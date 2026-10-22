import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const questions = [
  ["Which links work today?", "ToolJugaad currently supports public HTTPS URLs that directly serve a recognized audio or video file. Social-platform pages are not active integrations."],
  ["Can I download from YouTube or Instagram?", "No. Those integrations are not enabled. We do not bypass platform restrictions, logins, DRM, or paywalls."],
  ["Can I convert a video to MP3?", "Not currently. Only the original media file is offered; conversion will be added only for sources where you have authorization and the service can safely process them."],
  ["How long are downloads available?", "Temporary files are removed after the configured expiry time. The default job lifetime is 30 minutes."],
];

export default function FAQSection({ full = false }: { full?: boolean }) {
  return (
    <div className="divide-y divide-black/[.07]">
      {(full ? questions : questions.slice(0, 3)).map(([question, answer]) => <details key={question} className="faq-item group">
        <summary><span>{question}</span><ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" /></summary>
        <p>{answer}</p>
      </details>)}
      {!full && <Link to="/faq" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-leaf">See all answers <span aria-hidden="true">→</span></Link>}
    </div>
  );
}
