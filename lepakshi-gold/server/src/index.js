import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";

import {
  COOKIE,
  attachUser,
  changePassword,
  cookieOptions,
  createUser,
  endSession,
  requireStaff,
  requireUser,
  startSession,
  verifyPassword,
} from "./auth.js";
import { assertConnection, query, queryOne } from "./db.js";
import { buildQuote, createOrder, lookupOrder } from "./orders.js";
import { adjustStock, runQuery } from "./query.js";
import { buildRobots, buildSitemap, injectMeta, metaForPath } from "./seo.js";
import { HttpError, uuid, wrap } from "./util.js";

dotenv.config();

const dir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(dir, "..", "uploads");
const clientDist = path.join(dir, "..", "..", "client", "dist");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
    credentials: true,
  }),
);
app.use(attachUser());

/* ------------------------------------------------------------------- health */

app.get(
  "/api/health",
  wrap(async (_req, res) => {
    await assertConnection();
    res.json({ ok: true, database: process.env.DB_NAME });
  }),
);

/* --------------------------------------------------------------------- auth */

app.post(
  "/api/auth/register",
  wrap(async (req, res) => {
    const { email, password, fullName, phone } = req.body || {};
    const id = await createUser({ email, password, fullName, phone });
    const session = await startSession(id, req.headers["user-agent"]);
    res.cookie(COOKIE, session, cookieOptions());
    req.user = null;
    res.json({ ok: true });
  }),
);

app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const id = await verifyPassword(email, password);
    const session = await startSession(id, req.headers["user-agent"]);
    res.cookie(COOKIE, session, cookieOptions());
    res.json({ ok: true });
  }),
);

app.post(
  "/api/auth/logout",
  wrap(async (req, res) => {
    await endSession(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }),
);

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.user });
});

app.post(
  "/api/auth/password",
  wrap(async (req, res) => {
    const user = requireUser(req);
    await changePassword(user.id, req.body?.password);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ queries */

app.post(
  "/api/query",
  wrap(async (req, res) => {
    const data = await runQuery(req.body || {}, req.user);
    res.json({ data });
  }),
);

app.post(
  "/api/stock/adjust",
  wrap(async (req, res) => {
    const user = requireStaff(req);
    const balance = await adjustStock({ ...(req.body || {}), userId: user.id });
    res.json({ data: balance });
  }),
);

/* ------------------------------------------------------------------- orders */

app.post(
  "/api/orders/quote",
  wrap(async (req, res) => {
    const quote = await buildQuote(req.body || {}, req.user);
    const { lines, couponId, ...rest } = quote;
    res.json({ data: { ...rest, lineCount: lines.length } });
  }),
);

app.post(
  "/api/orders/place",
  wrap(async (req, res) => {
    const result = await createOrder(req.body || {}, req.user);
    res.json({ data: { orderNo: result.orderNo, grandTotal: result.grandTotal } });
  }),
);

app.post(
  "/api/orders/track",
  wrap(async (req, res) => {
    const { orderNo, phone } = req.body || {};
    res.json({ data: await lookupOrder(orderNo, phone) });
  }),
);

/* ------------------------------------------------------------------ uploads */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.-]/g, "-").slice(-60);
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

app.post(
  "/api/uploads",
  upload.array("files", 12),
  wrap(async (req, res) => {
    const user = requireStaff(req);
    const base = process.env.SITE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const saved = [];
    for (const file of req.files || []) {
      const url = `${base.replace(/\/$/, "")}/uploads/${file.filename}`;
      await query(
        "INSERT INTO media (id, url, filename, folder, size_bytes, uploaded_by) VALUES (?,?,?,?,?,?)",
        [uuid(), url, file.originalname, "products", file.size, user.id],
      );
      saved.push(url);
    }
    res.json({ data: saved });
  }),
);

app.use("/uploads", express.static(uploadsDir, { maxAge: "365d", fallthrough: true }));

/* ---------------------------------------------------------------------- SEO */

app.get(
  "/sitemap.xml",
  wrap(async (_req, res) => {
    res.type("application/xml").send(await buildSitemap());
  }),
);

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(buildRobots());
});

app.get(
  "/api/seo/meta",
  wrap(async (req, res) => {
    res.json({ data: await metaForPath(String(req.query.path || "/")) });
  }),
);

/* ------------------------------------------- serve the built storefront (prod) */

if (existsSync(clientDist)) {
  app.use(
    express.static(clientDist, {
      index: false,
      maxAge: "30d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );

  const template = readFileSync(path.join(clientDist, "index.html"), "utf8");

  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    try {
      const meta = await metaForPath(req.path);
      res.type("html").send(injectMeta(template, meta));
    } catch {
      res.type("html").send(template);
    }
  });
}

/* -------------------------------------------------------------------- errors */

app.use((_req, res) => res.status(404).json({ error: "Not found." }));

app.use((error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong on our side."
      : error.message || "Something went wrong.";
  res.status(status).json({ error: message });
});

/* --------------------------------------------------------------------- boot */

const port = Number(process.env.PORT || 4000);

try {
  await assertConnection();
  const store = await queryOne("SELECT store_name FROM settings WHERE id = 1");
  console.log(`  Database  ${process.env.DB_NAME} — connected`);
  if (!store) console.log("  Notice    settings row is empty. Run: npm run seed");
} catch (error) {
  console.error("\n  Could not reach MySQL.");
  console.error(`  ${error.message}\n`);
  console.error("  Check server/.env — DB_HOST, DB_NAME, DB_USER, DB_PASSWORD.");
  console.error("  Connecting to Hostinger from your laptop? Add your IP under");
  console.error("  hPanel -> Databases -> Remote MySQL first.\n");
}

app.listen(port, () => {
  console.log(`  API       http://localhost:${port}`);
  console.log(`  Health    http://localhost:${port}/api/health\n`);
});
