import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  Drawer,
  EmptyState,
  Field,
  Loading,
  Panel,
  Pill,
  Select,
  Table,
  Td,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/ui";
import { adminCategoriesQuery, adminProductsQuery, type CategoryRow } from "@/lib/admin";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesScreen,
});

type Draft = {
  id?: string | undefined;
  name: string;
  name_te: string;
  slug: string;
  parent_id: string | null;
  description: string;
  image_url: string;
  banner_url: string;
  sort_order: number;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  name_te: "",
  slug: "",
  parent_id: null,
  description: "",
  image_url: "",
  banner_url: "",
  sort_order: 0,
  is_active: true,
  seo_title: "",
  seo_description: "",
});

const toDraft = (row: CategoryRow): Draft => ({
  id: row.id,
  name: row.name,
  name_te: row.name_te ?? "",
  slug: row.slug,
  parent_id: row.parent_id,
  description: row.description ?? "",
  image_url: row.image_url ?? "",
  banner_url: row.banner_url ?? "",
  sort_order: row.sort_order,
  is_active: row.is_active,
  seo_title: row.seo_title ?? "",
  seo_description: row.seo_description ?? "",
});

function CategoriesScreen() {
  const qc = useQueryClient();
  const categories = useQuery(adminCategoriesQuery());
  const products = useQuery(adminProductsQuery());
  const [draft, setDraft] = useState<Draft | null>(null);

  const rows = categories.data ?? [];
  const productCount = (categoryId: string) =>
    (products.data ?? []).filter((p) => p.category_id === categoryId).length;

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim(),
        name_te: d.name_te.trim() || null,
        slug: d.slug.trim() || slugify(d.name),
        parent_id: d.parent_id,
        description: d.description.trim() || null,
        image_url: d.image_url.trim() || null,
        banner_url: d.banner_url.trim() || null,
        sort_order: d.sort_order,
        is_active: d.is_active,
        seo_title: d.seo_title.trim() || null,
        seo_description: d.seo_description.trim() || null,
      };
      if (!payload.name) throw new Error("Give the category a name.");
      const res = d.id
        ? await db.from("categories").update(payload).eq("id", d.id)
        : await db.from("categories").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Category saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: CategoryRow) => {
      if (productCount(row.id) > 0) {
        throw new Error("Move or delete this category's products first.");
      }
      const { error } = await db.from("categories").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Category deleted");
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ row, delta }: { row: CategoryRow; delta: number }) => {
      const { error } = await db
        .from("categories")
        .update({ sort_order: Math.max(0, row.sort_order + delta) })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (row: CategoryRow) => {
      const { error } = await db
        .from("categories")
        .update({ is_active: !row.is_active })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return (
    <AdminPage
      title="Categories"
      description="The oil types customers browse by. Every category needs an image."
      actions={
        <Btn onClick={() => setDraft(emptyDraft())}>
          <Plus /> New category
        </Btn>
      }
    >
      <Panel>
        {categories.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No categories yet"
            hint="Start with your oil types: groundnut, coconut, sesame, sunflower and the rest."
            action={<Btn onClick={() => setDraft(emptyDraft())}>Add the first category</Btn>}
          />
        ) : (
          <Table head={["", "Name", "Slug", "Products", "Order", "Status", ""]}>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-cream-100/50">
                <Td className="w-14">
                  <div className="size-10 overflow-hidden rounded-md bg-cream-100">
                    {row.image_url ? (
                      <img
                        src={row.image_url}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                </Td>
                <Td>
                  <p className="font-medium">{row.name}</p>
                  {row.name_te ? <p className="te text-xs text-ink-500">{row.name_te}</p> : null}
                  {!row.image_url ? (
                    <p className="mt-0.5 text-[11px] text-warning">Missing image</p>
                  ) : null}
                </Td>
                <Td className="num text-xs text-ink-500">{row.slug}</Td>
                <Td className="num">{productCount(row.id)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <span className="num w-6">{row.sort_order}</span>
                    <button
                      type="button"
                      aria-label="Move up"
                      className="rounded p-1 hover:bg-cream-100"
                      onClick={() => reorder.mutate({ row, delta: -1 })}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className="rounded p-1 hover:bg-cream-100"
                      onClick={() => reorder.mutate({ row, delta: 1 })}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                </Td>
                <Td>
                  <button type="button" onClick={() => toggleActive.mutate(row)}>
                    <Pill tone={row.is_active ? "good" : "neutral"}>
                      {row.is_active ? "Active" : "Hidden"}
                    </Pill>
                  </button>
                </Td>
                <Td className="w-24">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${row.name}`}
                      className="rounded p-1.5 hover:bg-cream-100"
                      onClick={() => setDraft(toDraft(row))}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${row.name}`}
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Delete "${row.name}"?`)) remove.mutate(row);
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
        title={draft?.id ? "Edit category" : "New category"}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Btn>
            <Btn disabled={save.isPending} onClick={() => draft && save.mutate(draft)}>
              {save.isPending ? "Saving…" : "Save category"}
            </Btn>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <TextInput
                value={draft.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: draft.id ? draft.slug : slugify(e.target.value),
                  })
                }
                placeholder="Groundnut (Palli) Oil"
              />
            </Field>
            <Field label="Telugu name" hint="Shown under the English name on the storefront.">
              <TextInput
                className="te"
                value={draft.name_te}
                onChange={(e) => setDraft({ ...draft, name_te: e.target.value })}
                placeholder="వేరుశనగ నూనె"
              />
            </Field>
            <Field label="Slug" hint="Used in the URL: /shop/groundnut">
              <TextInput
                className="num"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
              />
            </Field>
            <Field label="Parent category" hint="Leave as top level unless this is a sub-type.">
              <Select
                value={draft.parent_id ?? ""}
                onValue={(v) => setDraft({ ...draft, parent_id: v || null })}
                options={[
                  { value: "", label: "Top level" },
                  ...rows
                    .filter((r) => r.id !== draft.id)
                    .map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </Field>
            <Field label="Sort order">
              <TextInput
                type="number"
                className="num"
                value={String(draft.sort_order)}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value || 0) })}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Deep, nutty and cold-pressed. The everyday oil of coastal Andhra."
              />
            </Field>
            <Field label="Card image URL" hint="Square crop, plain cream background.">
              <TextInput
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Banner image URL" hint="Wide image for the category page header.">
              <TextInput
                value={draft.banner_url}
                onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })}
              />
            </Field>
            <Field label="SEO title">
              <TextInput
                value={draft.seo_title}
                onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
              />
            </Field>
            <Field label="SEO description">
              <TextInput
                value={draft.seo_description}
                onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Toggle
                checked={draft.is_active}
                onToggle={(v) => setDraft({ ...draft, is_active: v })}
                label="Visible on the storefront"
              />
            </div>
          </div>
        ) : null}
      </Drawer>
    </AdminPage>
  );
}
