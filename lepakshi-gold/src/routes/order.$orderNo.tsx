import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { inr, dateTime, statusLabel } from "@/lib/format";
import { trackOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/order/$orderNo")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Lepakshi Gold" },
      { name: "description", content: "Your order summary, delivery address and ETA." },
      { property: "og:title", content: "Order confirmed — Lepakshi Gold" },
      { property: "og:description", content: "Thank you for your order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

type Result = Awaited<ReturnType<typeof trackOrder>>;

function OrderPage() {
  const { orderNo } = Route.useParams();
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Result | null>(null);
  const [checked, setChecked] = useState(false);

  const lookup = useMutation({
    mutationFn: async (digits: string) => trackOrder({ data: { orderNo, phone: digits } }),
    onSuccess: (result) => {
      setOrder(result);
      setChecked(true);
    },
    onError: () => setChecked(true),
  });

  // Straight after checkout we already know the phone number.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("lg-last-order");
      if (!saved) {
        setChecked(true);
        return;
      }
      const parsed = JSON.parse(saved) as { orderNo: string; phone: string };
      if (parsed.orderNo === orderNo && parsed.phone) {
        lookup.mutate(parsed.phone);
      } else {
        setChecked(true);
      }
    } catch {
      setChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNo]);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-7 text-success" />
          <p className="eyebrow text-gold-600">Order placed</p>
        </div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Thank you.</h1>
        <p className="mt-3 text-ink-500">
          Your order number is <span className="num font-semibold text-ink-900">{orderNo}</span>.
          Keep it handy — you can track the order with it any time.
        </p>

        {!order && checked ? (
          <div className="mt-10 hairline rounded-xl bg-card p-6">
            <h2 className="font-display text-xl">See your order</h2>
            <p className="mt-1 text-sm text-ink-500">
              Enter the mobile number you ordered with.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="num w-full max-w-[220px] rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none focus:border-gold-500"
              />
              <button
                type="button"
                disabled={phone.length !== 10 || lookup.isPending}
                onClick={() => lookup.mutate(phone)}
                className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-50"
              >
                {lookup.isPending ? "Checking…" : "Show my order"}
              </button>
            </div>
            {lookup.isSuccess && !order ? (
              <p className="mt-3 text-sm text-destructive">
                We couldn't match that number to this order.
              </p>
            ) : null}
          </div>
        ) : null}

        {order ? (
          <div className="mt-10 space-y-6">
            <div className="hairline rounded-xl bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold">
                  <Package className="size-3.5" />
                  {statusLabel(order.status)}
                </span>
                <span className="text-xs text-ink-500">{dateTime(order.placedAt)}</span>
              </div>

              <ul className="mt-5 divide-y divide-line-200">
                {order.items.map((i, index) => (
                  <li key={index} className="flex justify-between gap-4 py-3">
                    <span>
                      <span className="block text-sm font-medium">{i.product_name_snapshot}</span>
                      <span className="block text-xs text-ink-500">
                        {i.variation_label_snapshot} × {Number(i.quantity)}
                      </span>
                    </span>
                    <span className="num text-sm">{inr(i.line_total)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-between border-t border-line-200 pt-4">
                <span className="font-display text-lg">Total</span>
                <span className="num text-xl font-semibold text-gold-600">
                  {inr(order.grandTotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {statusLabel(order.paymentMethod)} · {statusLabel(order.paymentStatus)}
              </p>
            </div>

            {order.trackingNumber ? (
              <div className="hairline rounded-xl bg-card p-6">
                <h2 className="font-display text-xl">On its way</h2>
                <p className="mt-2 text-sm">
                  {order.courierName} · <span className="num">{order.trackingNumber}</span>
                </p>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-green-700 underline"
                  >
                    Track with the courier
                  </a>
                ) : null}
              </div>
            ) : null}

            <ol className="hairline space-y-3 rounded-xl bg-card p-6">
              {order.history.map((h, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-500" />
                  <span>
                    <span className="block font-medium">{statusLabel(h.to_status)}</span>
                    <span className="block text-xs text-ink-500">{dateTime(h.changed_at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="rounded-md bg-green-900 px-5 py-3 text-sm font-semibold text-cream-50"
          >
            Keep shopping
          </Link>
          <Link
            to="/track-order"
            className="inline-flex items-center gap-2 rounded-md border border-line-200 px-5 py-3 text-sm font-semibold"
          >
            <MessageCircle className="size-4" /> Track this order later
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
