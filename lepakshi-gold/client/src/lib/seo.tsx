import { useEffect } from "react";

/**
 * Page metadata for the browser and for anything that runs JavaScript.
 *
 * The Express server also bakes the same tags into the HTML it serves in
 * production (see server/src/seo.js), which is what search engines and social
 * previews actually read. This keeps the two in step while you navigate.
 */

export type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "product" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const MANAGED = "data-seo";

function upsert(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    el.setAttribute(MANAGED, "");
    document.head.appendChild(el);
  }
  apply(el);
}

function meta(name: string, content: string, property = false) {
  const key = property ? "property" : "name";
  upsert(
    `meta[${key}="${name}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute(key, name);
      return el;
    },
    (el) => el.setAttribute("content", content),
  );
}

export function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const url = `${window.location.origin}${path ?? window.location.pathname}`;

    document.title = title;
    meta("description", description);
    meta(
      "robots",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1",
    );

    meta("og:title", title, true);
    meta("og:description", description, true);
    meta("og:url", url, true);
    meta("og:type", type, true);
    meta("og:locale", "en_IN", true);
    if (image) meta("og:image", image, true);

    meta("twitter:card", "summary_large_image");
    meta("twitter:title", title);
    meta("twitter:description", description);
    if (image) meta("twitter:image", image);

    upsert(
      'link[rel="canonical"]',
      () => {
        const el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        return el;
      },
      (el) => el.setAttribute("href", url),
    );

    const scripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      for (const block of Array.isArray(jsonLd) ? jsonLd : [jsonLd]) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute(MANAGED, "");
        script.textContent = JSON.stringify(block);
        document.head.appendChild(script);
        scripts.push(script);
      }
    }
    return () => scripts.forEach((s) => s.remove());
  }, [title, description, path, image, type, noindex, jsonLd]);

  return null;
}

export const organizationLd = (site: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lepakshi Gold",
  legalName: "Venkateshwara Oil Traders",
  url: site,
  foundingDate: "2003",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Andhra Pradesh",
    addressCountry: "IN",
  },
});

export const faqLd = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

export const breadcrumbLd = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});
