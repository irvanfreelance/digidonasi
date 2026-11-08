import { config } from "dotenv";
import { join } from "node:path";
import { z } from "zod";
import { applySqlFile, withTransaction } from "@/lib/db/run-sql";

config({ path: ".env.local" });
config();

const bootstrapSchema = z.object({
  optIn: z.literal("true").optional(),
  email: z.string().trim().regex(/^[^@\s]+@[^@\s]+$/).optional(),
  name: z.string().trim().min(1).max(200).optional(),
});

async function bootstrapAdmin(client: import("pg").PoolClient) {
  const parsed = bootstrapSchema.safeParse({
    optIn: process.env.BOOTSTRAP_ADMIN_OPT_IN,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    name: process.env.BOOTSTRAP_ADMIN_NAME,
  });
  if (!parsed.success) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL atau BOOTSTRAP_ADMIN_NAME tidak valid.");
  }
  if (parsed.data.optIn !== "true") {
    console.log("Bootstrap superadmin dilewati. BOOTSTRAP_ADMIN_OPT_IN bukan true.");
    return;
  }
  if (!parsed.data.email || !parsed.data.name) {
    throw new Error("Opt-in bootstrap butuh BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_NAME.");
  }
  await client.query(
    `INSERT INTO users (nama, email, role, is_active, seed_key, seed_untouched)
     VALUES ($1, $2, 'SUPERADMIN', true, 'bootstrap-superadmin', true)
     ON CONFLICT (seed_key) DO UPDATE SET
       nama = EXCLUDED.nama,
       email = EXCLUDED.email,
       role = 'SUPERADMIN',
       is_active = true
     WHERE users.seed_untouched`,
    [parsed.data.name, parsed.data.email.toLowerCase()],
  );
  console.log("Bootstrap superadmin diproses tanpa menulis email ke log.");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL wajib untuk db:seed");
  const file = join(process.cwd(), "drizzle/seed.sql");
  await withTransaction(url, async (client) => {
    await applySqlFile(client, file);
    await client.query("SELECT set_config('digidonasi.seeding', 'on', true)");
    await bootstrapAdmin(client);
  });
  console.log("Seed selesai.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
