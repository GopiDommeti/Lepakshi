import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * One shared connection pool for the whole API.
 * Hostinger's shared MySQL is happiest with a small pool.
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL || 8),
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: false,
  supportBigNumbers: true,
  decimalNumbers: true,
});

/** Run a query and get the rows back. */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** First row, or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Run several statements inside one transaction. */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function assertConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
