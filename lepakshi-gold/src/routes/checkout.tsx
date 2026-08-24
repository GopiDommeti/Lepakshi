import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useSession } from "@/hooks/useSession";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { placeOrder, quoteOrder } from "@/lib/orders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Lepakshi Gold" },
      { name: "description", content: "Delivery details and payment for your oil order." },
      { property: "og:title", content: "Checkout — Lepakshi Gold" },
      { property: "og:description", content: "Cash on delivery and UPI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Quote = Awaited<ReturnType<typeof quoteOrder>>;

type Form = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  customerNote: string;
};

const emptyForm: Form = {
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  district: "",
  state: "Andhra Pradesh",
  pincode: "",
  customerNote: "",
};

const FORM_KEY = "lg-checkout-v1";

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { session } = useSession();
  const [form, setForm] = useState<Form>(emptyForm);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [payment, setPayment] = useState<"cod" | "upi">("cod");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FORM_KEY);
      if (saved) setForm({ ...emptyForm, ...(JSON.parse(saved) as Partial<Form>) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FORM_KEY, JSON.stringify(form));
  }, [form]);

  const items = useMemo(
    () => cart.lines.map((l) => ({ variationId: l.variationId, quantity: l.quantity })),
    [cart.lines],
  );

  // Re-price on the server whenever anything that affects the total changes.
  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    void quoteOrder({
      data: {
        items,
        pincode: form.pincode.length === 6 ? form.pincode : null,
        state: form.state || null,
        couponCode: appliedCoupon,
        paymentMethod: payment === "cod" ? "cod" : "upi",
      },
    })
      .then((result) => {
        if (cancelled) return;
        setQuote(result);
        if (result.couponMessage && appliedCoupon && result.couponCode === null) {
          toast.error(result.couponMessage);
          setAppliedCoupon(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) toast.error(e.message);
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, form.pincode, form.state, appliedCoupon, payment]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof Form, string>> = {};
    if (form.contactName.trim().length < 2) next.contactName = "Tell us who to deliver to.";
    if (!/^[6-9]\d{9}$/.test(form.contactPhone.replace(/\D/g, "").slice(-10)))
      next.contactPhone = "A 10-digit Indian mobile number, please.";
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail))
      next.contactEmail = "That email doesn't look right.";
    if (form.line1.trim().length < 3) next.line1 = "House and street, please.";
    if (form.city.trim().length < 2) next.city = "Which town or city?";
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = "Six digits.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const place = useMutation({
    mutationFn: async () => {
      const digits = form.contactPhone.replace(/\D/g, "").slice(-10);
      return placeOrder({
        data: {
          items,
          contactName: form.contactName.trim(),
          contactPhone: digits,
          ...(form.contactEmail.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
          shippingAddress: {
            full_name: form.contactName.trim(),
            phone: digits,
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            landmark: form.landmark.trim() || undefined,
            city: form.city.trim(),
            district: form.district.trim() || undefined,
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          },
          couponCode: appliedCoupon,
          paymentMethod: payment,
          ...(form.customerNote.trim() ? { customerNote: form.customerNote.trim() } : {}),
        },
      });
    },
    onSuccess: (result) => {
      // Remember the phone so the confirmation page can look the order up.
      window.sessionStorage.setItem(
        "lg-last-order",
        JSON.stringify({ orderNo: result.orderNo, phone: form.contactPhone.replace(/\D/g, "").slice(-10) }),
      );
      cart.clear();
      toast.success("Order placed");
      void navigate({ to: "/order/$orderNo", params: { orderNo: result.orderNo } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cart.lines.length === 0 && !place.isPending) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <h1 className="font-display text-4xl">Your cart is empty</h1>
          <p className="mt-3 text-ink-500">Add an oil or two and come back.</p>
          <Link
            to="/shop"
            className="mt-8 inline-block rounded-md bg-green-900 px-6 py-3 text-sm font-semibold text-cream-50"
          >
            Shop the range
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const codBlocked = payment === "cod" && quote !== null && !quote.codAvailable;
  const unserviceable = quote !== null && !quote.serviceable;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card title="Contact" step={1}>
              {!session ? (
                <p className="mb-4 text-sm text-ink-500">
                  Checking out as a guest is fine.{" "}
                  <Link to="/auth" className="text-green-700 underline">
                    Sign in
                  </Link>{" "}
                  if you'd rather keep your orders together.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.contactName}
                  error={errors.contactName}
                  onChange={(v) => setForm({ ...form, contactName: v })}
                />
                <Input
                  label="Mobile number"
                  value={form.contactPhone}
                  error={errors.contactPhone}
                  mono
                  placeholder="9876543210"
                  onChange={(v) => setForm({ ...form, contactPhone: v })}
                />
                <Input
                  label="Email (optional)"
                  value={form.contactEmail}
                  error={errors.contactEmail}
                  className="sm:col-span-2"
                  onChange={(v) => setForm({ ...form, contactEmail: v })}
                />
              </div>
            </Card>

            <Card title="Delivery address" step={2}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Pincode"
                  value={form.pincode}
                  error={errors.pincode}
                  mono
                  onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, "").slice(0, 6) })}
                />
                <div className="flex items-end pb-2 text-sm">
                  {quoting ? (
                    <span className="flex items-center gap-2 text-ink-500">
                      <Loader2 className="size-3.5 animate-spin" /> Checking…
                    </span>
                  ) : unserviceable ? (
                    <span className="text-destructive">We don't deliver here yet.</span>
                  ) : quote?.etaDays ? (
                    <span className="flex items-center gap-2 text-success">
                      <Truck className="size-4" /> Delivers in about {quote.etaDays} days
                    </span>
                  ) : null}
                </div>
                <Input
                  label="House / flat and street"
                  value={form.line1}
                  error={errors.line1}
                  className="sm:col-span-2"
                  onChange={(v) => setForm({ ...form, line1: v })}
                />
                <Input
                  label="Area (optional)"
                  value={form.line2}
                  onChange={(v) => setForm({ ...form, line2: v })}
                />
                <Input
                  label="Landmark (optional)"
                  value={form.landmark}
                  onChange={(v) => setForm({ ...form, landmark: v })}
                />
                <Input
                  label="Town / city"
                  value={form.city}
                  error={errors.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <Input
                  label="District (optional)"
                  value={form.district}
                  onChange={(v) => setForm({ ...form, district: v })}
                />
                <Input
                  label="State"
                  value={form.state}
                  className="sm:col-span-2"
                  onChange={(v) => setForm({ ...form, state: v })}
                />
                <Input
                  label="Delivery note (optional)"
                  value={form.customerNote}
                  className="sm:col-span-2"
                  placeholder="Ring the bell twice, leave with the watchman…"
                  onChange={(v) => setForm({ ...form, customerNote: v })}
                />
              </div>
            </Card>

            <Card title="Payment" step={3}>
              <div className="space-y-3">
                <PaymentOption
                  active={payment === "cod"}
                  disabled={quote !== null && !quote.codAvailable}
                  title="Cash on delivery"
                  hint={
                    quote !== null && !quote.codAvailable
                      ? "Not available for this pincode."
                      : quote && quote.codFee > 0
                        ? `A ${inr(quote.codFee)} handling fee applies.`
                        : "Pay the courier when the oil arrives."
                  }
                  onSelect={() => setPayment("cod")}
                />
                <PaymentOption
                  active={payment === "upi"}
                  title="UPI / bank transfer"
                  hint="We'll send payment details on WhatsApp right after you order."
                  onSelect={() => setPayment("upi")}
                />
              </div>
            </Card>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="hairline rounded-xl bg-card p-5">
              <h2 className="font-display text-xl">Order summary</h2>

              <ul className="mt-4 divide-y divide-line-200">
                {cart.lines.map((l) => (
                  <li key={l.variationId} className="flex gap-3 py-3">
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{l.productName}</span>
                      <span className="block text-xs text-ink-500">
                        {l.variationLabel} × {l.quantity}
                      </span>
                    </span>
                    <span className="num text-sm">{inr(l.price * l.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-line-200 pt-4">
                <label className="mb-1.5 block text-xs font-semibold">Coupon code</label>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="LGWELCOME"
                    className="num w-full rounded-md border border-line-200 bg-card px-3 py-2 text-sm outline-none focus:border-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(coupon.trim() || null)}
                    className="rounded-md border border-line-200 px-3.5 py-2 text-sm font-semibold hover:border-gold-500"
                  >
                    Apply
                  </button>
                </div>
                {quote?.couponCode ? (
                  <p className="mt-2 text-xs text-success">
                    {quote.couponCode} applied.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCoupon("");
                      }}
                    >
                      Remove
                    </button>
                  </p>
                ) : null}
              </div>

              <dl className="mt-5 space-y-2 border-t border-line-200 pt-4 text-sm">
                <SummaryRow label="Subtotal" value={inr(quote?.itemsSubtotal ?? cart.subtotal)} />
                {quote && quote.discountTotal > 0 ? (
                  <SummaryRow label="Discount" value={`− ${inr(quote.discountTotal)}`} />
                ) : null}
                <SummaryRow
                  label={quote?.shippingLabel ?? "Delivery"}
                  value={
                    quote === null
                      ? "—"
                      : quote.shippingTotal === 0
                        ? "Free"
                        : inr(quote.shippingTotal)
                  }
                />
                {quote && quote.codFee > 0 ? (
                  <SummaryRow label="Cash on delivery fee" value={inr(quote.codFee)} />
                ) : null}
                {quote ? (
                  <SummaryRow label="GST included" value={inr(quote.taxTotal)} muted />
                ) : null}
                <div className="flex items-baseline justify-between border-t border-line-200 pt-3">
                  <dt className="font-display text-lg">Total</dt>
                  <dd className="num text-2xl font-semibold text-gold-600">
                    {quoting && !quote ? "…" : inr(quote?.grandTotal ?? cart.subtotal)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={place.isPending || quoting || unserviceable || codBlocked}
                onClick={() => {
                  if (!validate()) {
                    toast.error("Please check the highlighted fields.");
                    return;
                  }
                  place.mutate();
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-5 py-3.5 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {place.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {place.isPending ? "Placing your order…" : "Place order"}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                <ShieldCheck className="size-3.5" />
                Prices are re-checked on our server before the order is created.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}

function Card({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  return (
    <section className="hairline rounded-xl bg-card p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-xl">
        <span className="num flex size-7 items-center justify-center rounded-full bg-green-900 text-xs text-cream-50">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  error,
  placeholder,
  className,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  mono?: boolean | undefined;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold-500",
          mono && "num",
          error ? "border-destructive" : "border-line-200",
        )}
      />
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function PaymentOption({
  active,
  disabled,
  title,
  hint,
  onSelect,
}: {
  active: boolean;
  disabled?: boolean | undefined;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? "border-green-900 bg-cream-100" : "border-line-200 hover:border-gold-500",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          active ? "border-green-900" : "border-line-200",
        )}
      >
        {active ? <span className="size-2 rounded-full bg-green-900" /> : null}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ink-500">{hint}</span>
      </span>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean | undefined;
}) {
  return (
    <div className="flex justify-between">
      <dt className={cn("text-ink-500", muted && "text-xs")}>{label}</dt>
      <dd className={cn("num", muted ? "text-xs text-ink-500" : "")}>{value}</dd>
    </div>
  );
}
