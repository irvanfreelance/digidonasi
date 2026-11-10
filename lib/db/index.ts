import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { assertSafeDatabaseUrl } from "@/lib/db/run-sql";

type Row = Record<string, unknown>;

let pool: pg.Pool | null = null;
let poolUrl = "";

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  assertSafeDatabaseUrl(url);
  return url;
}

function localPool(url: string) {
  if (!pool || poolUrl !== url) {
    void pool?.end();
    pool = new pg.Pool({ connectionString: url, max: 4 });
    poolUrl = url;
  }
  return pool;
}

export type Sql = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;

/** Satu transaksi pada basis lokal. Neon tidak dipakai untuk checkout paket ini. */
export async function withDbTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  const url = databaseUrl();
  if (url.includes("neon.tech")) throw new Error("Transaksi checkout memakai basis Postgres lokal pada paket ini.");
  const client = await localPool(url).connect();
  try {
    await client.query("BEGIN");
    const sql: Sql = async <T extends Row = Row>(text: string, params: unknown[] = []) => (await client.query(text, params)).rows as T[];
    const result = await fn(sql);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* transaksi mungkin sudah batal */
    }
    throw error;
  } finally {
    client.release();
  }
}

/** SQL berparameter. Neon untuk host Neon, pg untuk basis lokal. Bukan query Drizzle. */
export async function dbQuery<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const url = databaseUrl();
  if (url.includes("neon.tech")) {
    const sql = neon(url);
    const rows = await sql.query(text, params);
    return rows as T[];
  }
  const result = await localPool(url).query(text, params);
  return result.rows as T[];
}
