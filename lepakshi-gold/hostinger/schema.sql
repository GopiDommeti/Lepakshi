-- Lepakshi Gold — Hostinger MySQL (u750189796_Lepakshi_gold)
-- User: u750189796_lepakshi_gold
-- Import in hPanel → Databases → phpMyAdmin.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  parent_id CHAR(36) DEFAULT NULL,
  name VARCHAR(160) NOT NULL,
  name_te VARCHAR(160) DEFAULT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  seo_title VARCHAR(180) DEFAULT NULL,
  seo_description VARCHAR(320) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_te VARCHAR(200) DEFAULT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  sku_base VARCHAR(80) DEFAULT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'variable',
  category_id CHAR(36) DEFAULT NULL,
  short_description TEXT,
  description MEDIUMTEXT,
  thumbnail_url TEXT,
  gallery JSON NOT NULL,
  gst_rate DECIMAL(8,2) NOT NULL DEFAULT 5,
  hsn_code VARCHAR(16) DEFAULT NULL,
  is_ganuga TINYINT(1) NOT NULL DEFAULT 1,
  extraction VARCHAR(80) DEFAULT NULL,
  shelf_life VARCHAR(80) DEFAULT NULL,
  ingredients TEXT,
  storage TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  seo_title VARCHAR(180) DEFAULT NULL,
  seo_description VARCHAR(320) DEFAULT NULL,
  upsell_ids JSON NOT NULL,
  crosssell_ids JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_products_category (category_id),
  KEY idx_products_status (status, is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS variations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  barcode VARCHAR(80) DEFAULT NULL,
  option_map JSON NOT NULL,
  label VARCHAR(80) DEFAULT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) DEFAULT NULL,
  sale_starts_at DATETIME(3) DEFAULT NULL,
  sale_ends_at DATETIME(3) DEFAULT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  weight_grams INT NOT NULL DEFAULT 0,
  length_cm DECIMAL(8,2) DEFAULT NULL,
  width_cm DECIMAL(8,2) DEFAULT NULL,
  height_cm DECIMAL(8,2) DEFAULT NULL,
  manage_stock TINYINT(1) NOT NULL DEFAULT 1,
  stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(12,3) NOT NULL DEFAULT 5,
  backorders VARCHAR(16) NOT NULL DEFAULT 'no',
  image_url TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_variations_product (product_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
  store_name VARCHAR(160) DEFAULT 'Lepakshi Gold',
  legal_name VARCHAR(200) DEFAULT 'Venkateshwara Oil Traders',
  tagline VARCHAR(240) DEFAULT 'Wood-pressed ganuga oils since 2003',
  address TEXT,
  phone VARCHAR(40) DEFAULT NULL,
  whatsapp VARCHAR(40) DEFAULT NULL,
  email VARCHAR(160) DEFAULT NULL,
  gstin VARCHAR(32) DEFAULT NULL,
  fssai_no VARCHAR(64) DEFAULT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  social_links JSON,
  seo_defaults JSON,
  order_prefix VARCHAR(12) DEFAULT 'LG',
  next_order_number INT NOT NULL DEFAULT 1,
  currency VARCHAR(8) DEFAULT 'INR',
  prices_include_tax TINYINT(1) DEFAULT 1,
  free_shipping_above DECIMAL(12,2) DEFAULT NULL,
  default_shipping_fee DECIMAL(12,2) DEFAULT 60,
  cod_enabled TINYINT(1) DEFAULT 1,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  question VARCHAR(400) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(80) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_blocks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(80) NOT NULL UNIQUE,
  data JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) NOT NULL PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  customer_id CHAR(36) DEFAULT NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(180) DEFAULT NULL,
  body TEXT,
  author_name VARCHAR(120) DEFAULT NULL,
  author_town VARCHAR(120) DEFAULT NULL,
  is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_reviews_product (product_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  email VARCHAR(160) DEFAULT NULL,
  type VARCHAR(40) DEFAULT NULL,
  message TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pincode_serviceability (
  id CHAR(36) NOT NULL PRIMARY KEY,
  pincode CHAR(6) NOT NULL UNIQUE,
  is_serviceable TINYINT(1) NOT NULL DEFAULT 1,
  cod_available TINYINT(1) NOT NULL DEFAULT 1,
  eta_days INT NOT NULL DEFAULT 4,
  city VARCHAR(80) DEFAULT NULL,
  district VARCHAR(80) DEFAULT NULL,
  state VARCHAR(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO settings (id, store_name, legal_name, tagline, social_links, seo_defaults)
VALUES (
  1,
  'Lepakshi Gold',
  'Venkateshwara Oil Traders',
  'Wood-pressed ganuga oils since 2003',
  JSON_OBJECT(),
  JSON_OBJECT(
    'title', 'Lepakshi Gold | Wood-pressed ganuga oils since 2003',
    'description', 'Buy wood-pressed groundnut, coconut, sesame and more from Venkateshwara Oil Traders, Andhra Pradesh. Cold crushed in a traditional ganuga. No solvents.'
  )
);

SET FOREIGN_KEY_CHECKS = 1;
