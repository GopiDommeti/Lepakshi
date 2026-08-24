import mysql from "mysql2/promise";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function mysqlConfig() {
  return {
    host: env("HOSTINGER_DB_HOST") || env("HOSTINGER_DB_HOST") || env("DB_HOST"),
    port: Number(env("HOSTINGER_DB_PORT") || env("HOSTINGER_DB_PORT") || env("DB_PORT") || 3306),
    user: env("HOSTINGER_DB_USER") || env("HOSTINGER_DB_USER") || env("DB_USER") || "u750189796_lepakshi_gold",
    password: env("HOSTINGER_DB_PASSWORD") || env("HOSTINGER_DB_PASSWORD") || env("DB_PASSWORD"),
    database: env("HOSTINGER_DB_NAME") || env("HOSTINGER_DB_NAME") || env("DB_NAME") || "u750189796_Lepakshi_gold",
  };
}

export function isMysqlConfigured(): boolean {
  const c = mysqlConfig();
  return Boolean(c.host && c.user && c.password && c.database);
}

let pool: mysql.Pool | undefined;

export function getMysqlPool(): mysql.Pool {
  if (!isMysqlConfigured()) {
    throw new Error(
      "Hostinger MySQL is not configured. Set HOSTINGER_DB_HOST and HOSTINGER_DB_PASSWORD in .env",
    );
  }
  if (!pool) {
    const c = mysqlConfig();
    pool = mysql.createPool({
      host: c.host,
      port: c.port,
      user: c.user,
      password: c.password,
      database: c.database,
      waitForConnections: true,
      connectionLimit: 8,
      charset: "utf8mb4",
      timezone: "Z",
      namedPlaceholders: false,
    });
  }
  return pool;
}

export async function mysqlQuery<T extends mysql.RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await getMysqlPool().execute<T[]>(sql, params as never);
  return rows;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function asNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
