import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly, inr, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/")({
  component: AccountHome,
});

function AccountHome() {
  const { user } = useSession();

  const summary = useQuery({
    queryKey: ["account", "summary", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return null;
      const [orders, addresses, wishlist, profile] = await Promise.all([
        supabase
          .from("orders")
          .select("id,order_no,status,grand_total,placed_at")
          .eq("customer_id", user.id)
          .order("placed_at", { ascending: false })
          .limit(3),
        supabase.from("addresses").select("id").eq("customer_id", user.id),
        supabase.from("wishlists").select("id").eq("customer_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      return {
        orders: orders.data ?? [],
        addressCount: (addresses.data ?? []).length,
        wishlistCount: (wishlist.data ?? []).length,
        profile: profile.data,
      };
    },
    enabled: Boolean(user),
  });

  const name = summary.data?.profile?.full_name ?? user?.email ?? "there";

  return (
    <AccountLayout title={`Hello, ${name}`} lead="Your orders, addresses and saved oils.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={summary.data?.orders.length ?? 0} />
        <Stat label="Saved addresses" value={summary.data?.addressCount ?? 0} />
        <Stat label="Wishlist" value={summary.data?.wishlistCount ?? 0} />
      </div>

      <section className="mt-8 hairline rounded-xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent orders</h2>
          <Link to="/account/orders" className="text-xs text-green-700 hover:underline">
            View all
          </Link>
        </div>
        {summary.isLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded bg-cream-100" />
        ) : (summary.data?.orders ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            Nothing yet.{" "}
            <Link to="/shop" className="text-green-700 underline">
              Have a look at the range.
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line-200">
            {(summary.data?.orders ?? []).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="num block font-semibold">{o.order_no}</span>
                  <span className="block text-xs text-ink-500">{dateOnly(o.placed_at)}</span>
                </span>
                <span className="text-sm">{statusLabel(o.status)}</span>
                <span className="num font-semibold">{inr(o.grand_total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hairline rounded-xl bg-card p-5">
      <p className="eyebrow text-ink-500">{label}</p>
      <p className="num mt-2 text-3xl font-semibold text-green-900">{value}</p>
    </div>
  );
}
