import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  Field,
  Loading,
  Panel,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/ui";
import { adminSettingsQuery, simpleListQuery, type SettingsRow } from "@/lib/admin";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsScreen,
});

const TABS = ["Store", "Orders", "Shipping & payment", "Users"] as const;

type Draft = {
  store_name: string;
  legal_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  gstin: string;
  fssai_no: string;
  logo_url: string;
  order_prefix: string;
  next_order_number: number;
  free_shipping_above: number;
  default_shipping_fee: number;
  cod_enabled: boolean;
  cod_extra_fee: number;
  razorpay_enabled: boolean;
  prices_include_tax: boolean;
  maintenance_mode: boolean;
  low_stock_alert_email: string;
};

function SettingsScreen() {
  const qc = useQueryClient();
  const settings = useQuery(adminSettingsQuery());
  const roles = useQuery(simpleListQuery("user_roles", { column: "created_at" }));
  const [tab, setTab] = useState<(typeof TABS)[number]>("Store");
  const [draft, setDraft] = useState<Draft | null>(null);

  const row = settings.data as SettingsRow | null | undefined;
  if (!draft && row) {
    setDraft({
      store_name: row.store_name ?? "Lepakshi Gold",
      legal_name: row.legal_name ?? "Venkateshwara Oil Traders",
      address: row.address ?? "",
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      email: row.email ?? "",
      gstin: row.gstin ?? "",
      fssai_no: row.fssai_no ?? "",
      logo_url: row.logo_url ?? "",
      order_prefix: row.order_prefix ?? "LG",
      next_order_number: Number(row.next_order_number ?? 1001),
      free_shipping_above: Number(row.free_shipping_above ?? 999),
      default_shipping_fee: Number(row.default_shipping_fee ?? 60),
      cod_enabled: row.cod_enabled ?? true,
      cod_extra_fee: Number(row.cod_extra_fee ?? 0),
      razorpay_enabled: row.razorpay_enabled ?? false,
      prices_include_tax: row.prices_include_tax ?? true,
      maintenance_mode: row.maintenance_mode ?? false,
      low_stock_alert_email: row.low_stock_alert_email ?? "",
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const payload = { ...draft, updated_at: new Date().toISOString() };
      const res = row
        ? await db.from("settings").update(payload).eq("id", row.id)
        : await db.from("settings").insert({ ...payload, id: true });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage
      title="Settings"
      ownerOnly
      description="Store identity, invoice numbering, payment and staff access."
      actions={
        <Btn disabled={!draft || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Btn>
      }
    >
      <div className="mb-5 flex flex-wrap gap-1 border-b border-line-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-gold-500 text-green-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {!draft ? (
        <Loading rows={6} />
      ) : tab === "Store" ? (
        <Panel title="Business identity" description="These appear on invoices and in the footer.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name">
              <TextInput
                value={draft.store_name}
                onChange={(e) => setDraft({ ...draft, store_name: e.target.value })}
              />
            </Field>
            <Field label="Legal name">
              <TextInput
                value={draft.legal_name}
                onChange={(e) => setDraft({ ...draft, legal_name: e.target.value })}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <TextArea
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                className="num"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp" hint="Digits only, with country code: 919876543210">
              <TextInput
                className="num"
                value={draft.whatsapp}
                onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
            <Field label="GSTIN">
              <TextInput
                className="num"
                value={draft.gstin}
                onChange={(e) => setDraft({ ...draft, gstin: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="FSSAI licence number">
              <TextInput
                className="num"
                value={draft.fssai_no}
                onChange={(e) => setDraft({ ...draft, fssai_no: e.target.value })}
              />
            </Field>
            <Field label="Logo URL">
              <TextInput
                value={draft.logo_url}
                onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Toggle
                checked={draft.maintenance_mode}
                onToggle={(v) => setDraft({ ...draft, maintenance_mode: v })}
                label="Maintenance mode (hide the storefront)"
              />
            </div>
          </div>
        </Panel>
      ) : tab === "Orders" ? (
        <Panel title="Order numbering and alerts">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order prefix" hint="Orders look like LG1001.">
              <TextInput
                className="num"
                value={draft.order_prefix}
                onChange={(e) => setDraft({ ...draft, order_prefix: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Next order number">
              <TextInput
                type="number"
                className="num"
                value={String(draft.next_order_number)}
                onChange={(e) =>
                  setDraft({ ...draft, next_order_number: Number(e.target.value || 0) })
                }
              />
            </Field>
            <Field label="Low stock alert email" className="sm:col-span-2">
              <TextInput
                value={draft.low_stock_alert_email}
                onChange={(e) => setDraft({ ...draft, low_stock_alert_email: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Toggle
                checked={draft.prices_include_tax}
                onToggle={(v) => setDraft({ ...draft, prices_include_tax: v })}
                label="Product prices already include GST"
              />
            </div>
          </div>
        </Panel>
      ) : tab === "Shipping & payment" ? (
        <Panel title="Rates and payment methods">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Free shipping above (₹)">
              <TextInput
                type="number"
                className="num"
                value={String(draft.free_shipping_above)}
                onChange={(e) =>
                  setDraft({ ...draft, free_shipping_above: Number(e.target.value || 0) })
                }
              />
            </Field>
            <Field label="Default shipping fee (₹)" hint="Used when no zone matches.">
              <TextInput
                type="number"
                className="num"
                value={String(draft.default_shipping_fee)}
                onChange={(e) =>
                  setDraft({ ...draft, default_shipping_fee: Number(e.target.value || 0) })
                }
              />
            </Field>
            <Field label="Cash on delivery fee (₹)">
              <TextInput
                type="number"
                className="num"
                value={String(draft.cod_extra_fee)}
                onChange={(e) => setDraft({ ...draft, cod_extra_fee: Number(e.target.value || 0) })}
              />
            </Field>
            <div className="flex flex-col justify-end gap-4">
              <Toggle
                checked={draft.cod_enabled}
                onToggle={(v) => setDraft({ ...draft, cod_enabled: v })}
                label="Accept cash on delivery"
              />
              <Toggle
                checked={draft.razorpay_enabled}
                onToggle={(v) => setDraft({ ...draft, razorpay_enabled: v })}
                label="Razorpay online payment"
              />
            </div>
            <p className="text-xs text-ink-500 sm:col-span-2">
              Razorpay also needs its API keys added as server environment variables before the
              option appears at checkout.
            </p>
          </div>
        </Panel>
      ) : (
        <Panel title="Staff access" description="Roles are managed in the user_roles table.">
          <div className="space-y-3">
            {(roles.data ?? []).length === 0 ? (
              <p className="text-sm text-ink-500">
                No staff roles yet. Add a row to <span className="num">user_roles</span> in Supabase
                with your user id and the role <span className="num">owner</span> to unlock
                everything.
              </p>
            ) : (
              <ul className="divide-y divide-line-200">
                {(roles.data ?? []).map((r) => {
                  const record = r as { id: string; user_id: string; role: string; is_active: boolean };
                  return (
                    <li key={record.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="num text-xs">{record.user_id}</span>
                      <span className="flex items-center gap-3">
                        <Select
                          className="w-[130px]"
                          value={record.role}
                          onValue={async (v) => {
                            await db
                              .from("user_roles")
                              .update({ role: v as "owner" | "manager" | "staff" })
                              .eq("id", record.id);
                            void qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
                            toast.success("Role updated");
                          }}
                          options={[
                            { value: "owner", label: "Owner" },
                            { value: "manager", label: "Manager" },
                            { value: "staff", label: "Staff" },
                          ]}
                        />
                        <span className="text-xs text-ink-500">
                          {record.is_active ? "Active" : "Disabled"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      )}
    </AdminPage>
  );
}
