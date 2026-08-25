import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type PublicVariation = Database["public"]["Views"]["variations_public"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type ProductWithVariations = Product & { variations: PublicVariation[] };

const PRODUCT_COLUMNS =
  "id,name,name_te,slug,type,category_id,short_description,description,thumbnail_url,gallery,gst_rate,is_ganuga,extraction,shelf_life,ingredients,storage,status,is_featured,sort_order,seo_title,seo_description,created_at,updated_at,sku_base,hsn_code,upsell_ids,crosssell_ids";

export function categoriesQuery() {
  return queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchVariations(productIds: string[]): Promise<PublicVariation[]> {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase
    .from("variations_public")
    .select("*")
    .in("product_id", productIds)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export function productsQuery(categorySlug?: string) {
  return queryOptions({
    queryKey: ["products", categorySlug ?? "all"],
    queryFn: async (): Promise<ProductWithVariations[]> => {
      let categoryId: string | null = null;
      if (categorySlug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        if (!cat) return [];
        categoryId = cat.id;
      }

      let query = supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("status", "published")
        .order("sort_order");
      if (categoryId) query = query.eq("category_id", categoryId);

      const { data: products, error } = await query;
      if (error) throw error;

      const variations = await fetchVariations((products ?? []).map((p) => p.id));
      return (products ?? []).map((p) => ({
        ...p,
        variations: variations.filter((v) => v.product_id === p.id),
      }));
    },
    staleTime: 60 * 1000,
  });
}

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductWithVariations | null> => {
      const { data: product, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!product) return null;
      const variations = await fetchVariations([product.id]);
      return { ...product, variations };
    },
    staleTime: 60 * 1000,
  });
}

export function reviewsQuery(productId: string | undefined) {
  return queryOptions({
    queryKey: ["reviews", productId ?? "none"],
    queryFn: async (): Promise<Review[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });
}

export function settingsQuery() {
  return queryOptions({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function faqsQuery() {
  return queryOptions({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function contentBlockQuery(key: string) {
  return queryOptions({
    queryKey: ["content-block", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_blocks")
        .select("*")
        .eq("key", key)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function effectivePrice(v: {
  price: number | string | null;
  sale_price: number | string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}): number {
  const base = Number(v.price ?? 0);
  const sale = v.sale_price == null ? null : Number(v.sale_price);
  if (sale == null || sale <= 0 || sale >= base) return base;
  const now = Date.now();
  if (v.sale_starts_at && new Date(v.sale_starts_at).getTime() > now) return base;
  if (v.sale_ends_at && new Date(v.sale_ends_at).getTime() < now) return base;
  return sale;
}

export function priceRange(variations: PublicVariation[]): [number, number] {
  const prices = variations.map(effectivePrice).filter((p) => p > 0);
  if (prices.length === 0) return [0, 0];
  return [Math.min(...prices), Math.max(...prices)];
}

export function inStock(v: PublicVariation | undefined): boolean {
  if (!v) return false;
  if (!v.manage_stock) return true;
  if (v.backorders && v.backorders !== "no") return true;
  return Number(v.stock_quantity ?? 0) > 0;
}
