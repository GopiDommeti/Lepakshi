export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string | null
          created_at: string
          customer_id: string
          district: string | null
          full_name: string | null
          id: string
          is_default: boolean
          label: string | null
          landmark: string | null
          line1: string | null
          line2: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          type: Database["public"]["Enums"]["address_type"]
        }
        Insert: {
          city?: string | null
          created_at?: string
          customer_id: string
          district?: string | null
          full_name?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          line1?: string | null
          line2?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["address_type"]
        }
        Update: {
          city?: string | null
          created_at?: string
          customer_id?: string
          district?: string | null
          full_name?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          line1?: string | null
          line2?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["address_type"]
        }
        Relationships: []
      }
      attribute_terms: {
        Row: {
          attribute_id: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          attribute_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          attribute_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "attribute_terms_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          display_type: Database["public"]["Enums"]["attr_display"]
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          display_type?: Database["public"]["Enums"]["attr_display"]
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          display_type?: Database["public"]["Enums"]["attr_display"]
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      banners: {
        Row: {
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          mobile_image_url: string | null
          placement: string | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          placement?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          placement?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_te: string | null
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_te?: string | null
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_te?: string | null
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          data: Json
          id: string
          is_active: boolean
          key: string
          sort_order: number
        }
        Insert: {
          data?: Json
          id?: string
          is_active?: boolean
          key: string
          sort_order?: number
        }
        Update: {
          data?: Json
          id?: string
          is_active?: boolean
          key?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          amount: number
          coupon_id: string
          customer_id: string | null
          id: string
          order_id: string | null
          used_at: string
        }
        Insert: {
          amount?: number
          coupon_id: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Update: {
          amount?: number
          coupon_id?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: Database["public"]["Enums"]["coupon_applies"]
          category_ids: string[]
          code: string
          created_at: string
          description: string | null
          excluded_ids: string[]
          expires_at: string | null
          first_order_only: boolean
          id: string
          is_active: boolean
          max_discount: number | null
          min_spend: number | null
          product_ids: string[]
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          usage_limit: number | null
          usage_limit_per_customer: number | null
          used_count: number
          value: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["coupon_applies"]
          category_ids?: string[]
          code: string
          created_at?: string
          description?: string | null
          excluded_ids?: string[]
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_spend?: number | null
          product_ids?: string[]
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number
          value?: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["coupon_applies"]
          category_ids?: string[]
          code?: string
          created_at?: string
          description?: string | null
          excluded_ids?: string[]
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_spend?: number | null
          product_ids?: string[]
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          type?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          category?: string | null
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          category?: string | null
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["movement_type"]
          variation_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["movement_type"]
          variation_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string | null
          folder: string | null
          id: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename?: string | null
          folder?: string | null
          id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string | null
          folder?: string | null
          id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: Database["public"]["Enums"]["notify_channel"]
          error: string | null
          id: string
          order_id: string | null
          recipient: string | null
          sent_at: string
          status: string | null
          template: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["notify_channel"]
          error?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          sent_at?: string
          status?: string | null
          template?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["notify_channel"]
          error?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          sent_at?: string
          status?: string | null
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          cost_price_snapshot: number
          gst_rate: number
          id: string
          image_snapshot: string | null
          line_total: number
          order_id: string
          product_id: string | null
          product_name_snapshot: string | null
          quantity: number
          sku_snapshot: string | null
          unit_price: number
          variation_id: string | null
          variation_label_snapshot: string | null
        }
        Insert: {
          cost_price_snapshot?: number
          gst_rate?: number
          id?: string
          image_snapshot?: string | null
          line_total?: number
          order_id: string
          product_id?: string | null
          product_name_snapshot?: string | null
          quantity?: number
          sku_snapshot?: string | null
          unit_price?: number
          variation_id?: string | null
          variation_label_snapshot?: string | null
        }
        Update: {
          cost_price_snapshot?: number
          gst_rate?: number
          id?: string
          image_snapshot?: string | null
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string | null
          quantity?: number
          sku_snapshot?: string | null
          unit_price?: number
          variation_id?: string | null
          variation_label_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_customer_visible: boolean
          note: string
          order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_customer_visible?: boolean
          note: string
          order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_customer_visible?: boolean
          note?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          coupon_code: string | null
          courier_name: string | null
          customer_id: string | null
          customer_note: string | null
          discount_total: number
          grand_total: number
          id: string
          is_guest: boolean
          items_subtotal: number
          order_no: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string
          shipping_address: Json | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          tax_total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          customer_id?: string | null
          customer_note?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          is_guest?: boolean
          items_subtotal?: number
          order_no: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_address?: Json | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          tax_total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          customer_id?: string | null
          customer_note?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          is_guest?: boolean
          items_subtotal?: number
          order_no?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_address?: Json | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          tax_total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json
          id: string
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pincode_serviceability: {
        Row: {
          city: string | null
          cod_available: boolean
          district: string | null
          eta_days: number
          id: string
          is_serviceable: boolean
          pincode: string
          state: string | null
        }
        Insert: {
          city?: string | null
          cod_available?: boolean
          district?: string | null
          eta_days?: number
          id?: string
          is_serviceable?: boolean
          pincode: string
          state?: string | null
        }
        Update: {
          city?: string | null
          cod_available?: boolean
          district?: string | null
          eta_days?: number
          id?: string
          is_serviceable?: boolean
          pincode?: string
          state?: string | null
        }
        Relationships: []
      }
      product_attribute_terms: {
        Row: {
          attribute_id: string
          product_id: string
          term_id: string
        }
        Insert: {
          attribute_id: string
          product_id: string
          term_id: string
        }
        Update: {
          attribute_id?: string
          product_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_terms_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_terms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "attribute_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_id: string
          product_id: string
          sort_order: number
          used_for_variations: boolean
        }
        Insert: {
          attribute_id: string
          product_id: string
          sort_order?: number
          used_for_variations?: boolean
        }
        Update: {
          attribute_id?: string
          product_id?: string
          sort_order?: number
          used_for_variations?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          crosssell_ids: string[]
          description: string | null
          extraction: string | null
          gallery: Json
          gst_rate: number
          hsn_code: string | null
          id: string
          ingredients: string | null
          is_featured: boolean
          is_ganuga: boolean
          name: string
          name_te: string | null
          seo_description: string | null
          seo_title: string | null
          shelf_life: string | null
          short_description: string | null
          sku_base: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          storage: string | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
          upsell_ids: string[]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          crosssell_ids?: string[]
          description?: string | null
          extraction?: string | null
          gallery?: Json
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          ingredients?: string | null
          is_featured?: boolean
          is_ganuga?: boolean
          name: string
          name_te?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shelf_life?: string | null
          short_description?: string | null
          sku_base?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          storage?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          upsell_ids?: string[]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          crosssell_ids?: string[]
          description?: string | null
          extraction?: string | null
          gallery?: Json
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          ingredients?: string | null
          is_featured?: boolean
          is_ganuga?: boolean
          name?: string
          name_te?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shelf_life?: string | null
          short_description?: string | null
          sku_base?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          storage?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          upsell_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          reason: string | null
          refunded_by: string | null
          restock: boolean
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          reason?: string | null
          refunded_by?: string | null
          restock?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          reason?: string | null
          refunded_by?: string | null
          restock?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string | null
          author_town: string | null
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          images: Json
          is_verified_purchase: boolean
          order_id: string | null
          product_id: string
          rating: number
          reply: string | null
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
        }
        Insert: {
          author_name?: string | null
          author_town?: string | null
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          images?: Json
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          reply?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
        }
        Update: {
          author_name?: string | null
          author_town?: string | null
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          images?: Json
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          reply?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          cod_enabled: boolean | null
          cod_extra_fee: number | null
          currency: string | null
          default_shipping_fee: number | null
          email: string | null
          favicon_url: string | null
          free_shipping_above: number | null
          fssai_no: string | null
          gstin: string | null
          id: boolean
          legal_name: string | null
          logo_url: string | null
          low_stock_alert_email: string | null
          maintenance_mode: boolean | null
          next_order_number: number | null
          order_email_recipients: string[] | null
          order_prefix: string | null
          phone: string | null
          prices_include_tax: boolean | null
          razorpay_enabled: boolean | null
          seo_defaults: Json | null
          social_links: Json | null
          store_name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cod_enabled?: boolean | null
          cod_extra_fee?: number | null
          currency?: string | null
          default_shipping_fee?: number | null
          email?: string | null
          favicon_url?: string | null
          free_shipping_above?: number | null
          fssai_no?: string | null
          gstin?: string | null
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          low_stock_alert_email?: string | null
          maintenance_mode?: boolean | null
          next_order_number?: number | null
          order_email_recipients?: string[] | null
          order_prefix?: string | null
          phone?: string | null
          prices_include_tax?: boolean | null
          razorpay_enabled?: boolean | null
          seo_defaults?: Json | null
          social_links?: Json | null
          store_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cod_enabled?: boolean | null
          cod_extra_fee?: number | null
          currency?: string | null
          default_shipping_fee?: number | null
          email?: string | null
          favicon_url?: string | null
          free_shipping_above?: number | null
          fssai_no?: string | null
          gstin?: string | null
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          low_stock_alert_email?: string | null
          maintenance_mode?: boolean | null
          next_order_number?: number | null
          order_email_recipients?: string[] | null
          order_prefix?: string | null
          phone?: string | null
          prices_include_tax?: boolean | null
          razorpay_enabled?: boolean | null
          seo_defaults?: Json | null
          social_links?: Json | null
          store_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          cost: number
          free_above: number | null
          id: string
          is_active: boolean
          max_days: number | null
          min_days: number | null
          name: string
          per_kg_rate: number | null
          type: Database["public"]["Enums"]["shipping_method_type"]
          zone_id: string
        }
        Insert: {
          cost?: number
          free_above?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name: string
          per_kg_rate?: number | null
          type?: Database["public"]["Enums"]["shipping_method_type"]
          zone_id: string
        }
        Update: {
          cost?: number
          free_above?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name?: string
          per_kg_rate?: number | null
          type?: Database["public"]["Enums"]["shipping_method_type"]
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_methods_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          id: string
          is_active: boolean
          match_type: Database["public"]["Enums"]["zone_match"]
          name: string
          sort_order: number
          values: string[]
        }
        Insert: {
          id?: string
          is_active?: boolean
          match_type?: Database["public"]["Enums"]["zone_match"]
          name: string
          sort_order?: number
          values?: string[]
        }
        Update: {
          id?: string
          is_active?: boolean
          match_type?: Database["public"]["Enums"]["zone_match"]
          name?: string
          sort_order?: number
          values?: string[]
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variations: {
        Row: {
          backorders: Database["public"]["Enums"]["backorder_mode"]
          barcode: string | null
          cost_price: number
          created_at: string
          height_cm: number | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string | null
          length_cm: number | null
          low_stock_threshold: number
          manage_stock: boolean
          option_map: Json
          price: number
          product_id: string
          sale_ends_at: string | null
          sale_price: number | null
          sale_starts_at: string | null
          sku: string
          sort_order: number
          stock_quantity: number
          updated_at: string
          weight_grams: number
          width_cm: number | null
        }
        Insert: {
          backorders?: Database["public"]["Enums"]["backorder_mode"]
          barcode?: string | null
          cost_price?: number
          created_at?: string
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string | null
          length_cm?: number | null
          low_stock_threshold?: number
          manage_stock?: boolean
          option_map?: Json
          price?: number
          product_id: string
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          sku: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number
          width_cm?: number | null
        }
        Update: {
          backorders?: Database["public"]["Enums"]["backorder_mode"]
          barcode?: string | null
          cost_price?: number
          created_at?: string
          height_cm?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string | null
          length_cm?: number | null
          low_stock_threshold?: number
          manage_stock?: boolean
          option_map?: Json
          price?: number
          product_id?: string
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          sku?: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      variations_public: {
        Row: {
          backorders: Database["public"]["Enums"]["backorder_mode"] | null
          barcode: string | null
          created_at: string | null
          height_cm: number | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          label: string | null
          length_cm: number | null
          low_stock_threshold: number | null
          manage_stock: boolean | null
          option_map: Json | null
          price: number | null
          product_id: string | null
          sale_ends_at: string | null
          sale_price: number | null
          sale_starts_at: string | null
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string | null
          weight_grams: number | null
          width_cm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_stock: {
        Args: {
          _note?: string
          _qty: number
          _reference_id?: string
          _reference_type?: string
          _type: Database["public"]["Enums"]["movement_type"]
          _variation_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      address_type: "shipping" | "billing"
      app_role: "owner" | "manager" | "staff"
      attr_display: "pills" | "dropdown" | "swatch"
      backorder_mode: "no" | "notify" | "allow"
      coupon_applies: "all" | "products" | "categories"
      coupon_type: "percent" | "fixed_cart" | "fixed_product" | "free_shipping"
      movement_type:
        | "purchase"
        | "production"
        | "sale"
        | "return"
        | "damage"
        | "adjustment"
        | "cancellation"
      notify_channel: "email" | "whatsapp" | "sms"
      order_status:
        | "pending"
        | "processing"
        | "packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "failed"
        | "on_hold"
      payment_method: "cod" | "razorpay" | "upi" | "bank_transfer"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      product_status: "draft" | "published" | "archived"
      product_type: "simple" | "variable"
      review_status: "pending" | "approved" | "rejected"
      shipping_method_type: "flat" | "free_above" | "weight_based" | "pickup"
      zone_match: "pincode" | "district" | "state" | "rest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_type: ["shipping", "billing"],
      app_role: ["owner", "manager", "staff"],
      attr_display: ["pills", "dropdown", "swatch"],
      backorder_mode: ["no", "notify", "allow"],
      coupon_applies: ["all", "products", "categories"],
      coupon_type: ["percent", "fixed_cart", "fixed_product", "free_shipping"],
      movement_type: [
        "purchase",
        "production",
        "sale",
        "return",
        "damage",
        "adjustment",
        "cancellation",
      ],
      notify_channel: ["email", "whatsapp", "sms"],
      order_status: [
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
      ],
      payment_method: ["cod", "razorpay", "upi", "bank_transfer"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      product_status: ["draft", "published", "archived"],
      product_type: ["simple", "variable"],
      review_status: ["pending", "approved", "rejected"],
      shipping_method_type: ["flat", "free_above", "weight_based", "pickup"],
      zone_match: ["pincode", "district", "state", "rest"],
    },
  },
} as const
