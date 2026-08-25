import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { db } from "@/lib/db";
import { priceRange, productsQuery } from "@/lib/catalog";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/wishlist")({
  component: Wishlist,
});

function Wishlist() {
  const { user } = useSession();
  const qc = useQueryClient();
  const products = useQuery(productsQuery());

  const wishlist = useQuery({
    queryKey: ["account", "wishlist", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from("wishlists")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("wishlists").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["account", "wishlist"] }),
  });

  const rows = (wishlist.data ?? [])
    .map((w) => ({
      id: w.id,
      product: (products.data ?? []).find((p) => p.id === w.product_id),
    }))
    .filter((r) => r.product);

  return (
    <AccountLayout title="Wishlist" lead="Oils you've saved for later.">
      {wishlist.isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-cream-100" />
      ) : rows.length === 0 ? (
        <div className="hairline rounded-xl bg-card p-10 text-center">
          <p className="font-display text-lg">Nothing saved yet</p>
          <p className="mt-2 text-sm text-ink-500">
            Tap the heart on any oil to keep it here.
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-block rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
          >
            Browse the range
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ id, product }) => {
            if (!product) return null;
            const [min] = priceRange(product.variations);
            return (
              <li key={id} className="hairline flex gap-4 rounded-xl bg-card p-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-md bg-cream-100">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="font-display text-lg hover:text-green-700"
                  >
                    {product.name}
                  </Link>
                  {min > 0 ? (
                    <p className="num mt-1 text-sm font-semibold text-green-900">
                      From {inr(min)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Remove from wishlist"
                  onClick={() => remove.mutate(id)}
                  className="h-fit rounded p-1.5 text-ink-500 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
