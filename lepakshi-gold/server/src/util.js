import { randomUUID, randomBytes } from "node:crypto";

export const uuid = () => randomUUID();
export const token = () => randomBytes(32).toString("hex");

/** MySQL DATETIME string in UTC. */
export function now(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 19).replace("T", " ");
}

/** MySQL doesn't have a JSON type on every plan — store objects as text safely. */
export function toJson(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Parse a column that may already be an object (JSON col) or a string (TEXT col). */
export function fromJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** MySQL gives TINYINT(1) back as 0/1 — the UI wants real booleans. */
export function boolFields(row, fields) {
  if (!row) return row;
  for (const f of fields) {
    if (f in row && row[f] !== null) row[f] = Boolean(row[f]);
  }
  return row;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const bad = (message) => new HttpError(400, message);
export const unauthorized = (message = "Please sign in.") => new HttpError(401, message);
export const forbidden = (message = "You don't have access to that.") => new HttpError(403, message);
export const notFound = (message = "Not found.") => new HttpError(404, message);

/** Wrap an async route handler so thrown errors reach the error middleware. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
