import type { Sql } from "@/lib/db";
import { bookCommission, reverseCommission } from "@/lib/afiliasi/ledger";
import { expiryMinutes, type MappedStatus, type ProviderCode } from "@/lib/pembayaran/verify";

export class PaymentError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type InvoiceRow = { id: string; status: string; total_amount: string; created_at: string };

async function writeAudit(sql: Sql, input: { userId?: string | null; action: string; invoiceId: string; before: unknown; after: unknown; source: string }) {
  await sql(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, field_changed, value_before, value_after, source)
     VALUES ($1,$2,'invoices',$3,'status',$4::jsonb,$5::jsonb,$6)`,
    [input.userId ?? null, input.action, input.invoiceId, JSON.stringify(input.before), JSON.stringify(input.after), input.source],
  );
}

export async function applyProviderEvent(sql: Sql, input: { provider: ProviderCode; eventId: string; invoiceCode: string; amount: number; mapped: MappedStatus; now?: Date }) {
  const now = input.now ?? new Date();
  const rows = await sql<InvoiceRow>(`SELECT id, status, total_amount::text, created_at FROM invoices WHERE invoice_code = $1 FOR UPDATE`, [input.invoiceCode]);
  const invoice = rows[0];
  if (!invoice) throw new PaymentError("invoice_tidak_ada");
  if (Number(invoice.total_amount) !== input.amount) throw new PaymentError("nominal_tidak_sama");
  const age = now.getTime() - new Date(invoice.created_at).getTime();
  if (invoice.status === "PENDING" && age > expiryMinutes() * 60 * 1000) {
    await sql(`UPDATE invoices SET status = 'FAILED' WHERE id = $1 AND status = 'PENDING'`, [invoice.id]);
    await writeAudit(sql, { action: "expire", invoiceId: invoice.id, before: { status: "PENDING" }, after: { status: "FAILED", reason: "kedaluwarsa" }, source: "expiry" });
    return { applied: false, duplicate: false, status: "FAILED", reason: "kedaluwarsa" };
  }
  const inserted = await sql<{ id: string }>(
    `INSERT INTO payment_events (provider_code, provider_event_id, invoice_id, mapped_status, amount_rupiah)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (provider_code, provider_event_id) DO NOTHING RETURNING id`,
    [input.provider, input.eventId, invoice.id, input.mapped, input.amount],
  );
  if (!inserted[0]) return { applied: false, duplicate: true, status: invoice.status, reason: "duplikat" };
  if (invoice.status === "PAID") return { applied: false, duplicate: false, status: "PAID", reason: "sudah_lunas" };
  if (invoice.status !== "PENDING") return { applied: false, duplicate: false, status: invoice.status, reason: "urutan_tidak_sah" };
  if (input.mapped === "paid") {
    await sql(`UPDATE invoices SET status = 'PAID', paid_at = $2 WHERE id = $1 AND status = 'PENDING'`, [invoice.id, now.toISOString()]);
    await sql(
      `UPDATE campaign_stats s SET collected_amount = s.collected_amount + t.amount, donor_count = s.donor_count + 1
       FROM transactions t WHERE t.invoice_id = $1 AND t.campaign_id = s.campaign_id`,
      [invoice.id],
    );
    await writeAudit(sql, { action: "paid", invoiceId: invoice.id, before: { status: "PENDING" }, after: { status: "PAID", provider: input.provider, eventId: input.eventId }, source: "webhook" });
    await bookCommission(sql, invoice.id);
    return { applied: true, duplicate: false, status: "PAID", reason: "lunas" };
  }
  if (input.mapped === "failed") {
    await sql(`UPDATE invoices SET status = 'FAILED' WHERE id = $1 AND status = 'PENDING'`, [invoice.id]);
    await writeAudit(sql, { action: "failed", invoiceId: invoice.id, before: { status: "PENDING" }, after: { status: "FAILED", eventId: input.eventId }, source: "webhook" });
    return { applied: true, duplicate: false, status: "FAILED", reason: "gagal" };
  }
  return { applied: false, duplicate: false, status: "PENDING", reason: "masih_menunggu" };
}

export async function reconcileInvoice(sql: Sql, input: { invoiceCode: string; action: "cek" | "gagal" | "kedaluwarsa"; reason: string; userId: string; now?: Date }) {
  if (input.reason.trim().length < 3) throw new PaymentError("alasan_wajib");
  const now = input.now ?? new Date();
  const rows = await sql<InvoiceRow>(`SELECT id, status, total_amount::text, created_at FROM invoices WHERE invoice_code = $1 FOR UPDATE`, [input.invoiceCode]);
  const invoice = rows[0];
  if (!invoice) throw new PaymentError("invoice_tidak_ada");
  const before = { status: invoice.status };
  if (input.action === "cek") {
    await writeAudit(sql, { userId: input.userId, action: "reconcile_check", invoiceId: invoice.id, before, after: { status: invoice.status, reason: input.reason.trim() }, source: "manual" });
    return { status: invoice.status, changed: false };
  }
  if (invoice.status !== "PENDING") {
    await writeAudit(sql, { userId: input.userId, action: "reconcile_noop", invoiceId: invoice.id, before, after: { status: invoice.status, reason: input.reason.trim() }, source: "manual" });
    return { status: invoice.status, changed: false };
  }
  const expired = now.getTime() - new Date(invoice.created_at).getTime() > expiryMinutes() * 60 * 1000;
  if (input.action === "kedaluwarsa" && !expired) throw new PaymentError("belum_kedaluwarsa");
  await sql(`UPDATE invoices SET status = 'FAILED' WHERE id = $1 AND status = 'PENDING'`, [invoice.id]);
  await writeAudit(sql, { userId: input.userId, action: input.action === "kedaluwarsa" ? "reconcile_expire" : "reconcile_fail", invoiceId: invoice.id, before, after: { status: "FAILED", reason: input.reason.trim() }, source: "manual" });
  return { status: "FAILED", changed: true };
}

/** Pembalikan lunas. Bukan event gagal yang datang setelah lunas: itu tetap tidak mundur. */
export async function reversePaidInvoice(sql: Sql, input: { invoiceCode: string; reason: string; userId: string }) {
  if (input.reason.trim().length < 3) throw new PaymentError("alasan_wajib");
  const rows = await sql<InvoiceRow>(`SELECT id, status, total_amount::text, created_at FROM invoices WHERE invoice_code = $1 FOR UPDATE`, [input.invoiceCode]);
  const invoice = rows[0];
  if (!invoice) throw new PaymentError("invoice_tidak_ada");
  if (invoice.status !== "PAID") return { status: invoice.status, changed: false };
  await sql(`UPDATE invoices SET status = 'FAILED', paid_at = NULL WHERE id = $1 AND status = 'PAID'`, [invoice.id]);
  await sql(
    `UPDATE campaign_stats s
     SET collected_amount = GREATEST(0, s.collected_amount - t.amount),
         donor_count = GREATEST(0, s.donor_count - 1)
     FROM transactions t
     WHERE t.invoice_id = $1 AND t.campaign_id = s.campaign_id`,
    [invoice.id],
  );
  await reverseCommission(sql, invoice.id);
  await writeAudit(sql, {
    userId: input.userId,
    action: "reverse_paid",
    invoiceId: invoice.id,
    before: { status: "PAID" },
    after: { status: "FAILED", reason: input.reason.trim() },
    source: "manual",
  });
  return { status: "FAILED", changed: true };
}
