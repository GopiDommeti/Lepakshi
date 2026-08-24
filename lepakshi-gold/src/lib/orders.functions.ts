import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemsSchema = z
  .array(z.object({ variationId: z.string().uuid(), quantity: z.number().int().min(1).max(999) }))
  .min(1)
  .max(50);

const addressSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().max(80).optional(),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/),
});

export const quoteOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        items: itemsSchema,
        pincode: z.string().trim().max(10).nullable().optional(),
        state: z.string().trim().max(80).nullable().optional(),
        couponCode: z.string().trim().max(40).nullable().optional(),
        paymentMethod: z.enum(["cod", "razorpay", "upi", "bank_transfer"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildQuote } = await import("./orders.server");
    const quote = await buildQuote(supabaseAdmin, {
      items: data.items,
      pincode: data.pincode ?? null,
      state: data.state ?? null,
      couponCode: data.couponCode ?? null,
      paymentMethod: data.paymentMethod ?? "cod",
    });
    const { lines, ...rest } = quote;
    return {
      ...rest,
      lines: lines.map(({ costPrice: _cost, ...safe }) => safe),
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        items: itemsSchema,
        contactName: z.string().trim().min(2).max(80),
        contactPhone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/),
        contactEmail: z.string().trim().email().max(160).optional(),
        shippingAddress: addressSchema,
        couponCode: z.string().trim().max(40).nullable().optional(),
        paymentMethod: z.enum(["cod", "upi", "bank_transfer"]),
        customerNote: z.string().trim().max(600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { createOrder } = await import("./orders.server.place");
    // Ownership comes from the verified bearer token only — never from request data.
    const header = getRequest().headers.get("authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
    let userId: string | null = null;
    if (token) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData.user?.id ?? null;
    }
    return createOrder({
      items: data.items,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail ?? "",
      shippingAddress: data.shippingAddress,
      couponCode: data.couponCode ?? null,
      paymentMethod: data.paymentMethod,
      customerNote: data.customerNote ?? "",
      userId,
    });
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderNo: z.string().trim().min(3).max(40),
        phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { lookupOrder } = await import("./orders.server.place");
    return lookupOrder(data.orderNo, data.phone);
  });
