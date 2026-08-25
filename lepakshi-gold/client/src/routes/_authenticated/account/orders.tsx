import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { db } from "@/lib/db";
import { dateTime, inr, statusLabel } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: AccountOrders,
});

function AccountOrders() {
  const { user } = useSession();
  const cart = useCart();
  const [openId, setOpenId] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["account", "orders", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("placed_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const items = useQuery({
    queryKey: ["account", "order-items", openId ?? "none"],
    queryFn: async () => {
      if (!openId) return [];
      const { data, error } = await db
        .from("order_items")
        .select("*")
        .eq("order_id", openId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(openId),
  });

  const reorder = () => {
    const lines = items.data ?? [];
    if (lines.length === 0) return;
    for (const i of lines) {
      if (!i.variation_id || !i.product_id) continue;
      cart.add(
        {
          variationId: i.variation_id,
          productId: i.product_id,
          slug: "",
          productName: i.product_name_snapshot ?? "Item",
          variationLabel: i.variation_label_snapshot ?? "",
          sku: i.sku_snapshot ?? "",
          price: Number(i.unit_price),
          weightGrams: 0,
        },
        Number(i.quantity),
      );
    }
    toast.success("Added back to your cart");
  };

  return (
    <AccountLayout title="My orders" lead="Everything you've ordered, newest first.">
      {orders.isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-cream-100" />
      ) : (orders.data ?? []).length === 0 ? (
        <div className="hairline rounded-xl bg-card p-10 text-center">
          <p className="font-display text-lg">No orders yet</p>
          <Link
            to="/shop"
            className="mt-5 inline-block rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
          >
            Shop the range
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {(orders.data ?? []).map((o) => (
            <li key={o.id} className="hairline rounded-xl bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="num font-display text-xl">{o.order_no}</p>
                  <p className="text-xs text-ink-500">{dateTime(o.placed_at)}</p>
                </div>
                <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold">
                  {statusLabel(o.status)}
                </span>
                <span className="num font-semibold">{inr(o.grand_total)}</span>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                  className="text-sm text-green-700 underline"
                >
                  {openId === o.id ? "Hide" : "Details"}
                </button>
              </div>

              {openId === o.id ? (
                <div className="mt-5 border-t border-line-200 pt-4">
                  {items.isLoading ? (
                    <div className="h-16 animate-pulse rounded bg-cream-100" />
                  ) : (
                    <>
                      <ul className="divide-y divide-line-200">
                        {(items.data ?? []).map((i) => (
                          <li key={i.id} className="flex justify-between gap-4 py-2.5 text-sm">
                            <span>
                              {i.product_name_snapshot}
                              <span className="block text-xs text-ink-500">
                                {i.variation_label_snapshot} × {Number(i.quantity)}
                              </span>
                            </span>
                            <span className="num">{inr(i.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                      {o.tracking_number ? (
                        <p className="mt-4 text-sm">
                          {o.courier_name} · <span className="num">{o.tracking_number}</span>
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={reorder}
                        className="mt-4 rounded-md border border-line-200 px-4 py-2 text-sm font-semibold hover:border-gold-500"
                      >
                        Order this again
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
