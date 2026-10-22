import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Sparkles } from "lucide-react";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Video Downloader", "/video-downloader"],
  ["Audio Downloader", "/audio-downloader"],
  ["How It Works", "/how-it-works"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-black/[.06] bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="ToolJugaad home">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></span>
          <span className="text-lg font-extrabold tracking-[-.06em] text-ink">Tool<span className="text-leaf">Jugaad</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/video-downloader" className="button button-dark hidden sm:inline-flex">
          Get started <ArrowUpRight size={15} />
        </Link>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-ink lg:hidden" aria-label="Toggle menu" aria-expanded={open}>
          <Menu size={22} />
        </button>
      </div>
      {open && <nav className="grid gap-1 border-t border-black/[.06] bg-paper px-5 py-4 lg:hidden" aria-label="Mobile navigation">
        {links.map(([label, to]) => <Link key={to} onClick={() => setOpen(false)} to={to} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-white">{label}</Link>)}
      </nav>}
    </header>
  );
}
