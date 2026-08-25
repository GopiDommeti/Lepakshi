import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { db } from "@/lib/db";
import { settingsQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const TYPES = ["Retail", "Wholesale", "Distributorship", "Feedback"] as const;

function ContactPage() {
  const settings = useQuery(settingsQuery());
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Retail" as (typeof TYPES)[number],
    message: "",
  });
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Please tell us your name.");
      if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
        throw new Error("A 10-digit mobile number, please.");
      }
      if (form.message.trim().length < 5) throw new Error("Add a short message.");
      const { error } = await db.from("enquiries").insert({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, "").slice(-10),
        email: form.email.trim() || null,
        type: form.type,
        message: form.message.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setSent(true);
      setForm({ name: "", phone: "", email: "", type: "Retail", message: "" });
      toast.success("Thanks — we'll call you back.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const store = settings.data;

  return (
    <StoreLayout>
      <Seo
        title="Contact & wholesale | Lepakshi Gold"
        description="Retail orders, wholesale supply and distributorship enquiries for organic edible oils across India."
        path="/contact"
      />

      <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-20">
        <p className="eyebrow text-gold-600">Talk to us</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Contact & wholesale</h1>
        <p className="mt-4 max-w-[62ch] text-ink-500">
          Ordering for a shop, a hotel kitchen or a distributorship? Call us — it is usually faster
          than email, and we answer the phone ourselves.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-8">
            <div className="hairline rounded-xl bg-card p-6">
              <h2 className="font-display text-xl">Reach us</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold-600" />
                  <address className="whitespace-pre-line not-italic text-ink-500">
                    {store?.legal_name ?? "Venkateshwara Oil Traders"}
                    {"\n"}
                    {store?.address ?? "West Godavari, Andhra Pradesh, India"}
                  </address>
                </li>
                {store?.phone ? (
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-gold-600" />
                    <a href={`tel:${store.phone}`} className="num hover:text-green-700">
                      {store.phone}
                    </a>
                  </li>
                ) : null}
                {store?.whatsapp ? (
                  <li className="flex gap-3">
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-600" />
                    <a
                      href={`https://wa.me/${store.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-green-700"
                    >
                      Message us on WhatsApp
                    </a>
                  </li>
                ) : null}
                {store?.email ? (
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-gold-600" />
                    <a href={`mailto:${store.email}`} className="hover:text-green-700">
                      {store.email}
                    </a>
                  </li>
                ) : null}
              </ul>
              <p className="mt-5 border-t border-line-200 pt-4 text-xs text-ink-500">
                Monday to Saturday, 9am to 7pm. Closed on Sundays and festival days.
              </p>
            </div>

            <div className="rounded-xl bg-green-950 p-6 text-cream-50">
              <h2 className="font-display text-xl">Wholesale & distribution</h2>
              <p className="mt-2 text-sm text-cream-100/75">
                Bulk tins, shop supply and district distributorships are handled directly. Tell us
                the volume you need and where you are, and we'll quote.
              </p>
              {store?.phone ? (
                <a
                  href={`tel:${store.phone}`}
                  className="num mt-4 inline-block border-b border-gold-500 pb-1 text-sm font-semibold text-gold-500"
                >
                  {store.phone}
                </a>
              ) : null}
            </div>
          </div>

          <div className="hairline h-fit rounded-xl bg-card p-6">
            <h2 className="font-display text-xl">Send an enquiry</h2>
            {sent ? (
              <div className="mt-6 rounded-lg bg-cream-100 p-5">
                <p className="font-medium">Thanks — your message is with us.</p>
                <p className="mt-1 text-sm text-ink-500">
                  We usually reply the same working day.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-sm text-green-700 underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="Your name">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile number">
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      placeholder="9876543210"
                      className={cn(inputClass, "num")}
                    />
                  </Field>
                  <Field label="Email (optional)">
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="What is this about?">
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm transition-colors",
                          form.type === t
                            ? "border-green-900 bg-green-900 text-cream-50"
                            : "border-line-200 hover:border-gold-500",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Message">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How much oil, which types, and where you're based."
                    className={cn(inputClass, "min-h-[130px] resize-y")}
                  />
                </Field>
                <button
                  type="button"
                  disabled={send.isPending}
                  onClick={() => send.mutate()}
                  className="w-full rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {send.isPending ? "Sending…" : "Send enquiry"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

const inputClass =
  "w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold-500";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
