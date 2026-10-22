import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-black/[.07] bg-white/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="text-lg font-extrabold tracking-[-.06em] text-ink">Tool<span className="text-leaf">Jugaad</span></Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">Simple tools for media you own or are authorized to download. Available formats depend on the source.</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.16em] text-muted">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm font-medium text-ink">
            <Link to="/video-downloader">Video Downloader</Link><Link to="/audio-downloader">Audio Downloader</Link><Link to="/how-it-works">How It Works</Link><Link to="/faq">FAQ</Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.16em] text-muted">Information</h2>
          <div className="mt-4 grid gap-3 text-sm font-medium text-ink">
            <Link to="/about">About ToolJugaad</Link><Link to="/contact">Contact</Link><Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms">Terms of Use</Link><Link to="/copyright-policy">Copyright Policy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-black/[.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted sm:px-8 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} ToolJugaad. Use media responsibly.</span>
          <span className="inline-flex items-center gap-1">Built for authorized media <ArrowUpRight size={12} /></span>
        </div>
      </div>
    </footer>
  );
}
