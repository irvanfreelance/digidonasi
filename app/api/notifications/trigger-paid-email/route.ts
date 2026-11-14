import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({
  invoiceCode: z.string().regex(/^INV-\d{8}-[A-Z0-9]+$/i),
  secret: z.string().min(1),
});

/**
 * Called by the admin panel after manually confirming a payment as PAID.
 * Validates the invoice is actually PAID, then queues the email via QStash.
 *
 * POST /api/notifications/trigger-paid-email
 * Body: { invoiceCode, secret }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
    }

    const { invoiceCode, secret } = parsed.data;

    if (secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    // Resolve partitioned table
    const m = invoiceCode.match(/^INV-(\d{4})(\d{2})\d{2}-/);
    const sfx = m ? `y${m[1]}m${m[2]}` : null;
    let invTable = 'invoices';
    if (sfx) {
      const check = await query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.invoices_${sfx}`]);
      if (check[0].e) invTable = `invoices_${sfx}`;
    }

    const rows = await query(
      `SELECT status, donor_email, is_email_paid_sent FROM "${invTable}" WHERE invoice_code = $1`,
      [invoiceCode]
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });
    }

    const inv = rows[0];

    if (inv.status !== 'PAID') {
      return NextResponse.json({ status: 'skipped', message: 'Invoice not PAID yet' });
    }
    if (inv.is_email_paid_sent) {
      return NextResponse.json({ status: 'skipped', message: 'Email already sent' });
    }
    if (!inv.donor_email) {
      return NextResponse.json({ status: 'skipped', message: 'No email address' });
    }

    const qstashUrl = process.env.QSTASH_URL;
    const qstashToken = process.env.QSTASH_TOKEN;
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

    if (!qstashUrl || !qstashToken || !baseUrl) {
      return NextResponse.json({ status: 'error', message: 'QStash not configured' }, { status: 500 });
    }

    const res = await fetch(`${qstashUrl}/v2/publish/${baseUrl}/api/notifications/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceCode }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ status: 'error', message: `QStash error: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ status: 'success', message: 'Email queued via QStash' });
  } catch (error: any) {
    console.error('[trigger-paid-email]', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
