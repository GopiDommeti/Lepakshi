import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  Drawer,
  EmptyState,
  Field,
  Loading,
  money,
  Panel,
  Pill,
  Select,
  Table,
  Td,
  TextInput,
  Toggle,
} from "@/components/admin/ui";
import { simpleListQuery, type CouponRow } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly } from "@/lib/format";
import { randomCouponCode } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsScreen,
});

type Draft = {
  id?: string | undefined;
  code: string;
  description: string;
  type: "percent" | "fixed_cart" | "fixed_product" | "free_shipping";
  value: number;
  min_spend: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  first_order_only: boolean;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const blank = (): Draft => ({
  code: randomCouponCode(),
  description: "",
  type: "percent",
  value: 10,
  min_spend: null,
  max_discount: null,
  usage_limit: null,
  usage_limit_per_customer: 1,
  first_order_only: false,
  starts_at: "",
  expires_at: "",
  is_active: true,
});

function CouponsScreen() {
  const qc = useQueryClient();
  const coupons = useQuery(simpleListQuery("coupons", { column: "created_at", ascending: false }));
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.code.trim()) throw new Error("Give the coupon a code.");
      const payload = {
        code: d.code.trim().toUpperCase(),
        description: d.description.trim() || null,
        type: d.type,
        value: d.value,
        min_spend: d.min_spend,
        max_discount: d.max_discount,
        usage_limit: d.usage_limit,
        usage_limit_per_customer: d.usage_limit_per_customer,
        first_order_only: d.first_order_only,
        starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
        expires_at: d.expires_at ? new Date(d.expires_at).toISOString() : null,
        is_active: d.is_active,
        applies_to: "all" as const,
      };
      const res = d.id
        ? await supabase.from("coupons").update(payload).eq("id", d.id)
        : await supabase.from("coupons").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Coupon saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Coupon deleted");
      void qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (coupons.data ?? []) as CouponRow[];

  const describe = (c: CouponRow) => {
    if (c.type === "percent") return `${Number(c.value)}% off`;
    if (c.type === "free_shipping") return "Free shipping";
    return `${money(c.value)} off`;
  };

  return (
    <AdminPage
      title="Coupons"
      description="Discount codes customers can enter in the cart or at checkout."
      actions={
        <Btn onClick={() => setDraft(blank())}>
          <Plus /> New coupon
        </Btn>
      }
    >
      <Panel>
        {coupons.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No coupons yet"
            hint="A first-order discount is a good place to start."
            action={<Btn onClick={() => setDraft(blank())}>Create a coupon</Btn>}
          />
        ) : (
          <Table head={["Code", "Discount", "Minimum", "Used", "Valid until", "Status", ""]}>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-cream-100/50">
                <Td>
                  <p className="num font-semibold">{c.code}</p>
                  {c.description ? (
                    <p className="text-xs text-ink-500">{c.description}</p>
                  ) : null}
                </Td>
                <Td>{describe(c)}</Td>
                <Td className="num">{c.min_spend ? money(c.min_spend) : "—"}</Td>
                <Td className="num">
                  {c.used_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </Td>
                <Td className="text-xs text-ink-500">
                  {c.expires_at ? dateOnly(c.expires_at) : "No expiry"}
                </Td>
                <Td>
                  <Pill tone={c.is_active ? "good" : "neutral"}>
                    {c.is_active ? "Active" : "Paused"}
                  </Pill>
                </Td>
                <Td className="w-24">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${c.code}`}
                      className="rounded p-1.5 hover:bg-cream-100"
                      onClick={() =>
                        setDraft({
                          id: c.id,
                          code: c.code,
                          description: c.description ?? "",
                          type: c.type,
                          value: Number(c.value),
                          min_spend: c.min_spend === null ? null : Number(c.min_spend),
                          max_discount: c.max_discount === null ? null : Number(c.max_discount),
                          usage_limit: c.usage_limit,
                          usage_limit_per_customer: c.usage_limit_per_customer,
                          first_order_only: c.first_order_only,
                          starts_at: c.starts_at ? c.starts_at.slice(0, 10) : "",
                          expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
                          is_active: c.is_active,
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.code}`}
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Delete coupon ${c.code}?`)) remove.mutate(c.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Drawer
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit coupon" : "New coupon"}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Btn>
            <Btn disabled={save.isPending} onClick={() => draft && save.mutate(draft)}>
              Save coupon
            </Btn>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <div className="flex gap-2">
                <TextInput
                  className="num"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                />
                <Btn variant="outline" onClick={() => setDraft({ ...draft, code: randomCouponCode() })}>
                  New
                </Btn>
              </div>
            </Field>
            <Field label="Type">
              <Select
                value={draft.type}
                onValue={(v) => setDraft({ ...draft, type: v as Draft["type"] })}
                options={[
                  { value: "percent", label: "Percentage off" },
                  { value: "fixed_cart", label: "Fixed amount off cart" },
                  { value: "fixed_product", label: "Fixed amount per item" },
                  { value: "free_shipping", label: "Free shipping" },
                ]}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextInput
                value={draft.description}
                placeholder="Shown to staff only."
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            {draft.type !== "free_shipping" ? (
              <Field label={draft.type === "percent" ? "Percent off" : "Amount off (₹)"}>
                <TextInput
                  type="number"
                  className="num"
                  value={String(draft.value)}
                  onChange={(e) => setDraft({ ...draft, value: Number(e.target.value || 0) })}
                />
              </Field>
            ) : null}
            <Field label="Maximum discount (₹)" hint="Caps a percentage coupon.">
              <TextInput
                type="number"
                className="num"
                value={draft.max_discount === null ? "" : String(draft.max_discount)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    max_discount: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </Field>
            <Field label="Minimum spend (₹)">
              <TextInput
                type="number"
                className="num"
                value={draft.min_spend === null ? "" : String(draft.min_spend)}
                onChange={(e) =>
                  setDraft({ ...draft, min_spend: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
            <Field label="Total uses allowed" hint="Blank means unlimited.">
              <TextInput
                type="number"
                className="num"
                value={draft.usage_limit === null ? "" : String(draft.usage_limit)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    usage_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </Field>
            <Field label="Starts on">
              <TextInput
                type="date"
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
            </Field>
            <Field label="Expires on">
              <TextInput
                type="date"
                value={draft.expires_at}
                onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <Toggle
                checked={draft.first_order_only}
                onToggle={(v) => setDraft({ ...draft, first_order_only: v })}
                label="First order only"
              />
              <Toggle
                checked={draft.is_active}
                onToggle={(v) => setDraft({ ...draft, is_active: v })}
                label="Active"
              />
            </div>
          </div>
        ) : null}
      </Drawer>
    </AdminPage>
  );
}
