import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
}

export default function PageMeta({ title, description, path }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (descriptionTag) descriptionTag.content = description;
    if (canonical) canonical.href = `https://tooljugaad.com${path}`;
    if (ogTitle) ogTitle.content = title;
    if (ogDescription) ogDescription.content = description;
    if (ogUrl) ogUrl.content = `https://tooljugaad.com${path}`;
  }, [title, description, path]);

  return null;
}
