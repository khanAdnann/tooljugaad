<<<<<<< HEAD
# ToolJugaad

React, Vite, and TypeScript frontend with a TypeScript/Express API for supported, authorized direct-media files. Platform-page downloaders and MP3 conversion are intentionally not enabled.

## Current capability status

| Source / feature | Status |
| --- | --- |
| Public HTTPS direct audio/video file URL | Operational when the remote host allows inspection and download |
| YouTube, Instagram, Facebook, TikTok, X, Vimeo, Dailymotion, Reddit, Pinterest | Unsupported; no authorized/configured provider integration is active |
| MP3 conversion / FFmpeg | Not implemented |
| Supabase job persistence / Supabase Auth | Schema and RLS migration provided; runtime persistence/auth are not wired |

The server offers original formats only and never claims success until it has downloaded a real file. Users must have permission to download media. No DRM, login, paywall, or platform restrictions are bypassed.

## Local development

Requirements: Node.js 20.6+ and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Vite runs on `http://localhost:5173`; the API runs on `http://localhost:4000`. The API process loads `.env` automatically (Node.js 20.6+). Set `APP_ORIGIN` to the exact frontend origin. In local development, Vite proxies `/api/*` to the local API. Use only non-sensitive public HTTPS media when testing.

Useful commands:

```powershell
npm test
npm run build
npm run build:server
```

To test a public direct file, start both services with `npm run dev`, open the video/audio tool, paste a public media URL you are authorized to download (for example `https://filesamples.com/samples/video/mp4/sample_640x360.mp4`), select **Inspect**, then choose **Prepare**. When the status becomes ready, use **Download file**. Social-platform post URLs are intentionally rejected.

The same flow can be exercised with the API: `POST /api/v1/media/inspect` with JSON `{ "url": "https://.../file.mp4" }`, then `POST /api/v1/media/jobs/{jobId}/download` with the returned format ID, poll `GET /api/v1/media/jobs/{jobId}` until `status` is `completed`, and fetch its `downloadUrl` before the expiry time.

## API

- `POST /api/v1/media/inspect` — accepts `{ "url": "https://..." }`, validates and inspects a direct media URL.
- `POST /api/v1/media/jobs/:jobId/download` — accepts `{ "formatId": "video/mp4" }` and starts an original-file download.
- `GET /api/v1/media/jobs/:jobId` — returns job status and, on completion, a temporary download URL.
- `GET /api/v1/media/jobs/:jobId/formats` — returns the inspected formats.
- `GET /api/v1/media/jobs/:jobId/file?token=...` — serves the temporary file with a short-lived bearer token.
- `GET /api/v1/media/platforms` — returns enabled and unsupported integration status.
- `GET /api/v1/health` — returns API health.

Successful download jobs and source URLs currently live in process memory; the actual temporary file is stored in an OS temporary directory and removed on expiry or process shutdown. This single-process implementation is not suitable for horizontally scaled production deployment as-is: use a shared job store and private object storage with short-lived signed URLs before scaling. The Supabase migration creates the requested tables and restrictive RLS policies, but the API does not yet connect to Supabase or persist rows. Supabase credentials are therefore not required or consumed by this initial build.

## Security and operations

- HTTPS only; rejects URL credentials, non-default ports, local/private/reserved IP ranges and mixed public/private DNS answers.
- Resolves DNS, validates all returned addresses, and pins the selected public address for each outbound request. Every redirect is revalidated and independently pinned.
- Redirect limit, request/download timeouts, 50 MiB default file cap, response content-type checks, per-process IP rate limit, and single-origin CORS allowlist.
- Random UUID job IDs and separate random download tokens; jobs expire after 30 minutes by default.
- No arbitrary shell execution, provider secrets, source URLs in logs, or user-controlled file paths.

The in-memory rate limiter and job store are process-local and are not distributed controls. A production deployment should put shared rate limiting, durable job coordination, private storage, cleanup scheduling, observability, and abuse monitoring behind the API. Configure the backend separately from Vercel; keep service-role keys and all provider credentials server-side only.

### Configuration

See `.env.example`.

- Local development uses `PORT=4000`, `APP_ORIGIN=http://localhost:5173`, and an empty `VITE_API_BASE_URL` (Vite proxies API requests).
- Production frontend builds require `VITE_API_BASE_URL=https://<your-api-host>`; this is the public API origin, not a secret. Rebuild the frontend after changing it.
- The backend must use `APP_ORIGIN` set to the exact deployed frontend origin. `PORT` is optional when supplied by the backend host.
- Media size, timeout, job lifetime, and rate-limit settings are optional; their defaults are listed in `.env.example`.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not used by this implementation. If Supabase is wired in later, service-role credentials must remain server-side and must never have a `VITE_` prefix.

Provider integrations requiring credentials are deliberately not present. Increase limits only after assessing storage, bandwidth, and abuse implications.

## Supabase

Apply `supabase/migrations/202610220001_initial_media_schema.sql` with the Supabase CLI or SQL editor. RLS allows authenticated users to read only their own persisted jobs; enabled provider status is public; usage events have no client policies. Server-side writes would require a protected service-role client, which is not part of this initial runtime.

## Deployment and SEO

Deploy the static frontend to Vercel and the API to a separately managed Node.js worker/service. Set the Vercel **build-time** environment variable `VITE_API_BASE_URL` to the public API origin (for example, `https://api.example.com`) and rebuild/redeploy the frontend. Set the backend `APP_ORIGIN` to the exact frontend origin. The frontend rejects a missing production API URL rather than silently treating the Vercel SPA as the API. Vercel rewrites only known frontend routes; API requests go directly to the configured backend. Configure the backend's CORS origin to the exact frontend origin.

Static `robots.txt` and `sitemap.xml` are under `public/`. The React router sets unique document titles, descriptions, canonical URLs, and Open Graph metadata per route after hydration. For social previews and crawlers that do not execute JavaScript, add prerendering or server-side rendering before production launch. Private job/file routes are API-only and are not in the sitemap.

The email addresses on the informational pages are placeholders; replace them with monitored addresses before publishing.
=======
# tooljugaad
>>>>>>> 5ad92200640bb56a5b02509ddc5c5f5aabe2504d
