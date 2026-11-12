import { randomBytes } from "node:crypto";
import type { Sql } from "@/lib/db";

export class AffiliateError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type Balance = { pending: number; available: number; reserved: number; settled: number };

async function configNumber(sql: Sql, key: string, fallback: number) {
  const rows = await sql<{ value: string }>(`SELECT value FROM app_config WHERE key = $1`, [key]);
  const number = Number(rows[0]?.value);
  return Number.isFinite(number) ? number : fallback;
}

export function commissionOf(principal: number, pct: number) {
  if (principal <= 0 || pct <= 0) return 0;
  return Math.floor((principal * Math.round(pct * 100)) / 10000);
}

export async function recordClick(sql: Sql, input: { affiliateId: string; slug: string; now?: Date }) {
  const rows = await sql<{ id: string; campaign_id: string }>(
    `SELECT a.id::text, c.id::text AS campaign_id
     FROM affiliates a
     JOIN campaigns c ON c.slug = $2 AND c.publication_status = 'ACTIVE'
     WHERE a.id = $1 AND a.status = 'ACTIVE'`,
    [input.affiliateId, input.slug],
  );
  if (!rows[0]) return null;
  const token = randomBytes(16).toString("hex");
  await sql(
    `INSERT INTO affiliate_clicks (affiliate_id, campaign_id, click_token, created_at)
     VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()))`,
    [rows[0].id, rows[0].campaign_id, token, input.now?.toISOString() ?? null],
  );
  return { token, campaignId: rows[0].campaign_id, affiliateId: rows[0].id };
}

export async function resolveClick(sql: Sql, token: string, now = new Date()) {
  const days = await configNumber(sql, "attribution_window_days", 30);
  const rows = await sql<{ affiliate_id: string; campaign_id: string; email: string }>(
    `SELECT c.affiliate_id::text, c.campaign_id::text, a.email
     FROM affiliate_clicks c
     JOIN affiliates a ON a.id = c.affiliate_id
     WHERE c.click_token = $1
       AND a.status = 'ACTIVE'
       AND c.created_at >= $2::timestamptz - make_interval(days => $3::int)`,
    [token, now.toISOString(), days],
  );
  return rows[0] ?? null;
}

export async function bookCommission(sql: Sql, invoiceId: string) {
  const fallback = await configNumber(sql, "default_commission_pct", 0);
  const lines = await sql<{ id: string; affiliate_id: string; campaign_id: string; amount: string; donor_email: string | null; affiliate_email: string }>(
    `SELECT t.id::text, t.affiliate_id::text, t.campaign_id::text, t.amount::text, i.donor_email, a.email AS affiliate_email
     FROM transactions t
     JOIN invoices i ON i.id = t.invoice_id
     JOIN affiliates a ON a.id = t.affiliate_id
     WHERE t.invoice_id = $1 AND t.affiliate_id IS NOT NULL AND i.status = 'PAID' AND a.status = 'ACTIVE'`,
    [invoiceId],
  );
  for (const line of lines) {
    if (line.donor_email && line.donor_email.toLowerCase() === line.affiliate_email.toLowerCase()) continue;
    const pctRows = await sql<{ pct: string }>(
      `SELECT COALESCE(
         (SELECT commission_pct FROM affiliate_campaign_commissions WHERE affiliate_id = $1 AND campaign_id = $2),
         (SELECT base_commission_pct FROM campaigns WHERE id = $2),
         $3::numeric
       )::text AS pct`,
      [line.affiliate_id, line.campaign_id, fallback],
    );
    const amount = commissionOf(Number(line.amount), Number(pctRows[0]?.pct ?? 0));
    if (amount <= 0) continue;
    await sql(
      `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
       VALUES ($1, $2, 'commission_hold', $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [line.affiliate_id, `hold:${line.id}`, amount, line.id],
    );
  }
}

export async function releaseDue(sql: Sql, now = new Date()) {
  const days = await configNumber(sql, "commission_hold_days", 14);
  const due = await sql<{ id: string; affiliate_id: string; amount: string }>(
    `SELECT l.transaction_id::text AS id, l.affiliate_id::text, l.amount_rupiah::text AS amount
     FROM affiliate_ledger l
     WHERE l.movement = 'commission_hold'
       AND l.created_at <= $1::timestamptz - make_interval(days => $2::int)
       AND NOT EXISTS (
         SELECT 1 FROM affiliate_ledger x
         WHERE x.transaction_id = l.transaction_id
           AND x.movement IN ('hold_to_available', 'reverse_pending', 'reverse_available')
       )`,
    [now.toISOString(), days],
  );
  for (const row of due) {
    await sql(
      `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
       VALUES ($1, $2, 'hold_to_available', $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [row.affiliate_id, `release:${row.id}`, row.amount, row.id],
    );
  }
  return due.length;
}

export async function reverseCommission(sql: Sql, invoiceId: string) {
  const lines = await sql<{ id: string; affiliate_id: string; amount: string; movement: string }>(
    `SELECT t.id::text, h.affiliate_id::text, h.amount_rupiah::text AS amount,
            CASE WHEN EXISTS (
              SELECT 1 FROM affiliate_ledger r WHERE r.transaction_id = t.id AND r.movement = 'hold_to_available'
            ) THEN 'reverse_available' ELSE 'reverse_pending' END AS movement
     FROM transactions t
     JOIN affiliate_ledger h ON h.transaction_id = t.id AND h.movement = 'commission_hold'
     WHERE t.invoice_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM affiliate_ledger x
         WHERE x.transaction_id = t.id AND x.movement IN ('reverse_pending', 'reverse_available')
       )`,
    [invoiceId],
  );
  for (const line of lines) {
    await sql(
      `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, transaction_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [line.affiliate_id, `reverse:${line.id}`, line.movement, line.amount, line.id],
    );
  }
  return lines.length;
}

export async function balanceOf(sql: Sql, affiliateId: string): Promise<Balance> {
  const rows = await sql<{ pending: string; available: string; reserved: string; settled: string }>(
    `SELECT
       coalesce(sum(d.pending), 0)::text AS pending,
       coalesce(sum(d.available), 0)::text AS available,
       coalesce(sum(d.reserved), 0)::text AS reserved,
       coalesce(sum(d.settled), 0)::text AS settled
     FROM affiliate_ledger l
     CROSS JOIN LATERAL affiliate_ledger_deltas(l.movement, l.amount_rupiah) d
     WHERE l.affiliate_id = $1`,
    [affiliateId],
  );
  const row = rows[0];
  return {
    pending: Number(row?.pending ?? 0),
    available: Number(row?.available ?? 0),
    reserved: Number(row?.reserved ?? 0),
    settled: Number(row?.settled ?? 0),
  };
}

export async function requestPayout(sql: Sql, input: { affiliateId: string; amount: number; key: string; now?: Date }) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new AffiliateError("nominal_tidak_sah");
  const locked = await sql<{ id: string }>(`SELECT id::text FROM affiliates WHERE id = $1 AND status = 'ACTIVE' FOR UPDATE`, [input.affiliateId]);
  if (!locked[0]) throw new AffiliateError("afiliasi_tidak_aktif");
  await releaseDue(sql, input.now ?? new Date());
  const existing = await sql<{ id: string; status: string }>(`SELECT id::text, status FROM payout_requests WHERE idempotency_key = $1`, [input.key]);
  if (existing[0]) return { id: existing[0].id, status: existing[0].status, duplicate: true };
  const balance = await balanceOf(sql, input.affiliateId);
  if (balance.available < input.amount) throw new AffiliateError("saldo_tidak_cukup");
  const payout = await sql<{ id: string }>(
    `INSERT INTO payout_requests (affiliate_id, idempotency_key, amount_rupiah, status)
     VALUES ($1, $2, $3, 'requested') RETURNING id::text`,
    [input.affiliateId, input.key, input.amount],
  );
  await sql(
    `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, payout_request_id)
     VALUES ($1, $2, 'payout_reserve', $3, $4)`,
    [input.affiliateId, `reserve:${payout[0].id}`, input.amount, payout[0].id],
  );
  return { id: payout[0].id, status: "requested", duplicate: false };
}

export async function settlePayout(sql: Sql, input: { payoutId: string; settlementRef: string; userId: string }) {
  const ref = input.settlementRef.trim();
  if (ref.length < 3) throw new AffiliateError("referensi_wajib");
  const rows = await sql<{ id: string; affiliate_id: string; amount: string; status: string }>(
    `SELECT id::text, affiliate_id::text, amount_rupiah::text AS amount, status
     FROM payout_requests WHERE id = $1 FOR UPDATE`,
    [input.payoutId],
  );
  const row = rows[0];
  if (!row) throw new AffiliateError("tarik_tidak_ada");
  if (row.status === "settled") return { status: "settled", duplicate: true };
  if (row.status !== "requested") throw new AffiliateError("status_tidak_sah");
  await sql(`UPDATE payout_requests SET status = 'settled', settlement_ref = $2 WHERE id = $1 AND status = 'requested'`, [row.id, ref]);
  await sql(
    `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, payout_request_id)
     VALUES ($1, $2, 'payout_settle', $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [row.affiliate_id, `settle:${row.id}`, row.amount, row.id],
  );
  await sql(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, field_changed, value_before, value_after, source)
     VALUES ($1, 'payout_settle', 'payout_requests', $2, 'status', $3::jsonb, $4::jsonb, 'manual')`,
    [input.userId, row.id, JSON.stringify({ status: "requested" }), JSON.stringify({ status: "settled", settlementRef: ref, manual: true })],
  );
  return { status: "settled", duplicate: false };
}

export async function rejectPayout(sql: Sql, input: { payoutId: string; reason: string; userId: string }) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new AffiliateError("alasan_wajib");
  const rows = await sql<{ id: string; affiliate_id: string; amount: string; status: string }>(
    `SELECT id::text, affiliate_id::text, amount_rupiah::text AS amount, status
     FROM payout_requests WHERE id = $1 FOR UPDATE`,
    [input.payoutId],
  );
  const row = rows[0];
  if (!row) throw new AffiliateError("tarik_tidak_ada");
  if (row.status === "rejected") return { status: "rejected", duplicate: true };
  if (row.status !== "requested") throw new AffiliateError("status_tidak_sah");
  await sql(`UPDATE payout_requests SET status = 'rejected' WHERE id = $1 AND status = 'requested'`, [row.id]);
  await sql(
    `INSERT INTO affiliate_ledger (affiliate_id, idempotency_key, movement, amount_rupiah, payout_request_id)
     VALUES ($1, $2, 'payout_release', $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [row.affiliate_id, `release-payout:${row.id}`, row.amount, row.id],
  );
  await sql(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, field_changed, value_before, value_after, source)
     VALUES ($1, 'payout_reject', 'payout_requests', $2, 'status', $3::jsonb, $4::jsonb, 'manual')`,
    [input.userId, row.id, JSON.stringify({ status: "requested" }), JSON.stringify({ status: "rejected", reason })],
  );
  return { status: "rejected", duplicate: false };
}

export async function setAffiliateStatus(sql: Sql, input: { affiliateId: string; status: "PENDING" | "ACTIVE" | "SUSPENDED"; userId: string }) {
  const rows = await sql<{ id: string; status: string }>(
    `UPDATE affiliates SET status = $2 WHERE id = $1 AND status IS DISTINCT FROM $2 RETURNING id::text, status`,
    [input.affiliateId, input.status],
  );
  if (!rows[0]) {
    const current = await sql<{ status: string }>(`SELECT status FROM affiliates WHERE id = $1`, [input.affiliateId]);
    if (!current[0]) throw new AffiliateError("afiliasi_tidak_ada");
    return { status: current[0].status, duplicate: true };
  }
  await sql(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, field_changed, value_after, source)
     VALUES ($1, 'affiliate_status', 'affiliates', $2, 'status', $3::jsonb, 'manual')`,
    [input.userId, rows[0].id, JSON.stringify({ status: rows[0].status })],
  );
  return { status: rows[0].status, duplicate: false };
}
