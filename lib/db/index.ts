import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { assertSafeDatabaseUrl } from "@/lib/db/run-sql";

type Row = Record<string, unknown>;

let pool: pg.Pool | null = null;

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  assertSafeDatabaseUrl(url);
  return url;
}

function localPool(url: string) {
  if (!pool) pool = new pg.Pool({ connectionString: url, max: 4 });
  return pool;
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
