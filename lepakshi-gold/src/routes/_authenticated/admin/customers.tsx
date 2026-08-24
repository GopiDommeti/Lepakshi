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
  Pill,
  Select,
  StatCard,
  Table,
  Td,
  TextInput,
  Toolbar,
} from "@/components/admin/ui";
import { customersQuery } from "@/lib/admin";
import { dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersScreen,
});

function CustomersScreen() {
  const customers = useQuery(customersQuery());
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return (customers.data ?? []).filter((c) => {
      if (segment === "repeat" && c.orders < 2) return false;
      if (segment === "new" && c.orders !== 0) return false;
      if (segment === "lapsed") {
        if (c.orders === 0) return false;
        if (c.lastOrder && new Date(c.lastOrder).getTime() > ninetyDaysAgo) return false;
      }
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.phone ?? "").includes(term) ||
        (c.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [customers.data, search, segment]);

  const stats = useMemo(() => {
    const all = customers.data ?? [];
    return {
      total: all.length,
      buyers: all.filter((c) => c.orders > 0).length,
      repeat: all.filter((c) => c.orders >= 2).length,
      lifetime: all.reduce((s, c) => s + c.lifetime, 0),
    };
  }, [customers.data]);

  const exportCsv = () => {
    const header = ["Name", "Phone", "Email", "Orders", "Lifetime value", "Last order"];
    const lines = rows.map((c) =>
      [c.name, c.phone ?? "", c.email ?? "", c.orders, c.lifetime, c.lastOrder ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lepakshi-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPage
      title="Customers"
      description="Registered accounts and guest buyers, merged by phone number."
      actions={
        <Btn variant="outline" onClick={exportCsv}>
          <Download /> Export CSV
        </Btn>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="People" value={stats.total} />
        <StatCard label="Have ordered" value={stats.buyers} />
        <StatCard label="Repeat buyers" value={stats.repeat} />
        <StatCard label="Lifetime revenue" value={money(stats.lifetime)} />
      </div>

      <Toolbar>
        <TextInput
          className="max-w-xs"
          placeholder="Name, phone or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="max-w-[190px]"
          value={segment}
          onValue={setSegment}
          options={[
            { value: "", label: "Everyone" },
            { value: "repeat", label: "Repeat buyers" },
            { value: "new", label: "Never ordered" },
            { value: "lapsed", label: "Lapsed (90 days)" },
          ]}
        />
        <span className="num ml-auto text-xs text-ink-500">{rows.length} people</span>
      </Toolbar>

      <Panel>
        {customers.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="No customers yet" hint="They appear here after the first order." />
        ) : (
          <Table head={["Name", "Phone", "Email", "Orders", "Lifetime", "Last order", "Type"]}>
            {rows.map((c) => (
              <tr key={c.key} className="hover:bg-cream-100/50">
                <Td className="font-medium">{c.name}</Td>
                <Td className="num text-sm">{c.phone ?? "—"}</Td>
                <Td className="text-sm text-ink-500">{c.email ?? "—"}</Td>
                <Td className="num">{c.orders}</Td>
                <Td className="num font-semibold">{money(c.lifetime)}</Td>
                <Td className="text-xs text-ink-500">
                  {c.lastOrder ? dateOnly(c.lastOrder) : "—"}
                </Td>
                <Td>
                  <Pill tone={c.registered ? "good" : "neutral"}>
                    {c.registered ? "Account" : "Guest"}
                  </Pill>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}
