import { Link } from "@tanstack/react-router";

import { inStock, priceRange, type ProductWithVariations } from "@/lib/catalog";
import { inr } from "@/lib/format";

export function ProductCard({ product }: { product: ProductWithVariations }) {
  const [min, max] = priceRange(product.variations);
  const available = product.variations.some(inStock);
  const sizes = product.variations
    .map((v) => v.label)
    .filter(Boolean)
    .slice(0, 5)
    .join(" · ");

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="oil-card oil-card-3d hairline group block overflow-hidden rounded-xl bg-card"
    >
      <div className="aspect-4/5 overflow-hidden bg-cream-100">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            width={480}
            height={600}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-b from-amber-400/25 to-gold-500/10">
            <span className="font-display text-xl text-green-900/40">Lepakshi Gold</span>
          </div>
        )}
      </div>
      <div className="relative p-5">
        <h3 className="font-display text-lg leading-tight">{product.name}</h3>
        {product.name_te ? <p className="te mt-0.5 text-sm text-ink-500">{product.name_te}</p> : null}
        {sizes ? <p className="mt-2 text-xs text-ink-500">{sizes}</p> : null}
        <p className="num mt-3 text-sm font-semibold text-green-900">
          {min === max ? inr(min) : `${inr(min)} – ${inr(max)}`}
        </p>
        {!available ? <p className="mt-1 text-xs text-destructive">Sold out</p> : null}
      </div>
    </Link>
  );
}
