import { api, ApiError } from "@/lib/api";

/**
 * A small query builder over POST /api/query.
 *
 * It reads like the client the screens were originally written against, so
 * every admin and account screen keeps its shape — but the SQL is built on the
 * server, against an allowlist, with the signed-in user's role applied. The
 * browser never gets to name a table it shouldn't, and cost prices simply
 * aren't in the response for anyone below owner.
 */

type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in" | "is";
type Filter = { column: string; op: Op; value: unknown };
// Row shapes live in database.types.ts and are applied at the call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export type Result<T> = { data: T; error: { message: string } | null };

type Descriptor = {
  table: string;
  action: "select" | "insert" | "update" | "upsert" | "delete";
  columns?: string[];
  filters: Filter[];
  order: { column: string; ascending: boolean }[];
  limit?: number;
  values?: unknown;
  returning?: boolean;
};

async function run<T>(descriptor: Descriptor): Promise<Result<T>> {
  try {
    const data = await api.post<T>("/api/query", descriptor);
    return { data, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Something went wrong.";
    return { data: null as T, error: { message } };
  }
}

class Query implements PromiseLike<Result<Row[]>> {
  private d: Descriptor;

  constructor(table: string, action: Descriptor["action"], values?: unknown) {
    this.d = { table, action, filters: [], order: [] };
    if (values !== undefined) this.d.values = values;
  }

  /** On a select this picks columns; on a write it asks for the rows back. */
  select(columns = "*"): Query {
    if (this.d.action === "select") {
      this.d.columns = columns === "*" ? ["*"] : columns.split(",").map((c) => c.trim());
    } else {
      this.d.returning = true;
    }
    return this;
  }

  eq(column: string, value: unknown) { return this.filter(column, "eq", value); }
  neq(column: string, value: unknown) { return this.filter(column, "neq", value); }
  gt(column: string, value: unknown) { return this.filter(column, "gt", value); }
  gte(column: string, value: unknown) { return this.filter(column, "gte", value); }
  lt(column: string, value: unknown) { return this.filter(column, "lt", value); }
  lte(column: string, value: unknown) { return this.filter(column, "lte", value); }
  like(column: string, value: string) { return this.filter(column, "like", value); }
  in(column: string, value: unknown[]) { return this.filter(column, "in", value); }
  is(column: string, value: null) { return this.filter(column, "is", value); }

  private filter(column: string, op: Op, value: unknown): Query {
    this.d.filters.push({ column, op, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): Query {
    this.d.order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number): Query {
    this.d.limit = count;
    return this;
  }

  /** First row or null — not an error when there simply isn't one. */
  async maybeSingle(): Promise<Result<Row | null>> {
    const result = await run<Row[]>({ ...this.d, limit: 1 });
    if (result.error) return { data: null, error: result.error };
    return { data: result.data?.[0] ?? null, error: null };
  }

  /** First row, and an error when there isn't one. */
  async single(): Promise<Result<Row>> {
    const result = await this.maybeSingle();
    if (result.error) return { data: {} as Row, error: result.error };
    if (!result.data) return { data: {} as Row, error: { message: "No matching row." } };
    return { data: result.data, error: null };
  }

  then<R1 = Result<Row[]>, R2 = never>(
    onfulfilled?: ((value: Result<Row[]>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return run<Row[]>(this.d).then(onfulfilled, onrejected);
  }
}

class TableRef {
  constructor(private name: string) {}

  select(columns = "*") {
    return new Query(this.name, "select").select(columns);
  }
  insert(values: unknown) {
    return new Query(this.name, "insert", values);
  }
  update(values: unknown) {
    return new Query(this.name, "update", values);
  }
  upsert(values: unknown, _options?: { onConflict?: string }) {
    return new Query(this.name, "upsert", values);
  }
  delete() {
    return new Query(this.name, "delete");
  }
}

export const db = {
  from: (table: string) => new TableRef(table),

  /** The stock ledger: balance and movement row are written together, or not at all. */
  async rpc(_fn: "adjust_stock", args: Record<string, unknown>): Promise<Result<number>> {
    try {
      const data = await api.post<number>("/api/stock/adjust", {
        variationId: args["_variation_id"],
        type: args["_type"],
        qty: args["_qty"],
        referenceType: args["_reference_type"],
        referenceId: args["_reference_id"],
        note: args["_note"],
      });
      return { data, error: null };
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Stock update failed.";
      return { data: 0, error: { message } };
    }
  },
};
