import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, History, Plus, Trash2 } from "lucide-react";
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
  StatCard,
  Table,
  Td,
  TextInput,
  Toolbar,
} from "@/components/admin/ui";
import {
  MOVEMENT_TYPES,
  movementsQuery,
  stockQuery,
  type MovementType,
  type StockRow,
} from "@/lib/admin";
import { useIsStaff } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  component: StockScreen,
});

type EntryLine = {
  variationId: string;
  label: string;
  sku: string;
  quantity: number;
};

function StockScreen() {
  const qc = useQueryClient();
  const stock = useQuery(stockQuery());
  const { isOwner } = useIsStaff();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [historyFor, setHistoryFor] = useState<StockRow | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (stock.data ?? []).filter((r) => {
      const qty = Number(r.stock_quantity);
      const threshold = Number(r.low_stock_threshold);
      if (filter === "low" && !(r.manage_stock && qty <= threshold)) return false;
      if (filter === "out" && qty > 0) return false;
      if (filter === "ganuga" && !r.is_ganuga) return false;
      if (!term) return true;
      return (
        r.product_name.toLowerCase().includes(term) ||
        r.sku.toLowerCase().includes(term) ||
        (r.barcode ?? "").includes(term) ||
        (r.label ?? "").toLowerCase().includes(term)
      );
    });
  }, [stock.data, search, filter]);

  const totals = useMemo(() => {
    const all = stock.data ?? [];
    return {
      units: all.reduce((s, r) => s + Number(r.stock_quantity), 0),
      atCost: all.reduce((s, r) => s + Number(r.stock_quantity) * Number(r.cost_price), 0),
      atRetail: all.reduce(
        (s, r) => s + Number(r.stock_quantity) * Number(r.sale_price ?? r.price),
        0,
      ),
      low: all.filter((r) => r.manage_stock && Number(r.stock_quantity) <= Number(r.low_stock_threshold))
        .length,
    };
  }, [stock.data]);

  const adjust = useMutation({
    mutationFn: async ({
      variationId,
      type,
      qty,
      note,
    }: {
      variationId: string;
      type: MovementType;
      qty: number;
      note: string;
    }) => {
      if (qty === 0) throw new Error("Enter a quantity.");
      const { error } = await supabase.rpc("adjust_stock", {
        _variation_id: variationId,
        _type: type,
        _qty: qty,
        _reference_type: "manual",
        _note: note,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Stock updated");
      void qc.invalidateQueries({ queryKey: ["admin", "stock"] });
      void qc.invalidateQueries({ queryKey: ["admin", "movements"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage
      title="Stock"
      description="Every change here is written to the movement ledger."
      actions={
        <Btn onClick={() => setEntryOpen(true)}>
          <Plus /> Bulk stock entry
        </Btn>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Units in stock" value={totals.units} />
        <StatCard label="Needs attention" value={totals.low} hint="At or below threshold" />
        {isOwner ? <StatCard label="Value at cost" value={money(totals.atCost)} /> : null}
        <StatCard label="Value at retail" value={money(totals.atRetail)} />
      </div>

      <Toolbar>
        <TextInput
          className="max-w-xs"
          placeholder="Search product, SKU or barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="max-w-[190px]"
          value={filter}
          onValue={setFilter}
          options={[
            { value: "", label: "Everything" },
            { value: "low", label: "Low stock" },
            { value: "out", label: "Out of stock" },
            { value: "ganuga", label: "Ganuga only" },
          ]}
        />
        <span className="num ml-auto text-xs text-ink-500">{rows.length} pack sizes</span>
      </Toolbar>

      <Panel>
        {stock.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing to show" hint="Add products and pack sizes first." />
        ) : (
          <Table
            head={[
              "Product",
              "Pack",
              "SKU",
              "In stock",
              "Threshold",
              ...(isOwner ? ["Value at cost"] : []),
              "Quick change",
              "",
            ]}
          >
            {rows.map((r) => {
              const qty = Number(r.stock_quantity);
              const threshold = Number(r.low_stock_threshold);
              const low = r.manage_stock && qty <= threshold;
              const warn = r.manage_stock && !low && qty <= threshold * 1.25;
              return (
                <tr key={r.id} className="hover:bg-cream-100/50">
                  <Td className="font-medium">{r.product_name}</Td>
                  <Td>{r.label}</Td>
                  <Td className="num text-xs text-ink-500">{r.sku}</Td>
                  <Td>
                    <span
                      className={cn(
                        "num font-semibold",
                        low ? "text-destructive" : warn ? "text-warning" : "text-ink-900",
                      )}
                    >
                      {qty}
                    </span>
                    {low ? (
                      <AlertTriangle className="ml-1.5 inline size-3.5 text-destructive" />
                    ) : null}
                  </Td>
                  <Td className="num text-xs text-ink-500">{threshold}</Td>
                  {isOwner ? <Td className="num">{money(qty * Number(r.cost_price))}</Td> : null}
                  <Td>
                    <div className="flex gap-1">
                      {[+1, +10, -1].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="rounded border border-line-200 px-2 py-1 text-xs hover:border-gold-500"
                          onClick={() =>
                            adjust.mutate({
                              variationId: r.id,
                              type: delta > 0 ? "purchase" : "adjustment",
                              qty: delta,
                              note: "Quick change from the stock table",
                            })
                          }
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </Td>
                  <Td className="w-12">
                    <button
                      type="button"
                      aria-label="Movement history"
                      className="rounded p-1.5 hover:bg-cream-100"
                      onClick={() => setHistoryFor(r)}
                    >
                      <History className="size-4" />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Panel>

      {historyFor ? (
        <MovementHistory row={historyFor} onClose={() => setHistoryFor(null)} />
      ) : null}
      {entryOpen ? (
        <BulkEntry rows={stock.data ?? []} onClose={() => setEntryOpen(false)} />
      ) : null}
    </AdminPage>
  );
}

function MovementHistory({ row, onClose }: { row: StockRow; onClose: () => void }) {
  const movements = useQuery(movementsQuery(row.id));
  return (
    <Drawer open onClose={onClose} title={`${row.product_name} · ${row.label ?? ""}`}>
      <p className="mb-4 text-sm text-ink-500">
        Current balance <span className="num font-semibold">{Number(row.stock_quantity)}</span> ·
        SKU <span className="num">{row.sku}</span>
      </p>
      {movements.isLoading ? (
        <Loading />
      ) : (movements.data ?? []).length === 0 ? (
        <EmptyState title="No movements recorded yet" />
      ) : (
        <Table head={["When", "Type", "Change", "Balance", "Note"]}>
          {(movements.data ?? []).map((m) => (
            <tr key={m.id}>
              <Td className="whitespace-nowrap text-xs text-ink-500">{dateTime(m.created_at)}</Td>
              <Td>
                <Pill tone={Number(m.quantity) > 0 ? "good" : "neutral"}>{m.type}</Pill>
              </Td>
              <Td
                className={cn(
                  "num font-semibold",
                  Number(m.quantity) > 0 ? "text-success" : "text-destructive",
                )}
              >
                {Number(m.quantity) > 0 ? "+" : ""}
                {Number(m.quantity)}
              </Td>
              <Td className="num">{Number(m.balance_after)}</Td>
              <Td className="text-xs text-ink-500">{m.note ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Drawer>
  );
}

function BulkEntry({ rows, onClose }: { rows: StockRow[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState<MovementType>("production");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<EntryLine[]>([]);

  const matches = search.trim()
    ? rows
        .filter((r) => {
          const term = search.trim().toLowerCase();
          return (
            r.sku.toLowerCase().includes(term) ||
            (r.barcode ?? "").includes(term) ||
            r.product_name.toLowerCase().includes(term)
          );
        })
        .slice(0, 6)
    : [];

  const addLine = (r: StockRow) => {
    setLines((prev) =>
      prev.some((l) => l.variationId === r.id)
        ? prev
        : [
            ...prev,
            {
              variationId: r.id,
              label: `${r.product_name} · ${r.label ?? ""}`,
              sku: r.sku,
              quantity: 1,
            },
          ],
    );
    setSearch("");
  };

  const post = useMutation({
    mutationFn: async () => {
      if (lines.length === 0) throw new Error("Add at least one line.");
      const outward = ["damage", "sale"].includes(type);
      for (const line of lines) {
        const { error } = await supabase.rpc("adjust_stock", {
          _variation_id: line.variationId,
          _type: type,
          _qty: outward ? -Math.abs(line.quantity) : Math.abs(line.quantity),
          _reference_type: "bulk_entry",
          _note: note.trim() || `Bulk ${type} entry`,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`${lines.length} lines posted`);
      void qc.invalidateQueries({ queryKey: ["admin", "stock"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Drawer
      open
      onClose={onClose}
      title="Bulk stock entry"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={post.isPending} onClick={() => post.mutate()}>
            {post.isPending ? "Posting…" : `Post ${lines.length} lines`}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entry type">
            <Select
              value={type}
              onValue={(v) => setType(v as MovementType)}
              options={MOVEMENT_TYPES.filter((t) => t !== "sale").map((t) => ({
                value: t,
                label: t,
              }))}
            />
          </Field>
          <Field label="Note" hint="Batch number, supplier, or reason.">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <Field label="Scan a barcode or search" hint="A USB scanner types into this box.">
          <TextInput
            autoFocus
            value={search}
            placeholder="Barcode, SKU or product name"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const exact = rows.find((r) => r.barcode === search.trim());
                const first = matches.at(0);
                if (exact) addLine(exact);
                else if (first) addLine(first);
              }
            }}
          />
        </Field>

        {matches.length > 0 ? (
          <ul className="rounded-lg border border-line-200 bg-card">
            {matches.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-cream-100"
                  onClick={() => addLine(r)}
                >
                  <span>
                    {r.product_name} · {r.label}
                  </span>
                  <span className="num text-xs text-ink-500">{r.sku}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {lines.length === 0 ? (
          <EmptyState title="No lines yet" hint="Scan or search to build the entry." />
        ) : (
          <Table head={["Item", "SKU", "Quantity", ""]}>
            {lines.map((l, i) => (
              <tr key={l.variationId}>
                <Td>{l.label}</Td>
                <Td className="num text-xs">{l.sku}</Td>
                <Td>
                  <TextInput
                    type="number"
                    className="num w-24"
                    value={String(l.quantity)}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((x, xi) =>
                          xi === i ? { ...x, quantity: Number(e.target.value || 0) } : x,
                        ),
                      )
                    }
                  />
                </Td>
                <Td className="w-12">
                  <button
                    type="button"
                    aria-label="Remove line"
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => setLines((prev) => prev.filter((_, xi) => xi !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Drawer>
  );
}
