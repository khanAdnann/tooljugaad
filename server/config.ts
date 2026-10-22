function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
const parsedOrigin = new URL(appOrigin);
if (parsedOrigin.origin !== appOrigin.replace(/\/$/, "")) {
  throw new Error("APP_ORIGIN must be an origin without a path");
}

export const config = {
  port: positiveInteger("PORT", 4000),
  appOrigin: parsedOrigin.origin,
  maxBytes: positiveInteger("MEDIA_MAX_BYTES", 50 * 1024 * 1024),
  requestTimeoutMs: positiveInteger("MEDIA_REQUEST_TIMEOUT_MS", 12_000),
  downloadTimeoutMs: positiveInteger("MEDIA_DOWNLOAD_TIMEOUT_MS", 120_000),
  jobTtlMs: positiveInteger("MEDIA_JOB_TTL_MS", 30 * 60 * 1000),
  rateLimitWindowMs: positiveInteger("RATE_LIMIT_WINDOW_MS", 60_000),
  rateLimitMaxRequests: positiveInteger("RATE_LIMIT_MAX_REQUESTS", 20),
};
