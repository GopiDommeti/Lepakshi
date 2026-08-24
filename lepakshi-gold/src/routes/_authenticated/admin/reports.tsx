import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  EmptyState,
  Loading,
  money,
  Panel,
  Select,
  StatCard,
  Table,
  Td,
} from "@/components/admin/ui";
import { adminOrdersQuery, adminProductsQuery, stockQuery } from "@/lib/admin";
import { useIsStaff } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { dateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsScreen,
});

const REPORTS = ["Sales", "Profit", "Products", "Stock", "GST"] as const;

function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lepakshi-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsScreen() {
  const [report, setReport] = useState<(typeof REPORTS)[number]>("Sales");
  const [days, setDays] = useState("30");
  const { isOwner } = useIsStaff();

  const orders = useQuery(adminOrdersQuery());
  const products = useQuery(adminProductsQuery());
  const stock = useQuery(stockQuery());
  const items = useQuery({
    queryKey: ["admin", "order-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .limit(5000);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const cutoff = Date.now() - Number(days) * 86400000;
  const scoped = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) =>
          new Date(o.placed_at).getTime() >= cutoff && !["cancelled", "failed"].includes(o.status),
      ),
    [orders.data, cutoff],
  );
  const scopedIds = new Set(scoped.map((o) => o.id));
  const scopedItems = (items.data ?? []).filter((i) => scopedIds.has(i.order_id));

  const revenue = scoped.reduce((s, o) => s + Number(o.grand_total), 0);
  const tax = scoped.reduce((s, o) => s + Number(o.tax_total), 0);
  const cogs = scopedItems.reduce(
    (s, i) => s + Number(i.cost_price_snapshot ?? 0) * Number(i.quantity),
    0,
  );
  const grossProfit = revenue - tax - cogs;

  const byProduct = useMemo(() => {
    const map = new Map<
      string,
      { name: string; qty: number; revenue: number; cost: number }
    >();
    for (const i of scopedItems) {
      const key = i.product_name_snapshot ?? i.product_id ?? "Unknown";
      const entry = map.get(key) ?? { name: key, qty: 0, revenue: 0, cost: 0 };
      entry.qty += Number(i.quantity);
      entry.revenue += Number(i.line_total);
      entry.cost += Number(i.cost_price_snapshot ?? 0) * Number(i.quantity);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [scopedItems]);

  const byDay = useMemo(() => {
    const map = new Map<string, { day: string; orders: number; revenue: number }>();
    for (const o of scoped) {
      const key = o.placed_at.slice(0, 10);
      const entry = map.get(key) ?? { day: key, orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += Number(o.grand_total);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.day.localeCompare(a.day));
  }, [scoped]);

  const byHsn = useMemo(() => {
    const map = new Map<string, { hsn: string; rate: number; taxable: number; tax: number }>();
    for (const i of scopedItems) {
      const product = (products.data ?? []).find((p) => p.id === i.product_id);
      const hsn = product?.hsn_code ?? "—";
      const rate = Number(i.gst_rate ?? 0);
      const key = `${hsn}-${rate}`;
      const gross = Number(i.line_total);
      const taxPart = rate > 0 ? gross - gross / (1 + rate / 100) : 0;
      const entry = map.get(key) ?? { hsn, rate, taxable: 0, tax: 0 };
      entry.taxable += gross - taxPart;
      entry.tax += taxPart;
      map.set(key, entry);
    }
    return [...map.values()];
  }, [scopedItems, products.data]);

  const loading = orders.isLoading || items.isLoading;

  return (
    <AdminPage
      title="Reports"
      description="Everything here respects the period you pick."
      actions={
        <Select
          className="w-[170px]"
          value={days}
          onValue={setDays}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
            { value: "365", label: "Last 12 months" },
          ]}
        />
      }
    >
      <div className="mb-5 flex flex-wrap gap-1 border-b border-line-200">
        {REPORTS.filter((r) => r !== "Profit" || isOwner).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReport(r)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors",
              report === r
                ? "border-gold-500 text-green-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading rows={6} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={money(revenue)} />
            <StatCard label="Orders" value={scoped.length} />
            <StatCard label="GST included" value={money(tax)} />
            {isOwner ? (
              <StatCard
                label="Gross profit"
                value={money(grossProfit)}
                hint={revenue > 0 ? `${Math.round((grossProfit / revenue) * 100)}% margin` : undefined}
              />
            ) : (
              <StatCard label="Units sold" value={scopedItems.reduce((s, i) => s + Number(i.quantity), 0)} />
            )}
          </div>

          {report === "Sales" ? (
            <Panel
              title="Sales by day"
              actions={
                <Btn
                  variant="outline"
                  onClick={() =>
                    downloadCsv(
                      "sales",
                      ["Date", "Orders", "Revenue"],
                      byDay.map((d) => [d.day, d.orders, d.revenue]),
                    )
                  }
                >
                  <Download /> CSV
                </Btn>
              }
            >
              {byDay.length === 0 ? (
                <EmptyState title="No sales in this period" />
              ) : (
                <Table head={["Date", "Orders", "Revenue"]}>
                  {byDay.map((d) => (
                    <tr key={d.day}>
                      <Td>{dateOnly(d.day)}</Td>
                      <Td className="num">{d.orders}</Td>
                      <Td className="num font-semibold">{money(d.revenue)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Panel>
          ) : null}

          {report === "Profit" && isOwner ? (
            <Panel
              title="Profit by product"
              description="Cost comes from the snapshot taken when each order was placed."
              actions={
                <Btn
                  variant="outline"
                  onClick={() =>
                    downloadCsv(
                      "profit",
                      ["Product", "Units", "Revenue", "Cost", "Profit", "Margin %"],
                      byProduct.map((p) => [
                        p.name,
                        p.qty,
                        p.revenue,
                        p.cost,
                        p.revenue - p.cost,
                        p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
                      ]),
                    )
                  }
                >
                  <Download /> CSV
                </Btn>
              }
            >
              {byProduct.length === 0 ? (
                <EmptyState title="No sales in this period" />
              ) : (
                <Table head={["Product", "Units", "Revenue", "Cost", "Profit", "Margin"]}>
                  {byProduct.map((p) => {
                    const profit = p.revenue - p.cost;
                    const margin = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0;
                    return (
                      <tr key={p.name}>
                        <Td className="font-medium">{p.name}</Td>
                        <Td className="num">{p.qty}</Td>
                        <Td className="num">{money(p.revenue)}</Td>
                        <Td className="num">{money(p.cost)}</Td>
                        <Td className="num font-semibold">{money(profit)}</Td>
                        <Td
                          className={cn(
                            "num",
                            margin < 15 ? "text-destructive" : margin > 35 ? "text-success" : "",
                          )}
                        >
                          {margin}%
                        </Td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </Panel>
          ) : null}

          {report === "Products" ? (
            <Panel title="Best sellers">
              {byProduct.length === 0 ? (
                <EmptyState title="Nothing sold in this period" />
              ) : (
                <Table head={["Product", "Units", "Revenue", "Share"]}>
                  {byProduct.map((p) => (
                    <tr key={p.name}>
                      <Td className="font-medium">{p.name}</Td>
                      <Td className="num">{p.qty}</Td>
                      <Td className="num">{money(p.revenue)}</Td>
                      <Td className="num">
                        {revenue > 0 ? Math.round((p.revenue / revenue) * 100) : 0}%
                      </Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Panel>
          ) : null}

          {report === "Stock" ? (
            <Panel
              title="Stock valuation"
              actions={
                <Btn
                  variant="outline"
                  onClick={() =>
                    downloadCsv(
                      "stock",
                      ["Product", "Pack", "SKU", "Quantity", "Cost value", "Retail value"],
                      (stock.data ?? []).map((r) => [
                        r.product_name,
                        r.label ?? "",
                        r.sku,
                        Number(r.stock_quantity),
                        Number(r.stock_quantity) * Number(r.cost_price),
                        Number(r.stock_quantity) * Number(r.sale_price ?? r.price),
                      ]),
                    )
                  }
                >
                  <Download /> CSV
                </Btn>
              }
            >
              {(stock.data ?? []).length === 0 ? (
                <EmptyState title="No stock records" />
              ) : (
                <Table
                  head={[
                    "Product",
                    "Pack",
                    "In stock",
                    ...(isOwner ? ["Value at cost"] : []),
                    "Value at retail",
                  ]}
                >
                  {(stock.data ?? []).map((r) => (
                    <tr key={r.id}>
                      <Td className="font-medium">{r.product_name}</Td>
                      <Td>{r.label}</Td>
                      <Td className="num">{Number(r.stock_quantity)}</Td>
                      {isOwner ? (
                        <Td className="num">
                          {money(Number(r.stock_quantity) * Number(r.cost_price))}
                        </Td>
                      ) : null}
                      <Td className="num">
                        {money(Number(r.stock_quantity) * Number(r.sale_price ?? r.price))}
                      </Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Panel>
          ) : null}

          {report === "GST" ? (
            <Panel
              title="GST summary"
              description="Taxable value and tax split by HSN, ready to reconcile against GSTR-1."
              actions={
                <Btn
                  variant="outline"
                  onClick={() =>
                    downloadCsv(
                      "gst",
                      ["HSN", "Rate", "Taxable value", "CGST", "SGST", "Total tax"],
                      byHsn.map((g) => [
                        g.hsn,
                        g.rate,
                        g.taxable.toFixed(2),
                        (g.tax / 2).toFixed(2),
                        (g.tax / 2).toFixed(2),
                        g.tax.toFixed(2),
                      ]),
                    )
                  }
                >
                  <Download /> CSV
                </Btn>
              }
            >
              {byHsn.length === 0 ? (
                <EmptyState title="No taxable sales in this period" />
              ) : (
                <Table head={["HSN", "Rate", "Taxable value", "CGST", "SGST", "Total tax"]}>
                  {byHsn.map((g) => (
                    <tr key={`${g.hsn}-${g.rate}`}>
                      <Td className="num font-semibold">{g.hsn}</Td>
                      <Td className="num">{g.rate}%</Td>
                      <Td className="num">{money(g.taxable)}</Td>
                      <Td className="num">{money(g.tax / 2)}</Td>
                      <Td className="num">{money(g.tax / 2)}</Td>
                      <Td className="num font-semibold">{money(g.tax)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Panel>
          ) : null}
        </div>
      )}
    </AdminPage>
  );
}
