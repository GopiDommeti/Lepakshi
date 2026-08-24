import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { categoriesQuery, productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/shop/$categorySlug")({
  head: ({ params }) => {
    const label = params.categorySlug.replace(/-/g, " ");
    const title = `${label} oil — Lepakshi Gold`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Wood-pressed ${label} oil in 500 ml to 15 L packs, pressed fresh in Andhra Pradesh.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Shop ${label} oil from Lepakshi Gold — crushed cold, filtered, never refined.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Category,
});

function Category() {
  const { categorySlug } = Route.useParams();
  const products = useQuery(productsQuery(categorySlug));
  const categories = useQuery(categoriesQuery());
  const category = (categories.data ?? []).find((c) => c.slug === categorySlug);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-500">
          <Link to="/shop" className="hover:text-green-700">
            Shop
          </Link>
          <span className="px-2">/</span>
          <span className="text-ink-900">{category?.name ?? categorySlug.replace(/-/g, " ")}</span>
        </nav>
        <h1 className="mt-4 font-display text-4xl capitalize sm:text-5xl">
          {category?.name ?? categorySlug.replace(/-/g, " ")}
        </h1>
        {category?.name_te ? <p className="te mt-2 text-lg text-ink-500">{category.name_te}</p> : null}
        {category?.description ? (
          <p className="mt-4 max-w-[68ch] text-ink-500">{category.description}</p>
        ) : null}

        {products.isLoading ? (
          <p className="mt-16 text-ink-500">Loading…</p>
        ) : (products.data ?? []).length === 0 ? (
          <p className="mt-16 text-ink-500">Nothing pressed in this category yet.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(products.data ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
