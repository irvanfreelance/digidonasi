import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import pg from "pg";

config({ path: ".env.local" });
config();

/**
 * Drizzle hanya dipakai untuk migrasi & seed. Query aplikasi tetap SQL mentah (lib/db.ts).
 * `npm run db:migrate -- --reset` mengosongkan schema public lebih dulu (hanya untuk basis baru).
 */
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL wajib untuk db:migrate");
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);
  try {
    if (process.argv.includes("--reset")) {
      await db.execute(sql.raw("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;"));
      console.log("Schema public dikosongkan.");
    }
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    console.log("Migrasi selesai.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
