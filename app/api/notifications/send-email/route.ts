import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDonationPaidEmail, replaceTemplateVars } from '@/lib/email-templates';
import { formatIDR } from '@/lib/utils';

/**
 * Internal endpoint called by QStash to email the donor once an invoice is PAID.
 * Payload: { invoiceCode }  (event is fixed to DONATION_SUCCESS for now)
 *
 * Idempotent via invoices.is_email_paid_sent; QStash retries on non-2xx.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();

    // Verify QStash signature when signing keys are configured.
    const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const next = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (current && next) {
      const ok = await new Receiver({ currentSigningKey: current, nextSigningKey: next })
        .verify({ signature: req.headers.get('upstash-signature') || '', body: raw })
        .catch(() => false);
      if (!ok) return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[send-email] QSTASH signing keys not set — request signature not verified');
    }

    const { invoiceCode } = JSON.parse(raw || '{}');
    const m = typeof invoiceCode === 'string' ? invoiceCode.match(/^INV-(\d{4})(\d{2})\d{2}-[A-Z0-9]+$/i) : null;
    if (!m) return NextResponse.json({ status: 'error', message: 'Invalid invoiceCode' }, { status: 400 });

    // Resolve partitioned tables from the code (never from the request body).
    const sfx = `y${m[1]}m${m[2]}`;
    const [ic, tc] = await Promise.all([
      query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.invoices_${sfx}`]),
      query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.transactions_${sfx}`]),
    ]);
    const invTable = ic[0].e ? `invoices_${sfx}` : 'invoices';
    const txTable = tc[0].e ? `transactions_${sfx}` : 'transactions';

    const rows = await query(`
      SELECT i.id, i.invoice_code, i.status, i.donor_name_snapshot, i.donor_email, i.is_anonymous,
             i.total_amount, i.is_email_paid_sent, COALESCE(i.paid_at, i.created_at) AS paid_at,
             pm.name AS payment_method_name
      FROM "${invTable}" i
      LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.invoice_code = $1
    `, [invoiceCode]);

    if (rows.length === 0) return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });
    const inv = rows[0];

    if (inv.status !== 'PAID') return NextResponse.json({ status: 'skipped', message: 'Invoice not PAID' });
    if (inv.is_email_paid_sent) return NextResponse.json({ status: 'skipped', message: 'Email already sent' });
    if (!inv.donor_email) return NextResponse.json({ status: 'skipped', message: 'No email address' });

    const [items, ngo, tmplRows] = await Promise.all([
      query(`
        SELECT c.title FROM "${txTable}" t JOIN campaigns c ON c.id = t.campaign_id
        WHERE t.invoice_id = $1
      `, [inv.id]),
      query(`SELECT ngo_name, primary_color FROM ngo_configs LIMIT 1`),
      query(`SELECT COALESCE(subject, '') AS subject, message_content FROM notification_templates WHERE event_trigger = 'payment_paid' AND channel = 'EMAIL' AND is_active = true LIMIT 1`).catch(() => []),
    ]);

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

    let mail: { subject: string; html: string; text: string };

    if (tmplRows.length > 0) {
      // Use DB template with variable replacement
      const paidDate = new Date(inv.paid_at);
      const tanggal = paidDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
      const program = items.map((r: any) => r.title).join(', ') || '-';

      const vars: Record<string, string> = {
        nama: inv.donor_name_snapshot || 'Donatur',
        nominal: formatIDR(Number(inv.total_amount)),
        invoice_code: invoiceCode,
        metode: inv.payment_method_name || '-',
        va_number: inv.va_number || '-',
        bank_name: inv.payment_method_name || '-',
        rekening: inv.va_number || '-',
        instruksi: '',
        total_transfer: formatIDR(Number(inv.total_amount)),
        tanggal,
        program,
        tanggal_bayar: tanggal,
        nama_program: program,
      };
      mail = {
        subject: replaceTemplateVars(tmplRows[0].subject, vars),
        html: replaceTemplateVars(tmplRows[0].message_content, vars),
        text: `Donasi ${vars.nominal} (${invoiceCode}) telah diterima. Jazakumullahu khairan.`,
      };
    } else {
      // Fallback to hardcoded template
      mail = buildDonationPaidEmail({
        ngoName: ngo[0]?.ngo_name || 'LAZ Darul Hikam',
        donorName: inv.donor_name_snapshot || 'Donatur',
        invoiceCode,
        amount: Number(inv.total_amount),
        paymentMethod: inv.payment_method_name || '-',
        paidAt: new Date(inv.paid_at),
        campaignTitles: items.map((r: any) => r.title),
        invoiceUrl: `${baseUrl}/invoice/${invoiceCode}`,
        brandColor: ngo[0]?.primary_color,
      });
    }

    // Build kwitansi PDF attachment — dynamic import so a module load error never blocks email
    let pdfAttachment: { filename: string; content: Buffer; contentType: string } | undefined;
    try {
      const { getKwitansiData, buildKwitansiPdf } = await import('@/lib/kwitansi-pdf');
      const kwitansiData = await getKwitansiData(invoiceCode);
      if (kwitansiData) {
        const pdfBuf = await buildKwitansiPdf(kwitansiData);
        pdfAttachment = {
          filename: `kwitansi-${invoiceCode}.pdf`,
          content: pdfBuf,
          contentType: 'application/pdf',
        };
      }
    } catch (pdfErr: any) {
      console.warn('[send-email] kwitansi PDF skipped:', pdfErr.message);
    }

    let status = 'SUCCESS';
    let response: any;
    try {
      response = await sendEmail({
        to: inv.donor_email,
        ...mail,
        attachments: pdfAttachment ? [pdfAttachment] : undefined,
      });
    } catch (err: any) {
      status = 'FAILED';
      response = { error: err.message };
    }

    await query(`
      INSERT INTO notification_logs (template_id, invoice_code, recipient, channel, request_payload, response_payload, status)
      VALUES (NULL, $1, $2, 'EMAIL', $3, $4, $5)
    `, [invoiceCode, inv.donor_email, JSON.stringify({ subject: mail.subject }), JSON.stringify(response), status]).catch(() => {});

    if (status === 'FAILED') {
      // Non-2xx so QStash retries (e.g. Gmail daily quota / transient SMTP error).
      return NextResponse.json({ status: 'error', message: response.error }, { status: 502 });
    }

    await query(`UPDATE "${invTable}" SET is_email_paid_sent = true WHERE invoice_code = $1`, [invoiceCode]);
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Send Email Error:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Internal Error' }, { status: 500 });
  }
}
