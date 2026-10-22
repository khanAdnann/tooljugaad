import { randomBytes, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { config } from "./config.js";
import { DirectMediaProvider } from "./providers/direct-media.js";
import { detectUnsupportedPlatform, unsupportedPlatforms } from "./providers/platforms.js";
import type { MediaJob } from "./types.js";

const app = express();
const provider = new DirectMediaProvider();
const jobs = new Map<string, MediaJob>();
const rateBuckets = new Map<string, { start: number; count: number }>();
const filesDirectoryPromise = mkdtemp(join(tmpdir(), "tooljugaad-"));
const inspectSchema = z.object({ url: z.string().url().max(2048) }).strict();

app.disable("x-powered-by");
app.use((request, response, next) => {
  const origin = request.get("origin");
  if (origin && origin !== config.appOrigin) {
    response.status(403).json({ success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "This website is not allowed to use the API." } });
    return;
  }
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: "8kb", strict: true }));
app.use((request, response, next) => {
  const now = Date.now();
  const key = request.ip ?? "unknown";
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= config.rateLimitWindowMs) {
    rateBuckets.set(key, { start: now, count: 1 });
    next();
    return;
  }
  bucket.count += 1;
  if (bucket.count > config.rateLimitMaxRequests) {
    response.setHeader("Retry-After", String(Math.ceil((config.rateLimitWindowMs - (now - bucket.start)) / 1000)));
    response.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } });
    return;
  }
  next();
});

function publicJob(job: MediaJob) {
  return {
    success: true,
    jobId: job.id,
    provider: job.provider,
    title: job.metadata.title,
    thumbnail: job.metadata.thumbnail,
    mediaType: job.metadata.mediaType,
    formats: job.metadata.formats,
    status: job.status,
    errorCode: job.errorCode,
    downloadUrl: job.status === "completed" ? `/api/v1/media/jobs/${job.id}/file?token=${job.downloadToken}` : null,
    expiresAt: new Date(job.expiresAt).toISOString(),
  };
}

function findJob(id: string, response: express.Response): MediaJob | null {
  const job = jobs.get(id);
  if (!job || job.expiresAt <= Date.now()) {
    response.status(404).json({ success: false, error: { code: "JOB_NOT_FOUND", message: "This media job was not found or has expired." } });
    return null;
  }
  return job;
}

function safeError(error: unknown): { status: number; code: string; message: string } {
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const known: Record<string, { status: number; message: string }> = {
    URL_NOT_ALLOWED: { status: 400, message: "Use a public HTTPS media URL. Local and private network addresses are not supported." },
    HOST_UNAVAILABLE: { status: 400, message: "The media host could not be reached." },
    REDIRECT_LIMIT: { status: 400, message: "The media URL redirects too many times." },
    MEDIA_UNAVAILABLE: { status: 422, message: "The media could not be retrieved from that URL." },
    UNSUPPORTED_MEDIA_TYPE: {
      status: 422,
      message: "This link returned a web page or unsupported file type, not a direct audio/video file. Paste a public HTTPS URL that points directly to a supported media file.",
    },
    FILE_TOO_LARGE: { status: 413, message: "This file exceeds the configured download size limit." },
    FORMAT_NOT_AVAILABLE: { status: 400, message: "That media format is not available." },
    FORMAT_CHANGED: { status: 422, message: "The media format changed after inspection. Inspect the URL again." },
  };
  const match = known[code];
  if (match) return { status: match.status, code, message: match.message };
  const unsupported = code.match(/^PLATFORM_UNSUPPORTED:(.+)$/);
  if (unsupported) {
    return {
      status: 422,
      code: "PLATFORM_UNSUPPORTED",
      message: `${unsupported[1]} links are not supported. Paste a public HTTPS URL directly to an audio or video file you own or are authorized to download. ToolJugaad does not bypass platform restrictions.`,
    };
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return { status: 504, code: "UPSTREAM_TIMEOUT", message: "The media host took too long to respond. Please retry." };
  }
  if (error instanceof Error && error.name === "AbortError") {
    return { status: 504, code: "UPSTREAM_TIMEOUT", message: "The media host took too long to respond. Please retry." };
  }
  console.error("Media request failed", { code: code.slice(0, 60) });
  return { status: 500, code: "INTERNAL_ERROR", message: "Something went wrong while processing this media. Please retry." };
}

app.get("/api/v1/health", (_request, response) => {
  response.json({ success: true, status: "ok" });
});

app.get("/api/v1/media/platforms", (_request, response) => {
  response.json({
    success: true,
    platforms: [
      { id: provider.id, displayName: provider.displayName, status: "operational", mediaTypes: ["video", "audio"], capabilities: ["inspect", "original-download"] },
      ...unsupportedPlatforms.map(({ id, displayName }) => ({
        id, displayName, status: "unsupported", mediaTypes: [], capabilities: [],
        message: "No authorized, configured integration is active.",
      })),
    ],
  });
});

app.post("/api/v1/media/inspect", async (request, response) => {
  const parsed = inspectSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: "Provide a valid HTTPS media URL." } });
    return;
  }
  let url: URL;
  try {
    url = new URL(parsed.data.url);
    if (!provider.supportsUrl(url)) throw new Error("URL_NOT_ALLOWED");
    const unsupported = detectUnsupportedPlatform(url.hostname);
    if (unsupported) throw new Error(`PLATFORM_UNSUPPORTED:${unsupported.displayName}`);
    const metadata = await provider.inspectMedia(url);
    const id = randomUUID();
    const now = Date.now();
    const job: MediaJob = {
      id,
      provider: provider.id,
      sourceUrl: url.toString(),
      metadata,
      status: "ready",
      createdAt: now,
      expiresAt: now + config.jobTtlMs,
      downloadToken: null,
      filePath: null,
      errorCode: null,
    };
    jobs.set(id, job);
    response.status(200).json(publicJob(job));
  } catch (error) {
    const failure = safeError(error);
    response.status(failure.status).json({ success: false, error: { code: failure.code, message: failure.message } });
  }
});

app.get("/api/v1/media/jobs/:jobId", (request, response) => {
  const job = findJob(request.params.jobId, response);
  if (job) response.json(publicJob(job));
});

app.get("/api/v1/media/jobs/:jobId/formats", (request, response) => {
  const job = findJob(request.params.jobId, response);
  if (job) response.json({ success: true, formats: job.metadata.formats });
});

app.post("/api/v1/media/jobs/:jobId/download", async (request, response) => {
  const job = findJob(request.params.jobId, response);
  if (!job) return;
  if (job.status === "processing") {
    response.status(409).json({ success: false, error: { code: "JOB_ALREADY_PROCESSING", message: "This download is already being prepared." } });
    return;
  }
  if (job.status === "completed") {
    response.json(publicJob(job));
    return;
  }
  const formatId = z.string().max(100).safeParse(request.body?.formatId);
  if (!formatId.success || !job.metadata.formats.some((format) => format.formatId === formatId.data)) {
    response.status(400).json({ success: false, error: { code: "INVALID_FORMAT", message: "Select a format returned by media inspection." } });
    return;
  }

  job.status = "processing";
  response.status(202).json(publicJob(job));
  void (async () => {
    let filePath: string | null = null;
    try {
      const directory = await filesDirectoryPromise;
      filePath = join(directory, `${randomBytes(24).toString("hex")}.media`);
      await provider.initiatePermittedDownload(new URL(job.sourceUrl), formatId.data, filePath);
      const fileStat = await stat(filePath);
      if (fileStat.size > config.maxBytes) throw new Error("FILE_TOO_LARGE");
      job.filePath = filePath;
      job.downloadToken = randomBytes(32).toString("hex");
      job.metadata.formats = job.metadata.formats.map((format) => ({ ...format, fileSize: fileStat.size }));
      job.status = "completed";
    } catch (error) {
      if (filePath) await rm(filePath, { force: true });
      job.status = "failed";
      const failure = safeError(error);
      job.errorCode = failure.code;
      console.error("Media job failed", { jobId: job.id, code: failure.code });
    }
  })();
});

app.get("/api/v1/media/jobs/:jobId/file", (request, response) => {
  const job = findJob(request.params.jobId, response);
  if (!job) return;
  if (job.status !== "completed" || !job.filePath || request.query.token !== job.downloadToken) {
    response.status(404).json({ success: false, error: { code: "DOWNLOAD_NOT_FOUND", message: "This temporary download is unavailable or has expired." } });
    return;
  }
  response.setHeader("Content-Type", job.metadata.formats[0]?.mimeType ?? "application/octet-stream");
  response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(job.metadata.title)}`);
  response.setHeader("Cache-Control", "private, no-store");
  const file = createReadStream(job.filePath);
  file.once("error", () => response.destroy());
  file.pipe(response);
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError) {
    response.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
    return;
  }
  if (error && typeof error === "object" && "status" in error && error.status === 413) {
    response.status(413).json({ success: false, error: { code: "REQUEST_TOO_LARGE", message: "Request body exceeds the allowed size." } });
    return;
  }
  const failure = safeError(error);
  response.status(failure.status).json({ success: false, error: { code: failure.code, message: failure.message } });
};
app.use(errorHandler);

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.expiresAt <= now) {
      if (job.filePath) void rm(job.filePath, { force: true });
      jobs.delete(id);
    }
  }
  for (const [ip, bucket] of rateBuckets) {
    if (now - bucket.start >= config.rateLimitWindowMs) rateBuckets.delete(ip);
  }
}, 60_000).unref();

const server = app.listen(config.port, () => {
  console.log(`ToolJugaad API listening on port ${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  const directory = await filesDirectoryPromise;
  await rm(directory, { recursive: true, force: true });
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
