import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { replaceTemplateVars } from '@/lib/email-templates';
import { parseManualAccount, fillInstructionPlaceholders } from '@/lib/payment-instructions';
import { formatIDR } from '@/lib/utils';

/**
 * QStash handler: send checkout pending email for VA & manual transfer.
 * Payload: { invoiceCode }
 * Idempotent via invoices.is_email_checkout_sent.
 * On SMTP failure returns 502 so QStash retries.
 * On QStash failure at trigger time, a PENDING_RETRY row was inserted into
 * notification_logs and will be retried by /api/cron/retry-notifications.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();

    // Verify QStash signature when keys are configured
    const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const next = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (current && next) {
      const ok = await new Receiver({ currentSigningKey: current, nextSigningKey: next })
        .verify({ signature: req.headers.get('upstash-signature') || '', body: raw })
        .catch(() => false);
      if (!ok) return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[send-email-checkout] QSTASH signing keys not set — request signature not verified');
    }

    const { invoiceCode } = JSON.parse(raw || '{}');
    const m = typeof invoiceCode === 'string' ? invoiceCode.match(/^INV-(\d{4})(\d{2})\d{2}-[A-Z0-9]+$/i) : null;
    if (!m) return NextResponse.json({ status: 'error', message: 'Invalid invoiceCode' }, { status: 400 });

    const sfx = `y${m[1]}m${m[2]}`;
    const [ic] = await Promise.all([
      query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.invoices_${sfx}`]),
    ]);
    const invTable = ic[0].e ? `invoices_${sfx}` : 'invoices';

    const rows = await query(`
      SELECT i.id, i.invoice_code, i.status, i.donor_name_snapshot, i.donor_email,
             i.base_amount, i.total_amount, i.va_number, i.is_email_checkout_sent,
             pm.name AS payment_method_name, pm.type AS payment_method_type,
             pm.code AS payment_method_code, pm.id AS payment_method_id
      FROM "${invTable}" i
      LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.invoice_code = $1
    `, [invoiceCode]);

    if (rows.length === 0) return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });
    const inv = rows[0];

    if (inv.is_email_checkout_sent) return NextResponse.json({ status: 'skipped', message: 'Email already sent' });
    if (!inv.donor_email) return NextResponse.json({ status: 'skipped', message: 'No email address' });

    // Fetch notification template from DB
    const tmplRows = await query(
      `SELECT COALESCE(subject, '') AS subject, message_content FROM notification_templates WHERE event_trigger = 'checkout_pending' AND channel = 'EMAIL' AND is_active = true LIMIT 1`
    ).catch(() => []);
    if (tmplRows.length === 0) {
      return NextResponse.json({ status: 'skipped', message: 'No active checkout_pending email template' });
    }
    const tmpl = tmplRows[0];

    // Build payment instructions string
    const pmType = (inv.payment_method_type || '').toLowerCase();
    let vaNumber = inv.va_number || '-';
    let bankName = inv.payment_method_name || '-';
    let rekening = '-';
    let instruksiHtml = '';

    // For manual transfer: extract rekening from va_number or payment_method.code (format: "rekening|nama")
    if (pmType.includes('manual')) {
      const account = parseManualAccount(inv.va_number, inv.payment_method_code);
      if (account) {
        rekening = account.rekening;
        vaNumber = account.rekening;
      }
    }

    // Fetch payment instructions
    const instrRows = await query(
      `SELECT title, content FROM payment_instructions WHERE payment_method_id = $1 ORDER BY sort_order ASC LIMIT 3`,
      [inv.payment_method_id]
    ).catch(() => []);

    if (instrRows.length > 0) {
      const account = parseManualAccount(inv.va_number, inv.payment_method_code);
      const filledRows = fillInstructionPlaceholders(instrRows as { title: string; content: string }[], account);
      instruksiHtml = filledRows
        .map((r) => `<strong>${r.title}</strong>\n${r.content}`)
        .join('\n\n');
    }

    const uniqueCode = Number(inv.total_amount) - Number(inv.base_amount);
    const manualAcc = pmType.includes('manual') ? parseManualAccount(inv.va_number, inv.payment_method_code) : null;
    const vars: Record<string, string> = {
      nama: inv.donor_name_snapshot || 'Donatur',
      nominal: formatIDR(Number(inv.base_amount)),
      invoice_code: inv.invoice_code,
      metode: inv.payment_method_name || '-',
      va_number: vaNumber,
      bank_name: bankName,
      rekening,
      atas_nama: manualAcc?.atasNama || '-',
      instruksi: instruksiHtml,
      total_transfer: formatIDR(Number(inv.total_amount)),
    };

    const subject = replaceTemplateVars(tmpl.subject, vars);
    const html = replaceTemplateVars(tmpl.message_content, vars);
    const text = `Donasi ${vars.nominal} (${invoiceCode})\nTotal Transfer: ${vars.total_transfer}\nNomor VA/Rekening: ${vaNumber}`;

    let emailStatus = 'SUCCESS';
    let emailResponse: any;
    try {
      emailResponse = await sendEmail({ to: inv.donor_email, subject, html, text });
    } catch (err: any) {
      emailStatus = 'FAILED';
      emailResponse = { error: err.message };
    }

    await query(`
      INSERT INTO notification_logs (template_id, invoice_code, recipient, channel, request_payload, response_payload, status)
      SELECT nt.id, $1, $2, 'EMAIL', $3, $4, $5
      FROM notification_templates nt WHERE nt.event_trigger = 'checkout_pending' AND nt.channel = 'EMAIL' LIMIT 1
    `, [invoiceCode, inv.donor_email, JSON.stringify({ subject }), JSON.stringify(emailResponse), emailStatus]).catch(() => {});

    if (emailStatus === 'FAILED') {
      return NextResponse.json({ status: 'error', message: emailResponse.error }, { status: 502 });
    }

    await query(`UPDATE "${invTable}" SET is_email_checkout_sent = true WHERE invoice_code = $1`, [invoiceCode]);
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('[send-email-checkout] Error:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Internal Error' }, { status: 500 });
  }
}
