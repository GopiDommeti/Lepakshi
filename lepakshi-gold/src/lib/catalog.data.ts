import type { RowDataPacket } from "mysql2";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { asBool, asNum, isMysqlConfigured, mysqlQuery, parseJson } from "@/lib/db";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type PublicVariation = Database["public"]["Views"]["variations_public"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type CatalogProduct = Product & { variations: PublicVariation[] };

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function isoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return iso(value);
}

function cell(row: RowDataPacket, key: string): unknown {
  return row[key];
}

function mapProduct(r: RowDataPacket): Product {
  return {
    ...r,
    gallery: parseJson(cell(r, "gallery"), []),
    upsell_ids: parseJson(cell(r, "upsell_ids"), []),
    crosssell_ids: parseJson(cell(r, "crosssell_ids"), []),
    is_ganuga: asBool(cell(r, "is_ganuga")),
    is_featured: asBool(cell(r, "is_featured")),
    created_at: iso(cell(r, "created_at")),
    updated_at: iso(cell(r, "updated_at")),
  } as unknown as Product;
}

function mapCategory(r: RowDataPacket): Category {
  return {
    ...r,
    is_active: asBool(cell(r, "is_active")),
    created_at: iso(cell(r, "created_at")),
    updated_at: iso(cell(r, "updated_at")),
  } as unknown as Category;
}

function mapVariation(r: RowDataPacket): PublicVariation {
  return {
    ...r,
    option_map: parseJson(cell(r, "option_map"), {}),
    price: asNum(cell(r, "price")),
    manage_stock: asBool(cell(r, "manage_stock")),
    is_active: asBool(cell(r, "is_active")),
    created_at: isoOrNull(cell(r, "created_at")),
    updated_at: isoOrNull(cell(r, "updated_at")),
  } as unknown as PublicVariation;
}

async function withVariations(products: Product[]): Promise<CatalogProduct[]> {
  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await mysqlQuery<RowDataPacket>(
    `SELECT * FROM variations WHERE is_active = 1 AND product_id IN (${placeholders}) ORDER BY sort_order ASC`,
    ids,
  );
  const variations = rows.map(mapVariation);
  return products.map((p) => ({
    ...p,
    variations: variations.filter((v) => v.product_id === p.id),
  }));
}

const PRODUCT_SELECT =
  "id,name,name_te,slug,type,category_id,short_description,description,thumbnail_url,gallery,gst_rate,is_ganuga,extraction,shelf_life,ingredients,storage,status,is_featured,sort_order,seo_title,seo_description,created_at,updated_at,sku_base,hsn_code,upsell_ids,crosssell_ids";

export async function fetchCategories(): Promise<Category[]> {
  if (isMysqlConfigured()) {
    try {
      const rows = await mysqlQuery<RowDataPacket>(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC",
      );
      return rows.map(mapCategory);
    } catch (error) {
      console.error("[catalog] Hostinger MySQL categories failed", error);
    }
  }
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  if (isMysqlConfigured()) {
    try {
      let categoryId: string | null = null;
      if (categorySlug) {
        const cats = await mysqlQuery<RowDataPacket>(
          "SELECT id FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1",
          [categorySlug],
        );
        if (!cats[0]) return [];
        categoryId = String(cell(cats[0], "id"));
      }
      const sql = categoryId
        ? "SELECT * FROM products WHERE status = 'published' AND category_id = ? ORDER BY sort_order ASC"
        : "SELECT * FROM products WHERE status = 'published' ORDER BY sort_order ASC";
      const rows = await mysqlQuery<RowDataPacket>(sql, categoryId ? [categoryId] : []);
      return withVariations(rows.map(mapProduct));
    } catch (error) {
      console.error("[catalog] Hostinger MySQL products failed", error);
    }
  }

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
    if (!cat) return [];
    categoryId = cat.id;
  }
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("status", "published").order("sort_order");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data: products, error } = await query;
  if (error) throw error;
  const ids = (products ?? []).map((p) => p.id);
  if (ids.length === 0) return [];
  const { data: variations, error: vError } = await supabase
    .from("variations_public")
    .select("*")
    .in("product_id", ids)
    .eq("is_active", true)
    .order("sort_order");
  if (vError) throw vError;
  return (products ?? []).map((p) => ({
    ...p,
    variations: (variations ?? []).filter((v) => v.product_id === p.id),
  })) as CatalogProduct[];
}

export async function fetchProduct(slug: string): Promise<CatalogProduct | null> {
  if (isMysqlConfigured()) {
    try {
      const rows = await mysqlQuery<RowDataPacket>(
        "SELECT * FROM products WHERE slug = ? AND status = 'published' LIMIT 1",
        [slug],
      );
      if (!rows[0]) return null;
      const attached = await withVariations([mapProduct(rows[0])]);
      return attached[0] ?? null;
    } catch (error) {
      console.error("[catalog] Hostinger MySQL product failed", error);
    }
  }
  const { data: product, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;
  const { data: variations, error: vError } = await supabase
    .from("variations_public")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order");
  if (vError) throw vError;
  return { ...product, variations: variations ?? [] } as CatalogProduct;
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  if (isMysqlConfigured()) {
    try {
      const rows = await mysqlQuery<RowDataPacket>(
        "SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC",
        [productId],
      );
      return rows as unknown as Review[];
    } catch (error) {
      console.error("[catalog] Hostinger MySQL reviews failed", error);
    }
  }
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings() {
  if (isMysqlConfigured()) {
    try {
      const rows = await mysqlQuery<RowDataPacket>("SELECT * FROM settings LIMIT 1");
      return rows[0] ?? null;
    } catch (error) {
      console.error("[catalog] Hostinger MySQL settings failed", error);
    }
  }
  const { data, error } = await supabase.from("settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFaqs() {
  if (isMysqlConfigured()) {
    try {
      return await mysqlQuery<RowDataPacket>(
        "SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC",
      );
    } catch (error) {
      console.error("[catalog] Hostinger MySQL faqs failed", error);
    }
  }
  const { data, error } = await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchContentBlock(key: string) {
  if (isMysqlConfigured()) {
    try {
      const rows = await mysqlQuery<RowDataPacket>(
        "SELECT * FROM content_blocks WHERE `key` = ? AND is_active = 1 LIMIT 1",
        [key],
      );
      const row = rows[0];
      if (!row) return null;
      return { ...row, data: parseJson(cell(row, "data"), {}) };
    } catch (error) {
      console.error("[catalog] Hostinger MySQL content failed", error);
    }
  }
  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
