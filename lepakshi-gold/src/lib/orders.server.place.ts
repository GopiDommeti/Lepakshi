import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { buildQuote, nextOrderNumber } from "./orders.server";

type Address = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  landmark?: string | undefined;
  city: string;
  district?: string | undefined;
  state: string;
  pincode: string;
};

export type PlaceOrderInput = {
  items: { variationId: string; quantity: number }[];
  contactName: string;
  contactPhone: string;
  contactEmail?: string | undefined;
  shippingAddress: Address;
  couponCode?: string | null | undefined;
  paymentMethod: "cod" | "upi" | "bank_transfer";
  customerNote?: string | undefined;
  /** Derived from the verified bearer token by the caller — never from request data. */
  userId?: string | null | undefined;
};

export async function createOrder(input: PlaceOrderInput) {
  const quote = await buildQuote(supabaseAdmin, {
    items: input.items,
    pincode: input.shippingAddress.pincode,
    state: input.shippingAddress.state,
    couponCode: input.couponCode ?? null,
    paymentMethod: input.paymentMethod === "cod" ? "cod" : "upi",
  });

  if (!quote.serviceable) {
    throw new Error("We don't deliver to that pincode yet. Please try another address.");
  }
  if (input.paymentMethod === "cod" && !quote.codAvailable) {
    throw new Error("Cash on delivery isn't available for this pincode.");
  }
  for (const line of quote.lines) {
    if (line.manageStock && line.backorders === "no" && line.stockQuantity < line.quantity) {
      throw new Error(`Only ${line.stockQuantity} left of ${line.productName} ${line.variationLabel}.`);
    }
  }

  const orderNo = await nextOrderNumber(supabaseAdmin);
  const customerId = input.userId ?? null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      order_no: orderNo,
      customer_id: customerId,
      is_guest: !customerId,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      contact_email: input.contactEmail || null,
      shipping_address: input.shippingAddress,
      billing_address: input.shippingAddress,
      items_subtotal: quote.itemsSubtotal,
      discount_total: quote.discountTotal,
      coupon_code: quote.couponCode,
      shipping_total: quote.shippingTotal + quote.codFee,
      tax_total: quote.taxTotal,
      grand_total: quote.grandTotal,
      payment_method: input.paymentMethod,
      payment_status: "pending",
      status: "pending",
      customer_note: input.customerNote || null,
    })
    .select("id,order_no,grand_total")
    .single();
  if (orderError) throw new Error(orderError.message);

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variation_id: l.variationId,
      product_name_snapshot: l.productName,
      variation_label_snapshot: l.variationLabel,
      sku_snapshot: l.sku,
      image_snapshot: l.imageUrl,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      cost_price_snapshot: l.costPrice,
      gst_rate: l.gstRate,
      line_total: l.lineTotal,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  for (const line of quote.lines) {
    await supabaseAdmin.rpc("adjust_stock", {
      _variation_id: line.variationId,
      _type: "sale",
      _qty: -line.quantity,
      _reference_type: "order",
      _reference_id: order.id,
      _note: `Order ${orderNo}`,
    });
  }

  if (quote.couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("id,used_count")
      .eq("code", quote.couponCode)
      .maybeSingle();
    if (coupon) {
      await supabaseAdmin.from("coupon_usages").insert({
        coupon_id: coupon.id,
        order_id: order.id,
        customer_id: customerId,
        amount: quote.discountTotal,
      });
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: coupon.used_count + 1 })
        .eq("id", coupon.id);
    }
  }

  await supabaseAdmin.from("order_status_history").insert({
    order_id: order.id,
    from_status: null,
    to_status: "pending",
  });

  return { orderNo: order.order_no, grandTotal: Number(order.grand_total) };
}

export async function lookupOrder(orderNo: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id,order_no,status,payment_status,payment_method,grand_total,placed_at,courier_name,tracking_number,tracking_url,contact_phone,shipping_address",
    )
    .eq("order_no", orderNo.trim().toUpperCase())
    .maybeSingle();

  if (!order || !order.contact_phone || !order.contact_phone.replace(/\D/g, "").endsWith(digits)) {
    return null;
  }

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name_snapshot,variation_label_snapshot,quantity,line_total")
    .eq("order_id", order.id);

  const { data: history } = await supabaseAdmin
    .from("order_status_history")
    .select("to_status,changed_at")
    .eq("order_id", order.id)
    .order("changed_at");

  const address = order.shipping_address as { city?: string; state?: string } | null;

  return {
    orderNo: order.order_no,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    grandTotal: Number(order.grand_total),
    placedAt: order.placed_at,
    courierName: order.courier_name,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    city: address?.city ?? null,
    state: address?.state ?? null,
    items: items ?? [],
    history: history ?? [],
  };
}
