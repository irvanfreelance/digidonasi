import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import pg from "pg";
import { applySqlFile } from "../lib/db/run-sql";
import type { Sql } from "../lib/db";
import { createCheckout } from "../lib/donasi/checkout";
import { applyProviderEvent, reversePaidInvoice } from "../lib/pembayaran/apply";
import {
  AffiliateError,
  balanceOf,
  bookCommission,
  recordClick,
  releaseDue,
  requestPayout,
  resolveClick,
  settlePayout,
} from "../lib/afiliasi/ledger";

const admin = { host: "127.0.0.1", port: 5433, user: "postgres", database: "postgres" };
const name = "digidonasi_day5";
const day = 86_400_000;

async function database() {
  const root = new pg.Client(admin);
  await root.connect();
  await root.query(`DROP DATABASE IF EXISTS ${name}`);
  await root.query(`CREATE DATABASE ${name}`);
  await root.end();
  const db = new pg.Client({ ...admin, database: name });
  await db.connect();
  await db.query("BEGIN");
  await applySqlFile(db, join(process.cwd(), "lib/db/migrations/0000_foundation.sql"));
  await applySqlFile(db, join(process.cwd(), "drizzle/seed.sql"));
  await db.query("COMMIT");
  const sql: Sql = async (text, params = []) => (await db.query(text, params)).rows;
  return { db, sql };
}

async function inTx<T>(fn: (sql: Sql) => Promise<T>) {
  const db = new pg.Client({ ...admin, database: name });
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

test("atribusi 30 hari, tahan 14 hari, komisi ganda, pembalikan, dan tarik bersamaan", async () => {
  const { db, sql } = await database();
  const affiliate = await sql<{ id: string; email: string }>(
    `INSERT INTO affiliates (nama, email, status) VALUES ('Uji Aktif', 'uji.afiliasi@example.com', 'ACTIVE') RETURNING id::text, email`,
  );
  const other = await sql<{ id: string }>(
    `INSERT INTO affiliates (nama, email, status) VALUES ('Uji Lain', 'lain.afiliasi@example.com', 'ACTIVE') RETURNING id::text`,
  );
  await sql(
    `INSERT INTO affiliate_campaign_commissions (affiliate_id, campaign_id, commission_pct)
     SELECT $1, id, 10 FROM campaigns WHERE slug = 'demo-umum'`,
    [affiliate[0].id],
  );
  const t0 = new Date("2026-03-01T00:00:00.000Z");
  const click = await recordClick(sql, { affiliateId: affiliate[0].id, slug: "demo-umum", now: t0 });
  assert.ok(click);
  assert.equal(await resolveClick(sql, click.token, new Date(t0.getTime() + 29 * day)) !== null, true);
  assert.equal(await resolveClick(sql, click.token, new Date(t0.getTime() + 31 * day)), null);
  const later = await recordClick(sql, { affiliateId: other[0].id, slug: "demo-umum", now: new Date(t0.getTime() + day) });
  assert.ok(later);

  const missed = await inTx((tx) => createCheckout(tx, {
    slug: "demo-umum", amount: 20000, donorName: "Tamu Lewat", donorEmail: "lewat@example.com",
    clickToken: click.token, now: new Date(t0.getTime() + 31 * day),
  }));
  const missedRow = await sql<{ affiliate_id: string | null }>(
    `SELECT t.affiliate_id::text FROM transactions t JOIN invoices i ON i.id = t.invoice_id WHERE i.invoice_code = $1`,
    [missed.invoiceCode],
  );
  assert.equal(missedRow[0].affiliate_id, null);

  const paid = await inTx((tx) => createCheckout(tx, {
    slug: "demo-umum", amount: 100000, donorName: "Tamu Baik", donorEmail: "tamu.baik@example.com",
    clickToken: click.token, now: new Date(t0.getTime() + 10 * day),
  }));
  await inTx((tx) => applyProviderEvent(tx, { provider: "xendit", eventId: "aff-1", invoiceCode: paid.invoiceCode, amount: 100000, mapped: "paid" }));
  const paidId = await sql<{ id: string }>(`SELECT id::text FROM invoices WHERE invoice_code = $1`, [paid.invoiceCode]);
  await inTx((tx) => bookCommission(tx, paidId[0].id));
  const holds = await sql<{ n: number }>(
    `SELECT count(*)::int AS n FROM affiliate_ledger WHERE affiliate_id = $1 AND movement = 'commission_hold'`,
    [affiliate[0].id],
  );
  assert.equal(holds[0].n, 1);
  assert.equal((await balanceOf(sql, affiliate[0].id)).pending, 10000);
  assert.equal((await balanceOf(sql, other[0].id)).pending, 0);

  const freshOther = await recordClick(sql, { affiliateId: other[0].id, slug: "demo-umum", now: new Date() });
  assert.ok(freshOther);
  const last = await inTx((tx) => createCheckout(tx, {
    slug: "demo-umum", amount: 10000, donorName: "Tamu Akhir", donorEmail: "akhir@example.com", clickToken: freshOther.token, now: new Date(),
  }));
  const lastRow = await sql<{ affiliate_id: string }>(
    `SELECT t.affiliate_id::text FROM transactions t JOIN invoices i ON i.id = t.invoice_id WHERE i.invoice_code = $1`,
    [last.invoiceCode],
  );
  assert.equal(lastRow[0].affiliate_id, other[0].id);

  const freshSelf = await recordClick(sql, { affiliateId: affiliate[0].id, slug: "demo-umum", now: new Date() });
  assert.ok(freshSelf);
  const self = await inTx((tx) => createCheckout(tx, {
    slug: "demo-umum", amount: 10000, donorName: "Uji Aktif", donorEmail: affiliate[0].email, clickToken: freshSelf.token, now: new Date(),
  }));
  const selfRow = await sql<{ affiliate_id: string | null }>(
    `SELECT t.affiliate_id::text FROM transactions t JOIN invoices i ON i.id = t.invoice_id WHERE i.invoice_code = $1`,
    [self.invoiceCode],
  );
  assert.equal(selfRow[0].affiliate_id, null);

  assert.equal(await releaseDue(sql, new Date(Date.now() + 13 * day)), 0);
  assert.equal(await releaseDue(sql, new Date(Date.now() + 14 * day + 10_000)), 1);
  assert.equal(await releaseDue(sql, new Date(Date.now() + 20 * day)), 0);
  assert.equal((await balanceOf(sql, affiliate[0].id)).available, 10000);

  const user = await sql<{ id: string }>(
    `INSERT INTO users (nama, email, role, is_active) VALUES ('Admin Uji', 'admin-afiliasi@example.com', 'SUPERADMIN', true) RETURNING id::text`,
  );
  await inTx((tx) => reversePaidInvoice(tx, { invoiceCode: paid.invoiceCode, reason: "Donasi dibatalkan", userId: user[0].id }));
  await inTx((tx) => reversePaidInvoice(tx, { invoiceCode: paid.invoiceCode, reason: "Donasi dibatalkan", userId: user[0].id }));
  const reverses = await sql<{ n: number }>(`SELECT count(*)::int AS n FROM affiliate_ledger WHERE movement = 'reverse_available'`);
  assert.equal(reverses[0].n, 1);
  assert.equal((await balanceOf(sql, affiliate[0].id)).available, 0);

  const fresh = await recordClick(sql, { affiliateId: affiliate[0].id, slug: "demo-umum", now: new Date() });
  assert.ok(fresh);
  const again = await inTx((tx) => createCheckout(tx, {
    slug: "demo-umum", amount: 100000, donorName: "Tamu Dua", donorEmail: "dua@example.com", clickToken: fresh.token, now: new Date(),
  }));
  await inTx((tx) => applyProviderEvent(tx, { provider: "xendit", eventId: "aff-2", invoiceCode: again.invoiceCode, amount: 100000, mapped: "paid" }));
  assert.equal(await releaseDue(sql, new Date(Date.now() + 15 * day)), 1);
  const results = await Promise.allSettled([
    inTx((tx) => requestPayout(tx, { affiliateId: affiliate[0].id, amount: 10000, key: "tarik-a" })),
    inTx((tx) => requestPayout(tx, { affiliateId: affiliate[0].id, amount: 10000, key: "tarik-b" })),
  ]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(results.some((item) => item.status === "rejected" && item.reason instanceof AffiliateError), true);
  const after = await balanceOf(sql, affiliate[0].id);
  assert.equal(after.available, 0);
  assert.equal(after.reserved, 10000);
  const payout = await sql<{ id: string }>(`SELECT id::text FROM payout_requests WHERE affiliate_id = $1 AND status = 'requested'`, [affiliate[0].id]);
  await inTx((tx) => settlePayout(tx, { payoutId: payout[0].id, settlementRef: "TRF-LEN-001", userId: user[0].id }));
  const audit = await sql<{ n: number }>(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'payout_settle' AND source = 'manual'`);
  assert.equal(audit[0].n, 1);
  assert.equal((await balanceOf(sql, affiliate[0].id)).settled, 10000);
  assert.equal((await balanceOf(sql, other[0].id)).settled, 0);
  await db.end();
});
