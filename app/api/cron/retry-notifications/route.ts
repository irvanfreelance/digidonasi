import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { replaceTemplateVars } from '@/lib/email-templates';
import { parseManualAccount } from '@/lib/payment-instructions';
import { formatIDR } from '@/lib/utils';

/**
 * Cron endpoint called by Upstash QStash Schedule every 15 minutes.
 * Retries notification_logs rows with status='PENDING_RETRY' by sending email directly.
 * Each successful send marks is_email_checkout_sent and updates log status.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();

    // Verify QStash signature
    const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const next = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (current && next) {
      const ok = await new Receiver({ currentSigningKey: current, nextSigningKey: next })
        .verify({ signature: req.headers.get('upstash-signature') || '', body: raw })
        .catch(() => false);
      if (!ok) return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
    }

    // Fetch pending rows (limit 20 per run to avoid timeout)
    const pending = await query(`
      SELECT id, invoice_code, recipient, request_payload
      FROM notification_logs
      WHERE status = 'PENDING_RETRY' AND channel = 'EMAIL'
      ORDER BY id ASC
      LIMIT 20
    `);

    if (pending.length === 0) return NextResponse.json({ status: 'ok', processed: 0 });

    let successCount = 0;
    let failCount = 0;

    for (const log of pending) {
      try {
        const invoiceCode = log.invoice_code;
        if (!invoiceCode) continue;

        const m = invoiceCode.match(/^INV-(\d{4})(\d{2})\d{2}-[A-Z0-9]+$/i);
        if (!m) continue;

        const sfx = `y${m[1]}m${m[2]}`;
        const icCheck = await query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.invoices_${sfx}`]);
        const invTable = icCheck[0].e ? `invoices_${sfx}` : 'invoices';

        const rows = await query(`
          SELECT i.id, i.invoice_code, i.donor_name_snapshot, i.donor_email,
                 i.base_amount, i.total_amount, i.va_number, i.is_email_checkout_sent,
                 pm.name AS payment_method_name, pm.type AS payment_method_type,
                 pm.code AS payment_method_code, pm.id AS payment_method_id
          FROM "${invTable}" i
          LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id
          WHERE i.invoice_code = $1
        `, [invoiceCode]);

        if (rows.length === 0) {
          await query(`UPDATE notification_logs SET status = 'FAILED', response_payload = $1 WHERE id = $2`,
            [JSON.stringify({ error: 'Invoice not found' }), log.id]);
          failCount++;
          continue;
        }

        const inv = rows[0];
        if (inv.is_email_checkout_sent) {
          await query(`UPDATE notification_logs SET status = 'SUCCESS' WHERE id = $1`, [log.id]);
          successCount++;
          continue;
        }

        if (!inv.donor_email) {
          await query(`UPDATE notification_logs SET status = 'FAILED', response_payload = $1 WHERE id = $2`,
            [JSON.stringify({ error: 'No email' }), log.id]);
          failCount++;
          continue;
        }

        const tmplRows = await query(
          `SELECT COALESCE(subject, '') AS subject, message_content FROM notification_templates WHERE event_trigger = 'checkout_pending' AND channel = 'EMAIL' AND is_active = true LIMIT 1`
        ).catch(() => []);
        if (tmplRows.length === 0) continue;

        const pmType = (inv.payment_method_type || '').toLowerCase();
        let vaNumber = inv.va_number || '-';
        let rekening = '-';

        if (pmType.includes('manual')) {
          const account = parseManualAccount(inv.payment_method_code, inv.va_number);
          if (account) { vaNumber = account.rekening; rekening = account.rekening; }
        }

        const instrRows = await query(
          `SELECT title, content FROM payment_instructions WHERE payment_method_id = $1 ORDER BY sort_order ASC LIMIT 3`,
          [inv.payment_method_id]
        ).catch(() => []);

        const instruksiHtml = instrRows.length > 0
          ? instrRows.map((r: any) => `<strong>${r.title}</strong>\n${r.content}`).join('\n\n')
          : '';

        const vars: Record<string, string> = {
          nama: inv.donor_name_snapshot || 'Donatur',
          nominal: formatIDR(Number(inv.base_amount)),
          invoice_code: inv.invoice_code,
          metode: inv.payment_method_name || '-',
          va_number: vaNumber,
          bank_name: inv.payment_method_name || '-',
          rekening,
          instruksi: instruksiHtml,
          total_transfer: formatIDR(Number(inv.total_amount)),
        };

        const subject = replaceTemplateVars(tmplRows[0].subject, vars);
        const html = replaceTemplateVars(tmplRows[0].message_content, vars);
        const text = `Donasi ${vars.nominal} (${invoiceCode})\nTotal: ${vars.total_transfer}\nVA/Rekening: ${vaNumber}`;

        let emailStatus = 'SUCCESS';
        let emailResponse: any;
        try {
          emailResponse = await sendEmail({ to: inv.donor_email, subject, html, text });
        } catch (err: any) {
          emailStatus = 'FAILED';
          emailResponse = { error: err.message };
        }

        await query(`UPDATE notification_logs SET status = $1, response_payload = $2 WHERE id = $3`,
          [emailStatus, JSON.stringify(emailResponse), log.id]).catch(() => {});

        if (emailStatus === 'SUCCESS') {
          await query(`UPDATE "${invTable}" SET is_email_checkout_sent = true WHERE invoice_code = $1`, [invoiceCode]).catch(() => {});
          successCount++;
        } else {
          failCount++;
        }
      } catch (rowErr: any) {
        console.error('[retry-notifications] row error:', rowErr.message);
        await query(`UPDATE notification_logs SET status = 'FAILED', response_payload = $1 WHERE id = $2`,
          [JSON.stringify({ error: rowErr.message }), log.id]).catch(() => {});
        failCount++;
      }
    }

    return NextResponse.json({ status: 'ok', processed: pending.length, success: successCount, failed: failCount });
  } catch (error: any) {
    console.error('[retry-notifications] Error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
