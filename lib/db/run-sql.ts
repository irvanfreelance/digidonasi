import { readFileSync } from "node:fs";
import pg from "pg";
import { splitSql } from "@/lib/db/sql-split";

export function assertSafeDatabaseUrl(url: string) {
  if (/darul|hikam/i.test(url)) {
    throw new Error("DATABASE_URL ditolak karena memuat nama basis yang tidak dipakai.");
  }
}

export function createPool(url: string) {
  assertSafeDatabaseUrl(url);
  return new pg.Pool({ connectionString: url, max: 4 });
}

type Queryable = { query: (text: string) => Promise<unknown> };

export async function applySqlText(client: Queryable, sql: string) {
  for (const statement of splitSql(sql)) {
    await client.query(statement);
  }
}

export async function applySqlFile(client: Queryable, path: string) {
  await applySqlText(client, readFileSync(path, "utf8"));
}

export async function withTransaction<T>(url: string, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const pool = createPool(url);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
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
    await pool.end();
  }
}
