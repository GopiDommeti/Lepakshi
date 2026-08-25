import { pool, query } from "./db.js";
import { tableConfig } from "./tables.js";
import { HttpError, fromJson, toJson, uuid } from "./util.js";

const IDENT = /^[a-z_][a-z0-9_]*$/i;
const OPS = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
};

const columnCache = new Map();

/** Real column list, read once per table from information_schema. */
async function columnsOf(table) {
  if (columnCache.has(table)) return columnCache.get(table);
  const rows = await query(
    `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  const set = new Set(rows.map((r) => r.name));
  if (set.size === 0) throw new HttpError(400, `Table "${table}" is not in the database yet.`);
  columnCache.set(table, set);
  return set;
}

function quote(name) {
  if (!IDENT.test(name)) throw new HttpError(400, `Bad column name: ${name}`);
  return `\`${name}\``;
}

function levelOf(user) {
  if (!user) return "anon";
  if (user.isOwner) return "owner";
  if (user.isStaff) return "staff";
  return "user";
}

function allowed(required, user) {
  const level = levelOf(user);
  switch (required) {
    case "public":
      return true;
    case "anon":
      return true;
    case "self":
      return level !== "anon";
    case "staff":
      return level === "staff" || level === "owner";
    case "owner":
      return level === "owner";
    default:
      return false;
  }
}

/** True when this reader gets the unrestricted view of the table. */
function isPrivileged(config, required, user) {
  if (!user) return false;
  if (user.isStaff) return true;
  return required === "self";
}

function buildWhere(config, filters, columns, extra = []) {
  const clauses = [...extra];
  const params = [];
  for (const f of filters || []) {
    const col = String(f.column || "");
    if (!columns.has(col)) throw new HttpError(400, `Unknown column "${col}".`);
    const c = quote(col);
    if (f.op === "in") {
      const list = Array.isArray(f.value) ? f.value : [];
      if (list.length === 0) {
        clauses.push("1 = 0");
        continue;
      }
      clauses.push(`${c} IN (${list.map(() => "?").join(",")})`);
      params.push(...list);
    } else if (f.op === "is") {
      clauses.push(f.value === null ? `${c} IS NULL` : `${c} IS NOT NULL`);
    } else {
      const sqlOp = OPS[f.op];
      if (!sqlOp) throw new HttpError(400, `Unsupported filter "${f.op}".`);
      if (f.value === null) {
        clauses.push(f.op === "neq" ? `${c} IS NOT NULL` : `${c} IS NULL`);
      } else {
        clauses.push(`${c} ${sqlOp} ?`);
        params.push(f.value);
      }
    }
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

function shapeRow(row, config, privileged, ownerView) {
  if (!row) return row;
  const out = { ...row };
  for (const col of config.json || []) {
    if (col in out) out[col] = fromJson(out[col], null);
  }
  for (const col of config.bool || []) {
    if (col in out && out[col] !== null) out[col] = Boolean(out[col]);
  }
  if (!ownerView) {
    for (const col of config.ownerColumns || []) delete out[col];
  }
  if (!privileged && Array.isArray(config.publicColumns)) {
    for (const key of Object.keys(out)) {
      if (!config.publicColumns.includes(key)) delete out[key];
    }
  }
  return out;
}

function encodeValues(config, data, columns) {
  const out = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (!columns.has(key)) continue; // silently drop unknown keys
    out[key] = (config.json || []).includes(key) ? toJson(value) : value;
  }
  return out;
}

/**
 * Run one query descriptor coming from the browser.
 * Everything is parameterised; identifiers are validated against the real schema.
 */
export async function runQuery(descriptor, user) {
  const { table, action } = descriptor;
  const config = tableConfig(table);
  if (!config) throw new HttpError(400, `Table "${table}" is not available.`);
  const columns = await columnsOf(table);

  if (action === "select") return runSelect(descriptor, config, columns, user);
  if (action === "insert") return runInsert(descriptor, config, columns, user);
  if (action === "update") return runUpdate(descriptor, config, columns, user);
  if (action === "upsert") return runUpsert(descriptor, config, columns, user);
  if (action === "delete") return runDelete(descriptor, config, columns, user);
  throw new HttpError(400, `Unsupported action "${action}".`);
}

async function runSelect(d, config, columns, user) {
  if (!allowed(config.read, user)) throw new HttpError(403, "You can't read that.");

  const privileged = isPrivileged(config, config.read, user);
  const ownerView = Boolean(user?.isOwner);
  const extra = [];
  const extraParams = [];

  // Customers and visitors only see the published slice.
  if (!privileged && config.publicWhere) extra.push(config.publicWhere);

  // "self" tables are scoped to the signed-in user unless staff is looking.
  if (config.read === "self" && !user?.isStaff) {
    if (!user) throw new HttpError(401, "Please sign in.");
    extra.push(`${quote(config.selfColumn)} = ?`);
    extraParams.push(user.id);
  }

  let select = "*";
  if (Array.isArray(d.columns) && d.columns.length > 0 && !d.columns.includes("*")) {
    const picked = d.columns.filter((c) => columns.has(c));
    if (picked.length === 0) throw new HttpError(400, "No readable columns requested.");
    select = picked.map(quote).join(", ");
  }

  const where = buildWhere(config, d.filters, columns, extra);
  let sql = `SELECT ${select} FROM ${quote(d.table)}${where.sql}`;
  const params = [...extraParams, ...where.params];

  if (Array.isArray(d.order) && d.order.length > 0) {
    const parts = d.order.map((o) => {
      if (!columns.has(o.column)) throw new HttpError(400, `Cannot sort by "${o.column}".`);
      return `${quote(o.column)} ${o.ascending === false ? "DESC" : "ASC"}`;
    });
    sql += ` ORDER BY ${parts.join(", ")}`;
  }

  const limit = Number.isFinite(d.limit) ? Math.min(Math.max(1, d.limit), 2000) : 1000;
  sql += ` LIMIT ${limit}`;

  const rows = await query(sql, params);
  return rows.map((r) => shapeRow(r, config, privileged, ownerView));
}

function assertWrite(config, user) {
  const required = config.write;
  if (required === "none") throw new HttpError(403, "That table is read-only here.");
  if (required === "anon") return;
  if (!allowed(required, user)) throw new HttpError(403, "You can't change that.");
}

async function runInsert(d, config, columns, user) {
  assertWrite(config, user);
  const list = Array.isArray(d.values) ? d.values : [d.values];
  if (list.length === 0) throw new HttpError(400, "Nothing to insert.");

  const ids = [];
  for (const raw of list) {
    const data = encodeValues(config, raw, columns);

    // Rows in "self" tables always belong to the person creating them.
    if (config.write === "self" && config.selfColumn && columns.has(config.selfColumn)) {
      data[config.selfColumn] = user.id;
    }
    if (columns.has("id") && !data.id) data.id = uuid();
    if (data.id) ids.push(data.id);

    const keys = Object.keys(data);
    if (keys.length === 0) throw new HttpError(400, "No valid columns to insert.");
    await query(
      `INSERT INTO ${quote(d.table)} (${keys.map(quote).join(", ")}) VALUES (${keys
        .map(() => "?")
        .join(", ")})`,
      keys.map((k) => data[k]),
    );
  }

  if (!d.returning || ids.length === 0) return [];
  return runSelect(
    { table: d.table, filters: [{ column: "id", op: "in", value: ids }] },
    config,
    columns,
    user,
  );
}

async function runUpdate(d, config, columns, user) {
  assertWrite(config, user);
  const data = encodeValues(config, d.values, columns);
  const keys = Object.keys(data);
  if (keys.length === 0) throw new HttpError(400, "Nothing to update.");
  if (!Array.isArray(d.filters) || d.filters.length === 0) {
    throw new HttpError(400, "Refusing to update every row — add a filter.");
  }

  const extra = [];
  const extraParams = [];
  if (config.write === "self" && config.selfColumn) {
    extra.push(`${quote(config.selfColumn)} = ?`);
    extraParams.push(user.id);
  }

  const where = buildWhere(config, d.filters, columns, extra);
  await query(
    `UPDATE ${quote(d.table)} SET ${keys.map((k) => `${quote(k)} = ?`).join(", ")}${where.sql}`,
    [...keys.map((k) => data[k]), ...extraParams, ...where.params],
  );
  return d.returning ? runSelect({ table: d.table, filters: d.filters }, config, columns, user) : [];
}

async function runUpsert(d, config, columns, user) {
  assertWrite(config, user);
  const list = Array.isArray(d.values) ? d.values : [d.values];
  for (const raw of list) {
    const data = encodeValues(config, raw, columns);
    if (config.write === "self" && config.selfColumn && columns.has(config.selfColumn)) {
      data[config.selfColumn] = user.id;
    }
    if (columns.has("id") && !data.id) data.id = uuid();
    const keys = Object.keys(data);
    if (keys.length === 0) continue;
    const updates = keys.filter((k) => k !== "id");
    await query(
      `INSERT INTO ${quote(d.table)} (${keys.map(quote).join(", ")})
       VALUES (${keys.map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${
         updates.length > 0
           ? updates.map((k) => `${quote(k)} = VALUES(${quote(k)})`).join(", ")
           : `${quote(keys[0])} = ${quote(keys[0])}`
       }`,
      keys.map((k) => data[k]),
    );
  }
  return [];
}

async function runDelete(d, config, columns, user) {
  assertWrite(config, user);
  if (!Array.isArray(d.filters) || d.filters.length === 0) {
    throw new HttpError(400, "Refusing to delete every row — add a filter.");
  }
  const extra = [];
  const extraParams = [];
  if (config.write === "self" && config.selfColumn) {
    extra.push(`${quote(config.selfColumn)} = ?`);
    extraParams.push(user.id);
  }
  const where = buildWhere(config, d.filters, columns, extra);
  await query(`DELETE FROM ${quote(d.table)}${where.sql}`, [...extraParams, ...where.params]);
  return [];
}

/**
 * The stock ledger. Balance and movement row are written together or not at all,
 * so the numbers on the Stock screen can always be explained.
 */
export async function adjustStock({ variationId, type, qty, referenceType, referenceId, note, userId }) {
  const amount = Number(qty);
  if (!variationId) throw new HttpError(400, "Which pack size?");
  if (!Number.isFinite(amount) || amount === 0) throw new HttpError(400, "Enter a quantity.");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      "SELECT stock_quantity FROM variations WHERE id = ? FOR UPDATE",
      [variationId],
    );
    if (rows.length === 0) throw new HttpError(404, "That pack size no longer exists.");

    const balance = Number(rows[0].stock_quantity) + amount;
    await conn.execute("UPDATE variations SET stock_quantity = ? WHERE id = ?", [
      balance,
      variationId,
    ]);
    await conn.execute(
      `INSERT INTO inventory_movements
         (id, variation_id, type, quantity, balance_after, reference_type, reference_id, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        variationId,
        type,
        amount,
        balance,
        referenceType || null,
        referenceId || null,
        note || null,
        userId || null,
      ],
    );
    await conn.commit();
    return balance;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
