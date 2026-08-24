import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
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
  Toggle,
  Toolbar,
} from "@/components/admin/ui";
import {
  adminAttributesQuery,
  adminCategoriesQuery,
  adminProductsQuery,
  productTermsQuery,
  type AdminProduct,
  type VariationRow,
} from "@/lib/admin";
import { useIsStaff } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { generateBarcode, skuToken, slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsScreen,
});

/* ------------------------------------------------------------------ types */

type VariationDraft = {
  id?: string | undefined;
  label: string;
  sku: string;
  barcode: string;
  option_map: Record<string, string>;
  price: number;
  sale_price: number | null;
  cost_price: number;
  weight_grams: number;
  stock_quantity: number;
  low_stock_threshold: number;
  manage_stock: boolean;
  backorders: "no" | "notify" | "allow";
  image_url: string;
  is_active: boolean;
  sort_order: number;
  /** true when the row was created in this editing session */
  isNew: boolean;
};

type ProductDraft = {
  id?: string | undefined;
  name: string;
  name_te: string;
  slug: string;
  sku_base: string;
  type: "simple" | "variable";
  category_id: string | null;
  short_description: string;
  description: string;
  thumbnail_url: string;
  gallery: string[];
  gst_rate: number;
  hsn_code: string;
  is_ganuga: boolean;
  extraction: string;
  shelf_life: string;
  ingredients: string;
  storage: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  termIds: string[];
  variations: VariationDraft[];
};

const blankProduct = (): ProductDraft => ({
  name: "",
  name_te: "",
  slug: "",
  sku_base: "",
  type: "variable",
  category_id: null,
  short_description: "",
  description: "",
  thumbnail_url: "",
  gallery: [],
  gst_rate: 5,
  hsn_code: "1508",
  is_ganuga: true,
  extraction: "Ganuga (wood-pressed)",
  shelf_life: "6 months from packing",
  ingredients: "100% cold-pressed oil. Nothing added.",
  storage: "Keep in a cool, dark place. Sediment is natural.",
  status: "draft",
  is_featured: false,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  termIds: [],
  variations: [],
});

const toVariationDraft = (v: VariationRow): VariationDraft => ({
  id: v.id,
  label: v.label ?? "",
  sku: v.sku,
  barcode: v.barcode ?? "",
  option_map: (v.option_map ?? {}) as Record<string, string>,
  price: Number(v.price ?? 0),
  sale_price: v.sale_price === null ? null : Number(v.sale_price),
  cost_price: Number(v.cost_price ?? 0),
  weight_grams: Number(v.weight_grams ?? 0),
  stock_quantity: Number(v.stock_quantity ?? 0),
  low_stock_threshold: Number(v.low_stock_threshold ?? 5),
  manage_stock: v.manage_stock,
  backorders: (v.backorders ?? "no") as "no" | "notify" | "allow",
  image_url: v.image_url ?? "",
  is_active: v.is_active,
  sort_order: v.sort_order,
  isNew: false,
});

/* -------------------------------------------------------------------- list */

function ProductsScreen() {
  const products = useQuery(adminProductsQuery());
  const categories = useQuery(adminCategoriesQuery());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { isOwner } = useIsStaff();
  const qc = useQueryClient();

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter((p) => {
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        (p.sku_base ?? "").toLowerCase().includes(term) ||
        p.variations.some(
          (v) =>
            v.sku.toLowerCase().includes(term) || (v.barcode ?? "").toLowerCase().includes(term),
        )
      );
    });
  }, [products.data, search, categoryFilter, statusFilter]);

  const duplicate = useMutation({
    mutationFn: async (p: AdminProduct) => {
      const { data: created, error } = await supabase
        .from("products")
        .insert({
          name: `${p.name} (copy)`,
          slug: `${p.slug}-copy-${Math.floor(Math.random() * 900 + 100)}`,
          name_te: p.name_te,
          sku_base: p.sku_base ? `${p.sku_base}-C` : null,
          type: p.type,
          category_id: p.category_id,
          short_description: p.short_description,
          description: p.description,
          thumbnail_url: p.thumbnail_url,
          gallery: p.gallery,
          gst_rate: p.gst_rate,
          hsn_code: p.hsn_code,
          is_ganuga: p.is_ganuga,
          extraction: p.extraction,
          shelf_life: p.shelf_life,
          ingredients: p.ingredients,
          storage: p.storage,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      if (p.variations.length > 0) {
        const { error: vErr } = await supabase.from("variations").insert(
          p.variations.map((v) => ({
            product_id: created.id,
            sku: `${v.sku}-C${Math.floor(Math.random() * 900 + 100)}`,
            label: v.label,
            option_map: v.option_map,
            price: v.price,
            sale_price: v.sale_price,
            cost_price: v.cost_price,
            weight_grams: v.weight_grams,
            low_stock_threshold: v.low_stock_threshold,
            manage_stock: v.manage_stock,
            stock_quantity: 0,
            sort_order: v.sort_order,
          })),
        );
        if (vErr) throw new Error(vErr.message);
      }
    },
    onSuccess: () => {
      toast.success("Product duplicated as a draft");
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async (p: AdminProduct) => {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: !p.is_featured })
        .eq("id", p.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <AdminPage
      title="Products"
      description="One product per oil. Pack sizes live underneath it as variations."
      actions={
        <Btn onClick={() => setCreating(true)}>
          <Plus /> New product
        </Btn>
      }
    >
      <Toolbar>
        <TextInput
          className="max-w-xs"
          placeholder="Search name, SKU or barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="max-w-[200px]"
          value={categoryFilter}
          onValue={setCategoryFilter}
          options={[
            { value: "", label: "All categories" },
            ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          className="max-w-[160px]"
          value={statusFilter}
          onValue={setStatusFilter}
          options={[
            { value: "", label: "Any status" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <span className="num ml-auto text-xs text-ink-500">{rows.length} products</span>
      </Toolbar>

      <Panel>
        {products.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No products here"
            hint="Create an oil, tick its pack sizes on the Variations tab, then hit Generate."
            action={<Btn onClick={() => setCreating(true)}>Add a product</Btn>}
          />
        ) : (
          <Table
            head={["", "Product", "Category", "Type", "Price", "Stock", "Status", "Featured", ""]}
          >
            {rows.map((p) => {
              const prices = p.variations.map((v) => Number(v.sale_price ?? v.price ?? 0));
              const min = prices.length ? Math.min(...prices) : 0;
              const max = prices.length ? Math.max(...prices) : 0;
              const stock = p.variations.reduce((s, v) => s + Number(v.stock_quantity ?? 0), 0);
              const low = p.variations.some(
                (v) => v.manage_stock && Number(v.stock_quantity) <= Number(v.low_stock_threshold),
              );
              return (
                <Fragment key={p.id}>
                  <tr className="hover:bg-cream-100/50">
                    <Td className="w-14">
                      <div className="size-10 overflow-hidden rounded-md bg-cream-100">
                        {p.thumbnail_url ? (
                          <img
                            src={p.thumbnail_url}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        className="text-left font-medium hover:text-green-700"
                        onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      >
                        {p.name}
                      </button>
                      <p className="num text-xs text-ink-500">{p.sku_base ?? p.slug}</p>
                    </Td>
                    <Td className="text-xs">
                      {categories.data?.find((c) => c.id === p.category_id)?.name ?? "—"}
                    </Td>
                    <Td>
                      <Pill tone={p.type === "variable" ? "gold" : "neutral"}>
                        {p.type === "variable" ? `${p.variations.length} sizes` : "Simple"}
                      </Pill>
                    </Td>
                    <Td className="num whitespace-nowrap">
                      {prices.length === 0 ? "—" : min === max ? money(min) : `${money(min)} – ${money(max)}`}
                    </Td>
                    <Td className={cn("num", low && "text-destructive")}>{stock}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() =>
                          setStatus.mutate({
                            id: p.id,
                            status: p.status === "published" ? "draft" : "published",
                          })
                        }
                      >
                        <Pill tone={p.status === "published" ? "good" : "neutral"}>{p.status}</Pill>
                      </button>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        aria-label="Toggle featured"
                        onClick={() => toggleFeatured.mutate(p)}
                      >
                        <Star
                          className={cn(
                            "size-4",
                            p.is_featured ? "fill-gold-500 text-gold-500" : "text-line-200",
                          )}
                        />
                      </button>
                    </Td>
                    <Td className="w-24">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${p.name}`}
                          className="rounded p-1.5 hover:bg-cream-100"
                          onClick={() => setEditingId(p.id)}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Duplicate ${p.name}`}
                          className="rounded p-1.5 hover:bg-cream-100"
                          onClick={() => duplicate.mutate(p)}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                  {expanded === p.id
                    ? p.variations.map((v) => (
                        <tr key={v.id} className="bg-cream-100/40 text-xs">
                          <Td />
                          <Td className="pl-6">{v.label}</Td>
                          <Td className="num">{v.sku}</Td>
                          <Td className="num">{v.barcode ?? "—"}</Td>
                          <Td className="num">{money(v.sale_price ?? v.price)}</Td>
                          <Td className="num">{Number(v.stock_quantity)}</Td>
                          <Td colSpan={3}>
                            {isOwner ? (
                              <span className="num text-ink-500">
                                cost {money(v.cost_price)} · margin{" "}
                                {Number(v.price) > 0
                                  ? Math.round(
                                      ((Number(v.price) - Number(v.cost_price)) /
                                        Number(v.price)) *
                                        100,
                                    )
                                  : 0}
                                %
                              </span>
                            ) : null}
                          </Td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </Table>
        )}
      </Panel>

      {creating || editingId ? (
        <ProductEditor
          productId={editingId}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
          }}
        />
      ) : null}
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ editor */

const TABS = [
  "General",
  "Media",
  "Variations",
  "Details",
  "Tax",
  "SEO",
] as const;

function ProductEditor({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const categories = useQuery(adminCategoriesQuery());
  const attributes = useQuery(adminAttributesQuery());
  const products = useQuery(adminProductsQuery());
  const savedTerms = useQuery(productTermsQuery(productId));
  const { isOwner } = useIsStaff();
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [draft, setDraft] = useState<ProductDraft | null>(null);

  // Hydrate once the source rows land.
  const existing = productId ? products.data?.find((p) => p.id === productId) : undefined;
  if (draft === null) {
    if (!productId) {
      setDraft(blankProduct());
    } else if (existing && savedTerms.data) {
      setDraft({
        id: existing.id,
        name: existing.name,
        name_te: existing.name_te ?? "",
        slug: existing.slug,
        sku_base: existing.sku_base ?? "",
        type: existing.type,
        category_id: existing.category_id,
        short_description: existing.short_description ?? "",
        description: existing.description ?? "",
        thumbnail_url: existing.thumbnail_url ?? "",
        gallery: Array.isArray(existing.gallery) ? (existing.gallery as string[]) : [],
        gst_rate: Number(existing.gst_rate ?? 5),
        hsn_code: existing.hsn_code ?? "",
        is_ganuga: existing.is_ganuga,
        extraction: existing.extraction ?? "",
        shelf_life: existing.shelf_life ?? "",
        ingredients: existing.ingredients ?? "",
        storage: existing.storage ?? "",
        status: existing.status,
        is_featured: existing.is_featured,
        sort_order: existing.sort_order,
        seo_title: existing.seo_title ?? "",
        seo_description: existing.seo_description ?? "",
        termIds: savedTerms.data.map((t) => t.term_id),
        variations: existing.variations.map(toVariationDraft),
      });
    }
  }

  const packAttribute =
    attributes.data?.attributes.find((a) => a.slug === "pack-size") ??
    attributes.data?.attributes[0];
  const packTerms = (attributes.data?.terms ?? []).filter(
    (t) => t.attribute_id === packAttribute?.id,
  );

  const save = useMutation({
    mutationFn: async (d: ProductDraft) => {
      if (!d.name.trim()) throw new Error("Give the product a name.");
      if (!d.category_id) throw new Error("Pick a category.");
      if (d.status === "published" && d.variations.filter((v) => v.is_active).length === 0) {
        throw new Error("Add at least one active pack size before publishing.");
      }
      const skus = d.variations.map((v) => v.sku.trim()).filter(Boolean);
      if (new Set(skus).size !== skus.length) throw new Error("Two pack sizes share a SKU.");

      const payload = {
        name: d.name.trim(),
        name_te: d.name_te.trim() || null,
        slug: d.slug.trim() || slugify(d.name),
        sku_base: d.sku_base.trim() || null,
        type: d.type,
        category_id: d.category_id,
        short_description: d.short_description.trim() || null,
        description: d.description.trim() || null,
        thumbnail_url: d.thumbnail_url.trim() || null,
        gallery: d.gallery,
        gst_rate: d.gst_rate,
        hsn_code: d.hsn_code.trim() || null,
        is_ganuga: d.is_ganuga,
        extraction: d.extraction.trim() || null,
        shelf_life: d.shelf_life.trim() || null,
        ingredients: d.ingredients.trim() || null,
        storage: d.storage.trim() || null,
        status: d.status,
        is_featured: d.is_featured,
        sort_order: d.sort_order,
        seo_title: d.seo_title.trim() || null,
        seo_description: d.seo_description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let id = d.id;
      if (id) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        const { data: created, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        id = created.id;
      }

      // Attribute wiring
      if (packAttribute) {
        await supabase
          .from("product_attributes")
          .upsert(
            { product_id: id, attribute_id: packAttribute.id, used_for_variations: true, sort_order: 1 },
            { onConflict: "product_id,attribute_id" },
          );
        await supabase.from("product_attribute_terms").delete().eq("product_id", id);
        if (d.termIds.length > 0) {
          await supabase.from("product_attribute_terms").insert(
            d.termIds.map((termId) => ({
              product_id: id as string,
              attribute_id: packAttribute.id,
              term_id: termId,
            })),
          );
        }
      }

      // Variations: update, insert, delete the ones removed.
      const keepIds = d.variations.map((v) => v.id).filter(Boolean) as string[];
      const previousIds = (existing?.variations ?? []).map((v) => v.id);
      const removed = previousIds.filter((pid) => !keepIds.includes(pid));
      if (removed.length > 0) {
        await supabase.from("variations").delete().in("id", removed);
      }

      for (const [index, v] of d.variations.entries()) {
        const base = {
          product_id: id as string,
          sku: v.sku.trim() || skuToken(d.sku_base || d.name, v.label),
          label: v.label.trim() || null,
          barcode: v.barcode.trim() || null,
          option_map: v.option_map,
          price: v.price,
          sale_price: v.sale_price,
          cost_price: v.cost_price,
          weight_grams: v.weight_grams,
          low_stock_threshold: v.low_stock_threshold,
          manage_stock: v.manage_stock,
          backorders: v.backorders,
          image_url: v.image_url.trim() || null,
          is_active: v.is_active,
          sort_order: index,
          updated_at: new Date().toISOString(),
        };
        if (v.id) {
          const { error } = await supabase.from("variations").update(base).eq("id", v.id);
          if (error) throw new Error(error.message);
        } else {
          const { data: createdVariation, error } = await supabase
            .from("variations")
            .insert({ ...base, stock_quantity: 0 })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          if (v.stock_quantity > 0) {
            await supabase.rpc("adjust_stock", {
              _variation_id: createdVariation.id,
              _type: "adjustment",
              _qty: v.stock_quantity,
              _reference_type: "opening",
              _note: "Opening stock set in the product editor",
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Product saved");
      void qc.invalidateQueries({ queryKey: ["admin"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateVariations = () => {
    if (!draft) return;
    const selected = packTerms.filter((t) => draft.termIds.includes(t.id));
    if (selected.length === 0) {
      toast.error("Tick the pack sizes this oil comes in first.");
      return;
    }
    const existingByTerm = new Map(
      draft.variations.map((v) => [Object.values(v.option_map)[0] ?? v.label, v]),
    );
    const next: VariationDraft[] = selected.map((term, index) => {
      const already = existingByTerm.get(term.slug);
      if (already) return { ...already, sort_order: index };
      return {
        label: term.name,
        sku: skuToken(draft.sku_base || draft.name, term.name),
        barcode: "",
        option_map: { [packAttribute?.slug ?? "pack-size"]: term.slug },
        price: 0,
        sale_price: null,
        cost_price: 0,
        weight_grams: 0,
        stock_quantity: 0,
        low_stock_threshold: 5,
        manage_stock: true,
        backorders: "no",
        image_url: "",
        is_active: true,
        sort_order: index,
        isNew: true,
      };
    });
    setDraft({ ...draft, variations: next, type: next.length > 1 ? "variable" : "simple" });
    toast.success(`${next.length} pack sizes ready to price`);
  };

  const patchVariation = (index: number, patch: Partial<VariationDraft>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      variations: draft.variations.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    });
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-5xl"
      title={productId ? "Edit product" : "New product"}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          {draft ? (
            <Select
              className="max-w-[160px]"
              value={draft.status}
              onValue={(v) =>
                setDraft({ ...draft, status: v as "draft" | "published" | "archived" })
              }
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
          ) : null}
          <Btn disabled={!draft || save.isPending} onClick={() => draft && save.mutate(draft)}>
            {save.isPending ? "Saving…" : "Save product"}
          </Btn>
        </>
      }
    >
      {!draft ? (
        <Loading rows={8} />
      ) : (
        <div>
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

          {tab === "General" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2">
                <TextInput
                  value={draft.name}
                  placeholder="Groundnut Ganuga Oil"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                      sku_base: draft.id ? draft.sku_base : skuToken(e.target.value).slice(0, 16),
                    })
                  }
                />
              </Field>
              <Field label="Telugu name">
                <TextInput
                  className="te"
                  value={draft.name_te}
                  onChange={(e) => setDraft({ ...draft, name_te: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <TextInput
                  className="num"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                />
              </Field>
              <Field label="Category">
                <Select
                  value={draft.category_id ?? ""}
                  onValue={(v) => setDraft({ ...draft, category_id: v || null })}
                  options={[
                    { value: "", label: "Choose a category" },
                    ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </Field>
              <Field label="SKU base" hint="Pack SKUs are built from this.">
                <TextInput
                  className="num"
                  value={draft.sku_base}
                  onChange={(e) => setDraft({ ...draft, sku_base: e.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Short description" className="sm:col-span-2">
                <TextInput
                  value={draft.short_description}
                  placeholder="Crushed cold in a wooden ganuga. Deep, nutty and unrefined."
                  onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
                />
              </Field>
              <Field label="Full description" className="sm:col-span-2">
                <TextArea
                  className="min-h-[160px]"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-6 sm:col-span-2">
                <Toggle
                  checked={draft.is_ganuga}
                  onToggle={(v) => setDraft({ ...draft, is_ganuga: v })}
                  label="Wood-pressed (shows the Ganuga pill)"
                />
                <Toggle
                  checked={draft.is_featured}
                  onToggle={(v) => setDraft({ ...draft, is_featured: v })}
                  label="Feature on the home page"
                />
              </div>
            </div>
          ) : null}

          {tab === "Media" ? (
            <div className="space-y-4">
              <Field label="Main image URL" hint="Square crop on a plain cream background.">
                <TextInput
                  value={draft.thumbnail_url}
                  onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              {draft.thumbnail_url ? (
                <img
                  src={draft.thumbnail_url}
                  alt=""
                  className="size-40 rounded-lg border border-line-200 object-cover"
                />
              ) : null}
              <Field
                label="Gallery image URLs"
                hint="One per line. These appear as thumbnails on the product page."
              >
                <TextArea
                  value={draft.gallery.join("\n")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      gallery: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
              <p className="text-xs text-ink-500">
                Upload files on the Media screen, then paste the URL here.
              </p>
            </div>
          ) : null}

          {tab === "Variations" ? (
            <div className="space-y-5">
              <Panel
                title="Pack sizes this oil comes in"
                description={`Options come from the "${packAttribute?.name ?? "Pack Size"}" attribute.`}
              >
                {packTerms.length === 0 ? (
                  <EmptyState
                    title="No pack sizes defined"
                    hint="Add them once on the Attributes screen and every oil can reuse them."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {packTerms.map((term) => {
                      const on = draft.termIds.includes(term.id);
                      return (
                        <button
                          key={term.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              termIds: on
                                ? draft.termIds.filter((t) => t !== term.id)
                                : [...draft.termIds, term.id],
                            })
                          }
                          className={cn(
                            "rounded-full border px-4 py-1.5 text-sm transition-colors",
                            on
                              ? "border-green-900 bg-green-900 text-cream-50"
                              : "border-line-200 bg-card text-ink-900 hover:border-gold-500",
                          )}
                        >
                          {term.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4">
                  <Btn variant="gold" onClick={generateVariations}>
                    <Sparkles /> Generate variations
                  </Btn>
                </div>
              </Panel>

              {draft.variations.length === 0 ? (
                <EmptyState
                  title="No variations yet"
                  hint="Tick the pack sizes above and press Generate. Then set a price for each."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line-200 bg-card">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-line-200 text-left">
                        {[
                          "Pack",
                          "SKU",
                          "Barcode",
                          "Price",
                          "Sale",
                          ...(isOwner ? ["Cost"] : []),
                          "Weight g",
                          "Stock",
                          "Active",
                          "",
                        ].map((h) => (
                          <th key={h} className="eyebrow px-2.5 py-2 text-ink-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200">
                      {draft.variations.map((v, i) => (
                        <tr key={v.id ?? `new-${i}`}>
                          <td className="px-2.5 py-2">
                            <TextInput
                              className="w-24"
                              value={v.label}
                              onChange={(e) => patchVariation(i, { label: e.target.value })}
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <TextInput
                              className="num w-36"
                              value={v.sku}
                              onChange={(e) =>
                                patchVariation(i, { sku: e.target.value.toUpperCase() })
                              }
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="flex gap-1">
                              <TextInput
                                className="num w-32"
                                value={v.barcode}
                                onChange={(e) => patchVariation(i, { barcode: e.target.value })}
                              />
                              <Btn
                                variant="outline"
                                className="px-2"
                                onClick={() => patchVariation(i, { barcode: generateBarcode() })}
                              >
                                Gen
                              </Btn>
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            <TextInput
                              type="number"
                              className="num w-24"
                              value={String(v.price)}
                              onChange={(e) =>
                                patchVariation(i, { price: Number(e.target.value || 0) })
                              }
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <TextInput
                              type="number"
                              className="num w-24"
                              value={v.sale_price === null ? "" : String(v.sale_price)}
                              onChange={(e) =>
                                patchVariation(i, {
                                  sale_price: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                            />
                          </td>
                          {isOwner ? (
                            <td className="px-2.5 py-2">
                              <TextInput
                                type="number"
                                className="num w-24"
                                value={String(v.cost_price)}
                                onChange={(e) =>
                                  patchVariation(i, { cost_price: Number(e.target.value || 0) })
                                }
                              />
                              {v.price > 0 && v.cost_price > 0 ? (
                                <span className="num mt-1 block text-[11px] text-ink-500">
                                  {Math.round(((v.price - v.cost_price) / v.price) * 100)}%
                                </span>
                              ) : null}
                            </td>
                          ) : null}
                          <td className="px-2.5 py-2">
                            <TextInput
                              type="number"
                              className="num w-24"
                              value={String(v.weight_grams)}
                              onChange={(e) =>
                                patchVariation(i, { weight_grams: Number(e.target.value || 0) })
                              }
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            {v.isNew ? (
                              <TextInput
                                type="number"
                                className="num w-20"
                                value={String(v.stock_quantity)}
                                onChange={(e) =>
                                  patchVariation(i, {
                                    stock_quantity: Number(e.target.value || 0),
                                  })
                                }
                              />
                            ) : (
                              <span className="num" title="Change stock on the Stock screen">
                                {v.stock_quantity}
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2">
                            <input
                              type="checkbox"
                              aria-label="Active"
                              checked={v.is_active}
                              onChange={(e) => patchVariation(i, { is_active: e.target.checked })}
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <button
                              type="button"
                              aria-label="Remove pack size"
                              className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  variations: draft.variations.filter((_, x) => x !== i),
                                })
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-ink-500">
                Stock on existing pack sizes is changed on the Stock screen so every movement is
                recorded in the ledger. Opening stock for a brand-new pack size can be typed here.
              </p>
            </div>
          ) : null}

          {tab === "Details" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Extraction method">
                <Select
                  value={draft.extraction}
                  onValue={(v) => setDraft({ ...draft, extraction: v })}
                  options={[
                    { value: "Ganuga (wood-pressed)", label: "Ganuga (wood-pressed)" },
                    { value: "Filtered", label: "Filtered" },
                    { value: "Refined", label: "Refined" },
                  ]}
                />
              </Field>
              <Field label="Shelf life">
                <TextInput
                  value={draft.shelf_life}
                  onChange={(e) => setDraft({ ...draft, shelf_life: e.target.value })}
                />
              </Field>
              <Field label="Ingredients" className="sm:col-span-2">
                <TextInput
                  value={draft.ingredients}
                  onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                />
              </Field>
              <Field label="Storage" className="sm:col-span-2">
                <TextArea
                  value={draft.storage}
                  onChange={(e) => setDraft({ ...draft, storage: e.target.value })}
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
            </div>
          ) : null}

          {tab === "Tax" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GST rate %" hint="Prices you enter already include this.">
                <TextInput
                  type="number"
                  className="num"
                  value={String(draft.gst_rate)}
                  onChange={(e) => setDraft({ ...draft, gst_rate: Number(e.target.value || 0) })}
                />
              </Field>
              <Field label="HSN code" hint="Edible oils usually sit in 1507–1515.">
                <TextInput
                  className="num"
                  value={draft.hsn_code}
                  onChange={(e) => setDraft({ ...draft, hsn_code: e.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {tab === "SEO" ? (
            <div className="space-y-4">
              <Field label="SEO title">
                <TextInput
                  value={draft.seo_title}
                  onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
                  placeholder={`${draft.name} — Lepakshi Gold`}
                />
              </Field>
              <Field label="Meta description" hint="Around 155 characters reads best in Google.">
                <TextArea
                  value={draft.seo_description}
                  onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
                />
              </Field>
              <div className="rounded-lg border border-line-200 bg-cream-100/60 p-4">
                <p className="text-sm text-green-700">
                  {draft.seo_title || `${draft.name} — Lepakshi Gold`}
                </p>
                <p className="num text-xs text-success">
                  lepakshigold.com/product/{draft.slug || "…"}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {draft.seo_description || draft.short_description || "Add a description."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
