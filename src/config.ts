const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
let configuredApiError: string | null = null;

if (configuredApiUrl) {
  try {
    const parsed = new URL(configuredApiUrl);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
      configuredApiError = "VITE_API_BASE_URL must be an API origin, for example https://api.example.com";
    } else if (import.meta.env.PROD && parsed.protocol !== "https:") {
      configuredApiError = "VITE_API_BASE_URL must use HTTPS in production.";
    }
  } catch {
    configuredApiError = "VITE_API_BASE_URL must be an API origin, for example https://api.example.com";
  }
}

export const apiBaseUrl = configuredApiUrl.replace(/\/+$/, "");
export const apiConfigError = configuredApiError;

export function resolveApiUrl(path: string, baseUrl = apiBaseUrl): string {
  if (!baseUrl) return path;
  const resolved = new URL(path, baseUrl);
  if (resolved.origin !== new URL(baseUrl).origin) {
    throw new Error("API response contains a download URL outside the configured API origin.");
  }
  return resolved.toString();
}

export function apiUrl(path: string): string {
  return resolveApiUrl(path);
}
