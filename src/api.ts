import { apiBaseUrl, apiConfigError } from "./config";

export interface MediaFormat {
  formatId: string;
  quality: string;
  mimeType: string;
  fileSize: number | null;
}

export interface MediaJob {
  success: true;
  jobId: string;
  provider: string;
  title: string;
  thumbnail: string | null;
  mediaType: "video" | "audio";
  formats: MediaFormat[];
  status: "ready" | "processing" | "completed" | "failed";
  errorCode: string | null;
  downloadUrl: string | null;
  expiresAt: string;
}

interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export class MediaApiError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "MediaApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  if (apiConfigError) {
    throw new MediaApiError(apiConfigError, "API_CONFIG_INVALID");
  }
  if (import.meta.env.PROD && !apiBaseUrl) {
    throw new MediaApiError(
      "The API server is not configured for this deployment. Set VITE_API_BASE_URL to your backend's HTTPS origin and rebuild the frontend.",
      "API_NOT_CONFIGURED",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${url}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new MediaApiError(
      "Could not reach the ToolJugaad API. Start the backend locally or configure VITE_API_BASE_URL for the deployed frontend.",
      "API_UNREACHABLE",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new MediaApiError(
      `The API returned a non-JSON response (HTTP ${response.status}). Check that the backend URL and /api/v1 routes are configured correctly.`,
      "API_BAD_RESPONSE",
    );
  }

  let payload: T | ApiError;
  try {
    payload = await response.json() as T | ApiError;
  } catch {
    throw new MediaApiError("The API returned an invalid JSON response.", "API_BAD_RESPONSE");
  }
  if (!response.ok || (payload && typeof payload === "object" && "success" in payload && payload.success === false)) {
    const error = payload as ApiError;
    throw new MediaApiError(error.error?.message ?? "The request could not be completed.", error.error?.code ?? "REQUEST_FAILED");
  }
  return payload as T;
}

export function inspectMedia(url: string): Promise<MediaJob> {
  return request("/api/v1/media/inspect", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function getJob(jobId: string): Promise<MediaJob> {
  return request(`/api/v1/media/jobs/${encodeURIComponent(jobId)}`);
}

export function startDownload(jobId: string, formatId: string): Promise<MediaJob> {
  return request(`/api/v1/media/jobs/${encodeURIComponent(jobId)}/download`, {
    method: "POST",
    body: JSON.stringify({ formatId }),
  });
}
