import { queryOptions } from "@tanstack/react-query";

import { db } from "@/lib/db";
import type { Database } from "@/lib/database.types";

type T = Database["public"]["Tables"];

export type CategoryRow = T["categories"]["Row"];
export type AttributeRow = T["attributes"]["Row"];
export type AttributeTermRow = T["attribute_terms"]["Row"];
export type ProductRow = T["products"]["Row"];
export type VariationRow = T["variations"]["Row"];
export type OrderRow = T["orders"]["Row"];
export type OrderItemRow = T["order_items"]["Row"];
export type OrderNoteRow = T["order_notes"]["Row"];
export type OrderHistoryRow = T["order_status_history"]["Row"];
export type CouponRow = T["coupons"]["Row"];
export type ReviewRow = T["reviews"]["Row"];
export type ShippingZoneRow = T["shipping_zones"]["Row"];
export type ShippingMethodRow = T["shipping_methods"]["Row"];
export type PincodeRow = T["pincode_serviceability"]["Row"];
export type SettingsRow = T["settings"]["Row"];
export type MediaRow = T["media"]["Row"];
export type FaqRow = T["faqs"]["Row"];
export type BannerRow = T["banners"]["Row"];
export type PageRow = T["pages"]["Row"];
export type EnquiryRow = T["enquiries"]["Row"];
export type MovementRow = T["inventory_movements"]["Row"];
export type ProfileRow = T["profiles"]["Row"];
export type AddressRow = T["addresses"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type MovementType = Database["public"]["Enums"]["movement_type"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
  "on_hold",
];

export const MOVEMENT_TYPES: MovementType[] = [
  "purchase",
  "production",
  "sale",
  "return",
  "damage",
  "adjustment",
  "cancellation",
];

function must<D>(data: D | null, error: { message: string } | null): D {
  if (error) throw new Error(error.message);
  return (data ?? []) as D;
}

/* ------------------------------------------------------------------ catalogue */

export function adminCategoriesQuery() {
  return queryOptions({
    queryKey: ["admin", "categories"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await db
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");
      return must(data, error);
    },
  });
}

export function adminAttributesQuery() {
  return queryOptions({
    queryKey: ["admin", "attributes"],
    queryFn: async (): Promise<{ attributes: AttributeRow[]; terms: AttributeTermRow[] }> => {
      const [a, t] = await Promise.all([
        db.from("attributes").select("*").order("sort_order"),
        db.from("attribute_terms").select("*").order("sort_order"),
      ]);
      if (a.error) throw new Error(a.error.message);
      if (t.error) throw new Error(t.error.message);
      return { attributes: a.data ?? [], terms: t.data ?? [] };
    },
  });
}

export type AdminProduct = ProductRow & { variations: VariationRow[] };

export function adminProductsQuery() {
  return queryOptions({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<AdminProduct[]> => {
      const [p, v] = await Promise.all([
        db.from("products").select("*").order("updated_at", { ascending: false }),
        db.from("variations").select("*").order("sort_order"),
      ]);
      if (p.error) throw new Error(p.error.message);
      if (v.error) throw new Error(v.error.message);
      const variations = v.data ?? [];
      return (p.data ?? []).map((row) => ({
        ...row,
        variations: variations.filter((x) => x.product_id === row.id),
      }));
    },
  });
}

export function adminProductQuery(productId: string | null) {
  return queryOptions({
    queryKey: ["admin", "product", productId ?? "none"],
    queryFn: async (): Promise<AdminProduct | null> => {
      if (!productId) return null;
      const { data, error } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const { data: variations } = await db
        .from("variations")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      return { ...data, variations: variations ?? [] };
    },
    enabled: Boolean(productId),
  });
}

export function productTermsQuery(productId: string | null) {
  return queryOptions({
    queryKey: ["admin", "product-terms", productId ?? "none"],
    queryFn: async (): Promise<{ attribute_id: string; term_id: string }[]> => {
      if (!productId) return [];
      const { data, error } = await db
        .from("product_attribute_terms")
        .select("attribute_id,term_id")
        .eq("product_id", productId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(productId),
  });
}

/* --------------------------------------------------------------------- orders */

export function adminOrdersQuery() {
  return queryOptions({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await db
        .from("orders")
        .select("*")
        .order("placed_at", { ascending: false })
        .limit(500);
      return must(data, error);
    },
  });
}

export type OrderDetail = {
  order: OrderRow;
  items: OrderItemRow[];
  notes: OrderNoteRow[];
  history: OrderHistoryRow[];
};

export function adminOrderQuery(orderId: string | null) {
  return queryOptions({
    queryKey: ["admin", "order", orderId ?? "none"],
    queryFn: async (): Promise<OrderDetail | null> => {
      if (!orderId) return null;
      const { data: order, error } = await db
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!order) return null;
      const [items, notes, history] = await Promise.all([
        db.from("order_items").select("*").eq("order_id", orderId),
        db
          .from("order_notes")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false }),
        db
          .from("order_status_history")
          .select("*")
          .eq("order_id", orderId)
          .order("changed_at"),
      ]);
      return {
        order,
        items: items.data ?? [],
        notes: notes.data ?? [],
        history: history.data ?? [],
      };
    },
    enabled: Boolean(orderId),
  });
}

/* ---------------------------------------------------------------------- stock */

export type StockRow = VariationRow & {
  product_name: string;
  product_slug: string;
  category_id: string | null;
  is_organic: boolean;
};

export function stockQuery() {
  return queryOptions({
    queryKey: ["admin", "stock"],
    queryFn: async (): Promise<StockRow[]> => {
      const [v, p] = await Promise.all([
        db.from("variations").select("*").order("sku"),
        db.from("products").select("id,name,slug,category_id,is_organic"),
      ]);
      if (v.error) throw new Error(v.error.message);
      if (p.error) throw new Error(p.error.message);
      const products = p.data ?? [];
      return (v.data ?? []).map((row) => {
        const parent = products.find((x) => x.id === row.product_id);
        return {
          ...row,
          product_name: parent?.name ?? "—",
          product_slug: parent?.slug ?? "",
          category_id: parent?.category_id ?? null,
          is_organic: parent?.is_organic ?? false,
        };
      });
    },
  });
}

export function movementsQuery(variationId: string | null) {
  return queryOptions({
    queryKey: ["admin", "movements", variationId ?? "none"],
    queryFn: async (): Promise<MovementRow[]> => {
      if (!variationId) return [];
      const { data, error } = await db
        .from("inventory_movements")
        .select("*")
        .eq("variation_id", variationId)
        .order("created_at", { ascending: false })
        .limit(200);
      return must(data, error);
    },
    enabled: Boolean(variationId),
  });
}

/* ------------------------------------------------------------------ the rest */

export function simpleListQuery<K extends keyof T & string>(
  table: K,
  orderBy?: { column: string; ascending?: boolean },
) {
  return queryOptions({
    queryKey: ["admin", table],
    queryFn: async () => {
      let q = db.from(table).select("*");
      if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as T[K]["Row"][];
    },
  });
}

export function adminSettingsQuery() {
  return queryOptions({
    queryKey: ["admin", "settings"],
    queryFn: async (): Promise<SettingsRow | null> => {
      const { data, error } = await db.from("settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function customersQuery() {
  return queryOptions({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        db.from("profiles").select("*").order("created_at", { ascending: false }),
        db
          .from("orders")
          .select("customer_id,contact_name,contact_phone,contact_email,grand_total,placed_at"),
      ]);
      if (profiles.error) throw new Error(profiles.error.message);
      if (orders.error) throw new Error(orders.error.message);

      type Aggregate = {
        key: string;
        name: string;
        phone: string | null;
        email: string | null;
        orders: number;
        lifetime: number;
        lastOrder: string | null;
        registered: boolean;
      };
      const map = new Map<string, Aggregate>();

      for (const p of profiles.data ?? []) {
        map.set(p.id, {
          key: p.id,
          name: p.full_name ?? "—",
          phone: p.phone,
          email: p.email,
          orders: 0,
          lifetime: 0,
          lastOrder: null,
          registered: true,
        });
      }
      for (const o of orders.data ?? []) {
        const key = o.customer_id ?? `guest:${o.contact_phone ?? "unknown"}`;
        const existing = map.get(key) ?? {
          key,
          name: o.contact_name ?? "Guest",
          phone: o.contact_phone,
          email: o.contact_email,
          orders: 0,
          lifetime: 0,
          lastOrder: null,
          registered: Boolean(o.customer_id),
        };
        existing.orders += 1;
        existing.lifetime += Number(o.grand_total ?? 0);
        if (!existing.lastOrder || o.placed_at > existing.lastOrder) existing.lastOrder = o.placed_at;
        if (!existing.phone) existing.phone = o.contact_phone;
        if (!existing.email) existing.email = o.contact_email;
        map.set(key, existing);
      }
      return [...map.values()].sort((a, b) => b.lifetime - a.lifetime);
    },
  });
}
