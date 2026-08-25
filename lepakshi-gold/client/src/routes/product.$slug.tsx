import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { db } from "@/lib/db";
import {
  effectivePrice,
  inStock,
  priceRange,
  productQuery,
  reviewsQuery,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { dateOnly, inr } from "@/lib/format";
import { breadcrumbLd, Seo } from "@/lib/seo";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const label = params.slug.replace(/-/g, " ");
    const title = `${label} — Lepakshi Gold`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Pack sizes, price, stock and delivery estimate for Lepakshi Gold ${label}.`,
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Cold-pressed oil, filtered and packed fresh." },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Product,
});

type Pin = {
  is_serviceable: boolean;
  cod_available: boolean;
  eta_days: number | null;
  district: string | null;
  state: string | null;
};

function Product() {
  const { slug } = Route.useParams();
  const product = useQuery(productQuery(slug));
  const reviews = useQuery(reviewsQuery(product.data?.id));
  const cart = useCart();

  const variations = useMemo(() => product.data?.variations ?? [], [product.data]);
  const [variationId, setVariationId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pin, setPin] = useState<Pin | null | "none">(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const first = variations.find(inStock) ?? variations[0];
    if (first?.id) setVariationId(first.id);
  }, [variations]);

  const selected = variations.find((v) => v.id === variationId);
  const price = selected ? effectivePrice(selected) : 0;
  const base = Number(selected?.price ?? 0);
  const onSale = price > 0 && price < base;

  async function checkPincode() {
    if (!/^\d{6}$/.test(pincode)) {
      toast.error("Enter a 6-digit pincode.");
      return;
    }
    setChecking(true);
    const { data } = await db
      .from("pincode_serviceability")
      .select("is_serviceable,cod_available,eta_days,district,state")
      .eq("pincode", pincode)
      .maybeSingle();
    setPin(data ?? "none");
    setChecking(false);
  }

  function addToCart() {
    if (!product.data || !selected) return;
    cart.add(
      {
        variationId: selected.id!,
        productId: product.data.id,
        slug: product.data.slug,
        productName: product.data.name,
        variationLabel: selected.label ?? "",
        sku: selected.sku ?? "",
        price,
        weightGrams: Number(selected.weight_grams ?? 0),
      },
      quantity,
    );
    toast.success(`${product.data.name} ${selected.label ?? ""} added to cart`);
  }

  if (product.isLoading) {
    return (
      <StoreLayout>
      {product.data ? (
        <Seo
          title={product.data.seo_title || `${product.data.name} — organic cold-pressed | Lepakshi Gold`}
          description={
            product.data.seo_description ||
            product.data.short_description ||
            `Buy ${product.data.name} online. Certified organic, cold-pressed and unrefined, delivered across India.`
          }
          path={`/product/${product.data.slug}`}
          type="product"
          {...(product.data.thumbnail_url ? { image: product.data.thumbnail_url } : {})}
          jsonLd={[
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.data.name,
              description: product.data.short_description ?? undefined,
              image: product.data.thumbnail_url ? [product.data.thumbnail_url] : undefined,
              sku: product.data.sku_base ?? undefined,
              brand: { "@type": "Brand", name: "Lepakshi Gold" },
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "INR",
                lowPrice: priceRange(product.data.variations)[0],
                highPrice: priceRange(product.data.variations)[1],
                offerCount: product.data.variations.length,
                availability: product.data.variations.some((v) => Number(v.stock_quantity) > 0)
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              },
            },
            breadcrumbLd([
              { name: "Home", url: window.location.origin },
              { name: "Shop", url: `${window.location.origin}/shop` },
              { name: product.data.name, url: window.location.href },
            ]),
          ]}
        />
      ) : null}

        <div className="mx-auto max-w-[1200px] px-6 py-24 text-ink-500">Loading…</div>
      </StoreLayout>
    );
  }

  if (!product.data) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <h1 className="font-display text-4xl">We couldn't find that oil</h1>
          <Link to="/shop" className="mt-6 inline-block text-green-700 underline">
            Back to the shop
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const p = product.data;
  const rating =
    (reviews.data ?? []).length > 0
      ? (reviews.data ?? []).reduce((s, r) => s + r.rating, 0) / (reviews.data ?? []).length
      : null;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-500">
          <Link to="/shop" className="hover:text-green-700">
            Shop
          </Link>
          <span className="px-2">/</span>
          <span className="text-ink-900">{p.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div className="hairline overflow-hidden rounded-xl bg-cream-100">
            <div className="aspect-square">
              {p.thumbnail_url ? (
                <img src={p.thumbnail_url} alt={p.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-b from-amber-400/25 to-gold-500/10">
                  <span className="font-display text-2xl text-green-900/40">Lepakshi Gold</span>
                </div>
              )}
            </div>
          </div>

          <div>
            {p.is_organic ? (
              <span className="rounded-full bg-green-900 px-3 py-1 text-xs font-semibold text-cream-50">
                Cold-pressed organic
              </span>
            ) : null}
            <h1 className="mt-4 font-display text-4xl leading-tight">{p.name}</h1>
            {p.name_te ? <p className="te mt-1 text-lg text-ink-500">{p.name_te}</p> : null}
            {rating ? (
              <p className="mt-2 text-sm text-ink-500">
                <span className="text-gold-600">{"★".repeat(Math.round(rating))}</span>{" "}
                {rating.toFixed(1)} · {(reviews.data ?? []).length} reviews
              </p>
            ) : null}
            {p.short_description ? (
              <p className="mt-4 max-w-[58ch] text-ink-500">{p.short_description}</p>
            ) : null}

            <div className="mt-8">
              <p className="eyebrow text-gold-600">Pack size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variations.map((v) => {
                  const ok = inStock(v);
                  const active = v.id === variationId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariationId(v.id!)}
                      disabled={!ok}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "border-green-900 bg-green-900 text-cream-50"
                          : "border-line-200 text-ink-900 hover:border-green-700"
                      } ${ok ? "" : "cursor-not-allowed opacity-40"}`}
                    >
                      {v.label}
                      {!ok ? " · sold out" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex items-end gap-3">
              <p className="num font-display text-4xl text-green-900">{inr(price)}</p>
              {onSale ? <p className="num text-lg text-ink-500 line-through">{inr(base)}</p> : null}
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Inclusive of GST · SKU {selected?.sku ?? "—"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border border-line-200">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="num w-10 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!inStock(selected)}
                className="rounded-md bg-green-900 px-8 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-green-700 disabled:opacity-40"
              >
                {inStock(selected) ? "Add to cart" : "Sold out"}
              </button>
              <Link
                to="/cart"
                className="rounded-md border border-line-200 px-6 py-3 text-sm font-semibold text-ink-900 hover:border-green-700"
              >
                View cart
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-line-200 p-5">
              <p className="eyebrow text-gold-600">Delivery check</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  aria-label="Pincode"
                  className="num w-40 rounded-md border border-line-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={checkPincode}
                  disabled={checking}
                  className="rounded-md border border-green-900 px-4 py-2 text-sm font-semibold text-green-900"
                >
                  {checking ? "Checking…" : "Check"}
                </button>
              </div>
              {pin === "none" ? (
                <p className="mt-3 text-sm text-ink-500">
                  We haven't mapped that pincode yet — standard delivery rates will apply.
                </p>
              ) : pin ? (
                <p className="mt-3 text-sm text-ink-900">
                  {pin.is_serviceable
                    ? `Delivers to ${pin.district ?? ""} ${pin.state ?? ""} in ${pin.eta_days ?? 3}–${(pin.eta_days ?? 3) + 2} days. ${pin.cod_available ? "Cash on delivery available." : "Prepaid only."}`
                    : "Sorry, we don't deliver to that pincode yet."}
                </p>
              ) : null}
            </div>

            <dl className="mt-8 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Extraction", p.extraction],
                ["Shelf life", p.shelf_life],
                ["Ingredients", p.ingredients],
                ["Storage", p.storage],
                ["HSN", p.hsn_code],
                ["GST", p.gst_rate ? `${p.gst_rate}%` : null],
              ]
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-ink-900">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {p.description ? (
          <section className="mt-20 max-w-[70ch]">
            <h2 className="font-display text-3xl">About this oil</h2>
            <p className="mt-4 whitespace-pre-line text-ink-500">{p.description}</p>
          </section>
        ) : null}

        <section className="mt-20">
          <h2 className="font-display text-3xl">Reviews</h2>
          {(reviews.data ?? []).length === 0 ? (
            <p className="mt-4 text-ink-500">No reviews yet — yours could be the first.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {(reviews.data ?? []).map((r) => (
                <li key={r.id} className="hairline rounded-xl p-5">
                  <p className="text-gold-600">{"★".repeat(r.rating)}</p>
                  {r.title ? <p className="mt-2 font-semibold">{r.title}</p> : null}
                  {r.body ? <p className="mt-1 text-sm text-ink-500">{r.body}</p> : null}
                  <p className="mt-3 text-xs text-ink-500">
                    {r.author_name ?? "Customer"} · {dateOnly(r.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StoreLayout>
  );
}
