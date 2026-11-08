import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import pg from "pg";
import { applySqlFile } from "../lib/db/run-sql";

const adminConfig = { host: "127.0.0.1", port: 5433, user: "postgres", database: "postgres" };

async function recreate(name: string) {
  const admin = new pg.Client(adminConfig);
  await admin.connect();
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
    [name],
  );
  await admin.query(`DROP DATABASE IF EXISTS ${name}`);
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();
  return new pg.Client({ ...adminConfig, database: name });
}

async function counts(client: pg.Client) {
  const q = async (sql: string) => Number((await client.query(sql)).rows[0].n);
  return {
    campaigns: await q("SELECT count(*)::int AS n FROM campaigns"),
    donationBlocks: await q("SELECT count(*)::int AS n FROM donation_blocks"),
    websiteBlocks: await q("SELECT count(*)::int AS n FROM website_blocks"),
    variants: await q("SELECT count(*)::int AS n FROM campaign_variants"),
    bundles: await q("SELECT count(*)::int AS n FROM campaign_bundles"),
    methods: await q("SELECT count(*)::int AS n FROM payment_methods"),
    articles: await q("SELECT count(*)::int AS n FROM web_articles"),
    tags: await q("SELECT count(*)::int AS n FROM web_article_tags"),
    invoices: await q("SELECT count(*)::int AS n FROM invoices"),
    ledger: await q("SELECT count(*)::int AS n FROM affiliate_ledger"),
    donors: await q("SELECT count(*)::int AS n FROM donors"),
    affiliates: await q("SELECT count(*)::int AS n FROM affiliates"),
    activeMethods: await q("SELECT count(*)::int AS n FROM payment_methods WHERE is_active"),
    qrisPayload: await q("SELECT count(*)::int AS n FROM campaign_qris_static WHERE qris_string <> ''"),
    paid: await q("SELECT count(*)::int AS n FROM invoices WHERE status = 'PAID'"),
  };
}

async function migrateAndSeed(client: pg.Client, bootstrap = false) {
  await client.query("BEGIN");
  await applySqlFile(client, join(process.cwd(), "lib/db/migrations/0000_foundation.sql"));
  await client.query("COMMIT");
  await client.query("BEGIN");
  await applySqlFile(client, join(process.cwd(), "drizzle/seed.sql"));
  if (bootstrap) {
    await client.query("SELECT set_config('digidonasi.seeding', 'on', true)");
    await client.query(
      `INSERT INTO users (nama, email, role, is_active, seed_key)
       VALUES ('Admin Contoh', 'admin@example.com', 'SUPERADMIN', true, 'bootstrap-superadmin')
       ON CONFLICT (seed_key) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email
       WHERE users.seed_untouched`,
    );
  }
  await client.query("COMMIT");
}

test("pasang, seed ulang, dan suntingan bertahan", async () => {
  const client = await recreate("digidonasi_day1");
  await client.connect();
  await migrateAndSeed(client, true);
  await migrateAndSeed(client, true);
  const first = await counts(client);
  assert.equal(first.campaigns, 8);
  assert.equal(first.donationBlocks, 15);
  assert.equal(first.websiteBlocks, 18);
  assert.equal(first.variants, 2);
  assert.equal(first.bundles, 2);
  assert.equal(first.methods, 6);
  assert.equal(first.articles, 3);
  assert.equal(first.tags, 3);
  assert.equal(first.invoices, 0);
  assert.equal(first.ledger, 0);
  assert.equal(first.donors, 0);
  assert.equal(first.affiliates, 0);
  assert.equal(first.activeMethods, 0);
  assert.equal(first.qrisPayload, 0);
  assert.equal(first.paid, 0);
  assert.equal(Number((await client.query("SELECT count(*)::int AS n FROM users")).rows[0].n), 1);
  const flags = await client.query(`
    SELECT
      bool_or(is_verified) AS is_verified,
      bool_or(is_urgent) AS is_urgent,
      bool_or(is_zakat) AS is_zakat,
      bool_or(is_qurban) AS is_qurban,
      bool_or(is_fixed_amount) AS is_fixed_amount,
      bool_or(is_bundle) AS is_bundle,
      bool_or(has_no_target) AS has_no_target,
      bool_or(has_no_time_limit) AS has_no_time_limit,
      bool_or(is_carousel) AS is_carousel
    FROM campaigns`);
  for (const value of Object.values(flags.rows[0])) assert.equal(value, true);

  await client.query("UPDATE donation_blocks SET heading = 'Suntingan klien' WHERE seed_key = 'donasi.kategori_heading'");
  await client.query("UPDATE website_blocks SET heading = 'Suntingan beranda' WHERE seed_key = 'web.hero_copy'");
  await client.query("UPDATE campaign_stats SET collected_amount = 12345 WHERE campaign_id = (SELECT id FROM campaigns WHERE seed_key = 'demo-umum')");
  await client.query("UPDATE users SET nama = 'Nama diubah' WHERE seed_key = 'bootstrap-superadmin'");
  await migrateAndSeed(client, true);
  const heading = await client.query("SELECT heading, seed_untouched FROM donation_blocks WHERE seed_key = 'donasi.kategori_heading'");
  assert.equal(heading.rows[0].heading, "Suntingan klien");
  assert.equal(heading.rows[0].seed_untouched, false);
  const hero = await client.query("SELECT heading FROM website_blocks WHERE seed_key = 'web.hero_copy'");
  assert.equal(hero.rows[0].heading, "Suntingan beranda");
  const stats = await client.query("SELECT collected_amount::text AS n FROM campaign_stats WHERE campaign_id = (SELECT id FROM campaigns WHERE seed_key = 'demo-umum')");
  assert.equal(stats.rows[0].n, "12345");
  const admin = await client.query("SELECT nama FROM users WHERE seed_key = 'bootstrap-superadmin'");
  assert.equal(admin.rows[0].nama, "Nama diubah");
  assert.equal(Number((await client.query("SELECT count(*)::int AS n FROM users")).rows[0].n), 1);
  const configEmail = await client.query("SELECT value FROM app_config WHERE key = 'bootstrap_admin_email'");
  assert.equal(configEmail.rows[0].value, "");
  const idDefault = await client.query(
    "SELECT column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'",
  );
  assert.match(String(idDefault.rows[0].column_default), /nextval/);
  const auditCols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'",
  );
  const auditNames = auditCols.rows.map((row) => row.column_name);
  assert.equal(auditNames.includes("user_id"), true);
  assert.equal(auditNames.includes("donor_id"), false);
  assert.equal(auditNames.includes("actor_admin_id"), false);
  const secrets = await client.query(
    "SELECT count(*)::int AS n FROM information_schema.columns WHERE column_name = 'password_hash'",
  );
  assert.equal(secrets.rows[0].n, 0);
  assert.equal((await client.query("SELECT to_regclass('public.user_tokens') AS t")).rows[0].t, null);
  assert.equal((await client.query("SELECT to_regclass('public.programs') AS t")).rows[0].t, null);
  assert.equal((await client.query("SELECT to_regclass('public.employees') AS t")).rows[0].t, null);
  const catalog = await client.query(
    "SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1",
  );
  assert.equal(catalog.rows.length, 50);
  for (const name of [
    "campaign_variants",
    "campaign_bundles",
    "transaction_qurban_names",
    "campaign_qris_static",
    "payment_events",
    "affiliate_clicks",
    "affiliate_ledger",
    "payout_requests",
    "donation_blocks",
    "website_blocks",
  ]) {
    assert.equal(catalog.rows.some((row) => row.relname === name), true, name);
  }
  await client.end();
});

test("constraint uang, peran, idempotensi, dan fixture negatif", async () => {
  const client = await recreate("digidonasi_constraints");
  await client.connect();
  await migrateAndSeed(client, false);

  await assert.rejects(client.query("INSERT INTO users (nama, email, role) VALUES ('A', 'a@example.com', 'FINANCE')"));
  await assert.rejects(client.query("INSERT INTO app_config (key, value, description, is_proposal) VALUES ('website_enabled', 'true', 'x', false)"));
  await assert.rejects(
    client.query(
      "UPDATE campaign_qris_static SET qris_string = '000201010212' WHERE seed_key = 'demo-qris-umum'",
    ),
  );
  await assert.rejects(client.query("UPDATE payment_providers SET is_active = true WHERE code = 'faspay_snap'"));

  const donor = await client.query("INSERT INTO donors (nama, email) VALUES ('Donatur Contoh', 'sama@example.com') RETURNING id");
  const admin = await client.query("INSERT INTO users (nama, email, role, is_active) VALUES ('Admin Contoh', 'sama@example.com', 'SUPERADMIN', true) RETURNING id");
  assert.ok(donor.rows[0].id);
  assert.ok(admin.rows[0].id);

  const method = await client.query("SELECT id FROM payment_methods WHERE seed_key = 'demo-pay-va'");
  await assert.rejects(
    client.query(
      `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, base_amount, admin_fee, total_amount, status)
       VALUES ('T-BAD', $1, 'Contoh', 1000, 0, 999, 'PENDING')`,
      [method.rows[0].id],
    ),
  );
  await assert.rejects(
    client.query(
      `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, base_amount, admin_fee, total_amount, status, paid_at)
       VALUES ('T-PAID', $1, 'Contoh', 1000, 0, 1000, 'PAID', NULL)`,
      [method.rows[0].id],
    ),
  );

  await client.query("BEGIN");
  const invoice = await client.query(
    `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, base_amount, admin_fee, total_amount)
     VALUES ('T-OK', $1, 'Contoh', 10000, 0, 10000) RETURNING id`,
    [method.rows[0].id],
  );
  const campaign = await client.query("SELECT id FROM campaigns WHERE seed_key = 'demo-umum'");
  await client.query(
    "INSERT INTO transactions (invoice_id, campaign_id, amount) VALUES ($1, $2, 10000)",
    [invoice.rows[0].id, campaign.rows[0].id],
  );
  await client.query("COMMIT");
  await assert.rejects(
    client.query(
      `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, base_amount, admin_fee, total_amount)
       VALUES ('T-OK', $1, 'Contoh', 10000, 0, 10000)`,
      [method.rows[0].id],
    ),
  );

  await client.query("BEGIN");
  const bare = await client.query(
    `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, base_amount, admin_fee, total_amount)
     VALUES ('T-EMPTY', $1, 'Contoh', 5000, 0, 5000) RETURNING id`,
    [method.rows[0].id],
  );
  await assert.rejects(client.query("COMMIT"));
  await client.query("ROLLBACK");
  assert.ok(bare.rows[0].id);

  const affiliate = await client.query(
    "INSERT INTO affiliates (nama, email, status) VALUES ('Afiliasi Contoh', 'afiliasi@example.com', 'ACTIVE') RETURNING id",
  );
  const tx = await client.query("SELECT id FROM transactions LIMIT 1");
  await client.query(
    `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
     VALUES ($1, 'commission:1', 'commission_hold', 500, $2)`,
    [affiliate.rows[0].id, tx.rows[0].id],
  );
  await assert.rejects(
    client.query(
      `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
       VALUES ($1, 'commission:2', 'commission_hold', 500, $2)`,
      [affiliate.rows[0].id, tx.rows[0].id],
    ),
  );
  await assert.rejects(
    client.query("UPDATE affiliate_ledger SET amount_rupiah = 1 WHERE idempotency_key = 'commission:1'"),
  );

  const self = await client.query(
    "INSERT INTO affiliates (nama, email) VALUES ('Diri', 'tamu@example.com') RETURNING id",
  );
  await client.query("BEGIN");
  const selfInvoice = await client.query(
    `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, donor_email, base_amount, admin_fee, total_amount)
     VALUES ('T-SELF', $1, 'Tamu', 'tamu@example.com', 8000, 0, 8000) RETURNING id`,
    [method.rows[0].id],
  );
  const selfTx = await client.query(
    "INSERT INTO transactions (invoice_id, campaign_id, affiliate_id, amount) VALUES ($1, $2, $3, 8000) RETURNING id",
    [selfInvoice.rows[0].id, campaign.rows[0].id, self.rows[0].id],
  );
  await client.query("COMMIT");
  await assert.rejects(
    client.query(
      `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
       VALUES ($1, 'commission:self', 'commission_hold', 100, $2)`,
      [self.rows[0].id, selfTx.rows[0].id],
    ),
  );

  await client.end();
});

test("basis asing dan nama terlarang ditolak", async () => {
  const foreign = await recreate("digidonasi_foreign");
  await foreign.connect();
  await foreign.query("CREATE TABLE not_ours (id int)");
  await foreign.query("BEGIN");
  await assert.rejects(applySqlFile(foreign, join(process.cwd(), "lib/db/migrations/0000_foundation.sql")));
  await foreign.query("ROLLBACK");
  await foreign.end();

  const named = await recreate("darulhikam_sandbox");
  await named.connect();
  await named.query("BEGIN");
  await assert.rejects(applySqlFile(named, join(process.cwd(), "lib/db/migrations/0000_foundation.sql")));
  await named.query("ROLLBACK");
  await named.end();
  const admin = new pg.Client(adminConfig);
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS darulhikam_sandbox");
  await admin.end();
});
