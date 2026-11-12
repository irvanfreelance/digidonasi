import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import test from "node:test";
import pg from "pg";
import { POST as xendit } from "../app/api/webhooks/xendit/route";
import { POST as midtrans } from "../app/api/webhooks/midtrans/route";
import { applySqlFile } from "../lib/db/run-sql";
import { createCheckout } from "../lib/donasi/checkout";
import { setCampaignStatus } from "../lib/donasi/manage";
import { applyProviderEvent, reconcileInvoice } from "../lib/pembayaran/apply";
import { createCharge, faspayRejected, midtransSignature, verifyXenditToken } from "../lib/pembayaran/verify";
import type { Sql } from "../lib/db";

const admin = { host: "127.0.0.1", port: 5433, user: "postgres", database: "postgres" };
const token = "token-uji-xendit";
const serverKey = "kunci-uji-midtrans";

async function setup() {
  const root = new pg.Client(admin);
  await root.connect();
  await root.query("DROP DATABASE IF EXISTS digidonasi_pay");
  await root.query("CREATE DATABASE digidonasi_pay");
  await root.end();
  const db = new pg.Client({ ...admin, database: "digidonasi_pay" });
  await db.connect();
  await db.query("BEGIN");
  await applySqlFile(db, join(process.cwd(), "lib/db/migrations/0000_foundation.sql"));
  await applySqlFile(db, join(process.cwd(), "drizzle/seed.sql"));
  await db.query("COMMIT");
  const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
  await setCampaignStatus(sql, "demo-umum", "ACTIVE");
  await db.query(`UPDATE payment_methods SET is_active = true WHERE code = 'demo-va'`);
  await db.query(`INSERT INTO users (nama, email, role, is_active) VALUES ('Admin Uji', 'admin-uji@example.com', 'SUPERADMIN', true)`);
  return db;
}

async function pay(db: pg.Client, amount = 15000) {
  await db.query("BEGIN");
  const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
  const invoice = await createCheckout(sql, { slug: "demo-umum", amount, donorName: "Pembayar Contoh", methodCode: "demo-va" });
  await db.query("COMMIT");
  return invoice;
}

test("tanda tangan, duplikat, urutan, nominal, kedaluwarsa, dan rekonsiliasi", async () => {
  assert.equal(faspayRejected("faspay_snap"), true);
  assert.equal(verifyXenditToken("salah", token), false);
  assert.equal(verifyXenditToken(token, token), true);
  const signature = midtransSignature("INV1", "200", "15000", serverKey);
  assert.notEqual(signature, midtransSignature("INV1", "200", "15000", "lain"));
  let called = false;
  const charge = await createCharge({ provider: "xendit", invoiceCode: "INV-UJI", amount: 15000 }, async () => {
    called = true;
    return new Response("{}");
  });
  assert.equal(called, false);
  assert.match(charge.providerRef, /^mock-xendit-/);
  assert.equal(charge.live, false);

  const db = await setup();
  const invoice = await pay(db);
  const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
  process.env.XENDIT_CALLBACK_TOKEN = token;
  process.env.MIDTRANS_SERVER_KEY = serverKey;
  process.env.DATABASE_URL = "postgresql://postgres@127.0.0.1:5433/digidonasi_pay";
  const bad = await xendit(new Request("http://localhost/api/webhooks/xendit", { method: "POST", headers: { "x-callback-token": "salah" }, body: "{}" }));
  assert.equal(bad.status, 401);
  const mismatch = await xendit(new Request("http://localhost/api/webhooks/xendit", {
    method: "POST",
    headers: { "x-callback-token": token, "content-type": "application/json" },
    body: JSON.stringify({ id: "evt-salah", external_id: invoice.invoiceCode, amount: 1, status: "PAID" }),
  }));
  assert.equal(mismatch.status, 400);
  const paid = await xendit(new Request("http://localhost/api/webhooks/xendit", {
    method: "POST",
    headers: { "x-callback-token": token, "content-type": "application/json" },
    body: JSON.stringify({ id: "evt-1", external_id: invoice.invoiceCode, amount: 15000, status: "PAID" }),
  }));
  assert.equal(paid.status, 200);
  const replay = await xendit(new Request("http://localhost/api/webhooks/xendit", {
    method: "POST",
    headers: { "x-callback-token": token, "content-type": "application/json" },
    body: JSON.stringify({ id: "evt-1", external_id: invoice.invoiceCode, amount: 15000, status: "PAID" }),
  }));
  const replayBody = (await replay.json()) as { duplicate: boolean };
  assert.equal(replayBody.duplicate, true);
  const late = await xendit(new Request("http://localhost/api/webhooks/xendit", {
    method: "POST",
    headers: { "x-callback-token": token, "content-type": "application/json" },
    body: JSON.stringify({ id: "evt-2", external_id: invoice.invoiceCode, amount: 15000, status: "FAILED" }),
  }));
  const lateBody = (await late.json()) as { status: string };
  assert.equal(lateBody.status, "PAID");
  const stats = await db.query(`SELECT collected_amount::text FROM campaign_stats WHERE campaign_id = (SELECT id FROM campaigns WHERE slug = 'demo-umum')`);
  const afterPaid = String(86400000 + 15000);
  assert.equal(stats.rows[0].collected_amount, afterPaid);

  const second = await pay(db, 20000);
  await db.query("BEGIN");
  const failed = await applyProviderEvent(sql, { provider: "midtrans", eventId: "mt-fail", invoiceCode: second.invoiceCode, amount: 20000, mapped: "failed" });
  assert.equal(failed.status, "FAILED");
  const ordered = await applyProviderEvent(sql, { provider: "midtrans", eventId: "mt-late", invoiceCode: second.invoiceCode, amount: 20000, mapped: "paid" });
  assert.equal(ordered.reason, "urutan_tidak_sah");
  await db.query("COMMIT");
  const gross = "20000";
  const badSign = await midtrans(new Request("http://localhost/api/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order_id: second.invoiceCode, transaction_id: "mt-bad", transaction_status: "settlement", status_code: "200", gross_amount: gross, signature_key: "bukan" }),
  }));
  assert.equal(badSign.status, 401);
  const goodSign = midtransSignature(second.invoiceCode, "200", gross, serverKey);
  assert.equal(goodSign, createHash("sha512").update(`${second.invoiceCode}200${gross}${serverKey}`).digest("hex"));

  const third = await pay(db, 18000);
  await db.query(`UPDATE invoices SET created_at = now() - interval '3 days' WHERE invoice_code = $1`, [third.invoiceCode]);
  await db.query("BEGIN");
  const expired = await applyProviderEvent(sql, { provider: "xendit", eventId: "evt-exp", invoiceCode: third.invoiceCode, amount: 18000, mapped: "paid" });
  assert.equal(expired.reason, "kedaluwarsa");
  await db.query("COMMIT");
  const still = await db.query(`SELECT collected_amount::text FROM campaign_stats WHERE campaign_id = (SELECT id FROM campaigns WHERE slug = 'demo-umum')`);
  assert.equal(still.rows[0].collected_amount, afterPaid);

  const fourth = await pay(db, 16000);
  const user = await db.query(`SELECT id FROM users WHERE email = 'admin-uji@example.com'`);
  await db.query("BEGIN");
  const checked = await reconcileInvoice(sql, { invoiceCode: fourth.invoiceCode, action: "cek", reason: "Cek ulang tanpa ubah uang", userId: String(user.rows[0].id) });
  assert.equal(checked.changed, false);
  const marked = await reconcileInvoice(sql, { invoiceCode: fourth.invoiceCode, action: "gagal", reason: "Tidak ada dana masuk", userId: String(user.rows[0].id) });
  assert.equal(marked.status, "FAILED");
  await db.query("COMMIT");
  const audit = await db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE source = 'manual'`);
  const after = await db.query(`SELECT collected_amount::text FROM campaign_stats WHERE campaign_id = (SELECT id FROM campaigns WHERE slug = 'demo-umum')`);
  assert.equal(Number(audit.rows[0].n) >= 2, true);
  assert.equal(after.rows[0].collected_amount, afterPaid);
  await db.end();
  delete process.env.DATABASE_URL;
});
