/** Public origin used in canonical URLs, Open Graph and JSON-LD. */
export const SITE_URL = (
  import.meta.env["VITE_SITE_URL"] ||
  process.env["VITE_SITE_URL"] ||
  "https://lepakshigold.com"
).replace(/\/$/, "");

export const BRAND = {
  name: "Lepakshi Gold",
  legalName: "Venkateshwara Oil Traders",
  tagline: "Wood-pressed ganuga oils since 2003",
  locale: "en_IN",
  localeAlt: "te_IN",
  region: "IN-AP",
  locality: "Andhra Pradesh",
  country: "IN",
  email: "hello@lepakshigold.com",
  sameAs: [] as string[],
} as const;

export function absUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function seoTitle(page: string): string {
  return `${page} | Lepakshi Gold — Wood-pressed ganuga oil`;
}
