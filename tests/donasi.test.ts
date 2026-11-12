import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import pg from "pg";
import { applySqlFile } from "../lib/db/run-sql";
import { listCampaigns } from "../lib/donasi/catalog";
import { progressPercent } from "../components/public/campaign-card";
import { DonasiError, createCheckout, isUniqueViolation } from "../lib/donasi/checkout";
import { saveDonationBlock, saveOrg, setCampaignStatus } from "../lib/donasi/manage";
import type { Sql } from "../lib/db";

const admin = { host: "127.0.0.1", port: 5433, user: "postgres", database: "postgres" };

async function database() {
  const root = new pg.Client(admin);
  await root.connect();
  await root.query("DROP DATABASE IF EXISTS digidonasi_day3");
  await root.query("CREATE DATABASE digidonasi_day3");
  await root.end();
  const db = new pg.Client({ ...admin, database: "digidonasi_day3" });
  await db.connect();
  await db.query("BEGIN");
  await applySqlFile(db, join(process.cwd(), "lib/db/migrations/0000_foundation.sql"));
  await applySqlFile(db, join(process.cwd(), "drizzle/seed.sql"));
  await db.query("COMMIT");
  const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
  return { db, sql };
}

async function inTx<T>(databaseName: string, fn: (sql: Sql) => Promise<T>) {
  const db = new pg.Client({ ...admin, database: databaseName });
  await db.connect();
  try {
    await db.query("BEGIN");
    const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
    const result = await fn(sql);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

const pay = (input: Parameters<typeof createCheckout>[1]) => inTx("digidonasi_day3", (tx) => createCheckout(tx, input));

test("katalog, checkout, bundel, qurban, isolasi, dan halaman", async () => {
  const { db, sql } = await database();
  const seeded = await listCampaigns(sql, { pageSize: 50 });
  assert.equal(seeded.total, 8);
  const umum = seeded.rows.find((row) => row.slug === "demo-umum");
  assert.equal(Number(umum?.collected_amount), 86400000);
  assert.equal(String(umum?.image_url), "/seed/kampanye/pangan.webp");
  const filtered = await listCampaigns(sql, { category: "demo-kemanusiaan", pageSize: 50 });
  assert.equal(filtered.rows.every((row) => row.category_slug === "demo-kemanusiaan"), true);
  assert.equal(progressPercent(70, 100, false), 70);
  assert.equal(progressPercent(10, null, true), null);
  await setCampaignStatus(sql, "demo-zakat", "DRAFT");
  await setCampaignStatus(sql, "demo-tanpa-target", "DRAFT");
  await setCampaignStatus(sql, "demo-tanpa-batas", "DRAFT");
  const hidden = await listCampaigns(sql, { q: "zakat" });
  assert.equal(hidden.total, 0);
  const page = await listCampaigns(sql, { page: 2, pageSize: 2 });
  assert.equal(page.rows.length, 2);
  assert.equal(page.total, 5);

  const guest = await pay({ slug: "demo-umum", amount: 15000, donorName: "Tamu Contoh", donorEmail: "sama@example.com" });
  assert.equal(guest.provider, "mock");
  assert.match(guest.instruction, /mock/i);
  const guestRow = await sql<{ donor_id: string | null }>(`SELECT donor_id FROM invoices WHERE invoice_code = $1`, [guest.invoiceCode]);
  assert.equal(guestRow[0].donor_id, null);
  await db.query(`INSERT INTO donors (nama, email, google_sub) VALUES ('Donor A', 'a@example.com', 'sub-a')`);
  await db.query(`INSERT INTO donors (nama, email, google_sub) VALUES ('Donor B', 'b@example.com', 'sub-b')`);
  const donors = await sql<{ id: string; email: string }>(`SELECT id, email FROM donors ORDER BY email`);
  const owned = await pay( {
    slug: "demo-umum",
    amount: 20000,
    donorId: String(donors[0].id),
    sessionEmail: "a@example.com",
    sessionName: "Donor A",
    donorEmail: "b@example.com",
  });
  const ownedRow = await sql<{ donor_id: string; donor_email: string }>(`SELECT donor_id, donor_email FROM invoices WHERE invoice_code = $1`, [owned.invoiceCode]);
  assert.equal(String(ownedRow[0].donor_id), String(donors[0].id));
  assert.equal(ownedRow[0].donor_email, "a@example.com");
  const other = await pay( { slug: "demo-umum", amount: 12000, donorId: String(donors[1].id), sessionEmail: "b@example.com", sessionName: "Donor B" });
  const historyA = await sql<{ invoice_code: string }>(`SELECT invoice_code FROM invoices WHERE donor_id = $1`, [donors[0].id]);
  assert.deepEqual(historyA.map((row) => row.invoice_code), [owned.invoiceCode]);
  assert.notEqual(other.invoiceCode, owned.invoiceCode);

  await assert.rejects(pay( { slug: "demo-umum", amount: 1000, donorName: "Tamu" }), (error: unknown) => error instanceof DonasiError && error.code === "nominal_tidak_sah");
  await assert.rejects(pay( { slug: "demo-nominal-tetap", amount: 50000, qty: 1, donorName: "Tamu" }), (error: unknown) => error instanceof DonasiError);
  await assert.rejects(pay( { slug: "demo-umum", amount: 10000, qty: 0, donorName: "Tamu" }), (error: unknown) => error instanceof DonasiError && error.code === "jumlah_tidak_sah");

  const variant = await sql<{ id: string }>(`SELECT id FROM campaign_variants WHERE seed_key = 'demo-qurban-kambing'`);
  await assert.rejects(
    pay( { slug: "demo-qurban", variantId: Number(variant[0].id), qty: 1, names: [], donorName: "Tamu" }),
    (error: unknown) => error instanceof DonasiError && error.code === "nama_qurban_tidak_sesuai",
  );
  const qurban = await pay( { slug: "demo-qurban", variantId: Number(variant[0].id), qty: 1, names: ["Mudhohi Contoh"], donorName: "Tamu Qurban" });
  const names = await sql(`SELECT mudhohi_name FROM transaction_qurban_names n JOIN transactions t ON t.id = n.transaction_id JOIN invoices i ON i.id = t.invoice_id WHERE i.invoice_code = $1`, [qurban.invoiceCode]);
  assert.equal(names.length, 1);

  await assert.rejects(
    pay( { slug: "demo-bundel", donorName: "Tamu", lines: [{ slug: "demo-umum", qty: 1, amount: 20000 }] }),
    (error: unknown) => error instanceof DonasiError && error.code === "bundel_tidak_seimbang",
  );
  const bundle = await pay( {
    slug: "demo-bundel",
    donorName: "Tamu Bundel",
    lines: [
      { slug: "demo-umum", qty: 1, amount: 10000 },
      { slug: "demo-nominal-tetap", qty: 1, amount: 10000 },
    ],
  });
  const sum = await sql<{ n: string }>(
    `SELECT coalesce(sum(t.amount),0)::text AS n FROM transactions t JOIN invoices i ON i.id = t.invoice_id WHERE i.invoice_code = $1`,
    [bundle.invoiceCode],
  );
  assert.equal(sum[0].n, "20000");

  const saved = await saveOrg(sql, { nama: "Lembaga Sunting", namaSingkat: "LS", tagline: "Sunting", logoUrl: null, faviconUrl: null, primaryColor: "#112233", sidebarColor: "#112233", accentColor: "#445566" });
  assert.equal(saved && "nama" in saved ? saved.nama : "", "Lembaga Sunting");
  const block = await saveDonationBlock(sql, { seedKey: "donasi.header", heading: "Judul klien", body: "Isi klien", status: "ACTIVE" });
  assert.equal(block && "publication_status" in block ? block.publication_status : "", "ACTIVE");
  await db.query("BEGIN");
  await applySqlFile(db, join(process.cwd(), "drizzle/seed.sql"));
  await db.query("COMMIT");
  const kept = await sql<{ heading: string; publication_status: string }>(`SELECT heading, publication_status FROM donation_blocks WHERE seed_key = 'donasi.header'`);
  assert.equal(kept[0].heading, "Judul klien");
  const still = await sql<{ publication_status: string }>(`SELECT publication_status FROM campaigns WHERE slug = 'demo-umum'`);
  assert.equal(still[0].publication_status, "ACTIVE");
  await db.end();

  const [first, second] = await Promise.all([
    inTx("digidonasi_day3", async (tx) => { await createCheckout(tx, { slug: "demo-umum", amount: 11000, donorName: "Paralel A" }); }),
    inTx("digidonasi_day3", async (tx) => { await createCheckout(tx, { slug: "demo-umum", amount: 11000, donorName: "Paralel B" }); }),
  ]);
  assert.equal(first, undefined);
  assert.equal(second, undefined);
  const check = new pg.Client({ ...admin, database: "digidonasi_day3" });
  await check.connect();
  const codes = await check.query(`SELECT count(distinct invoice_code)::int AS n, count(*)::int AS rows FROM invoices`);
  assert.equal(codes.rows[0].n, codes.rows[0].rows);
  let collided = false;
  try {
    await inTx("digidonasi_day3", async (tx) => { await createCheckout(tx, { slug: "demo-umum", amount: 10000, donorName: "Bentrok", invoiceCode: "INV-SAMA" }); });
    await inTx("digidonasi_day3", async (tx) => { await createCheckout(tx, { slug: "demo-umum", amount: 10000, donorName: "Bentrok", invoiceCode: "INV-SAMA" }); });
  } catch (error) {
    collided = isUniqueViolation(error);
  }
  assert.equal(collided, true);
  await check.end();
});
