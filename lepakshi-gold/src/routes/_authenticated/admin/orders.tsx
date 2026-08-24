import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
  TextArea,
  TextInput,
  Toolbar,
} from "@/components/admin/ui";
import {
  adminOrderQuery,
  adminOrdersQuery,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/admin";
import { useIsStaff } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { dateTime, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersScreen,
});

function tone(status: string): "good" | "gold" | "bad" | "neutral" {
  if (status === "delivered" || status === "paid") return "good";
  if (["shipped", "packed", "out_for_delivery", "processing"].includes(status)) return "gold";
  if (["cancelled", "failed", "refunded"].includes(status)) return "bad";
  return "neutral";
}

type Address = {
  full_name?: string | undefined;
  phone?: string | undefined;
  line1?: string | undefined;
  line2?: string | undefined;
  landmark?: string | undefined;
  city?: string | undefined;
  district?: string | undefined;
  state?: string | undefined;
  pincode?: string | undefined;
};

function formatAddress(value: unknown): Address {
  return (value ?? {}) as Address;
}

function OrdersScreen() {
  const orders = useQuery(adminOrdersQuery());
  const [statusTab, setStatusTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (orders.data ?? []).filter((o) => {
      if (statusTab !== "all" && o.status !== statusTab) return false;
      if (!term) return true;
      return (
        o.order_no.toLowerCase().includes(term) ||
        (o.contact_phone ?? "").includes(term) ||
        (o.contact_name ?? "").toLowerCase().includes(term) ||
        (o.contact_email ?? "").toLowerCase().includes(term)
      );
    });
  }, [orders.data, statusTab, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.data?.length ?? 0 };
    for (const o of orders.data ?? []) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders.data]);

  const exportCsv = () => {
    const header = [
      "Order",
      "Placed",
      "Customer",
      "Phone",
      "Pincode",
      "Total",
      "Payment",
      "Payment status",
      "Status",
      "Courier",
      "Tracking",
    ];
    const lines = rows.map((o) => {
      const a = formatAddress(o.shipping_address);
      return [
        o.order_no,
        o.placed_at,
        o.contact_name ?? "",
        o.contact_phone ?? "",
        a.pincode ?? "",
        o.grand_total,
        o.payment_method,
        o.payment_status,
        o.status,
        o.courier_name ?? "",
        o.tracking_number ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lepakshi-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPage
      title="Orders"
      description="Every online order, newest first."
      actions={
        <Btn variant="outline" onClick={exportCsv}>
          <Download /> Export CSV
        </Btn>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line-200">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusTab(s)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              statusTab === s
                ? "border-gold-500 text-green-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {s === "all" ? "All" : statusLabel(s)}
            <span className="num ml-1.5 text-xs text-ink-500">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <Toolbar>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <TextInput
            className="pl-8"
            placeholder="Order number, phone or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="num ml-auto text-xs text-ink-500">{rows.length} orders</span>
      </Toolbar>

      <Panel>
        {orders.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No orders here yet"
            hint="Orders placed on the storefront land in this list straight away."
          />
        ) : (
          <Table
            head={["Order", "Placed", "Customer", "Total", "Payment", "Status", "Courier", ""]}
          >
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-cream-100/50">
                <Td className="num font-semibold">{o.order_no}</Td>
                <Td className="whitespace-nowrap text-xs text-ink-500">{dateTime(o.placed_at)}</Td>
                <Td>
                  <p className="font-medium">{o.contact_name ?? "Guest"}</p>
                  <p className="num text-xs text-ink-500">{o.contact_phone}</p>
                </Td>
                <Td className="num font-semibold">{money(o.grand_total)}</Td>
                <Td>
                  <p className="text-xs">{statusLabel(o.payment_method)}</p>
                  <Pill tone={tone(o.payment_status)}>{statusLabel(o.payment_status)}</Pill>
                </Td>
                <Td>
                  <Pill tone={tone(o.status)}>{statusLabel(o.status)}</Pill>
                </Td>
                <Td className="text-xs text-ink-500">{o.courier_name ?? "—"}</Td>
                <Td className="w-16">
                  <button
                    type="button"
                    aria-label={`Open ${o.order_no}`}
                    className="rounded p-1.5 hover:bg-cream-100"
                    onClick={() => setOpenId(o.id)}
                  >
                    <Eye className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {openId ? <OrderDetail orderId={openId} onClose={() => setOpenId(null)} /> : null}
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ detail */

function OrderDetail({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const detail = useQuery(adminOrderQuery(orderId));
  const { isOwner } = useIsStaff();
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const order = detail.data?.order;
  const items = detail.data?.items ?? [];

  if (order && !hydrated) {
    setCourier(order.courier_name ?? "");
    setTracking(order.tracking_number ?? "");
    setTrackingUrl(order.tracking_url ?? "");
    setHydrated(true);
  }

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
    void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const changeStatus = useMutation({
    mutationFn: async (next: OrderStatus) => {
      if (!order) return;
      const { error } = await supabase
        .from("orders")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw new Error(error.message);
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        from_status: order.status,
        to_status: next,
      });
      // Returning stock is explicit, never silent.
      if (next === "cancelled") {
        for (const item of items) {
          if (!item.variation_id) continue;
          await supabase.rpc("adjust_stock", {
            _variation_id: item.variation_id,
            _type: "cancellation",
            _qty: Number(item.quantity),
            _reference_type: "order",
            _reference_id: order.id,
            _note: `Cancelled ${order.order_no}`,
          });
        }
      }
    },
    onSuccess: (_d, next) => {
      toast.success(`Order moved to ${statusLabel(next)}`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async () => {
      if (!order) return;
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", order.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveFulfilment = useMutation({
    mutationFn: async () => {
      if (!order) return;
      const { error } = await supabase
        .from("orders")
        .update({
          courier_name: courier.trim() || null,
          tracking_number: tracking.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          status: tracking.trim() ? "shipped" : order.status,
        })
        .eq("id", order.id);
      if (error) throw new Error(error.message);
      if (tracking.trim() && order.status !== "shipped") {
        await supabase.from("order_status_history").insert({
          order_id: order.id,
          from_status: order.status,
          to_status: "shipped",
        });
      }
    },
    onSuccess: () => {
      toast.success("Dispatch details saved");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!order || !note.trim()) throw new Error("Write the note first.");
      const { error } = await supabase.from("order_notes").insert({
        order_id: order.id,
        note: note.trim(),
        is_customer_visible: false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNote("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refund = useMutation({
    mutationFn: async ({ amount, restock }: { amount: number; restock: boolean }) => {
      if (!order) return;
      const { error } = await supabase.from("refunds").insert({
        order_id: order.id,
        amount,
        reason: "Refunded from admin",
        restock,
      });
      if (error) throw new Error(error.message);
      await supabase
        .from("orders")
        .update({
          payment_status: amount >= Number(order.grand_total) ? "refunded" : "partially_refunded",
        })
        .eq("id", order.id);
      if (restock) {
        for (const item of items) {
          if (!item.variation_id) continue;
          await supabase.rpc("adjust_stock", {
            _variation_id: item.variation_id,
            _type: "return",
            _qty: Number(item.quantity),
            _reference_type: "refund",
            _reference_id: order.id,
            _note: `Refund on ${order.order_no}`,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Refund recorded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shipping = formatAddress(order?.shipping_address);
  const cost = items.reduce(
    (s, i) => s + Number(i.cost_price_snapshot ?? 0) * Number(i.quantity),
    0,
  );
  const profit = Number(order?.items_subtotal ?? 0) - Number(order?.tax_total ?? 0) - cost;

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-4xl"
      title={order ? `Order ${order.order_no}` : "Order"}
      footer={
        order ? (
          <>
            <Btn variant="outline" onClick={() => window.print()}>
              <Printer /> Print invoice
            </Btn>
            <Select
              className="max-w-[190px]"
              value={order.status}
              onValue={(v) => changeStatus.mutate(v as OrderStatus)}
              options={ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
            />
            {order.payment_status !== "paid" ? (
              <Btn onClick={() => markPaid.mutate()}>Mark paid</Btn>
            ) : null}
          </>
        ) : null
      }
    >
      {detail.isLoading || !order ? (
        <Loading rows={8} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={tone(order.status)}>{statusLabel(order.status)}</Pill>
            <Pill tone={tone(order.payment_status)}>
              {statusLabel(order.payment_method)} · {statusLabel(order.payment_status)}
            </Pill>
            <span className="text-xs text-ink-500">{dateTime(order.placed_at)}</span>
          </div>

          <Panel title="Items">
            <Table head={["Item", "SKU", "Qty", "Rate", "Total"]}>
              {items.map((i) => (
                <tr key={i.id}>
                  <Td>
                    <p className="font-medium">{i.product_name_snapshot}</p>
                    <p className="text-xs text-ink-500">{i.variation_label_snapshot}</p>
                  </Td>
                  <Td className="num text-xs">{i.sku_snapshot}</Td>
                  <Td className="num">{Number(i.quantity)}</Td>
                  <Td className="num">{money(i.unit_price)}</Td>
                  <Td className="num font-semibold">{money(i.line_total)}</Td>
                </tr>
              ))}
            </Table>

            <dl className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
              <Row label="Items subtotal" value={money(order.items_subtotal)} />
              {Number(order.discount_total) > 0 ? (
                <Row
                  label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                  value={`− ${money(order.discount_total)}`}
                />
              ) : null}
              <Row label="Shipping" value={money(order.shipping_total)} />
              <Row label="GST included" value={money(order.tax_total)} />
              <Row label="Grand total" value={money(order.grand_total)} strong />
              {isOwner ? (
                <>
                  <Row label="Cost of goods" value={money(cost)} />
                  <Row label="Gross profit" value={money(profit)} strong />
                </>
              ) : null}
            </dl>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Customer">
              <p className="font-medium">{order.contact_name}</p>
              <p className="num text-sm">
                <a href={`tel:${order.contact_phone}`} className="hover:text-green-700">
                  {order.contact_phone}
                </a>
              </p>
              {order.contact_email ? (
                <p className="text-sm text-ink-500">{order.contact_email}</p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                {shipping.line1}
                {shipping.line2 ? `, ${shipping.line2}` : ""}
                {shipping.landmark ? `, ${shipping.landmark}` : ""}
                <br />
                {shipping.city}
                {shipping.district ? `, ${shipping.district}` : ""}
                <br />
                {shipping.state} — <span className="num">{shipping.pincode}</span>
              </p>
              {order.customer_note ? (
                <p className="mt-3 rounded-md bg-cream-100 p-3 text-sm">
                  “{order.customer_note}”
                </p>
              ) : null}
            </Panel>

            <Panel title="Dispatch">
              <div className="space-y-3">
                <Field label="Courier">
                  <TextInput
                    value={courier}
                    placeholder="Delhivery"
                    onChange={(e) => setCourier(e.target.value)}
                  />
                </Field>
                <Field label="Tracking number">
                  <TextInput
                    className="num"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                </Field>
                <Field label="Tracking URL">
                  <TextInput
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                  />
                </Field>
                <Btn disabled={saveFulfilment.isPending} onClick={() => saveFulfilment.mutate()}>
                  Save and mark shipped
                </Btn>
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Internal notes">
              <TextArea
                value={note}
                placeholder="Anything the team should know about this order."
                onChange={(e) => setNote(e.target.value)}
              />
              <Btn className="mt-3" variant="outline" onClick={() => addNote.mutate()}>
                Add note
              </Btn>
              <ul className="mt-4 space-y-2 text-sm">
                {(detail.data?.notes ?? []).map((n) => (
                  <li key={n.id} className="rounded-md bg-cream-100 p-3">
                    <p>{n.note}</p>
                    <p className="mt-1 text-xs text-ink-500">{dateTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Timeline">
              <ol className="space-y-3 text-sm">
                {(detail.data?.history ?? []).map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-500" />
                    <div>
                      <p className="font-medium">{statusLabel(h.to_status)}</p>
                      <p className="text-xs text-ink-500">{dateTime(h.changed_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {isOwner ? (
                <div className="mt-5 border-t border-line-200 pt-4">
                  <Btn
                    variant="danger"
                    onClick={() => {
                      if (window.confirm("Record a full refund and return the stock?")) {
                        refund.mutate({ amount: Number(order.grand_total), restock: true });
                      }
                    }}
                  >
                    Refund in full and restock
                  </Btn>
                </div>
              ) : null}
            </Panel>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className={cn("num", strong && "font-semibold text-green-900")}>{value}</dd>
    </div>
  );
}
