# Lepakshi Gold

The online store for **Venkateshwara Oil Traders** (Tanuku, West Godavari, Andhra Pradesh) — wood-pressed ganuga edible oils, pressed since 2003.

This is a full WooCommerce-equivalent platform: a premium storefront, a complete store backend, and a customer account area.

---

## What's in here

| Area | Path | What it does |
|---|---|---|
| Storefront | `/` | Home, shop, category pages, product pages with pack-size variations, cart, checkout, order tracking, about, contact, policy pages |
| Store admin | `/admin` | Dashboard, orders, products, categories, attributes, stock, customers, reviews, coupons, shipping, tax, content, media, reports, settings |
| Account | `/account` | Orders with reorder, addresses, wishlist, reviews, profile |

### The catalogue model

Pack sizes are **variations of one product**, not separate products — the WooCommerce model.

```
Product: "Groundnut Ganuga Oil"
  └── Pack Size attribute → 500 ml · 1 L · 2 L · 5 L · 15 L Tin
        └── Variation rows, each with its own SKU, barcode,
            price, sale price, cost price, weight and STOCK
```

Stock lives on the **variation**, never on the product.

### The stock rule

Stock changes only through the Postgres function `adjust_stock(variation_id, type, qty, ref_type, ref_id, note)`, which updates the balance and writes an `inventory_movements` row in the same transaction. No client code writes `stock_quantity` directly — that's why the Stock screen has a full audit ledger and the numbers can always be explained.

### Roles

| Role | Can see |
|---|---|
| `owner` | Everything, including cost price, profit reports and settings |
| `manager` | Catalogue, orders, stock, coupons, customers, content — no cost price, no settings |
| `staff` | Orders and fulfilment |
| customer | Their own account |

Enforced by RLS in the database, not just hidden in the UI.

---

## Running it locally

You need Node.js 20+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
npm install
npm run dev
```

The dev server prints its URL (Lovable's config uses port **8080**).

`.env` already holds the Supabase project URL and publishable key. For server functions that place orders you also need a **service role key**, which is never committed:

```
SUPABASE_SERVICE_ROLE_KEY="..."
```

Add it in Lovable Cloud, or in `.env` locally. Without it, browsing works but checkout will fail.

## Scripts

```sh
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview the build
npm run lint     # eslint
npm run format   # prettier
```

## Stack

TanStack Start + TanStack Router (file-based routes, `src/routeTree.gen.ts` is generated — don't edit it) · React 19 · Vite · Tailwind v4 · shadcn/ui · TanStack Query · Recharts · Supabase (Postgres, Auth, Storage, RLS).

## Layout

```
src/
  routes/                    file-based routes
    _authenticated/admin/    the store backend
    _authenticated/account/  customer account
  components/
    admin/                   AdminLayout + shared admin primitives (ui.tsx)
    storefront/              StoreLayout, CartDrawer, ProductCard, AccountLayout
  lib/
    admin.ts                 admin queries and row types
    catalog.ts               public catalogue queries
    orders.server.ts         pricing, coupons, shipping, tax
    orders.server.place.ts   order creation and guest lookup
    orders.functions.ts      quoteOrder / placeOrder / trackOrder server functions
supabase/migrations/         schema, RLS and adjust_stock()
```

---

## First-run checklist

1. Add a row to `user_roles` with your user id and role `owner` — otherwise `/admin` stays locked.
2. **Attributes** → create `Pack Size` with terms 500 ml, 1 L, 2 L, 5 L, 15 L Tin.
3. **Categories** → add your oil types, each with a square image.
4. **Products** → create an oil, tick its pack sizes, press *Generate variations*, set prices and cost, publish.
5. **Shipping** → one "Rest of India" zone with a rate, plus your serviceable pincodes.
6. **Settings** → store name, address, phone, WhatsApp, GSTIN, FSSAI, order prefix.
7. Create a public Storage bucket named `media` if you want to upload photos in-app rather than pasting URLs.

## Before going live

- FSSAI number and GSTIN filled in (they print on the invoice).
- A real serviceable-pincode list — Shiprocket or Delhivery will export one as CSV.
- Product photography: square crop, plain cream background. The whole design leans on it.
- Cost price filled in per variation — every profit report depends on it.
- Razorpay account and keys if you want online payment; COD and UPI work without it.

## Notes

Prices are stored **inclusive of GST** (normal Indian retail practice). The tax component is extracted at checkout and split into CGST/SGST on the invoice.

Online stock is a **separate ledger** from any counter-billing system added later. Nothing here assumes the two are connected.
