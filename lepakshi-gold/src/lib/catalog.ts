import { queryOptions } from "@tanstack/react-query";

import type { Database } from "@/integrations/supabase/types";
import {
  loadCategories,
  loadContentBlock,
  loadFaqs,
  loadProduct,
  loadProducts,
  loadReviews,
  loadSettings,
} from "@/lib/catalog.server";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type PublicVariation = Database["public"]["Views"]["variations_public"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type ProductWithVariations = Product & { variations: PublicVariation[] };

export function categoriesQuery() {
  return queryOptions({
    queryKey: ["categories"],
    queryFn: () => loadCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function productsQuery(categorySlug?: string) {
  return queryOptions({
    queryKey: ["products", categorySlug ?? "all"],
    queryFn: () => loadProducts({ data: { categorySlug } }),
    staleTime: 60 * 1000,
  });
}

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: () => loadProduct({ data: { slug } }),
    staleTime: 60 * 1000,
  });
}

export function reviewsQuery(productId: string | undefined) {
  return queryOptions({
    queryKey: ["reviews", productId ?? "none"],
    queryFn: async (): Promise<Review[]> => {
      if (!productId) return [];
      return loadReviews({ data: { productId } });
    },
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });
}

export function settingsQuery() {
  return queryOptions({
    queryKey: ["settings"],
    queryFn: () => loadSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function faqsQuery() {
  return queryOptions({
    queryKey: ["faqs"],
    queryFn: () => loadFaqs(),
    staleTime: 5 * 60 * 1000,
  });
}

export function contentBlockQuery(key: string) {
  return queryOptions({
    queryKey: ["content-block", key],
    queryFn: () => loadContentBlock({ data: { key } }),
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
  const row = v as unknown as Record<string, unknown>;
  const managed = row["manage_stock"] ?? row["manage_stock"];
  if (managed === false) return true;
  if (v.backorders && v.backorders !== "no") return true;
  return Number(row["stock_quantity"] ?? row["stock_quantity"] ?? 0) > 0;
}
