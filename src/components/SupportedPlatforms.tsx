import { Check, CircleDashed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiBaseUrl, apiConfigError } from "../config";

interface Platform {
  id: string;
  displayName: string;
  status: string;
  mediaTypes: string[];
  message?: string;
}

export default function SupportedPlatforms() {
  const platforms = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      if (apiConfigError) throw new Error(apiConfigError);
      if (import.meta.env.PROD && !apiBaseUrl) {
        throw new Error("Platform status is unavailable because VITE_API_BASE_URL is not configured for this deployment.");
      }
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/v1/media/platforms`);
      } catch {
        throw new Error("Platform status is unavailable because the ToolJugaad API could not be reached.");
      }
      if (!response.ok) throw new Error("Platform status is currently unavailable.");
      if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
        throw new Error("Platform status is unavailable because the configured API did not return JSON.");
      }
      const body = await response.json() as { platforms: Platform[] };
      return body.platforms;
    },
    staleTime: 60_000,
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(platforms.data ?? []).map((platform) => {
        const active = platform.status === "operational";
        return <div key={platform.id} className={`platform-row ${active ? "platform-active" : ""}`}>
          <span className={`platform-icon ${active ? "platform-icon-active" : ""}`}>{active ? <Check size={15} /> : <CircleDashed size={15} />}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{platform.displayName}</span>
            <span className="block text-xs text-muted">{active ? "Operational · original file only" : "Not currently supported"}</span>
          </span>
          <span className={`platform-dot ${active ? "bg-leaf" : "bg-[#b4b9b1]"}`} aria-label={active ? "Operational" : "Unsupported"} />
        </div>;
      })}
      {platforms.isPending && <p className="sm:col-span-2 text-xs text-muted">Checking currently configured platform integrations…</p>}
      {platforms.isError && <p className="sm:col-span-2 text-xs text-muted">Platform availability cannot be confirmed until the API responds.</p>}
    </div>
  );
}
