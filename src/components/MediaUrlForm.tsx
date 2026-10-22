import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowRight, Check, ClipboardPaste, Download, FileAudio2, FileVideo2, LoaderCircle, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { getJob, inspectMedia, MediaApiError, startDownload, type MediaJob } from "../api";
import { apiUrl } from "../config";

interface MediaUrlFormProps {
  initialType?: "video" | "audio";
  compact?: boolean;
  homeActions?: boolean;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "Size unavailable";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function errorForCode(job: MediaJob): string {
  const messages: Record<string, string> = {
    FILE_TOO_LARGE: "This file is larger than the server's configured size limit.",
    MEDIA_UNAVAILABLE: "The media host stopped serving the file. Check the URL and try again.",
    FORMAT_CHANGED: "The file format changed after inspection. Inspect the URL again.",
    UPSTREAM_TIMEOUT: "The media host took too long to respond. Try again later.",
    URL_NOT_ALLOWED: "The URL is not a public HTTPS media address.",
  };
  if (job.status === "failed") return messages[job.errorCode ?? ""] ?? "We couldn't prepare this file. Try inspecting the URL again.";
  return "Something went wrong. Please try again.";
}

export default function MediaUrlForm({ initialType, compact = false, homeActions = false }: MediaUrlFormProps) {
  const [url, setUrl] = useState("");
  const [mediaType, setMediaType] = useState<"video" | "audio">(initialType ?? "video");
  const [job, setJob] = useState<MediaJob | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const inspect = useMutation({ mutationFn: inspectMedia });
  const download = useMutation({ mutationFn: ({ id, formatId }: { id: string; formatId: string }) => startDownload(id, formatId) });
  const status = useQuery({
    queryKey: ["media-job", job?.jobId],
    queryFn: () => getJob(job!.jobId),
    enabled: job?.status === "processing",
    refetchInterval: (query) => query.state.data?.status === "processing" ? 1200 : false,
  });
  const currentJob = status.data ?? download.data ?? job;
  const working = inspect.isPending || download.isPending || currentJob?.status === "processing";
  const inputError = url && !isValidUrl(url) ? "Enter a valid HTTPS URL." : "";
  const requestFailure = inspect.error ?? download.error ?? status.error;
  const requestError = requestFailure?.message;
  const canRetry = !(requestFailure instanceof MediaApiError && requestFailure.code === "PLATFORM_UNSUPPORTED");

  async function pasteLink() {
    try {
      const clipboard = await navigator.clipboard.readText();
      if (clipboard) {
        setUrl(clipboard.trim());
        setJob(null);
        setClipboardError(null);
        inspect.reset();
        download.reset();
      } else {
        setClipboardError("Your clipboard is empty.");
      }
    } catch {
      setClipboardError("Clipboard access was blocked. Paste the link into the field instead.");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>, type = mediaType) {
    event.preventDefault();
    await inspectUrl(type);
  }

  async function inspectUrl(type: "video" | "audio") {
    if (!isValidUrl(url) || working) return;
    setMediaType(type);
    setJob(null);
    download.reset();
    try {
      const result = await inspect.mutateAsync(url.trim());
      setJob(result);
    } catch {
      // The mutation's error is rendered below.
    }
  }

  async function requestDownload(formatId: string) {
    if (!job || working) return;
    try {
      const started = await download.mutateAsync({ id: job.jobId, formatId });
      setJob(started);
    } catch {
      // The mutation's error is rendered below.
    }
  }

  async function retryInspect() {
    if (!isValidUrl(url) || working) return;
    setJob(null);
    download.reset();
    try {
      setJob(await inspect.mutateAsync(url.trim()));
    } catch {
      // The mutation's error is rendered below.
    }
  }

  const wrongType = Boolean(job && job.mediaType !== mediaType);

  return (
    <div className={`media-card ${compact ? "media-card-compact" : ""}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl bg-[#f1f3ee] p-1" role="tablist" aria-label="Media type">
          {(["video", "audio"] as const).map((type) => (
            <button key={type} type="button" role="tab" aria-selected={mediaType === type} onClick={() => { setMediaType(type); setJob(null); }}
              className={`type-tab ${mediaType === type ? "type-tab-active" : ""}`}>
              {type === "video" ? <FileVideo2 size={15} /> : <FileAudio2 size={15} />}{type === "video" ? "Video" : "Audio"}
            </button>
          ))}
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted sm:flex"><ShieldCheck size={14} className="text-leaf" /> Authorized media only</span>
      </div>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <label htmlFor="media-url" className="mb-2 block text-sm font-semibold text-ink">Paste a media link</label>
        <div className={`url-input-wrap ${inputError ? "url-input-error" : ""}`}>
          <input id="media-url" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setJob(null); inspect.reset(); download.reset(); }}
            placeholder="Paste your video or audio URL here..." autoComplete="url" inputMode="url" aria-describedby="url-note url-error" />
          {url && <button type="button" aria-label="Clear URL" className="clear-input" onClick={() => { setUrl(""); setJob(null); setClipboardError(null); inspect.reset(); download.reset(); }}><X size={17} /></button>}
          <button type="button" onClick={() => void pasteLink()} className="paste-button"><ClipboardPaste size={15} /> Paste Link</button>
        </div>
        {inputError ? <p id="url-error" className="mt-2 text-xs font-medium text-red-700" role="alert">{inputError}</p> :
          <p id="url-note" className="mt-2 text-xs leading-5 text-muted">Supported right now: public HTTPS links to direct audio or video files. Platform pages may not work.</p>}
        {clipboardError && <p className="mt-2 text-xs font-medium text-amber-800" role="status">{clipboardError}</p>}
        {homeActions ? <div className="mt-5 grid grid-cols-2 gap-2">
          {(["video", "audio"] as const).map((type) => <button key={type} type="button" onClick={() => void inspectUrl(type)} disabled={!isValidUrl(url) || working} className="button button-green w-full !px-3">
            {working && mediaType === type ? <LoaderCircle size={16} className="animate-spin" /> : type === "video" ? <FileVideo2 size={16} /> : <FileAudio2 size={16} />}
            Download {type === "video" ? "Video" : "Audio"}
          </button>)}
        </div> : <button type="submit" disabled={!isValidUrl(url) || working} className="button button-green mt-5 w-full">
          {working ? <><LoaderCircle size={17} className="animate-spin" /> {currentJob?.status === "processing" ? "Preparing download..." : "Checking link..."}</> :
            <><ArrowDownToLine size={17} /> Inspect {mediaType}</>}
        </button>}
      </form>

      {requestError && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
        <X size={17} className="mt-0.5 shrink-0" /><span>{requestError}</span>
        {canRetry && <button className="ml-auto inline-flex items-center gap-1 font-semibold underline" onClick={() => void retryInspect()}><RotateCcw size={13} /> Retry</button>}
      </div>}

      {wrongType && job && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">This link contains {job.mediaType}, not {mediaType}. Switch the selected tool to continue.</div>}

      {currentJob && currentJob.status !== "failed" && !wrongType && <div className="result-panel mt-5" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="result-icon">{currentJob.status === "completed" ? <Check size={18} /> : <FileVideo2 size={18} />}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-ink">{currentJob.title}</h3>
              <span className="status-badge">{currentJob.provider}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {currentJob.status === "processing" ? "Preparing your temporary download…" :
                currentJob.status === "completed" ? "Your file is ready. This link expires automatically." : `${currentJob.formats.length} original format${currentJob.formats.length === 1 ? "" : "s"} available`}
            </p>
          </div>
        </div>
        {currentJob.status === "ready" && <div className="mt-4 grid gap-2">
          {currentJob.formats.map((format) => <div key={format.formatId} className="format-row">
            <div><span className="block text-sm font-semibold text-ink">{format.quality}</span><span className="text-xs text-muted">{format.mimeType} · {formatBytes(format.fileSize)}</span></div>
            <button className="button button-outline !min-h-9 !px-3 !py-2 !text-xs" onClick={() => void requestDownload(format.formatId)} disabled={working}>
              <Download size={14} /> Prepare
            </button>
          </div>)}
        </div>}
        {currentJob.status === "processing" && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e2e7df]"><div className="progress-bar" /></div>}
        {currentJob.status === "completed" && currentJob.downloadUrl && <a className="button button-green mt-4 w-full" href={apiUrl(currentJob.downloadUrl)}>
          <Download size={16} /> Download file <ArrowRight size={15} />
        </a>}
      </div>}
      {currentJob?.status === "failed" && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800" role="alert">
      {errorForCode(currentJob)} <button onClick={() => void retryInspect()} className="ml-2 inline-flex items-center gap-1 font-semibold underline"><RotateCcw size={13} /> Retry</button>
      </div>}
      <div className="mt-5 flex items-start gap-2 border-t border-black/[.06] pt-4 text-[11px] leading-5 text-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-leaf" />
        <span>Only download content you own or have permission to use. We don't bypass access controls, DRM, or platform restrictions.</span>
      </div>
    </div>
  );
}
