import { createWriteStream } from "node:fs";
import type { IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { config } from "../config.js";
import type { MediaMetadata, MediaProvider } from "../types.js";
import { validatePublicHttpsUrl } from "../security/url.js";

const mediaTypes = new Map<string, "video" | "audio">([
  ["video/mp4", "video"],
  ["video/webm", "video"],
  ["video/quicktime", "video"],
  ["audio/mpeg", "audio"],
  ["audio/mp4", "audio"],
  ["audio/aac", "audio"],
  ["audio/ogg", "audio"],
  ["audio/wav", "audio"],
  ["audio/webm", "audio"],
]);
const maxRedirects = 4;

function safeFilename(value: string): string {
  return value
    .replace(/%[0-9a-f]{2}/gi, " ")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "authorized-media";
}

function filenameFrom(url: URL): string {
  const segment = url.pathname.split("/").filter(Boolean).at(-1) ?? "authorized-media";
  try {
    return safeFilename(decodeURIComponent(segment));
  } catch {
    return safeFilename(segment);
  }
}

async function requestPublicMedia(
  initialUrl: URL,
  method: "HEAD" | "GET",
  range = false,
  timeoutMs = config.requestTimeoutMs,
): Promise<IncomingMessage> {
  let current = initialUrl;
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const target = await validatePublicHttpsUrl(current);
    current = target.url;
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const outgoing = httpsRequest(current, {
        method,
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: target.address, family: target.family }]);
          } else {
            callback(null, target.address, target.family);
          }
        },
        signal: AbortSignal.timeout(timeoutMs),
        headers: method === "GET" && range ? { Range: "bytes=0-0" } : undefined,
      }, resolve);
      outgoing.once("error", reject);
      outgoing.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      response.resume();
      if (!location || redirects === maxRedirects) {
        throw new Error("REDIRECT_LIMIT");
      }
      current = new URL(location, current);
      continue;
    }
    return response;
  }
  throw new Error("REDIRECT_LIMIT");
}

export class DirectMediaProvider implements MediaProvider {
  readonly id = "direct-media";
  readonly displayName = "Direct media URL";

  supportsUrl(url: URL): boolean {
    return url.protocol === "https:";
  }

  async inspectMedia(url: URL): Promise<MediaMetadata> {
    let response = await requestPublicMedia(url, "HEAD");
    if (response.statusCode === 405 || response.statusCode === 501) {
      response.resume();
      response = await requestPublicMedia(url, "GET", true);
    }
    if ((response.statusCode ?? 500) >= 400 && response.statusCode !== 206) {
      response.resume();
      throw new Error("MEDIA_UNAVAILABLE");
    }

    const mimeType = (response.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    const mediaType = mediaTypes.get(mimeType);
    const rangeTotal = response.headers["content-range"]?.match(/\/(\d+)$/)?.[1];
    const lengthHeader = response.statusCode === 206 ? rangeTotal : response.headers["content-length"];
    const fileSize = lengthHeader && /^\d+$/.test(lengthHeader) ? Number(lengthHeader) : null;
    response.resume();

    if (!mediaType) {
      throw new Error("UNSUPPORTED_MEDIA_TYPE");
    }
    if (fileSize !== null && fileSize > config.maxBytes) {
      throw new Error("FILE_TOO_LARGE");
    }

    return {
      title: filenameFrom(url),
      thumbnail: null,
      mediaType,
      formats: [{
        formatId: mimeType,
        quality: "Original",
        mimeType,
        fileSize,
      }],
    };
  }

  async initiatePermittedDownload(url: URL, formatId: string, destination: string): Promise<void> {
    if (!mediaTypes.has(formatId)) {
      throw new Error("FORMAT_NOT_AVAILABLE");
    }
    const response = await requestPublicMedia(url, "GET", false, config.downloadTimeoutMs);
    if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
      response.resume();
      throw new Error("MEDIA_UNAVAILABLE");
    }
    const mimeType = (response.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (mimeType !== formatId || !mediaTypes.has(mimeType)) {
      response.resume();
      throw new Error("FORMAT_CHANGED");
    }
    const declaredLength = Number(response.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > config.maxBytes) {
      response.resume();
      throw new Error("FILE_TOO_LARGE");
    }

    let bytes = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > config.maxBytes) {
          callback(new Error("FILE_TOO_LARGE"));
          return;
        }
        callback(null, chunk);
      },
    });
    await pipeline(response, limiter, createWriteStream(destination, { flags: "wx" }), {
      signal: AbortSignal.timeout(config.downloadTimeoutMs),
    });
  }
}
