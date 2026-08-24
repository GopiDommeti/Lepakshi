import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  component: Addresses,
});

const blank = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  district: "",
  state: "Andhra Pradesh",
  pincode: "",
};

function Addresses() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<typeof blank | null>(null);

  const addresses = useQuery({
    queryKey: ["account", "addresses", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !draft) return;
      if (draft.full_name.trim().length < 2) throw new Error("Who is this address for?");
      if (!/^\d{6}$/.test(draft.pincode)) throw new Error("A six-digit pincode, please.");
      const { error } = await supabase.from("addresses").insert({
        customer_id: user.id,
        type: "shipping",
        label: draft.label,
        full_name: draft.full_name.trim(),
        phone: draft.phone.replace(/\D/g, "").slice(-10),
        line1: draft.line1.trim(),
        line2: draft.line2.trim() || null,
        landmark: draft.landmark.trim() || null,
        city: draft.city.trim(),
        district: draft.district.trim() || null,
        state: draft.state.trim(),
        pincode: draft.pincode,
        is_default: (addresses.data ?? []).length === 0,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Address saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["account", "addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["account", "addresses"] }),
  });

  const makeDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await supabase.from("addresses").update({ is_default: false }).eq("customer_id", user.id);
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["account", "addresses"] }),
  });

  return (
    <AccountLayout title="Addresses" lead="Where we send your oil.">
      {addresses.isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-cream-100" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(addresses.data ?? []).map((a) => (
            <li key={a.id} className="hairline rounded-xl bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gold-600">{a.label ?? "Address"}</p>
                  <p className="mt-1 font-medium">{a.full_name}</p>
                </div>
                <button
                  type="button"
                  aria-label="Delete address"
                  className="rounded p-1.5 text-ink-500 hover:text-destructive"
                  onClick={() => remove.mutate(a.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                {a.landmark ? `, ${a.landmark}` : ""}
                <br />
                {a.city}, {a.state} — <span className="num">{a.pincode}</span>
                <br />
                <span className="num">{a.phone}</span>
              </p>
              {a.is_default ? (
                <p className="mt-3 text-xs font-semibold text-success">Default address</p>
              ) : (
                <button
                  type="button"
                  onClick={() => makeDefault.mutate(a.id)}
                  className="mt-3 text-xs text-green-700 underline"
                >
                  Make default
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="mt-6 hairline rounded-xl bg-card p-6">
          <h2 className="font-display text-xl">New address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Label">
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Full name">
              <input
                value={draft.full_name}
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                value={draft.phone}
                onChange={(e) =>
                  setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                className={cn(inputClass, "num")}
              />
            </Field>
            <Field label="Pincode">
              <input
                value={draft.pincode}
                onChange={(e) =>
                  setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                }
                className={cn(inputClass, "num")}
              />
            </Field>
            <Field label="House / flat and street" className="sm:col-span-2">
              <input
                value={draft.line1}
                onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Area">
              <input
                value={draft.line2}
                onChange={(e) => setDraft({ ...draft, line2: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Landmark">
              <input
                value={draft.landmark}
                onChange={(e) => setDraft({ ...draft, landmark: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Town / city">
              <input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="State">
              <input
                value={draft.state}
                onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => save.mutate()}
              className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md border border-line-200 px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-line-200 px-5 py-2.5 text-sm font-semibold hover:border-gold-500"
        >
          <Plus className="size-4" /> Add an address
        </button>
      )}
    </AccountLayout>
  );
}

const inputClass =
  "w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none focus:border-gold-500";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
