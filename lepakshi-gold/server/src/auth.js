import bcrypt from "bcryptjs";

import { query, queryOne } from "./db.js";
import { HttpError, now, token, uuid } from "./util.js";

const SESSION_DAYS = 30;
export const COOKIE = "lg_session";

export function cookieOptions() {
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: prod,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function createUser({ email, password, fullName, phone }) {
  const clean = String(email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(clean)) throw new HttpError(400, "That email doesn't look right.");
  if (String(password || "").length < 8) {
    throw new HttpError(400, "Use a password of at least eight characters.");
  }
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [clean]);
  if (existing) throw new HttpError(409, "An account with that email already exists.");

  const id = uuid();
  await query(
    "INSERT INTO users (id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)",
    [id, clean, await hashPassword(password), fullName || null, phone || null],
  );
  await query("INSERT INTO profiles (id, full_name, email, phone) VALUES (?, ?, ?, ?)", [
    id,
    fullName || null,
    clean,
    phone || null,
  ]);

  // The very first account to register becomes the owner, so the admin is reachable.
  const [{ count }] = await query("SELECT COUNT(*) AS count FROM users");
  if (Number(count) === 1) {
    await query("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'owner')", [uuid(), id]);
  }
  return id;
}

export async function verifyPassword(email, password) {
  const clean = String(email || "").trim().toLowerCase();
  const user = await queryOne("SELECT id, password_hash FROM users WHERE email = ?", [clean]);
  if (!user) throw new HttpError(401, "No account matches that email and password.");
  const ok = await bcrypt.compare(String(password || ""), user.password_hash);
  if (!ok) throw new HttpError(401, "No account matches that email and password.");
  return user.id;
}

export async function startSession(userId, userAgent) {
  const value = token();
  const expires = now(SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO sessions (token, user_id, user_agent, expires_at) VALUES (?, ?, ?, ?)",
    [value, userId, (userAgent || "").slice(0, 250), expires],
  );
  return value;
}

export async function endSession(value) {
  if (value) await query("DELETE FROM sessions WHERE token = ?", [value]);
}

/** Resolve the signed-in user (plus role) from the session cookie. */
export async function currentUser(req) {
  const value = req.cookies?.[COOKIE];
  if (!value) return null;
  const row = await queryOne(
    `SELECT u.id, u.email, u.full_name, u.phone,
            (SELECT r.role FROM user_roles r
              WHERE r.user_id = u.id AND r.is_active = 1
              ORDER BY FIELD(r.role,'owner','manager','staff') LIMIT 1) AS role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [value],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role || null,
    isStaff: ["owner", "manager", "staff"].includes(row.role),
    isOwner: row.role === "owner",
  };
}

/** Populates req.user on every request. Never throws. */
export function attachUser() {
  return async (req, _res, next) => {
    try {
      req.user = await currentUser(req);
    } catch {
      req.user = null;
    }
    next();
  };
}

export function requireUser(req) {
  if (!req.user) throw new HttpError(401, "Please sign in.");
  return req.user;
}

export function requireStaff(req) {
  const user = requireUser(req);
  if (!user.isStaff) throw new HttpError(403, "Staff access only.");
  return user;
}

export function requireOwner(req) {
  const user = requireUser(req);
  if (!user.isOwner) throw new HttpError(403, "Owner access only.");
  return user;
}

export async function changePassword(userId, password) {
  if (String(password || "").length < 8) {
    throw new HttpError(400, "Use a password of at least eight characters.");
  }
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [
    await hashPassword(password),
    userId,
  ]);
  await query("DELETE FROM sessions WHERE user_id = ?", [userId]);
}
