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
  Panel,
  Select,
  TextInput,
} from "@/components/admin/ui";
import { adminAttributesQuery } from "@/lib/admin";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/admin/attributes")({
  component: AttributesScreen,
});

function AttributesScreen() {
  const qc = useQueryClient();
  const data = useQuery(adminAttributesQuery());
  const [newAttr, setNewAttr] = useState({ name: "", display: "pills" });
  const [newTerm, setNewTerm] = useState<Record<string, string>>({});

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
    void qc.invalidateQueries({ queryKey: ["attributes"] });
  };

  const addAttribute = useMutation({
    mutationFn: async () => {
      const name = newAttr.name.trim();
      if (!name) throw new Error("Give the attribute a name.");
      const { error } = await db.from("attributes").insert({
        name,
        slug: slugify(name),
        display_type: newAttr.display as "pills" | "dropdown" | "swatch",
        sort_order: (data.data?.attributes.length ?? 0) + 1,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Attribute added");
      setNewAttr({ name: "", display: "pills" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addTerm = useMutation({
    mutationFn: async (attributeId: string) => {
      const name = (newTerm[attributeId] ?? "").trim();
      if (!name) throw new Error("Type the option first.");
      const existing = (data.data?.terms ?? []).filter((t) => t.attribute_id === attributeId);
      const { error } = await db.from("attribute_terms").insert({
        attribute_id: attributeId,
        name,
        slug: slugify(name),
        sort_order: existing.length + 1,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_r, attributeId) => {
      setNewTerm((prev) => ({ ...prev, [attributeId]: "" }));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTerm = useMutation({
    mutationFn: async (termId: string) => {
      const { error } = await db.from("attribute_terms").delete().eq("id", termId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAttribute = useMutation({
    mutationFn: async (attributeId: string) => {
      const { error } = await db.from("attributes").delete().eq("id", attributeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Attribute deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const attributes = data.data?.attributes ?? [];
  const terms = data.data?.terms ?? [];

  return (
    <AdminPage
      title="Attributes"
      description="Global options reused across products. 'Pack Size' is what turns a product into a variable product."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {data.isLoading ? (
            <Loading />
          ) : attributes.length === 0 ? (
            <EmptyState
              title="No attributes yet"
              hint="Create 'Pack Size' and add 500 ml, 1 L, 2 L, 5 L and 15 L Tin. Every oil then reuses those options."
            />
          ) : (
            attributes.map((attr) => {
              const attrTerms = terms.filter((t) => t.attribute_id === attr.id);
              return (
                <Panel
                  key={attr.id}
                  title={attr.name}
                  description={`${attr.slug} · shown as ${attr.display_type} · ${attrTerms.length} options`}
                  actions={
                    <Btn
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Delete the "${attr.name}" attribute and its options?`)) {
                          removeAttribute.mutate(attr.id);
                        }
                      }}
                    >
                      <Trash2 /> Delete
                    </Btn>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {attrTerms.map((term) => (
                      <span
                        key={term.id}
                        className="inline-flex items-center gap-2 rounded-full border border-line-200 bg-cream-100 px-3 py-1 text-sm"
                      >
                        {term.name}
                        <button
                          type="button"
                          aria-label={`Remove ${term.name}`}
                          className="text-ink-500 hover:text-destructive"
                          onClick={() => removeTerm.mutate(term.id)}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </span>
                    ))}
                    {attrTerms.length === 0 ? (
                      <p className="text-sm text-ink-500">No options yet.</p>
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <TextInput
                      value={newTerm[attr.id] ?? ""}
                      placeholder="e.g. 1 L"
                      onChange={(e) =>
                        setNewTerm((prev) => ({ ...prev, [attr.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTerm.mutate(attr.id);
                      }}
                    />
                    <Btn variant="outline" onClick={() => addTerm.mutate(attr.id)}>
                      <Plus /> Add option
                    </Btn>
                  </div>
                </Panel>
              );
            })
          )}
        </div>

        <Panel title="New attribute">
          <div className="space-y-4">
            <Field label="Name">
              <TextInput
                value={newAttr.name}
                placeholder="Pack Size"
                onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })}
              />
            </Field>
            <Field label="Display as">
              <Select
                value={newAttr.display}
                onValue={(v) => setNewAttr({ ...newAttr, display: v })}
                options={[
                  { value: "pills", label: "Pills" },
                  { value: "dropdown", label: "Dropdown" },
                  { value: "swatch", label: "Swatch" },
                ]}
              />
            </Field>
            <Btn
              className="w-full"
              disabled={addAttribute.isPending}
              onClick={() => addAttribute.mutate()}
            >
              <Plus /> Create attribute
            </Btn>
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
