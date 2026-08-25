import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  EmptyState,
  Loading,
  money,
  Panel,
  Pill,
  Select,
  StatCard,
  Table,
  Td,
} from "@/components/admin/ui";
import {
  adminOrdersQuery,
  adminProductsQuery,
  simpleListQuery,
  stockQuery,
  type OrderRow,
  type ReviewRow,
} from "@/lib/admin";
import { useIsStaff } from "@/hooks/useSession";
import { dateOnly, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

function withinDays(iso: string, days: number) {
  return new Date(iso).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function Dashboard() {
  const orders = useQuery(adminOrdersQuery());
  const products = useQuery(adminProductsQuery());
  const stock = useQuery(stockQuery());
  const reviews = useQuery(simpleListQuery("reviews", { column: "created_at", ascending: false }));
  const { isOwner } = useIsStaff();
  const [range, setRange] = useState("30");

  const days = Number(range);
  const live = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => withinDays(o.placed_at, days) && !["cancelled", "failed"].includes(o.status),
      ),
    [orders.data, days],
  );

  const kpis = useMemo(() => {
    const revenue = live.reduce((s, o) => s + Number(o.grand_total), 0);
    const previous = (orders.data ?? []).filter((o) => {
      const t = new Date(o.placed_at).getTime();
      return (
        t < Date.now() - days * 86400000 &&
        t >= Date.now() - days * 2 * 86400000 &&
        !["cancelled", "failed"].includes(o.status)
      );
    });
    const prevRevenue = previous.reduce((s, o) => s + Number(o.grand_total), 0);
    const delta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;
    return {
      revenue,
      orders: live.length,
      aov: live.length > 0 ? revenue / live.length : 0,
      delta,
      pending: (orders.data ?? []).filter((o) =>
        ["pending", "processing", "packed"].includes(o.status),
      ).length,
    };
  }, [live, orders.data, days]);

  const series = useMemo(() => {
    const buckets = new Map<string, { day: string; revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      buckets.set(d, { day: d.slice(5), revenue: 0, orders: 0 });
    }
    for (const o of live) {
      const key = o.placed_at.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += Number(o.grand_total);
        bucket.orders += 1;
      }
    }
    const all = [...buckets.values()];
    return days > 60 ? all.filter((_, i) => i % 7 === 0) : all;
  }, [live, days]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders.data ?? []) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name: statusLabel(name), value }));
  }, [orders.data]);

  const lowStock = (stock.data ?? []).filter(
    (r) => r.manage_stock && Number(r.stock_quantity) <= Number(r.low_stock_threshold),
  );
  const pendingReviews = ((reviews.data ?? []) as ReviewRow[]).filter(
    (r) => r.status === "pending",
  );

  const draftCount = (products.data ?? []).filter((p) => p.status === "draft").length;

  const stockValue = (stock.data ?? []).reduce(
    (s, r) => s + Number(r.stock_quantity) * Number(isOwner ? r.cost_price : (r.sale_price ?? r.price)),
    0,
  );

  const CHART_COLORS = ["#17593A", "#C8A04B", "#E7B34A", "#0E3B24", "#6B675C"];

  return (
    <AdminPage
      title="Dashboard"
      description="How the store is doing."
      actions={
        <Select className="w-[170px]" value={range} onValue={setRange} options={RANGES} />
      }
    >
      {orders.isLoading ? (
        <Loading rows={6} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Revenue"
              value={money(kpis.revenue)}
              hint={
                kpis.delta === null
                  ? undefined
                  : `${kpis.delta >= 0 ? "+" : ""}${kpis.delta}% vs previous period`
              }
            />
            <StatCard label="Orders" value={kpis.orders} />
            <StatCard label="Average order" value={money(kpis.aov)} />
            <StatCard label="Awaiting dispatch" value={kpis.pending} />
            <StatCard
              label={isOwner ? "Stock at cost" : "Stock at retail"}
              value={money(stockValue)}
            />
          </div>

          <Panel title="Revenue and orders">
            {live.length === 0 ? (
              <EmptyState
                title="No orders in this period"
                hint="Once the storefront is live, this chart fills in daily."
              />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4DCC9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#6B675C" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6B675C" />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "revenue" ? money(value) : value
                      }
                    />
                    <Bar dataKey="revenue" fill="#E7B34A" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#17593A"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Panel
              title="Needs your attention"
              actions={
                <Link to="/admin/orders" className="text-xs text-green-700 hover:underline">
                  All orders <ArrowRight className="inline size-3" />
                </Link>
              }
            >
              <ul className="space-y-2.5 text-sm">
                {kpis.pending > 0 ? (
                  <Attention
                    tone="gold"
                    label={`${kpis.pending} orders waiting to be dispatched`}
                    action={
                      <Link to="/admin/orders" className="text-xs text-green-700 hover:underline">
                        Open
                      </Link>
                    }
                  />
                ) : null}
                {lowStock.length > 0 ? (
                  <Attention
                    tone="bad"
                    label={`${lowStock.length} pack sizes at or below their stock threshold`}
                    action={
                      <Link to="/admin/stock" className="text-xs text-green-700 hover:underline">
                        Open
                      </Link>
                    }
                  />
                ) : null}
                {pendingReviews.length > 0 ? (
                  <Attention
                    tone="neutral"
                    label={`${pendingReviews.length} reviews waiting for moderation`}
                    action={
                      <Link to="/admin/reviews" className="text-xs text-green-700 hover:underline">
                        Open
                      </Link>
                    }
                  />
                ) : null}
                {draftCount > 0 ? (
                  <Attention
                    tone="neutral"
                    label={`${draftCount} products still in draft`}
                    action={
                      <Link to="/admin/products" className="text-xs text-green-700 hover:underline">
                        Open
                      </Link>
                    }
                  />
                ) : null}
                {kpis.pending === 0 &&
                lowStock.length === 0 &&
                pendingReviews.length === 0 ? (
                  <li className="text-ink-500">Nothing needs you right now.</li>
                ) : null}
              </ul>
            </Panel>

            <Panel title="Orders by status">
              {byStatus.length === 0 ? (
                <EmptyState title="No orders yet" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {byStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length] ?? "#17593A"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="Recent orders"
            actions={
              <Link to="/admin/orders" className="text-xs text-green-700 hover:underline">
                View all
              </Link>
            }
          >
            {(orders.data ?? []).length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <Table head={["Order", "Date", "Customer", "Total", "Status"]}>
                {(orders.data ?? []).slice(0, 8).map((o: OrderRow) => (
                  <tr key={o.id}>
                    <Td className="num font-semibold">{o.order_no}</Td>
                    <Td className="text-xs text-ink-500">{dateOnly(o.placed_at)}</Td>
                    <Td>{o.contact_name ?? "Guest"}</Td>
                    <Td className="num">{money(o.grand_total)}</Td>
                    <Td>
                      <Pill
                        tone={
                          o.status === "delivered"
                            ? "good"
                            : ["cancelled", "failed"].includes(o.status)
                              ? "bad"
                              : "gold"
                        }
                      >
                        {statusLabel(o.status)}
                      </Pill>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      )}
    </AdminPage>
  );
}

function Attention({
  tone,
  label,
  action,
}: {
  tone: "gold" | "bad" | "neutral";
  label: string;
  action: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      {tone === "bad" ? (
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-gold-500" />
      )}
      <span className="flex-1">{label}</span>
      {action}
    </li>
  );
}
