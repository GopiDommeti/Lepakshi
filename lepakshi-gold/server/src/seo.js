import { query, queryOne } from "./db.js";

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");

/** Full sitemap, built live from what is actually published. */
export async function buildSitemap() {
  const base = siteUrl();
  const staticPaths = [
    ["/", "1.0", "daily"],
    ["/shop", "0.9", "daily"],
    ["/about", "0.6", "monthly"],
    ["/contact", "0.6", "monthly"],
    ["/track-order", "0.4", "monthly"],
    ["/shipping-policy", "0.3", "yearly"],
    ["/returns", "0.3", "yearly"],
    ["/privacy", "0.2", "yearly"],
    ["/terms", "0.2", "yearly"],
  ];

  const categories = await query(
    "SELECT slug, updated_at FROM categories WHERE is_active = 1 ORDER BY sort_order",
  );
  const products = await query(
    "SELECT slug, updated_at FROM products WHERE status = 'published' ORDER BY updated_at DESC",
  );

  const url = (loc, priority, freq, lastmod) =>
    `  <url><loc>${escape(base + loc)}</loc>` +
    (lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : "") +
    `<changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPaths.map(([loc, p, f]) => url(loc, p, f)),
    ...categories.map((c) => url(`/shop/${c.slug}`, "0.8", "weekly", c.updated_at)),
    ...products.map((p) => url(`/product/${p.slug}`, "0.8", "weekly", p.updated_at)),
    "</urlset>",
  ].join("\n");
}

export function buildRobots() {
  const base = siteUrl();
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /checkout",
    "Disallow: /cart",
    "Disallow: /auth",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
}

async function storeName() {
  const row = await queryOne("SELECT store_name, legal_name, phone, address, logo_url FROM settings WHERE id = 1");
  return {
    name: row?.store_name || "Lepakshi Gold",
    legal: row?.legal_name || "Venkateshwara Oil Traders",
    phone: row?.phone || "",
    address: row?.address || "Andhra Pradesh, India",
    logo: row?.logo_url || "",
  };
}

/**
 * Crawler-visible metadata.
 *
 * The storefront is a single-page app, so the tags React writes at runtime are
 * invisible to anything that doesn't run JavaScript. This resolves the route on
 * the server and bakes real title / description / Open Graph / JSON-LD into the
 * HTML before it is sent, which is what actually gets indexed.
 */
export async function metaForPath(pathname) {
  const base = siteUrl();
  const store = await storeName();
  const canonical = base + pathname;

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    legalName: store.legal,
    url: base,
    foundingDate: "2003",
    ...(store.logo ? { logo: store.logo } : {}),
    address: { "@type": "PostalAddress", addressRegion: "Andhra Pradesh", addressCountry: "IN" },
    ...(store.phone
      ? { contactPoint: [{ "@type": "ContactPoint", telephone: store.phone, contactType: "sales" }] }
      : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const product = pathname.match(/^\/product\/([^/?#]+)/);
  if (product) {
    const row = await queryOne(
      `SELECT p.*, c.name AS category_name FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ? AND p.status = 'published'`,
      [decodeURIComponent(product[1])],
    );
    if (row) {
      const variations = await query(
        "SELECT sku, label, price, sale_price, stock_quantity FROM variations WHERE product_id = ? AND is_active = 1",
        [row.id],
      );
      const prices = variations.map((v) => Number(v.sale_price ?? v.price)).filter((n) => n > 0);
      const reviews = await queryOne(
        "SELECT COUNT(*) AS count, AVG(rating) AS rating FROM reviews WHERE product_id = ? AND status = 'approved'",
        [row.id],
      );
      const inStock = variations.some((v) => Number(v.stock_quantity) > 0);
      const title = row.seo_title || `${row.name} — Organic cold-pressed oil | ${store.name}`;
      const description =
        row.seo_description ||
        row.short_description ||
        `Buy ${row.name} online from ${store.legal}. Certified organic, cold-pressed, unrefined, delivered across India.`;

      return {
        title,
        description,
        canonical,
        image: row.thumbnail_url || store.logo,
        type: "product",
        jsonLd: [
          org,
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: row.name,
            description,
            sku: row.sku_base || undefined,
            image: row.thumbnail_url ? [row.thumbnail_url] : undefined,
            brand: { "@type": "Brand", name: store.name },
            category: row.category_name || "Organic edible oil",
            ...(reviews && Number(reviews.count) > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: Number(reviews.rating).toFixed(1),
                    reviewCount: Number(reviews.count),
                  },
                }
              : {}),
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: prices.length ? Math.min(...prices) : 0,
              highPrice: prices.length ? Math.max(...prices) : 0,
              offerCount: variations.length,
              availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: canonical,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: base },
              { "@type": "ListItem", position: 2, name: "Shop", item: `${base}/shop` },
              { "@type": "ListItem", position: 3, name: row.name, item: canonical },
            ],
          },
        ],
      };
    }
  }

  const category = pathname.match(/^\/shop\/([^/?#]+)/);
  if (category) {
    const row = await queryOne(
      "SELECT * FROM categories WHERE slug = ? AND is_active = 1",
      [decodeURIComponent(category[1])],
    );
    if (row) {
      return {
        title: row.seo_title || `${row.name} — Organic cold-pressed | ${store.name}`,
        description:
          row.seo_description ||
          row.description ||
          `Shop organic ${row.name.toLowerCase()} from ${store.legal}. Cold-pressed, unrefined, delivered across India.`,
        canonical,
        image: row.banner_url || row.image_url || store.logo,
        type: "website",
        jsonLd: [
          org,
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: row.name,
            url: canonical,
          },
        ],
      };
    }
  }

  const staticMeta = {
    "/": {
      title: `${store.name} — Certified organic cold-pressed oils since 2003`,
      description:
        "Organic groundnut, coconut, sesame, sunflower and mustard oil, cold-pressed in small batches in Andhra Pradesh. No chemicals, no refining. Delivered across India.",
      jsonLd: [org, website],
    },
    "/shop": {
      title: `Shop organic cold-pressed oils | ${store.name}`,
      description:
        "The full range of organic edible oils — groundnut, coconut, sesame, sunflower, safflower, mustard and rice bran. Pack sizes from 500 ml to 15 L.",
    },
    "/about": {
      title: `Our story — ${store.legal}, organic oils since 2003`,
      description:
        "Two decades of small-batch organic oil pressing in Andhra Pradesh. How we source, press and test every batch.",
    },
    "/contact": {
      title: `Contact & wholesale | ${store.name}`,
      description:
        "Retail orders, wholesale supply and distributorship enquiries for organic edible oils across Andhra Pradesh and India.",
    },
    "/track-order": {
      title: `Track your order | ${store.name}`,
      description: "Enter your order number and phone number to see where your oil is.",
    },
  };

  const found = staticMeta[pathname.replace(/\/$/, "") || "/"];
  return {
    title: found?.title || `${store.name} — Organic cold-pressed edible oils`,
    description:
      found?.description ||
      `Certified organic, cold-pressed edible oils from ${store.legal}, Andhra Pradesh.`,
    canonical,
    image: store.logo,
    type: "website",
    jsonLd: found?.jsonLd || [org],
    noindex: /^\/(admin|account|checkout|cart|auth)/.test(pathname),
  };
}

/** Rewrite the built index.html with the metadata for this route. */
export function injectMeta(html, meta) {
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    `<link rel="canonical" href="${escape(meta.canonical)}" />`,
    meta.noindex
      ? '<meta name="robots" content="noindex, nofollow" />'
      : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${escape(meta.canonical)}" />`,
    `<meta property="og:type" content="${escape(meta.type || "website")}" />`,
    '<meta property="og:locale" content="en_IN" />',
    meta.image ? `<meta property="og:image" content="${escape(meta.image)}" />` : "",
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    meta.image ? `<meta name="twitter:image" content="${escape(meta.image)}" />` : "",
    ...(meta.jsonLd || []).map(
      (item) =>
        `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`,
    ),
  ]
    .filter(Boolean)
    .join("\n    ");

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace("</head>", `    ${tags}\n  </head>`);
}
