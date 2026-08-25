/**
 * Table registry.
 *
 * The browser can only touch tables listed here, only with the access level
 * given, and only through columns that exist. Anything else is refused before
 * a single line of SQL is built. Cost prices and profit never leave the server
 * for anyone below owner.
 *
 *   read/write: "public" | "self" | "staff" | "owner" | "none"
 *   self       — rows belonging to the signed-in user, matched on selfColumn
 *   publicWhere— extra condition forced onto anonymous/customer reads
 */

const OWNER_MONEY = ["cost_price"];

export const TABLES = {
  categories: {
    read: "public",
    write: "staff",
    bool: ["is_active"],
    publicWhere: "is_active = 1",
  },
  attributes: { read: "public", write: "staff" },
  attribute_terms: { read: "public", write: "staff" },
  tags: { read: "public", write: "staff" },

  products: {
    read: "public",
    write: "staff",
    json: ["gallery", "upsell_ids", "crosssell_ids"],
    bool: ["is_organic", "is_featured"],
    publicWhere: "status = 'published'",
  },
  product_attributes: { read: "public", write: "staff", bool: ["used_for_variations"] },
  product_attribute_terms: { read: "public", write: "staff" },

  variations: {
    read: "public",
    write: "staff",
    json: ["option_map"],
    bool: ["manage_stock", "is_active"],
    ownerColumns: OWNER_MONEY,
    publicWhere: "is_active = 1",
  },

  inventory_movements: { read: "staff", write: "none" },

  addresses: { read: "self", write: "self", selfColumn: "customer_id", bool: ["is_default"] },
  wishlists: { read: "self", write: "self", selfColumn: "customer_id" },
  profiles: { read: "self", write: "self", selfColumn: "id" },

  orders: {
    read: "self",
    write: "staff",
    selfColumn: "customer_id",
    json: ["shipping_address", "billing_address"],
    bool: ["is_guest"],
    ownerColumns: [],
  },
  order_items: {
    read: "staff",
    write: "none",
    ownerColumns: ["cost_price_snapshot"],
  },
  order_notes: { read: "staff", write: "staff", bool: ["is_customer_visible"] },
  order_status_history: { read: "staff", write: "staff" },
  refunds: { read: "staff", write: "owner", bool: ["restock"] },

  coupons: {
    read: "staff",
    write: "staff",
    json: ["product_ids", "category_ids", "excluded_ids"],
    bool: ["first_order_only", "is_active"],
  },
  coupon_usages: { read: "staff", write: "none" },

  shipping_zones: { read: "public", write: "staff", json: ["values"], bool: ["is_active"] },
  shipping_methods: { read: "public", write: "staff", bool: ["is_active"] },
  pincode_serviceability: {
    read: "public",
    write: "staff",
    bool: ["is_serviceable", "cod_available"],
  },

  pages: { read: "public", write: "staff", json: ["content"], bool: ["is_published"] },
  content_blocks: { read: "public", write: "staff", json: ["data"], bool: ["is_active"] },
  banners: { read: "public", write: "staff", bool: ["is_active"], publicWhere: "is_active = 1" },
  faqs: { read: "public", write: "staff", bool: ["is_active"], publicWhere: "is_active = 1" },

  reviews: {
    read: "public",
    write: "self",
    selfColumn: "customer_id",
    json: ["images"],
    bool: ["is_verified_purchase"],
    publicWhere: "status = 'approved'",
  },

  enquiries: { read: "staff", write: "anon" },
  media: { read: "staff", write: "staff" },
  notifications_log: { read: "staff", write: "none" },

  settings: {
    read: "public",
    write: "owner",
    json: ["order_email_recipients", "social_links", "seo_defaults"],
    bool: ["prices_include_tax", "cod_enabled", "razorpay_enabled", "maintenance_mode"],
    // Anonymous visitors only need what the footer and checkout show.
    publicColumns: [
      "id",
      "store_name",
      "legal_name",
      "address",
      "phone",
      "whatsapp",
      "email",
      "gstin",
      "fssai_no",
      "logo_url",
      "favicon_url",
      "currency",
      "prices_include_tax",
      "free_shipping_above",
      "default_shipping_fee",
      "cod_enabled",
      "razorpay_enabled",
      "social_links",
      "seo_defaults",
      "maintenance_mode",
    ],
  },

  user_roles: { read: "owner", write: "owner", bool: ["is_active"] },
};

export function tableConfig(name) {
  return Object.prototype.hasOwnProperty.call(TABLES, name) ? TABLES[name] : null;
}
