interface UnsupportedPlatform {
  id: string;
  displayName: string;
  domains: string[];
}

export const unsupportedPlatforms: UnsupportedPlatform[] = [
  { id: "youtube", displayName: "YouTube", domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"] },
  { id: "instagram", displayName: "Instagram", domains: ["instagram.com"] },
  { id: "facebook", displayName: "Facebook", domains: ["facebook.com", "fb.watch"] },
  { id: "tiktok", displayName: "TikTok", domains: ["tiktok.com"] },
  { id: "x", displayName: "X", domains: ["x.com", "twitter.com"] },
  { id: "vimeo", displayName: "Vimeo", domains: ["vimeo.com"] },
  { id: "dailymotion", displayName: "Dailymotion", domains: ["dailymotion.com", "dai.ly"] },
  { id: "reddit", displayName: "Reddit", domains: ["reddit.com", "redd.it"] },
  { id: "pinterest", displayName: "Pinterest", domains: ["pinterest.com", "pin.it"] },
];

export function detectUnsupportedPlatform(hostname: string): UnsupportedPlatform | undefined {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return unsupportedPlatforms.find(({ domains }) =>
    domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
  );
}
