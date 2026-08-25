/**
 * Row shapes for the MySQL tables.
 *
 * Written by hand and kept in the same shape the screens already expect, so a
 * table is described in exactly one place. If you add a column in
 * database/schema.sql, add it here too.
 */

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;
type Id = string;
type Timestamp = string;

export type CategoryRow = {
  id: Id;
  parent_id: Id | null;
  name: string;
  name_te: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ProductRow = {
  id: Id;
  name: string;
  name_te: string | null;
  slug: string;
  sku_base: string | null;
  type: "simple" | "variable";
  category_id: Id | null;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  gallery: Json;
  gst_rate: number;
  hsn_code: string | null;
  is_organic: boolean;
  extraction: string | null;
  shelf_life: string | null;
  ingredients: string | null;
  storage: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  upsell_ids: Json;
  crosssell_ids: Json;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type VariationRow = {
  id: Id;
  product_id: Id;
  sku: string;
  barcode: string | null;
  label: string | null;
  option_map: Record<string, string> | null;
  price: number;
  sale_price: number | null;
  sale_starts_at: Timestamp | null;
  sale_ends_at: Timestamp | null;
  cost_price: number;
  weight_grams: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  manage_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  backorders: "no" | "notify" | "allow";
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Timestamp;
  updated_at: Timestamp;
};

/** What a shopper is allowed to see — cost price is stripped by the server. */
export type PublicVariationRow = Omit<VariationRow, "cost_price"> & { cost_price?: never };

export type OrderRow = {
  id: Id;
  order_no: string;
  customer_id: Id | null;
  is_guest: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  shipping_address: Json;
  billing_address: Json;
  items_subtotal: number;
  discount_total: number;
  coupon_code: string | null;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  payment_method: "cod" | "razorpay" | "upi" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  payment_ref: string | null;
  status:
    | "pending"
    | "processing"
    | "packed"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refunded"
    | "failed"
    | "on_hold";
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  customer_note: string | null;
  placed_at: Timestamp;
  updated_at: Timestamp;
};

export type OrderItemRow = {
  id: Id;
  order_id: Id;
  product_id: Id | null;
  variation_id: Id | null;
  product_name_snapshot: string | null;
  variation_label_snapshot: string | null;
  sku_snapshot: string | null;
  image_snapshot: string | null;
  quantity: number;
  unit_price: number;
  cost_price_snapshot: number;
  gst_rate: number;
  line_total: number;
};

export type Database = {
  public: {
    Tables: {
      categories: { Row: CategoryRow };
      tags: { Row: { id: Id; name: string; slug: string } };
      attributes: {
        Row: {
          id: Id;
          name: string;
          slug: string;
          display_type: "pills" | "dropdown" | "swatch";
          sort_order: number;
        };
      };
      attribute_terms: {
        Row: { id: Id; attribute_id: Id; name: string; slug: string; sort_order: number };
      };
      products: { Row: ProductRow };
      product_tags: { Row: { product_id: Id; tag_id: Id } };
      product_attributes: {
        Row: { product_id: Id; attribute_id: Id; used_for_variations: boolean; sort_order: number };
      };
      product_attribute_terms: { Row: { product_id: Id; attribute_id: Id; term_id: Id } };
      variations: { Row: VariationRow };
      inventory_movements: {
        Row: {
          id: Id;
          variation_id: Id;
          type:
            | "purchase"
            | "production"
            | "sale"
            | "return"
            | "damage"
            | "adjustment"
            | "cancellation";
          quantity: number;
          balance_after: number;
          reference_type: string | null;
          reference_id: Id | null;
          note: string | null;
          created_by: Id | null;
          created_at: Timestamp;
        };
      };
      addresses: {
        Row: {
          id: Id;
          customer_id: Id;
          type: "shipping" | "billing";
          label: string | null;
          full_name: string | null;
          phone: string | null;
          line1: string | null;
          line2: string | null;
          landmark: string | null;
          city: string | null;
          district: string | null;
          state: string | null;
          pincode: string | null;
          is_default: boolean;
          created_at: Timestamp;
        };
      };
      wishlists: { Row: { id: Id; customer_id: Id; product_id: Id; created_at: Timestamp } };
      profiles: {
        Row: {
          id: Id;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          created_at: Timestamp;
        };
      };
      orders: { Row: OrderRow };
      order_items: { Row: OrderItemRow };
      order_notes: {
        Row: {
          id: Id;
          order_id: Id;
          note: string;
          is_customer_visible: boolean;
          created_by: Id | null;
          created_at: Timestamp;
        };
      };
      order_status_history: {
        Row: {
          id: Id;
          order_id: Id;
          from_status: string | null;
          to_status: string;
          changed_by: Id | null;
          changed_at: Timestamp;
        };
      };
      refunds: {
        Row: {
          id: Id;
          order_id: Id;
          amount: number;
          reason: string | null;
          restock: boolean;
          refunded_by: Id | null;
          created_at: Timestamp;
        };
      };
      coupons: {
        Row: {
          id: Id;
          code: string;
          description: string | null;
          type: "percent" | "fixed_cart" | "fixed_product" | "free_shipping";
          value: number;
          min_spend: number | null;
          max_discount: number | null;
          usage_limit: number | null;
          usage_limit_per_customer: number | null;
          used_count: number;
          applies_to: "all" | "products" | "categories";
          product_ids: Json;
          category_ids: Json;
          excluded_ids: Json;
          first_order_only: boolean;
          starts_at: Timestamp | null;
          expires_at: Timestamp | null;
          is_active: boolean;
          created_at: Timestamp;
        };
      };
      coupon_usages: {
        Row: {
          id: Id;
          coupon_id: Id;
          order_id: Id | null;
          customer_id: Id | null;
          amount: number;
          used_at: Timestamp;
        };
      };
      shipping_zones: {
        Row: {
          id: Id;
          name: string;
          match_type: "pincode" | "district" | "state" | "rest";
          values: string[] | null;
          sort_order: number;
          is_active: boolean;
        };
      };
      shipping_methods: {
        Row: {
          id: Id;
          zone_id: Id;
          name: string;
          type: "flat" | "free_above" | "weight_based" | "pickup";
          cost: number;
          free_above: number | null;
          per_kg_rate: number | null;
          min_days: number | null;
          max_days: number | null;
          is_active: boolean;
        };
      };
      pincode_serviceability: {
        Row: {
          id: Id;
          pincode: string;
          city: string | null;
          district: string | null;
          state: string | null;
          is_serviceable: boolean;
          cod_available: boolean;
          eta_days: number;
        };
      };
      pages: {
        Row: {
          id: Id;
          slug: string;
          title: string;
          content: Json;
          seo_title: string | null;
          seo_description: string | null;
          is_published: boolean;
          updated_at: Timestamp;
        };
      };
      content_blocks: {
        Row: { id: Id; key: string; data: Json; is_active: boolean; sort_order: number };
      };
      banners: {
        Row: {
          id: Id;
          title: string | null;
          subtitle: string | null;
          image_url: string | null;
          mobile_image_url: string | null;
          link_url: string | null;
          placement: string | null;
          sort_order: number;
          starts_at: Timestamp | null;
          ends_at: Timestamp | null;
          is_active: boolean;
        };
      };
      reviews: {
        Row: {
          id: Id;
          product_id: Id;
          customer_id: Id | null;
          order_id: Id | null;
          rating: number;
          title: string | null;
          body: string | null;
          images: Json;
          author_name: string | null;
          author_town: string | null;
          is_verified_purchase: boolean;
          reply: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: Timestamp;
        };
      };
      faqs: {
        Row: {
          id: Id;
          question: string;
          answer: string;
          category: string | null;
          sort_order: number;
          is_active: boolean;
        };
      };
      enquiries: {
        Row: {
          id: Id;
          name: string;
          phone: string | null;
          email: string | null;
          type: string | null;
          message: string | null;
          created_at: Timestamp;
        };
      };
      media: {
        Row: {
          id: Id;
          url: string;
          filename: string | null;
          alt_text: string | null;
          folder: string | null;
          size_bytes: number | null;
          uploaded_by: Id | null;
          created_at: Timestamp;
        };
      };
      notifications_log: {
        Row: {
          id: Id;
          channel: "email" | "whatsapp" | "sms";
          template: string | null;
          recipient: string | null;
          order_id: Id | null;
          status: string | null;
          error: string | null;
          sent_at: Timestamp;
        };
      };
      settings: {
        Row: {
          id: number;
          store_name: string | null;
          legal_name: string | null;
          address: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          gstin: string | null;
          fssai_no: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          order_prefix: string | null;
          next_order_number: number | null;
          currency: string | null;
          prices_include_tax: boolean | null;
          free_shipping_above: number | null;
          default_shipping_fee: number | null;
          cod_enabled: boolean | null;
          cod_extra_fee: number | null;
          razorpay_enabled: boolean | null;
          low_stock_alert_email: string | null;
          order_email_recipients: Json;
          social_links: Json;
          seo_defaults: Json;
          maintenance_mode: boolean | null;
          updated_at: Timestamp;
        };
      };
      user_roles: {
        Row: {
          id: Id;
          user_id: Id;
          role: "owner" | "manager" | "staff";
          permissions: Json;
          is_active: boolean;
          created_at: Timestamp;
        };
      };
    };
    Views: {
      variations_public: { Row: PublicVariationRow };
    };
    Enums: {
      app_role: "owner" | "manager" | "staff";
      order_status: OrderRow["status"];
      payment_status: OrderRow["payment_status"];
      payment_method: OrderRow["payment_method"];
      movement_type: Database["public"]["Tables"]["inventory_movements"]["Row"]["type"];
      review_status: "pending" | "approved" | "rejected";
    };
  };
};
