import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Search } from "lucide-react";
import { useState } from "react";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { dateTime, inr, statusLabel } from "@/lib/format";
import { trackOrder } from "@/lib/orders";
import { Seo } from "@/lib/seo";

export const Route = createFileRoute("/track-order")({
  component: TrackPage,
});

type Result = Awaited<ReturnType<typeof trackOrder>>;

const STEPS = ["pending", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

function TrackPage() {
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useMutation({
    mutationFn: async () => trackOrder({ data: { orderNo: orderNo.trim(), phone } }),
    onSuccess: (result) => {
      setOrder(result);
      setNotFound(result === null);
    },
    onError: () => setNotFound(true),
  });

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <StoreLayout>
      <Seo
        title="Track your order | Lepakshi Gold"
        description="Enter your order number and phone number to see where your oil is."
        path="/track-order"
      />

      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <p className="eyebrow text-gold-600">Where is my oil?</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Track your order</h1>
        <p className="mt-4 max-w-[60ch] text-ink-500">
          No account needed. Use the order number from your confirmation and the mobile number you
          ordered with.
        </p>

        <div className="mt-8 hairline rounded-xl bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Order number</span>
              <input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
                placeholder="LG1001"
                className="num w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none focus:border-gold-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Mobile number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="num w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none focus:border-gold-500"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!orderNo.trim() || phone.length !== 10 || lookup.isPending}
            onClick={() => {
              setNotFound(false);
              lookup.mutate();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-50"
          >
            <Search className="size-4" />
            {lookup.isPending ? "Looking…" : "Find my order"}
          </button>
          {notFound ? (
            <p className="mt-3 text-sm text-destructive">
              No order matches that combination. Check the number and try again, or call us.
            </p>
          ) : null}
        </div>

        {order ? (
          <div className="mt-8 space-y-6">
            <div className="hairline rounded-xl bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="num font-display text-2xl">{order.orderNo}</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold">
                  <Package className="size-3.5" />
                  {statusLabel(order.status)}
                </span>
              </div>

              {stepIndex >= 0 ? (
                <ol className="mt-6 flex flex-wrap gap-x-2 gap-y-3">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span
                        className={
                          i <= stepIndex
                            ? "size-2.5 rounded-full bg-green-700"
                            : "size-2.5 rounded-full bg-line-200"
                        }
                      />
                      <span
                        className={
                          i <= stepIndex ? "text-xs font-medium" : "text-xs text-ink-500"
                        }
                      >
                        {statusLabel(s)}
                      </span>
                      {i < STEPS.length - 1 ? (
                        <span className="hidden h-px w-6 bg-line-200 sm:block" />
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}

              <ul className="mt-6 divide-y divide-line-200 border-t border-line-200">
                {order.items.map((i, index) => (
                  <li key={index} className="flex justify-between gap-4 py-3">
                    <span className="text-sm">
                      {i.product_name_snapshot}
                      <span className="block text-xs text-ink-500">
                        {i.variation_label_snapshot} × {Number(i.quantity)}
                      </span>
                    </span>
                    <span className="num text-sm">{inr(i.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between">
                <span className="text-sm text-ink-500">Total</span>
                <span className="num font-semibold">{inr(order.grandTotal)}</span>
              </div>

              {order.trackingNumber ? (
                <p className="mt-4 border-t border-line-200 pt-4 text-sm">
                  {order.courierName} · <span className="num">{order.trackingNumber}</span>
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-green-700 underline"
                    >
                      Track with the courier
                    </a>
                  ) : null}
                </p>
              ) : null}

              <p className="mt-4 text-xs text-ink-500">
                Delivering to {order.city}
                {order.state ? `, ${order.state}` : ""} · placed {dateTime(order.placedAt)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </StoreLayout>
  );
}
