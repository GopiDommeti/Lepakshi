import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
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
} from "@/components/admin/ui";
import {
  simpleListQuery,
  type PincodeRow,
  type ShippingMethodRow,
  type ShippingZoneRow,
} from "@/lib/admin";
import { db } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  component: ShippingScreen,
});

function ShippingScreen() {
  const qc = useQueryClient();
  const zones = useQuery(simpleListQuery("shipping_zones", { column: "sort_order" }));
  const methods = useQuery(simpleListQuery("shipping_methods", { column: "name" }));
  const pincodes = useQuery(simpleListQuery("pincode_serviceability", { column: "pincode" }));

  const [zoneDraft, setZoneDraft] = useState({ name: "", match: "rest", values: "" });
  const [methodDraft, setMethodDraft] = useState({
    zone_id: "",
    name: "Standard delivery",
    type: "free_above",
    cost: 60,
    free_above: 999,
    per_kg_rate: 0,
    min_days: 2,
    max_days: 5,
  });
  const [pinBulk, setPinBulk] = useState("");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "shipping_zones"] });
    void qc.invalidateQueries({ queryKey: ["admin", "shipping_methods"] });
    void qc.invalidateQueries({ queryKey: ["admin", "pincode_serviceability"] });
  };

  const addZone = useMutation({
    mutationFn: async () => {
      if (!zoneDraft.name.trim()) throw new Error("Name the zone.");
      const { error } = await db.from("shipping_zones").insert({
        name: zoneDraft.name.trim(),
        match_type: zoneDraft.match as "pincode" | "district" | "state" | "rest",
        values: zoneDraft.values
          .split(/[\n,]/)
          .map((v) => v.trim())
          .filter(Boolean),
        sort_order: ((zones.data ?? []) as ShippingZoneRow[]).length + 1,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Zone added");
      setZoneDraft({ name: "", match: "rest", values: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMethod = useMutation({
    mutationFn: async () => {
      if (!methodDraft.zone_id) throw new Error("Pick a zone for this rate.");
      const { error } = await db.from("shipping_methods").insert({
        zone_id: methodDraft.zone_id,
        name: methodDraft.name.trim() || "Standard delivery",
        type: methodDraft.type as "flat" | "free_above" | "weight_based" | "pickup",
        cost: methodDraft.cost,
        free_above: methodDraft.type === "free_above" ? methodDraft.free_above : null,
        per_kg_rate: methodDraft.type === "weight_based" ? methodDraft.per_kg_rate : null,
        min_days: methodDraft.min_days,
        max_days: methodDraft.max_days,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Rate added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRow = useMutation({
    mutationFn: async ({ table, id }: { table: "shipping_zones" | "shipping_methods"; id: string }) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const importPincodes = useMutation({
    mutationFn: async () => {
      const rows = pinBulk
        .split("\n")
        .map((line) => line.split(",").map((c) => c.trim()))
        .filter((cells) => /^\d{6}$/.test(cells[0] ?? ""))
        .map((cells) => ({
          pincode: cells[0] as string,
          city: cells[1] || null,
          district: cells[2] || null,
          state: cells[3] || "Andhra Pradesh",
          eta_days: Number(cells[4] || 4),
          cod_available: (cells[5] ?? "yes").toLowerCase() !== "no",
          is_serviceable: true,
        }));
      if (rows.length === 0) throw new Error("No valid rows found. Each line needs a 6-digit pincode first.");
      const { error } = await db
        .from("pincode_serviceability")
        .upsert(rows, { onConflict: "pincode" });
      if (error) throw new Error(error.message);
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} pincodes imported`);
      setPinBulk("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const zoneRows = (zones.data ?? []) as ShippingZoneRow[];
  const methodRows = (methods.data ?? []) as ShippingMethodRow[];
  const pinRows = (pincodes.data ?? []) as PincodeRow[];

  return (
    <AdminPage
      title="Shipping"
      description="Zones decide the rate. Pincodes decide whether you deliver there at all."
    >
      <div className="space-y-5">
        <Panel title="Zones" description="Checked in order — put specific pincode zones above 'rest of India'.">
          {zones.isLoading ? (
            <Loading rows={3} />
          ) : zoneRows.length === 0 ? (
            <EmptyState title="No zones yet" hint="Start with one 'Rest of India' zone." />
          ) : (
            <Table head={["Zone", "Matches", "Values", "Rates", ""]}>
              {zoneRows.map((z) => (
                <tr key={z.id}>
                  <Td className="font-medium">{z.name}</Td>
                  <Td>
                    <Pill>{z.match_type}</Pill>
                  </Td>
                  <Td className="num max-w-[280px] truncate text-xs text-ink-500">
                    {z.match_type === "rest" ? "Everywhere else" : (z.values ?? []).join(", ")}
                  </Td>
                  <Td className="num">{methodRows.filter((m) => m.zone_id === z.id).length}</Td>
                  <Td className="w-12">
                    <button
                      type="button"
                      aria-label="Delete zone"
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => removeRow.mutate({ table: "shipping_zones", id: z.id })}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}

          <div className="mt-5 grid gap-4 border-t border-line-200 pt-5 sm:grid-cols-3">
            <Field label="Zone name">
              <TextInput
                value={zoneDraft.name}
                placeholder="Andhra Pradesh"
                onChange={(e) => setZoneDraft({ ...zoneDraft, name: e.target.value })}
              />
            </Field>
            <Field label="Match by">
              <Select
                value={zoneDraft.match}
                onValue={(v) => setZoneDraft({ ...zoneDraft, match: v })}
                options={[
                  { value: "state", label: "State" },
                  { value: "district", label: "District" },
                  { value: "pincode", label: "Pincode list" },
                  { value: "rest", label: "Rest of India" },
                ]}
              />
            </Field>
            <Field label="Values" hint="Comma separated. Ignored for 'rest'.">
              <TextInput
                value={zoneDraft.values}
                placeholder="Andhra Pradesh, Telangana"
                onChange={(e) => setZoneDraft({ ...zoneDraft, values: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-3">
              <Btn onClick={() => addZone.mutate()}>
                <Plus /> Add zone
              </Btn>
            </div>
          </div>
        </Panel>

        <Panel title="Rates">
          {methodRows.length === 0 ? (
            <EmptyState title="No rates yet" hint="Add a rate to each zone or shipping falls back to the default fee in Settings." />
          ) : (
            <Table head={["Zone", "Rate name", "Type", "Cost", "Free above", "Days", ""]}>
              {methodRows.map((m) => (
                <tr key={m.id}>
                  <Td>{zoneRows.find((z) => z.id === m.zone_id)?.name ?? "—"}</Td>
                  <Td className="font-medium">{m.name}</Td>
                  <Td>
                    <Pill>{m.type}</Pill>
                  </Td>
                  <Td className="num">{money(m.cost)}</Td>
                  <Td className="num">{m.free_above ? money(m.free_above) : "—"}</Td>
                  <Td className="num text-xs">
                    {m.min_days ?? "?"}–{m.max_days ?? "?"}
                  </Td>
                  <Td className="w-12">
                    <button
                      type="button"
                      aria-label="Delete rate"
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => removeRow.mutate({ table: "shipping_methods", id: m.id })}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}

          <div className="mt-5 grid gap-4 border-t border-line-200 pt-5 sm:grid-cols-4">
            <Field label="Zone">
              <Select
                value={methodDraft.zone_id}
                onValue={(v) => setMethodDraft({ ...methodDraft, zone_id: v })}
                options={[
                  { value: "", label: "Choose a zone" },
                  ...zoneRows.map((z) => ({ value: z.id, label: z.name })),
                ]}
              />
            </Field>
            <Field label="Rate name">
              <TextInput
                value={methodDraft.name}
                onChange={(e) => setMethodDraft({ ...methodDraft, name: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <Select
                value={methodDraft.type}
                onValue={(v) => setMethodDraft({ ...methodDraft, type: v })}
                options={[
                  { value: "free_above", label: "Flat, free above ₹X" },
                  { value: "flat", label: "Flat rate" },
                  { value: "weight_based", label: "By weight" },
                  { value: "pickup", label: "Local pickup" },
                ]}
              />
            </Field>
            <Field label="Cost (₹)">
              <TextInput
                type="number"
                className="num"
                value={String(methodDraft.cost)}
                onChange={(e) =>
                  setMethodDraft({ ...methodDraft, cost: Number(e.target.value || 0) })
                }
              />
            </Field>
            {methodDraft.type === "free_above" ? (
              <Field label="Free above (₹)">
                <TextInput
                  type="number"
                  className="num"
                  value={String(methodDraft.free_above)}
                  onChange={(e) =>
                    setMethodDraft({ ...methodDraft, free_above: Number(e.target.value || 0) })
                  }
                />
              </Field>
            ) : null}
            {methodDraft.type === "weight_based" ? (
              <Field label="Per kg (₹)">
                <TextInput
                  type="number"
                  className="num"
                  value={String(methodDraft.per_kg_rate)}
                  onChange={(e) =>
                    setMethodDraft({ ...methodDraft, per_kg_rate: Number(e.target.value || 0) })
                  }
                />
              </Field>
            ) : null}
            <Field label="Min days">
              <TextInput
                type="number"
                className="num"
                value={String(methodDraft.min_days)}
                onChange={(e) =>
                  setMethodDraft({ ...methodDraft, min_days: Number(e.target.value || 0) })
                }
              />
            </Field>
            <Field label="Max days">
              <TextInput
                type="number"
                className="num"
                value={String(methodDraft.max_days)}
                onChange={(e) =>
                  setMethodDraft({ ...methodDraft, max_days: Number(e.target.value || 0) })
                }
              />
            </Field>
            <div className="sm:col-span-4">
              <Btn onClick={() => addMethod.mutate()}>
                <Plus /> Add rate
              </Btn>
            </div>
          </div>
        </Panel>

        <Panel
          title="Serviceable pincodes"
          description={`${pinRows.length} pincodes on file. A pincode that isn't listed still allows checkout using your default rate.`}
        >
          <Field
            label="Bulk import"
            hint="One per line: pincode, city, district, state, ETA days, COD (yes/no)"
          >
            <TextArea
              className="num min-h-[120px]"
              value={pinBulk}
              placeholder={"534211, Tanuku, West Godavari, Andhra Pradesh, 2, yes"}
              onChange={(e) => setPinBulk(e.target.value)}
            />
          </Field>
          <Btn className="mt-3" onClick={() => importPincodes.mutate()}>
            Import pincodes
          </Btn>

          {pinRows.length > 0 ? (
            <div className="mt-5">
              <Table head={["Pincode", "City", "District", "ETA", "COD"]}>
                {pinRows.slice(0, 40).map((p) => (
                  <tr key={p.id}>
                    <Td className="num font-semibold">{p.pincode}</Td>
                    <Td>{p.city ?? "—"}</Td>
                    <Td>{p.district ?? "—"}</Td>
                    <Td className="num">{p.eta_days} days</Td>
                    <Td>
                      <Pill tone={p.cod_available ? "good" : "neutral"}>
                        {p.cod_available ? "COD" : "Prepaid only"}
                      </Pill>
                    </Td>
                  </tr>
                ))}
              </Table>
              {pinRows.length > 40 ? (
                <p className="mt-3 text-xs text-ink-500">Showing the first 40.</p>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
    </AdminPage>
  );
}
