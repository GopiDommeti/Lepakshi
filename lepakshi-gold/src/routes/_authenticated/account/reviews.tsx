import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/catalog";
import { dateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/reviews")({
  component: MyReviews,
});

function MyReviews() {
  const { user } = useSession();
  const products = useQuery(productsQuery());

  const reviews = useQuery({
    queryKey: ["account", "reviews", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const productName = (id: string) =>
    (products.data ?? []).find((p) => p.id === id)?.name ?? "A product";

  return (
    <AccountLayout title="My reviews" lead="What you've written about our oils.">
      {reviews.isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-cream-100" />
      ) : (reviews.data ?? []).length === 0 ? (
        <div className="hairline rounded-xl bg-card p-10 text-center">
          <p className="font-display text-lg">No reviews yet</p>
          <p className="mt-2 text-sm text-ink-500">
            After an order arrives, you can review it from the product page.
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-block rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
          >
            Browse the range
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {(reviews.data ?? []).map((r) => (
            <li key={r.id} className="hairline rounded-xl bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{productName(r.product_id)}</p>
                <span className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "size-3.5",
                        n <= r.rating ? "fill-gold-500 text-gold-500" : "text-line-200",
                      )}
                    />
                  ))}
                </span>
              </div>
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              {r.body ? <p className="mt-1 text-sm text-ink-500">{r.body}</p> : null}
              <p className="mt-3 text-xs text-ink-500">
                {dateOnly(r.created_at)} ·{" "}
                {r.status === "approved"
                  ? "Published"
                  : r.status === "pending"
                    ? "Waiting for moderation"
                    : "Not published"}
              </p>
              {r.reply ? (
                <p className="mt-3 rounded-md bg-cream-100 p-3 text-sm">
                  <span className="font-semibold">Lepakshi Gold:</span> {r.reply}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
