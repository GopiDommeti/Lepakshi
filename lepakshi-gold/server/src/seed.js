/**
 * Fills an empty database with the starting catalogue.
 * Safe to run more than once — it skips anything already there.
 *
 *   cd server && npm run seed
 */
import dotenv from "dotenv";

import { pool, query, queryOne } from "./db.js";
import { toJson, uuid } from "./util.js";

dotenv.config();

const CATEGORIES = [
  ["Groundnut Oil", "వేరుశనగ నూనె", "groundnut", "Deep, nutty and golden. The everyday oil of coastal Andhra kitchens."],
  ["Coconut Oil", "కొబ్బరి నూనె", "coconut", "Cold-pressed from sun-dried copra. Sweet, clean and solid in winter."],
  ["Sesame Oil", "నువ్వుల నూnne", "sesame", "Dark, aromatic and unmistakable. A spoonful changes a whole dish."],
  ["Sunflower Oil", "పొద్దుతిరుగుడు నూనె", "sunflower", "Light and neutral. The easiest oil to cook with every day."],
  ["Safflower Oil", "కుసుమ నూనె", "safflower", "Delicate and pale, traditionally pressed for lighter cooking."],
  ["Mustard Oil", "ఆవ నూనె", "mustard", "Sharp and pungent, the way pickles and North Indian cooking want it."],
  ["Rice Bran Oil", "రైస్ బ్రాన్ నూనె", "rice-bran", "High smoke point, mild flavour. Good for frying without fuss."],
  ["Castor & Speciality", "ఆముదం", "speciality", "Smaller-batch pressings for specific uses."],
];

const PACK_SIZES = ["500 ml", "1 L", "2 L", "5 L", "15 L Tin"];

const PRODUCTS = [
  {
    name: "Organic Groundnut Oil",
    nameTe: "సేంద్రియ వేరుశనగ నూనె",
    slug: "organic-groundnut-oil",
    category: "groundnut",
    sku: "ORG-GN",
    short: "Cold-pressed from organically grown groundnuts. Deep, nutty and unrefined.",
    description:
      "Pressed slowly from certified organic groundnuts grown by farmers we buy from year after year. Nothing is heated, nothing is bleached and nothing is added, so the oil keeps the colour and aroma of the seed it came from. Natural sediment at the bottom of the bottle is normal.",
    hsn: "1508",
    prices: { "500 ml": 210, "1 L": 395, "2 L": 760, "5 L": 1850, "15 L Tin": 5400 },
    cost: { "500 ml": 148, "1 L": 278, "2 L": 540, "5 L": 1320, "15 L Tin": 3900 },
    featured: true,
  },
  {
    name: "Organic Coconut Oil",
    nameTe: "సేంద్రియ కొబ్బరి నూనె",
    slug: "organic-coconut-oil",
    category: "coconut",
    sku: "ORG-CO",
    short: "Cold-pressed organic copra. Sweet, clean and good for cooking or hair.",
    description:
      "Sun-dried organic copra, pressed cold and filtered through cloth. It sets solid below about 24°C, which is exactly what unrefined coconut oil should do — stand the bottle in warm water and it clears again.",
    hsn: "1513",
    prices: { "500 ml": 260, "1 L": 495, "2 L": 950, "5 L": 2300, "15 L Tin": 6700 },
    cost: { "500 ml": 182, "1 L": 348, "2 L": 670, "5 L": 1640, "15 L Tin": 4800 },
    featured: true,
  },
  {
    name: "Organic Sesame Oil",
    nameTe: "సేంద్రియ నువ్వుల నూనె",
    slug: "organic-sesame-oil",
    category: "sesame",
    sku: "ORG-SE",
    short: "Dark, aromatic and cold-pressed from organic sesame seed.",
    description:
      "Made from organic sesame, pressed cold so the aroma survives. Strong enough that a single spoon carries a dish — traditional in pickles, podis and temple cooking.",
    hsn: "1515",
    prices: { "500 ml": 320, "1 L": 610, "2 L": 1180, "5 L": 2850, "15 L Tin": 8300 },
    cost: { "500 ml": 224, "1 L": 430, "2 L": 830, "5 L": 2010, "15 L Tin": 5900 },
    featured: true,
  },
  {
    name: "Organic Sunflower Oil",
    nameTe: "సేంద్రియ పొద్దుతిరుగుడు నూనె",
    slug: "organic-sunflower-oil",
    category: "sunflower",
    sku: "ORG-SU",
    short: "Light, neutral and cold-pressed. The everyday organic option.",
    description:
      "A mild organic oil for daily cooking, pressed cold and filtered rather than refined. Lighter in flavour than groundnut, so it stays out of the way of your spices.",
    hsn: "1512",
    prices: { "500 ml": 185, "1 L": 350, "2 L": 680, "5 L": 1650, "15 L Tin": 4800 },
    cost: { "500 ml": 130, "1 L": 247, "2 L": 480, "5 L": 1170, "15 L Tin": 3450 },
    featured: true,
  },
  {
    name: "Organic Mustard Oil",
    nameTe: "సేంద్రియ ఆవ నూనె",
    slug: "organic-mustard-oil",
    category: "mustard",
    sku: "ORG-MU",
    short: "Sharp and pungent, cold-pressed from organic mustard seed.",
    description:
      "Kachi ghani style — pressed cold so the pungency stays. This is the oil pickles want, and the one North Indian cooking is built around.",
    hsn: "1514",
    prices: { "500 ml": 195, "1 L": 370, "2 L": 720, "5 L": 1750 },
    cost: { "500 ml": 137, "1 L": 260, "2 L": 505, "5 L": 1240 },
    featured: false,
  },
  {
    name: "Organic Safflower Oil",
    nameTe: "సేంద్రియ కుసుమ నూనె",
    slug: "organic-safflower-oil",
    category: "safflower",
    sku: "ORG-SA",
    short: "Pale and delicate, pressed in smaller batches.",
    description:
      "Kusuma oil, pressed cold from organic safflower. Light and clean, traditionally used where a heavier oil would overwhelm the food.",
    hsn: "1512",
    prices: { "500 ml": 240, "1 L": 455, "2 L": 880 },
    cost: { "500 ml": 168, "1 L": 320, "2 L": 620 },
    featured: false,
  },
];

const FAQS = [
  [
    "What makes your oil organic?",
    "The seed comes from farms growing without synthetic pesticides or fertilisers, and we press and pack it separately from anything conventional so nothing gets mixed along the way.",
  ],
  [
    "Why does cold-pressed oil cost more than refined oil?",
    "Cold pressing yields far less oil from the same weight of seed, and organic seed costs more to grow. Refining exists to squeeze out every last drop cheaply — that is the whole difference in price.",
  ],
  [
    "There is sediment at the bottom of my bottle. Is it spoiled?",
    "No. Unrefined oil is filtered through cloth, not chemically stripped, so a little settles over time. Shake it gently or let it be — it is a sign the oil was not over-processed.",
  ],
  [
    "My coconut oil has gone solid.",
    "Pure coconut oil solidifies below roughly 24°C. Stand the bottle in warm water for a few minutes and it turns clear again. It does not affect quality at all.",
  ],
  [
    "How long does the oil keep?",
    "Six months from the packing date printed on the bottle. Keep it in a cool, dark cupboard and away from the stove.",
  ],
  [
    "Do you deliver across India?",
    "Yes. Two to four days within Andhra Pradesh and Telangana, four to seven days elsewhere. You can check your exact pincode on any product page.",
  ],
  [
    "Can I buy in bulk for my shop or restaurant?",
    "Yes — 15 L tins and wholesale rates are available. Call us or send a wholesale enquiry from the contact page.",
  ],
];

const PINCODES = [
  ["534211", "Tanuku", "West Godavari", 2],
  ["534101", "Bhimavaram", "West Godavari", 2],
  ["534001", "Eluru", "West Godavari", 2],
  ["533101", "Rajahmundry", "East Godavari", 2],
  ["530001", "Visakhapatnam", "Visakhapatnam", 3],
  ["520001", "Vijayawada", "Krishna", 3],
  ["500001", "Hyderabad", "Hyderabad", 3],
  ["600001", "Chennai", "Chennai", 4],
  ["560001", "Bengaluru", "Bengaluru Urban", 4],
  ["400001", "Mumbai", "Mumbai", 5],
  ["110001", "New Delhi", "New Delhi", 6],
];

async function main() {
  console.log("Seeding Lepakshi Gold…\n");

  // ---- settings -----------------------------------------------------------
  const settings = await queryOne("SELECT id FROM settings WHERE id = 1");
  if (!settings) {
    await query(
      `INSERT INTO settings
        (id, store_name, legal_name, address, phone, whatsapp, email, order_prefix,
         next_order_number, free_shipping_above, default_shipping_fee, cod_enabled, cod_extra_fee)
       VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        "Lepakshi Gold",
        "Venkateshwara Oil Traders",
        "Tanuku, West Godavari,\nAndhra Pradesh 534211, India",
        "+91 00000 00000",
        "910000000000",
        "hello@lepakshigold.com",
        "LG",
        1001,
        999,
        60,
        1,
        0,
      ],
    );
    console.log("  settings          created");
  } else {
    console.log("  settings          already there");
  }

  // ---- categories ---------------------------------------------------------
  const categoryIds = {};
  for (const [i, [name, nameTe, slug, description]] of CATEGORIES.entries()) {
    let row = await queryOne("SELECT id FROM categories WHERE slug = ?", [slug]);
    if (!row) {
      const id = uuid();
      await query(
        `INSERT INTO categories (id, name, name_te, slug, description, sort_order, is_active)
         VALUES (?,?,?,?,?,?,1)`,
        [id, name, nameTe, slug, description, i + 1],
      );
      row = { id };
    }
    categoryIds[slug] = row.id;
  }
  console.log(`  categories        ${CATEGORIES.length} ready`);

  // ---- pack size attribute ------------------------------------------------
  let attribute = await queryOne("SELECT id FROM attributes WHERE slug = 'pack-size'");
  if (!attribute) {
    const id = uuid();
    await query(
      "INSERT INTO attributes (id, name, slug, display_type, sort_order) VALUES (?, 'Pack Size', 'pack-size', 'pills', 1)",
      [id],
    );
    attribute = { id };
  }
  const termIds = {};
  for (const [i, label] of PACK_SIZES.entries()) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let term = await queryOne(
      "SELECT id FROM attribute_terms WHERE attribute_id = ? AND slug = ?",
      [attribute.id, slug],
    );
    if (!term) {
      const id = uuid();
      await query(
        "INSERT INTO attribute_terms (id, attribute_id, name, slug, sort_order) VALUES (?,?,?,?,?)",
        [id, attribute.id, label, slug, i + 1],
      );
      term = { id };
    }
    termIds[label] = { id: term.id, slug };
  }
  console.log(`  pack sizes        ${PACK_SIZES.length} ready`);

  // ---- products and variations -------------------------------------------
  const weights = { "500 ml": 480, "1 L": 950, "2 L": 1880, "5 L": 4650, "15 L Tin": 13900 };
  let created = 0;
  for (const [i, p] of PRODUCTS.entries()) {
    const existing = await queryOne("SELECT id FROM products WHERE slug = ?", [p.slug]);
    if (existing) continue;

    const productId = uuid();
    await query(
      `INSERT INTO products
        (id, name, name_te, slug, sku_base, type, category_id, short_description, description,
         gst_rate, hsn_code, is_organic, extraction, shelf_life, ingredients, storage,
         status, is_featured, sort_order, seo_title, seo_description)
       VALUES (?,?,?,?,?,'variable',?,?,?,?,?,1,?,?,?,?,'published',?,?,?,?)`,
      [
        productId,
        p.name,
        p.nameTe,
        p.slug,
        p.sku,
        categoryIds[p.category],
        p.short,
        p.description,
        5,
        p.hsn,
        "Cold-pressed",
        "6 months from packing",
        "100% certified organic cold-pressed oil. Nothing added.",
        "Keep in a cool, dark place away from the stove. Natural sediment is normal.",
        p.featured ? 1 : 0,
        i + 1,
        `${p.name} online — cold-pressed & unrefined | Lepakshi Gold`,
        p.short,
      ],
    );

    await query(
      "INSERT INTO product_attributes (product_id, attribute_id, used_for_variations, sort_order) VALUES (?,?,1,1)",
      [productId, attribute.id],
    );

    let order = 0;
    for (const [label, price] of Object.entries(p.prices)) {
      const term = termIds[label];
      await query(
        "INSERT INTO product_attribute_terms (product_id, attribute_id, term_id) VALUES (?,?,?)",
        [productId, attribute.id, term.id],
      );
      const variationId = uuid();
      await query(
        `INSERT INTO variations
          (id, product_id, sku, label, option_map, price, cost_price, weight_grams,
           manage_stock, stock_quantity, low_stock_threshold, is_active, sort_order)
         VALUES (?,?,?,?,?,?,?,?,1,?,?,1,?)`,
        [
          variationId,
          productId,
          `${p.sku}-${term.slug.toUpperCase()}`,
          label,
          toJson({ "pack-size": term.slug }),
          price,
          p.cost[label] ?? Math.round(price * 0.7),
          weights[label] ?? 1000,
          24,
          5,
          order += 1,
        ],
      );
      await query(
        `INSERT INTO inventory_movements
          (id, variation_id, type, quantity, balance_after, reference_type, note)
         VALUES (?,?, 'adjustment', 24, 24, 'seed', 'Opening stock from seed data')`,
        [uuid(), variationId],
      );
    }
    created += 1;
  }
  console.log(`  products          ${created} created, ${PRODUCTS.length - created} already there`);

  // ---- faqs ---------------------------------------------------------------
  for (const [i, [question, answer]] of FAQS.entries()) {
    const found = await queryOne("SELECT id FROM faqs WHERE question = ?", [question]);
    if (!found) {
      await query(
        "INSERT INTO faqs (id, question, answer, sort_order, is_active) VALUES (?,?,?,?,1)",
        [uuid(), question, answer, i + 1],
      );
    }
  }
  console.log(`  faqs              ${FAQS.length} ready`);

  // ---- shipping -----------------------------------------------------------
  let zone = await queryOne("SELECT id FROM shipping_zones WHERE name = 'Rest of India'");
  if (!zone) {
    const id = uuid();
    await query(
      "INSERT INTO shipping_zones (id, name, match_type, `values`, sort_order, is_active) VALUES (?, 'Rest of India', 'rest', ?, 99, 1)",
      [id, toJson([])],
    );
    await query(
      `INSERT INTO shipping_methods (id, zone_id, name, type, cost, free_above, min_days, max_days, is_active)
       VALUES (?,?, 'Standard delivery', 'free_above', 60, 999, 3, 7, 1)`,
      [uuid(), id],
    );
    zone = { id };
  }
  let apZone = await queryOne("SELECT id FROM shipping_zones WHERE name = 'Andhra Pradesh & Telangana'");
  if (!apZone) {
    const id = uuid();
    await query(
      "INSERT INTO shipping_zones (id, name, match_type, `values`, sort_order, is_active) VALUES (?, 'Andhra Pradesh & Telangana', 'state', ?, 1, 1)",
      [id, toJson(["Andhra Pradesh", "Telangana"])],
    );
    await query(
      `INSERT INTO shipping_methods (id, zone_id, name, type, cost, free_above, min_days, max_days, is_active)
       VALUES (?,?, 'Local delivery', 'free_above', 40, 799, 2, 4, 1)`,
      [uuid(), id],
    );
  }
  console.log("  shipping zones    ready");

  for (const [pincode, city, district, eta] of PINCODES) {
    await query(
      `INSERT INTO pincode_serviceability (id, pincode, city, district, state, is_serviceable, cod_available, eta_days)
       VALUES (?,?,?,?,?,1,1,?)
       ON DUPLICATE KEY UPDATE city = VALUES(city), eta_days = VALUES(eta_days)`,
      [uuid(), pincode, city, district, "India", eta],
    );
  }
  console.log(`  pincodes          ${PINCODES.length} ready`);

  // ---- home page copy -----------------------------------------------------
  const blocks = [
    [
      "home_hero",
      {
        eyebrow: "Certified organic · Since 2003",
        headline: "Oil the way it was always made.",
        lead: "Organic seed, cold-pressed in small batches, settled naturally and filtered. No heat, no solvents, no shortcuts.",
        primaryLabel: "Shop the range",
        secondaryLabel: "How we press it",
      },
    ],
    ["announcement", { text: "Certified organic · Cold-pressed to order · Free delivery above ₹999" }],
  ];
  for (const [key, data] of blocks) {
    await query(
      "INSERT INTO content_blocks (id, `key`, data, is_active, sort_order) VALUES (?,?,?,1,0) ON DUPLICATE KEY UPDATE data = VALUES(data)",
      [uuid(), key, toJson(data)],
    );
  }
  console.log("  home page copy    ready");

  console.log("\nDone. Register your account in the app — the first one becomes the owner.\n");
  await pool.end();
}

main().catch(async (error) => {
  console.error("\nSeeding failed:", error.message, "\n");
  await pool.end();
  process.exit(1);
});
