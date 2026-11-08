import { config } from "dotenv";
import { join } from "node:path";
import { applySqlFile, withTransaction } from "@/lib/db/run-sql";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL wajib untuk db:migrate");
  const file = join(process.cwd(), "lib/db/migrations/0000_foundation.sql");
  await withTransaction(url, async (client) => {
    await applySqlFile(client, file);
  });
  console.log("Migrasi 0000_foundation selesai.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
