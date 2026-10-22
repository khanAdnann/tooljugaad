export type MediaType = "video" | "audio";
export type JobStatus = "ready" | "processing" | "completed" | "failed";

export interface MediaFormat {
  formatId: string;
  quality: string;
  mimeType: string;
  fileSize: number | null;
}

export interface MediaMetadata {
  title: string;
  thumbnail: null;
  mediaType: MediaType;
  formats: MediaFormat[];
}

export interface MediaProvider {
  readonly id: string;
  readonly displayName: string;
  supportsUrl(url: URL): boolean;
  inspectMedia(url: URL): Promise<MediaMetadata>;
  initiatePermittedDownload(
    url: URL,
    formatId: string,
    destination: string,
  ): Promise<void>;
}

export interface MediaJob {
  id: string;
  provider: string;
  sourceUrl: string;
  metadata: MediaMetadata;
  status: JobStatus;
  createdAt: number;
  expiresAt: number;
  downloadToken: string | null;
  filePath: string | null;
  errorCode: string | null;
}
