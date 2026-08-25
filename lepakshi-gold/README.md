# Lepakshi Gold

Online store for **Venkateshwara Oil Traders** — certified organic, cold-pressed edible oils from Tanuku, Andhra Pradesh, pressing since 2003.

Split into two halves:

```
client/     the storefront and store admin  (React + Vite)
server/     the API and all business logic  (Express + MySQL)
database/   schema.sql — import this into Hostinger once
```

There is no Supabase anywhere. The database is your Hostinger MySQL database, and every rule about who can read or write what now lives in `server/`.

---

## 1. Import the database

hPanel → **Databases → phpMyAdmin** → pick `u750189796_Lepakshi_gold` → **Import** → choose `database/schema.sql` → Go.

Or from a terminal:

```bash
mysql -h HOST -u u750189796_lepakshi_gold -p u750189796_Lepakshi_gold < database/schema.sql
```

## 2. Point the server at it

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in the password from hPanel:

```
DB_HOST=localhost
DB_NAME=u750189796_Lepakshi_gold
DB_USER=u750189796_lepakshi_gold
DB_PASSWORD=your-database-password
SESSION_SECRET=any-long-random-string
```

**Running on your laptop against Hostinger's database?** `localhost` won't reach it. Go to hPanel → **Databases → Remote MySQL**, add your IP address (or `%` while you're testing), then set `DB_HOST` to the MySQL host shown there.

## 3. Install and start

From the project root:

```bash
npm run install:all
npm run seed          # loads the organic catalogue, pack sizes, FAQs, pincodes
npm run dev           # starts the API and the storefront together
```

| | |
|---|---|
| Storefront | http://localhost:5173 |
| API | http://localhost:4000 |
| Is the database connected? | http://localhost:4000/api/health |

Prefer two terminals? `npm run dev:server` and `npm run dev:client`.

## 4. Make yourself the owner

Open http://localhost:5173/auth and create an account. **The first account to register automatically becomes the owner**, which unlocks `/admin`, cost prices and the profit reports. Everyone who registers after that is an ordinary customer until you give them a role in Settings → Users.

---

## How the two halves talk

The browser never touches MySQL. It calls the API, and the API decides what it's allowed to see.

```
client  ──POST /api/query──▶  server/src/query.js
                                 ├─ is this table in the allowlist?      tables.js
                                 ├─ what role is this session?           auth.js
                                 ├─ build parameterised SQL              query.js
                                 └─ strip cost_price for non-owners
```

`client/src/lib/db.ts` gives the screens a familiar `db.from("products").select("*").eq(…)` builder, but it only ever produces a JSON description of the query. The SQL is written on the server, identifiers are checked against the real schema, and every value is a bound parameter — so a table name or column that isn't on the allowlist simply can't be reached from the browser.

**Roles**

| Role | Sees |
|---|---|
| `owner` | Everything: cost price, profit reports, settings, staff management |
| `manager` | Catalogue, orders, stock, coupons, customers, content — no cost price, no settings |
| `staff` | Orders and fulfilment |
| customer | Their own orders, addresses, wishlist and reviews |

Cost price is removed from the response for anyone below owner. It isn't hidden with CSS — it never leaves the server.

**Stock** only ever changes through `adjustStock()`, which writes the new balance and the ledger row in one transaction. That's why every number on the Stock screen can be explained.

**Pricing** is never trusted from the browser. `POST /api/orders/quote` re-reads prices, stock, coupon rules and shipping from the database on every keystroke at checkout, and `place` runs the whole order — stock, coupon usage, order number — inside a single transaction that rolls back completely if anything fails.

---

## The catalogue model

Pack sizes are **variations of one product**, the way WooCommerce does it:

```
Product: "Organic Groundnut Oil"
  └── Pack Size → 500 ml · 1 L · 2 L · 5 L · 15 L Tin
        └── each with its own SKU, barcode, price, cost and stock
```

In the admin: create the product, tick its pack sizes on the **Variations** tab, press **Generate variations**, set prices, publish.

---

## SEO

An ordinary single-page app is close to invisible to crawlers, so this does the work in two places:

- **`server/src/seo.js`** resolves the route on the server and bakes a real `<title>`, description, canonical, Open Graph, Twitter card and JSON-LD into the HTML *before* it's sent. Product pages get live `Product` schema with price range, stock status and aggregate rating; categories get `CollectionPage`; the home page gets `Organization` + `WebSite` + `FAQPage`. This is what Google and WhatsApp previews actually read. It runs whenever `client/dist` exists — i.e. after `npm run build`.
- **`client/src/lib/seo.tsx`** keeps the same tags correct while a visitor clicks around.

Also live: `/sitemap.xml` generated from published products and categories on every request, and `/robots.txt` that keeps `/admin`, `/account`, `/checkout` and `/cart` out of the index.

Worth doing before launch: set `SITE_URL` in `server/.env` to your real domain, fill in GSTIN and FSSAI (they print on invoices and feed the Organization schema), and add square product photography — the design leans on it and image search is a real source of traffic.

---

## Motion

`client/src/lib/motion.ts` and the `lg-*` classes at the bottom of `client/src/styles.css`:

- pointer-tracking 3D tilt on the hero bottle and category cards, with a highlight that follows the cursor
- layered depth (`lg-layer-1/2/3`) so labels and badges sit in front of the glass
- drifting aurora light, falling oil droplets, a looping name band, sheen sweeps, count-up numbers, scroll reveals

All of it is transform and opacity only, and **all of it stops** under `prefers-reduced-motion`. The bottle is SVG, not a photo, so it stays sharp and costs nothing to load.

---

## Going live on Hostinger

```bash
npm run build         # builds client/dist
cd server && npm start
```

When `client/dist` exists the API serves the built site itself, with SEO tags injected per route — so one Node process runs everything on port 4000. Put it behind your domain and set `NODE_ENV=production`, `SITE_URL=https://yourdomain.com` and a real `SESSION_SECRET`.

**One thing to check:** this needs Node.js. Hostinger's shared/Premium plans run PHP only — Node apps need a VPS or a plan with Node.js support. Your MySQL database works either way; it's the API that needs somewhere to run.

## Scripts

| Command | Does |
|---|---|
| `npm run install:all` | Installs both halves |
| `npm run dev` | API + storefront together |
| `npm run seed` | Loads the starting catalogue |
| `npm run build` | Builds the storefront |
| `npm start` | Production server |

## Troubleshooting

**"Can't reach the server"** — the API isn't running. `npm run dev:server`.

**"Could not reach MySQL"** — check `server/.env`. From a laptop, add your IP under Remote MySQL first.

**`/admin` says "Staff access only"** — that account has no role. The first registered account gets `owner`; add roles for others in Settings → Users.

**Home page is empty** — run `npm run seed`.

**Prices look wrong** — they're stored GST-inclusive (normal Indian retail). Tax is extracted at checkout and split CGST/SGST on the invoice.
