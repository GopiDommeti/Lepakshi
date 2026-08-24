import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

export type QuoteInput = {
  items: { variationId: string; quantity: number }[];
  pincode?: string | null | undefined;
  state?: string | null | undefined;
  couponCode?: string | null | undefined;
  paymentMethod?: "cod" | "razorpay" | "upi" | "bank_transfer" | undefined;
  customerId?: string | null | undefined;
};

export type PricedLine = {
  variationId: string;
  productId: string;
  productName: string;
  variationLabel: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  costPrice: number;
  gstRate: number;
  quantity: number;
  lineTotal: number;
  weightGrams: number;
  categoryId: string | null;
  stockQuantity: number;
  manageStock: boolean;
  backorders: string;
};

export type Quote = {
  lines: PricedLine[];
  itemsSubtotal: number;
  discountTotal: number;
  couponCode: string | null;
  couponMessage: string | null;
  shippingTotal: number;
  shippingLabel: string;
  codFee: number;
  taxTotal: number;
  grandTotal: number;
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number | null;
  weightGrams: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function livePrice(v: {
  price: number | string;
  sale_price: number | string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}): number {
  const base = Number(v.price);
  const sale = v.sale_price == null ? null : Number(v.sale_price);
  if (sale == null || sale <= 0 || sale >= base) return base;
  const now = Date.now();
  if (v.sale_starts_at && new Date(v.sale_starts_at).getTime() > now) return base;
  if (v.sale_ends_at && new Date(v.sale_ends_at).getTime() < now) return base;
  return sale;
}

export async function buildQuote(admin: Admin, input: QuoteInput): Promise<Quote> {
  const wanted = input.items.filter((i) => i.quantity > 0);
  if (wanted.length === 0) throw new Error("Your cart is empty.");

  const { data: variations, error } = await admin
    .from("variations")
    .select(
      "id,product_id,sku,label,price,sale_price,sale_starts_at,sale_ends_at,cost_price,weight_grams,manage_stock,stock_quantity,backorders,image_url,is_active,products(id,name,gst_rate,category_id,thumbnail_url,status)",
    )
    .in(
      "id",
      wanted.map((i) => i.variationId),
    );
  if (error) throw new Error(error.message);

  const lines: PricedLine[] = [];
  for (const item of wanted) {
    const v = (variations ?? []).find((row) => row.id === item.variationId);
    if (!v || !v.is_active) throw new Error("One of the items is no longer available.");
    const product = v.products as unknown as {
      id: string;
      name: string;
      gst_rate: number | string;
      category_id: string | null;
      thumbnail_url: string | null;
      status: string;
    } | null;
    if (!product || product.status !== "published") {
      throw new Error("One of the items is no longer available.");
    }
    const unitPrice = livePrice(v);
    lines.push({
      variationId: v.id,
      productId: product.id,
      productName: product.name,
      variationLabel: v.label ?? "",
      sku: v.sku,
      imageUrl: v.image_url ?? product.thumbnail_url,
      unitPrice,
      costPrice: Number(v.cost_price ?? 0),
      gstRate: Number(product.gst_rate ?? 0),
      quantity: item.quantity,
      lineTotal: round2(unitPrice * item.quantity),
      weightGrams: Number(v.weight_grams ?? 0) * item.quantity,
      categoryId: product.category_id,
      stockQuantity: Number(v.stock_quantity ?? 0),
      manageStock: Boolean(v.manage_stock),
      backorders: String(v.backorders ?? "no"),
    });
  }

  const itemsSubtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const weightGrams = lines.reduce((s, l) => s + l.weightGrams, 0);

  const { data: settings } = await admin.from("settings").select("*").maybeSingle();
  const freeAbove = settings?.free_shipping_above == null ? null : Number(settings.free_shipping_above);
  const defaultFee = Number(settings?.default_shipping_fee ?? 0);
  const codEnabled = settings?.cod_enabled ?? true;
  const codExtra = Number(settings?.cod_extra_fee ?? 0);

  // Coupon
  let discountTotal = 0;
  let couponCode: string | null = null;
  let couponMessage: string | null = null;
  let freeShippingCoupon = false;

  const rawCode = (input.couponCode ?? "").trim().toUpperCase();
  if (rawCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", rawCode)
      .maybeSingle();
    const now = Date.now();
    if (!coupon || !coupon.is_active) {
      couponMessage = "That coupon code isn't valid.";
    } else if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
      couponMessage = "That coupon isn't active yet.";
    } else if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
      couponMessage = "That coupon has expired.";
    } else if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
      couponMessage = "That coupon has been fully claimed.";
    } else if (coupon.min_spend != null && itemsSubtotal < Number(coupon.min_spend)) {
      couponMessage = `Spend ₹${Number(coupon.min_spend)} to use this coupon.`;
    } else {
      const eligible = lines.filter((l) => {
        if (coupon.excluded_ids?.includes(l.productId)) return false;
        if (coupon.applies_to === "products") return coupon.product_ids?.includes(l.productId);
        if (coupon.applies_to === "categories")
          return l.categoryId ? coupon.category_ids?.includes(l.categoryId) : false;
        return true;
      });
      const eligibleTotal = round2(eligible.reduce((s, l) => s + l.lineTotal, 0));
      if (eligibleTotal <= 0) {
        couponMessage = "This coupon doesn't apply to the items in your cart.";
      } else {
        couponCode = coupon.code;
        if (coupon.type === "percent") {
          discountTotal = round2((eligibleTotal * Number(coupon.value)) / 100);
        } else if (coupon.type === "fixed_cart") {
          discountTotal = Math.min(eligibleTotal, Number(coupon.value));
        } else if (coupon.type === "fixed_product") {
          discountTotal = round2(
            eligible.reduce((s, l) => s + Math.min(l.unitPrice, Number(coupon.value)) * l.quantity, 0),
          );
        } else if (coupon.type === "free_shipping") {
          freeShippingCoupon = true;
        }
        if (coupon.max_discount != null) {
          discountTotal = Math.min(discountTotal, Number(coupon.max_discount));
        }
        couponMessage = `Coupon ${coupon.code} applied.`;
      }
    }
  }
  discountTotal = round2(Math.min(discountTotal, itemsSubtotal));

  // Serviceability
  let serviceable = true;
  let codAvailable = codEnabled;
  let etaDays: number | null = null;
  let district: string | null = null;
  let stateName = input.state ?? null;

  const pincode = (input.pincode ?? "").trim();
  if (pincode) {
    const { data: pin } = await admin
      .from("pincode_serviceability")
      .select("*")
      .eq("pincode", pincode)
      .maybeSingle();
    if (pin) {
      serviceable = pin.is_serviceable;
      codAvailable = codEnabled && pin.cod_available;
      etaDays = pin.eta_days;
      district = pin.district;
      stateName = pin.state ?? stateName;
    }
  }

  // Shipping
  let shippingTotal = defaultFee;
  let shippingLabel = "Standard delivery";

  const { data: zones } = await admin
    .from("shipping_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const matchZone = (zones ?? []).find((z) => {
    const values = (z.values ?? []).map((v) => String(v).toLowerCase());
    if (z.match_type === "pincode") return pincode ? values.includes(pincode) : false;
    if (z.match_type === "district") return district ? values.includes(district.toLowerCase()) : false;
    if (z.match_type === "state") return stateName ? values.includes(stateName.toLowerCase()) : false;
    return z.match_type === "rest";
  });

  if (matchZone) {
    const { data: methods } = await admin
      .from("shipping_methods")
      .select("*")
      .eq("zone_id", matchZone.id)
      .eq("is_active", true);
    const method = (methods ?? [])[0];
    if (method) {
      shippingLabel = method.name;
      if (method.type === "free_above" || method.type === "flat") {
        shippingTotal = Number(method.cost ?? 0);
        if (method.free_above != null && itemsSubtotal - discountTotal >= Number(method.free_above)) {
          shippingTotal = 0;
        }
      } else if (method.type === "weight_based") {
        const perKg = Number(method.per_kg_rate ?? 0);
        shippingTotal = round2(Number(method.cost ?? 0) + (weightGrams / 1000) * perKg);
      } else if (method.type === "pickup") {
        shippingTotal = 0;
      }
      if (method.max_days != null && etaDays == null) etaDays = method.max_days;
    }
  }

  if (freeAbove != null && itemsSubtotal - discountTotal >= freeAbove) shippingTotal = 0;
  if (freeShippingCoupon) shippingTotal = 0;
  shippingTotal = round2(Math.max(0, shippingTotal));

  const codFee =
    input.paymentMethod === "cod" && codAvailable ? round2(codExtra) : 0;

  // GST is included in the listed price — surface the tax component.
  const taxTotal = round2(
    lines.reduce((s, l) => {
      const rate = l.gstRate / 100;
      const share = itemsSubtotal > 0 ? l.lineTotal / itemsSubtotal : 0;
      const netLine = l.lineTotal - discountTotal * share;
      return s + (netLine * rate) / (1 + rate);
    }, 0),
  );

  const grandTotal = round2(itemsSubtotal - discountTotal + shippingTotal + codFee);

  return {
    lines,
    itemsSubtotal,
    discountTotal,
    couponCode,
    couponMessage,
    shippingTotal,
    shippingLabel,
    codFee,
    taxTotal,
    grandTotal,
    serviceable,
    codAvailable,
    etaDays,
    weightGrams,
  };
}

export async function nextOrderNumber(admin: Admin): Promise<string> {
  const { data: settings } = await admin
    .from("settings")
    .select("id,order_prefix,next_order_number")
    .maybeSingle();
  const prefix = settings?.order_prefix ?? "LG";
  const current = Number(settings?.next_order_number ?? 1001);
  if (settings) {
    await admin
      .from("settings")
      .update({ next_order_number: current + 1 })
      .eq("id", settings.id);
  }
  return `${prefix}${current}`;
}
