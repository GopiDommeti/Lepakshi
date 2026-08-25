import { pool, query, queryOne } from "./db.js";
import { HttpError, fromJson, toJson, uuid } from "./util.js";

/* ------------------------------------------------------------------ pricing */

async function loadLines(items) {
  const list = Array.isArray(items) ? items.filter((i) => i && i.variationId) : [];
  if (list.length === 0) throw new HttpError(400, "Your cart is empty.");

  const ids = [...new Set(list.map((i) => String(i.variationId)))];
  const rows = await query(
    `SELECT v.id, v.sku, v.label, v.price, v.sale_price, v.cost_price, v.weight_grams,
            v.stock_quantity, v.manage_stock, v.backorders, v.is_active, v.option_map,
            p.id AS product_id, p.name AS product_name, p.thumbnail_url, p.gst_rate,
            p.status AS product_status, p.category_id
       FROM variations v
       JOIN products p ON p.id = v.product_id
      WHERE v.id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );

  return list.map((item) => {
    const v = rows.find((r) => r.id === item.variationId);
    if (!v) throw new HttpError(400, "One of those pack sizes is no longer available.");
    if (!v.is_active || v.product_status !== "published") {
      throw new HttpError(400, `${v.product_name} is not on sale at the moment.`);
    }
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (v.manage_stock && v.backorders === "no" && Number(v.stock_quantity) < quantity) {
      throw new HttpError(
        400,
        `Only ${Number(v.stock_quantity)} of ${v.product_name} ${v.label || ""} left.`.trim(),
      );
    }
    // The server decides the price. Whatever the browser sent is ignored.
    const unitPrice = Number(v.sale_price ?? v.price);
    return {
      variationId: v.id,
      productId: v.product_id,
      productName: v.product_name,
      variationLabel: v.label,
      sku: v.sku,
      image: v.thumbnail_url,
      gstRate: Number(v.gst_rate || 0),
      costPrice: Number(v.cost_price || 0),
      weightGrams: Number(v.weight_grams || 0),
      categoryId: v.category_id,
      quantity,
      unitPrice,
      lineTotal: Number((unitPrice * quantity).toFixed(2)),
    };
  });
}

async function loadSettings() {
  const row = await queryOne("SELECT * FROM settings WHERE id = 1");
  return {
    freeShippingAbove: Number(row?.free_shipping_above ?? 999),
    defaultShippingFee: Number(row?.default_shipping_fee ?? 60),
    codEnabled: row ? Boolean(row.cod_enabled) : true,
    codExtraFee: Number(row?.cod_extra_fee ?? 0),
    orderPrefix: row?.order_prefix || "LG",
    nextOrderNumber: Number(row?.next_order_number ?? 1001),
  };
}

async function resolveShipping({ subtotal, pincode, state, weightGrams, settings }) {
  let serviceable = true;
  let codAvailable = settings.codEnabled;
  let etaDays = null;
  let district = null;

  if (pincode) {
    const pin = await queryOne(
      "SELECT * FROM pincode_serviceability WHERE pincode = ?",
      [String(pincode)],
    );
    if (pin) {
      serviceable = Boolean(pin.is_serviceable);
      codAvailable = settings.codEnabled && Boolean(pin.cod_available);
      etaDays = Number(pin.eta_days);
      district = pin.district;
    }
  }

  const zones = await query(
    "SELECT * FROM shipping_zones WHERE is_active = 1 ORDER BY sort_order ASC",
  );
  let matched = null;
  for (const zone of zones) {
    const values = (fromJson(zone.values, []) || []).map((v) => String(v).toLowerCase().trim());
    if (zone.match_type === "rest") {
      matched = zone;
      break;
    }
    if (zone.match_type === "pincode" && pincode && values.includes(String(pincode))) {
      matched = zone;
      break;
    }
    if (zone.match_type === "state" && state && values.includes(String(state).toLowerCase())) {
      matched = zone;
      break;
    }
    if (zone.match_type === "district" && district && values.includes(String(district).toLowerCase())) {
      matched = zone;
      break;
    }
  }

  let total = settings.defaultShippingFee;
  let label = "Delivery";
  if (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove) total = 0;

  if (matched) {
    const method = await queryOne(
      "SELECT * FROM shipping_methods WHERE zone_id = ? AND is_active = 1 ORDER BY cost ASC LIMIT 1",
      [matched.id],
    );
    if (method) {
      label = method.name || label;
      if (method.type === "pickup") total = 0;
      else if (method.type === "weight_based") {
        total = Number((Number(method.per_kg_rate || 0) * (weightGrams / 1000)).toFixed(2));
      } else if (method.type === "free_above") {
        total = subtotal >= Number(method.free_above || 0) ? 0 : Number(method.cost || 0);
      } else {
        total = Number(method.cost || 0);
      }
      if (method.min_days && method.max_days && etaDays === null) {
        etaDays = Number(method.max_days);
      }
    }
  }

  return { shippingTotal: total, shippingLabel: label, serviceable, codAvailable, etaDays };
}

async function resolveCoupon({ code, subtotal, lines, customerId }) {
  if (!code) return { discountTotal: 0, couponCode: null, couponMessage: null, coupon: null, freeShipping: false };

  const coupon = await queryOne("SELECT * FROM coupons WHERE code = ?", [String(code).toUpperCase()]);
  const reject = (message) => ({
    discountTotal: 0,
    couponCode: null,
    couponMessage: message,
    coupon: null,
    freeShipping: false,
  });

  if (!coupon) return reject("That coupon code isn't recognised.");
  if (!coupon.is_active) return reject("That coupon is no longer active.");

  const nowMs = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > nowMs) {
    return reject("That coupon hasn't started yet.");
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < nowMs) {
    return reject("That coupon has expired.");
  }
  if (coupon.usage_limit !== null && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
    return reject("That coupon has been fully used.");
  }
  if (coupon.min_spend !== null && subtotal < Number(coupon.min_spend)) {
    return reject(`Spend ₹${Number(coupon.min_spend)} to use this coupon.`);
  }
  if (customerId && coupon.usage_limit_per_customer !== null) {
    const [{ used }] = await query(
      "SELECT COUNT(*) AS used FROM coupon_usages WHERE coupon_id = ? AND customer_id = ?",
      [coupon.id, customerId],
    );
    if (Number(used) >= Number(coupon.usage_limit_per_customer)) {
      return reject("You've already used that coupon.");
    }
  }
  if (coupon.first_order_only && customerId) {
    const [{ orders }] = await query(
      "SELECT COUNT(*) AS orders FROM orders WHERE customer_id = ?",
      [customerId],
    );
    if (Number(orders) > 0) return reject("That coupon is for first orders only.");
  }

  // Which lines the discount may apply to.
  const productIds = fromJson(coupon.product_ids, []) || [];
  const categoryIds = fromJson(coupon.category_ids, []) || [];
  const eligible = lines.filter((l) => {
    if (coupon.applies_to === "products") return productIds.includes(l.productId);
    if (coupon.applies_to === "categories") return categoryIds.includes(l.categoryId);
    return true;
  });
  const eligibleTotal = eligible.reduce((s, l) => s + l.lineTotal, 0);
  if (eligibleTotal <= 0) return reject("That coupon doesn't apply to anything in your cart.");

  let discount = 0;
  let freeShipping = false;
  if (coupon.type === "percent") discount = (eligibleTotal * Number(coupon.value)) / 100;
  else if (coupon.type === "fixed_cart") discount = Number(coupon.value);
  else if (coupon.type === "fixed_product") {
    discount = eligible.reduce((s, l) => s + Number(coupon.value) * l.quantity, 0);
  } else if (coupon.type === "free_shipping") freeShipping = true;

  if (coupon.max_discount !== null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(discount, eligibleTotal);

  return {
    discountTotal: Number(discount.toFixed(2)),
    couponCode: coupon.code,
    couponMessage: null,
    coupon,
    freeShipping,
  };
}

/** Prices are GST-inclusive, so tax is extracted rather than added. */
function extractTax(lines, discountTotal, subtotal) {
  if (subtotal <= 0) return 0;
  const ratio = (subtotal - discountTotal) / subtotal;
  const tax = lines.reduce((sum, l) => {
    const gross = l.lineTotal * ratio;
    const rate = l.gstRate;
    return sum + (rate > 0 ? gross - gross / (1 + rate / 100) : 0);
  }, 0);
  return Number(tax.toFixed(2));
}

export async function buildQuote(input, user) {
  const lines = await loadLines(input.items);
  const settings = await loadSettings();

  const itemsSubtotal = Number(lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const weightGrams = lines.reduce((s, l) => s + l.weightGrams * l.quantity, 0);

  const couponResult = await resolveCoupon({
    code: input.couponCode,
    subtotal: itemsSubtotal,
    lines,
    customerId: user?.id || null,
  });

  const shipping = await resolveShipping({
    subtotal: itemsSubtotal - couponResult.discountTotal,
    pincode: input.pincode,
    state: input.state,
    weightGrams,
    settings,
  });

  const shippingTotal = couponResult.freeShipping ? 0 : shipping.shippingTotal;
  const codFee =
    input.paymentMethod === "cod" && shipping.codAvailable ? Number(settings.codExtraFee || 0) : 0;
  const taxTotal = extractTax(lines, couponResult.discountTotal, itemsSubtotal);
  const grandTotal = Number(
    (itemsSubtotal - couponResult.discountTotal + shippingTotal + codFee).toFixed(2),
  );

  return {
    lines,
    itemsSubtotal,
    discountTotal: couponResult.discountTotal,
    couponCode: couponResult.couponCode,
    couponMessage: couponResult.couponMessage,
    couponId: couponResult.coupon?.id ?? null,
    shippingTotal,
    shippingLabel: shipping.shippingLabel,
    codFee,
    taxTotal,
    grandTotal,
    serviceable: shipping.serviceable,
    codAvailable: shipping.codAvailable && settings.codEnabled,
    etaDays: shipping.etaDays,
  };
}

/* ------------------------------------------------------------- placing them */

async function nextOrderNumber(conn) {
  const [rows] = await conn.execute(
    "SELECT order_prefix, next_order_number FROM settings WHERE id = 1 FOR UPDATE",
  );
  if (rows.length === 0) {
    await conn.execute(
      "INSERT INTO settings (id, order_prefix, next_order_number) VALUES (1, 'LG', 1002)",
    );
    return "LG1001";
  }
  const prefix = rows[0].order_prefix || "LG";
  const number = Number(rows[0].next_order_number || 1001);
  await conn.execute("UPDATE settings SET next_order_number = ? WHERE id = 1", [number + 1]);
  return `${prefix}${number}`;
}

export async function createOrder(input, user) {
  const quote = await buildQuote(input, user);
  if (!quote.serviceable) throw new HttpError(400, "We don't deliver to that pincode yet.");
  if (input.paymentMethod === "cod" && !quote.codAvailable) {
    throw new HttpError(400, "Cash on delivery isn't available for that pincode.");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orderNo = await nextOrderNumber(conn);
    const orderId = uuid();
    const phone = String(input.contactPhone || "").replace(/\D/g, "").slice(-10);

    await conn.execute(
      `INSERT INTO orders
        (id, order_no, customer_id, is_guest, contact_name, contact_phone, contact_email,
         shipping_address, billing_address, items_subtotal, discount_total, coupon_code,
         shipping_total, tax_total, grand_total, payment_method, payment_status, status, customer_note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderId,
        orderNo,
        user?.id || null,
        user ? 0 : 1,
        input.contactName || null,
        phone,
        input.contactEmail || null,
        toJson(input.shippingAddress || {}),
        toJson(input.billingAddress || input.shippingAddress || {}),
        quote.itemsSubtotal,
        quote.discountTotal,
        quote.couponCode,
        quote.shippingTotal + quote.codFee,
        quote.taxTotal,
        quote.grandTotal,
        input.paymentMethod === "razorpay" ? "razorpay" : input.paymentMethod === "upi" ? "upi" : "cod",
        "pending",
        "pending",
        input.customerNote || null,
      ],
    );

    for (const line of quote.lines) {
      await conn.execute(
        `INSERT INTO order_items
          (id, order_id, product_id, variation_id, product_name_snapshot, variation_label_snapshot,
           sku_snapshot, image_snapshot, quantity, unit_price, cost_price_snapshot, gst_rate, line_total)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uuid(),
          orderId,
          line.productId,
          line.variationId,
          line.productName,
          line.variationLabel,
          line.sku,
          line.image,
          line.quantity,
          line.unitPrice,
          line.costPrice,
          line.gstRate,
          line.lineTotal,
        ],
      );

      // Reserve the stock, through the ledger, in the same transaction.
      const [stockRows] = await conn.execute(
        "SELECT stock_quantity FROM variations WHERE id = ? FOR UPDATE",
        [line.variationId],
      );
      const balance = Number(stockRows[0].stock_quantity) - line.quantity;
      await conn.execute("UPDATE variations SET stock_quantity = ? WHERE id = ?", [
        balance,
        line.variationId,
      ]);
      await conn.execute(
        `INSERT INTO inventory_movements
           (id, variation_id, type, quantity, balance_after, reference_type, reference_id, note)
         VALUES (?,?, 'sale', ?, ?, 'order', ?, ?)`,
        [uuid(), line.variationId, -line.quantity, balance, orderId, `Order ${orderNo}`],
      );
    }

    if (quote.couponId) {
      await conn.execute("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [
        quote.couponId,
      ]);
      await conn.execute(
        "INSERT INTO coupon_usages (id, coupon_id, order_id, customer_id, amount) VALUES (?,?,?,?,?)",
        [uuid(), quote.couponId, orderId, user?.id || null, quote.discountTotal],
      );
    }

    await conn.execute(
      "INSERT INTO order_status_history (id, order_id, from_status, to_status) VALUES (?,?,NULL,'pending')",
      [uuid(), orderId],
    );

    await conn.commit();
    return { orderNo, grandTotal: quote.grandTotal, orderId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/* ------------------------------------------------------------------ lookups */

export async function lookupOrder(orderNo, phone) {
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);
  if (!orderNo || digits.length !== 10) return null;

  const order = await queryOne(
    "SELECT * FROM orders WHERE order_no = ? AND contact_phone = ?",
    [String(orderNo).toUpperCase(), digits],
  );
  if (!order) return null;

  const items = await query(
    `SELECT product_name_snapshot, variation_label_snapshot, quantity, unit_price, line_total
       FROM order_items WHERE order_id = ?`,
    [order.id],
  );
  const history = await query(
    "SELECT to_status, changed_at FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC",
    [order.id],
  );
  const address = fromJson(order.shipping_address, {}) || {};

  return {
    orderNo: order.order_no,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    placedAt: order.placed_at,
    grandTotal: Number(order.grand_total),
    courierName: order.courier_name,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    city: address.city || null,
    state: address.state || null,
    items,
    history,
  };
}
