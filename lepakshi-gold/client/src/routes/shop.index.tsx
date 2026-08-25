import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { categoriesQuery, priceRange, productsQuery } from "@/lib/catalog";
import { Seo } from "@/lib/seo";

export const Route = createFileRoute("/shop/")({
  component: Shop,
});

type Sort = "featured" | "price-asc" | "price-desc" | "name";

function Shop() {
  const products = useQuery(productsQuery());
  const categories = useQuery(categoriesQuery());
  const [sort, setSort] = useState<Sort>("featured");
  const [organicOnly, setOrganicOnly] = useState(false);

  const list = useMemo(() => {
    let rows = [...(products.data ?? [])];
    if (organicOnly) rows = rows.filter((p) => p.is_organic);
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc") return priceRange(a.variations)[0] - priceRange(b.variations)[0];
      if (sort === "price-desc") return priceRange(b.variations)[0] - priceRange(a.variations)[0];
      return Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order;
    });
    return rows;
  }, [products.data, sort, organicOnly]);

  return (
    <StoreLayout>
      <Seo
        title="Shop organic cold-pressed oils | Lepakshi Gold"
        description="The full range of organic edible oils — groundnut, coconut, sesame, sunflower, safflower, mustard and rice bran. Pack sizes from 500 ml to 15 L."
        path="/shop"
      />

      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <p className="eyebrow text-gold-600">The range</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Shop all oils</h1>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-line-200 py-4">
          <label className="flex items-center gap-2 text-sm text-ink-900">
            <input
              type="checkbox"
              checked={organicOnly}
              onChange={(e) => setOrganicOnly(e.target.checked)}
              className="size-4 accent-green-900"
            />
            Cold-pressed only
          </label>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <label htmlFor="sort" className="text-ink-500">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-line-200 bg-card px-3 py-2 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(categories.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/shop/$categorySlug"
              params={{ categorySlug: c.slug }}
              className="rounded-full border border-line-200 px-4 py-1.5 text-sm text-ink-900 transition-colors hover:border-green-700 hover:text-green-700"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {products.isLoading ? (
          <p className="mt-16 text-ink-500">Loading the range…</p>
        ) : list.length === 0 ? (
          <p className="mt-16 text-ink-500">No oils match that filter.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
