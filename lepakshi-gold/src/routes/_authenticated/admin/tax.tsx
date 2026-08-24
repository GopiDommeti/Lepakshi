import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { AdminPage } from "@/components/admin/AdminLayout";
import { EmptyState, Loading, money, Panel, Table, Td } from "@/components/admin/ui";
import { adminProductsQuery, adminSettingsQuery } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/tax")({
  component: TaxScreen,
});

function TaxScreen() {
  const products = useQuery(adminProductsQuery());
  const settings = useQuery(adminSettingsQuery());

  const groups = useMemo(() => {
    type Group = { hsn: string; rate: number; products: string[] };
    const map = new Map<string, Group>();
    for (const p of products.data ?? []) {
      const key = `${p.hsn_code ?? "—"}::${Number(p.gst_rate ?? 0)}`;
      const entry: Group = map.get(key) ?? {
        hsn: p.hsn_code ?? "—",
        rate: Number(p.gst_rate ?? 0),
        products: [],
      };
      entry.products.push(p.name);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.hsn.localeCompare(b.hsn));
  }, [products.data]);

  return (
    <AdminPage
      title="Tax"
      description="GST is set per product. This screen shows how your catalogue groups by HSN."
    >
      <div className="space-y-5">
        <Panel title="How pricing works here">
          <ul className="space-y-2 text-sm text-ink-500">
            <li>
              Prices you enter on a product are{" "}
              <strong className="text-ink-900">inclusive of GST</strong>
              {settings.data?.prices_include_tax === false
                ? " — but the store setting currently says otherwise, which is worth checking."
                : ", the normal Indian retail convention."}
            </li>
            <li>
              The tax component is extracted at checkout and split evenly into CGST and SGST on the
              invoice.
            </li>
            <li>Change a product&apos;s rate or HSN on its Tax tab in the product editor.</li>
          </ul>
        </Panel>

        <Panel title="Catalogue by HSN and rate">
          {products.isLoading ? (
            <Loading rows={4} />
          ) : groups.length === 0 ? (
            <EmptyState title="No products yet" />
          ) : (
            <Table head={["HSN", "GST rate", "Products", "Names"]}>
              {groups.map((g) => (
                <tr key={`${g.hsn}-${g.rate}`}>
                  <Td className="num font-semibold">{g.hsn}</Td>
                  <Td className="num">{g.rate}%</Td>
                  <Td className="num">{g.products.length}</Td>
                  <Td className="max-w-[420px] text-xs text-ink-500">
                    {g.products.slice(0, 6).join(", ")}
                    {g.products.length > 6 ? ` +${g.products.length - 6} more` : ""}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title="Invoice identity">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">GSTIN</dt>
              <dd className="num">{settings.data?.gstin || "Not set — add it in Settings"}</dd>
            </div>
            <div>
              <dt className="text-ink-500">FSSAI</dt>
              <dd className="num">{settings.data?.fssai_no || "Not set — add it in Settings"}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Free shipping above</dt>
              <dd className="num">{money(settings.data?.free_shipping_above ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Default shipping fee</dt>
              <dd className="num">{money(settings.data?.default_shipping_fee ?? 0)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </AdminPage>
  );
}
