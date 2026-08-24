import { SITE_URL } from "./site";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/contact",
  "/track-order",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
];

export async function sitemapXml(): Promise<string> {
  const urls = new Set(STATIC_PATHS);
  try {
    const { fetchCategories, fetchProducts } = await import("./catalog.data");
    const [categories, products] = await Promise.all([fetchCategories(), fetchProducts()]);
    for (const c of categories) urls.add(`/shop/${c.slug}`);
    for (const p of products) urls.add(`/product/${p.slug}`);
  } catch (error) {
    console.error("[sitemap] catalog fetch failed", error);
  }

  const body = [...urls]
    .map((path) => {
      const loc = `${SITE_URL}${path === "/" ? "" : path}`;
      const priority = path === "/" ? "1.0" : path === "/shop" ? "0.9" : "0.7";
      return `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
