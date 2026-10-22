import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Check, CircleHelp, FileAudio2, FileVideo2, Link2, LockKeyhole, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Footer from "./components/Footer";
import FAQSection from "./components/FAQSection";
import MediaUrlForm from "./components/MediaUrlForm";
import Navbar from "./components/Navbar";
import PageMeta from "./components/PageMeta";
import SupportedPlatforms from "./components/SupportedPlatforms";

const pageInfo: Record<string, { title: string; description: string; heading: string; intro: string }> = {
  "/how-it-works": { title: "How It Works | ToolJugaad", description: "Learn how ToolJugaad validates direct media URLs, checks available file formats, and prepares temporary downloads.", heading: "How it works", intro: "A clear, three-step flow for direct media files you own or have permission to download." },
  "/faq": { title: "FAQ | ToolJugaad", description: "Answers about supported links, privacy, temporary downloads, and ToolJugaad's current limitations.", heading: "Frequently asked questions", intro: "Straight answers about supported sources, formats, and how your temporary downloads work." },
  "/about": { title: "About ToolJugaad | ToolJugaad", description: "ToolJugaad is a simple, transparent set of tools for media you own or are authorized to download.", heading: "A simpler way to work with your media", intro: "ToolJugaad is built around a simple idea: useful media tools should be honest about what they can do." },
  "/contact": { title: "Contact | ToolJugaad", description: "Contact the ToolJugaad team with questions, feedback, or copyright concerns.", heading: "Get in touch", intro: "Questions, feedback, or a rights-related concern? We welcome a clear note." },
  "/privacy-policy": { title: "Privacy Policy | ToolJugaad", description: "Read how ToolJugaad handles media URLs, temporary files, and service data.", heading: "Privacy policy", intro: "We aim to collect as little information as possible to provide a temporary media-processing service." },
  "/terms": { title: "Terms of Use | ToolJugaad", description: "Review the terms and responsible-use requirements for ToolJugaad.", heading: "Terms of use", intro: "By using ToolJugaad, you agree to use the service lawfully and respect the rights of creators and platforms." },
  "/copyright-policy": { title: "Copyright Policy | ToolJugaad", description: "ToolJugaad respects copyright and does not enable bypassing access controls or platform restrictions.", heading: "Copyright & responsible use", intro: "ToolJugaad is intended for media you own or have explicit permission to download." },
};

const steps = [
  { number: "01", icon: Link2, title: "Paste a direct link", text: "Start with an HTTPS URL that points directly to an audio or video file." },
  { number: "02", icon: CircleHelp, title: "Check what’s available", text: "We validate the source and show only formats and metadata the server actually returns." },
  { number: "03", icon: ArrowDown, title: "Prepare your file", text: "Request the original file. A temporary, secure link appears when it is ready." },
];

function Hero() {
  return <section className="hero-wrap">
    <div className="hero-grid" aria-hidden="true" />
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1fr_.94fr] lg:gap-16 lg:pb-24 lg:pt-20">
      <div className="relative z-10">
        <span className="eyebrow"><Sparkles size={13} /> YOUR MEDIA, YOUR WAY</span>
        <h1 className="hero-title mt-6">Download Videos &amp; Audio with <span>ToolJugaad</span></h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">Your simple destination for supported video and audio tools. Paste a link, explore available options, and get started.</p>
        <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-muted sm:text-sm">
          <span className="inline-flex items-center gap-2"><Check size={15} className="text-leaf" /> Transparent support</span>
          <span className="inline-flex items-center gap-2"><Check size={15} className="text-leaf" /> Temporary downloads</span>
          <span className="inline-flex items-center gap-2"><Check size={15} className="text-leaf" /> No platform workarounds</span>
        </div>
      </div>
      <div className="relative z-10">
        <div className="absolute -inset-5 rounded-[2rem] bg-[#dce8d5]/55 blur-2xl" aria-hidden="true" />
        <MediaUrlForm homeActions />
      </div>
    </div>
  </section>;
}

function Home() {
  return <>
    <PageMeta title="ToolJugaad — Video & Audio Tools" description="Inspect supported video and audio links and download authorized direct media with ToolJugaad." path="/" />
    <Hero />
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="section-heading">
        <div><span className="eyebrow">START WITH A TOOL</span><h2 className="section-title mt-3">Made for the media you’re allowed to use.</h2></div>
        <p className="max-w-md text-sm leading-6 text-muted">No guessing, no fake results. ToolJugaad checks your source and shows real options when they’re available.</p>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-2">
        <ToolCard title="Video Downloader" description="Inspect public direct video files and prepare the original format when available." icon={<FileVideo2 size={20} />} to="/video-downloader" tone="green" />
        <ToolCard title="Audio Downloader" description="Inspect public direct audio files and download the original format when available." icon={<FileAudio2 size={20} />} to="/audio-downloader" tone="cream" />
      </div>
    </section>
    <section className="border-y border-black/[.06] bg-[#f0f2ec]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:py-20">
        <div><span className="eyebrow">CURRENT AVAILABILITY</span><h2 className="section-title mt-3">Real capabilities, clearly labeled.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted">We only enable integrations that are technically functional and authorized. Unsupported social-platform URLs won’t be treated as downloads.</p></div>
        <SupportedPlatforms />
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="section-heading"><div><span className="eyebrow">THREE SIMPLE STEPS</span><h2 className="section-title mt-3">From link to file, without the mystery.</h2></div><Link to="/how-it-works" className="text-sm font-bold text-leaf">How it works <ArrowUpRight size={15} className="inline" /></Link></div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, text }) => <div key={number} className="step-card"><div className="flex items-center justify-between"><span className="step-number">{number}</span><Icon size={19} className="text-leaf" /></div><h3 className="mt-8 text-lg font-bold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>)}</div>
    </section>
    <section className="border-y border-black/[.06] bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        <div><span className="eyebrow">GOOD TO KNOW</span><h2 className="section-title mt-3">A few useful answers.</h2><p className="mt-4 text-sm leading-6 text-muted">See what works before you paste a link.</p></div><FAQSection />
      </div>
    </section>
  </>;
}

function ToolCard({ title, description, icon, to, tone }: { title: string; description: string; icon: React.ReactNode; to: string; tone: string }) {
  return <Link to={to} className={`tool-card tool-card-${tone}`}><span className="tool-icon">{icon}</span><div className="flex-1"><h3 className="text-lg font-bold text-ink">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p></div><span className="arrow-circle"><ArrowRight size={17} /></span></Link>;
}

function DownloaderPage({ type }: { type: "video" | "audio" }) {
  const isVideo = type === "video";
  const title = isVideo ? "Video Downloader | ToolJugaad" : "Audio Downloader | ToolJugaad";
  const description = isVideo
    ? "Inspect direct HTTPS video file URLs and prepare original media files you are authorized to download."
    : "Inspect direct HTTPS audio file URLs and prepare original media files you are authorized to download.";
  return <>
    <PageMeta title={title} description={description} path={`/${type}-downloader`} />
    <section className="tool-page">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.85fr] lg:items-center lg:py-20">
        <div><span className="eyebrow">{isVideo ? <FileVideo2 size={13} /> : <AudioLines size={13} />} TOOLJUGAAD {type.toUpperCase()} TOOL</span>
          <h1 className="page-title mt-5">{isVideo ? "Video downloader" : "Audio downloader"}<span className="block text-leaf">for direct media.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">Paste a public HTTPS URL that points directly to a media file. We’ll verify the source and show the original format if the server makes it available.</p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-leaf" /> Authorized sources</span><span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-leaf" /> Temporary links</span></div>
        </div>
        <MediaUrlForm initialType={type} />
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="grid gap-6 sm:grid-cols-3">{[
        [Link2, "Direct file URLs", "A link to the media file itself, not a social-platform post."],
        [TimerReset, "Temporary by design", "Generated downloads expire automatically and are cleaned up."],
        [ShieldCheck, "No access bypass", "We don't circumvent DRM, logins, paywalls, or platform rules."],
      ].map(([Icon, heading, body]) => <div key={heading as string} className="feature-card"><Icon size={18} className="text-leaf" /><h2 className="mt-4 text-sm font-bold text-ink">{heading as string}</h2><p className="mt-2 text-xs leading-5 text-muted">{body as string}</p></div>)}</div>
    </section>
  </>;
}

function InfoPage({ path }: { path: string }) {
  const info = pageInfo[path];
  const text: Record<string, React.ReactNode> = {
    "/how-it-works": <div className="grid gap-4 sm:grid-cols-3">{steps.map(({ number, icon: Icon, title, text: copy }) => <div className="step-card" key={number}><span className="step-number">{number}</span><Icon size={20} className="mt-6 text-leaf" /><h2 className="mt-4 font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{copy}</p></div>)}</div>,
    "/faq": <FAQSection full />,
    "/about": <div className="prose-copy"><h2>Built to be useful—and honest.</h2><p>ToolJugaad currently handles public HTTPS direct audio and video URLs only. Social-platform integrations are not active; each platform has distinct API permissions and terms, and we will only enable capabilities that are explicitly supported.</p><p>We do not bypass access controls, DRM, private accounts, or paywalls. We do not claim a download succeeded until a real file has been prepared.</p><h2>What’s available now?</h2><p>Original-file inspection and temporary download for supported direct media. Format conversion and platform-page extraction are not currently offered.</p></div>,
    "/contact": <div className="prose-copy"><h2>Reach the ToolJugaad team</h2><p>For product questions, feedback, or copyright concerns, email <a href="mailto:hello@tooljugaad.com">hello@tooljugaad.com</a>. Please include a description of the issue, but do not send private media, credentials, or sensitive links.</p><p>For copyright notices, identify the work and the URL at issue, explain your relationship to the rights holder, and provide a way for us to follow up.</p></div>,
    "/privacy-policy": <div className="prose-copy"><h2>Information processed</h2><p>To inspect a media link, the service receives the URL and makes a request to its public host. The source URL is held temporarily in server memory for the job and is not included in application logs. Do not submit private or sensitive URLs.</p><h2>Temporary files</h2><p>Prepared files and job data are held temporarily and removed when their expiry time is reached or the service restarts. Temporary download links act as bearer credentials; keep them private.</p><h2>Operational data</h2><p>The API applies basic rate limiting. This initial release does not require an account and does not persist jobs in Supabase. Hosting providers may maintain their own operational logs under their policies.</p><h2>Your choices</h2><p>Do not use the service if you do not agree with this processing. Contact <a href="mailto:privacy@tooljugaad.com">privacy@tooljugaad.com</a> with privacy questions.</p></div>,
    "/terms": <div className="prose-copy"><h2>Permitted use</h2><p>You may use ToolJugaad only with media you own or have explicit legal permission to download and process. You are responsible for complying with copyright law, platform terms, and other applicable requirements.</p><h2>Limitations</h2><p>The service supports only the direct media formats shown by the configured provider. Availability is not guaranteed. We do not circumvent DRM, authentication, paywalls, or technical restrictions.</p><h2>Temporary service</h2><p>Jobs and generated download links expire, and files may be removed earlier to protect service reliability. The service is provided as-is and may change or be unavailable.</p></div>,
    "/copyright-policy": <div className="prose-copy"><h2>Use only authorized media</h2><p>ToolJugaad is not a license to copy content. Only use the service for content you own or are otherwise authorized to download. Do not use it to infringe copyrights or bypass a platform’s restrictions.</p><h2>Report a concern</h2><p>Send copyright or rights-related notices to <a href="mailto:copyright@tooljugaad.com">copyright@tooljugaad.com</a>. Include the affected URL and enough information for us to understand your claim. We review reports and may disable access to relevant material.</p></div>,
  };
  return <><PageMeta title={info.title} description={info.description} path={path} /><section className="info-page"><div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:py-20"><span className="eyebrow">TOOLJUGAAD</span><h1 className="page-title mt-5">{info.heading}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{info.intro}</p><div className="mt-10">{text[path]}</div>{path === "/how-it-works" && <div className="mt-10 rounded-2xl bg-[#edf3e8] p-6"><p className="text-sm leading-6 text-ink">We currently support direct public HTTPS file URLs only. Website pages from social platforms are not supported by active integrations.</p></div>}</div></section></>;
}

export default function App() {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  return <div className="min-h-screen"><Navbar /><main><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/video-downloader" element={<DownloaderPage type="video" />} />
    <Route path="/audio-downloader" element={<DownloaderPage type="audio" />} />
    {Object.keys(pageInfo).map((path) => <Route key={path} path={path} element={<InfoPage path={path} />} />)}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></main><Footer /></div>;
}
