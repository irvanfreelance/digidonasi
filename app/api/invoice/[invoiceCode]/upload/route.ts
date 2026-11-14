import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

const bodySchema = z.object({
  // Only accept files that were stored in our Vercel Blob store.
  proofUrl: z.string().url().refine((u) => {
    try {
      return new URL(u).hostname.endsWith('.public.blob.vercel-storage.com');
    } catch {
      return false;
    }
  }, 'proofUrl must be a Vercel Blob URL'),
});

export async function POST(req: Request, props: { params: Promise<{ invoiceCode: string }> }) {
  try {
    const { invoiceCode } = await props.params;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid proofUrl' }, { status: 400 });
    }
    const { proofUrl } = parsed.data;

    // Only update if it's SIM- or a real TRX-
    if (!invoiceCode.startsWith('SIM-')) {
      // Resolve the (possibly partitioned) table from the code, never from user input.
      let table = 'invoices';
      const m = invoiceCode.match(/^INV-(\d{4})(\d{2})\d{2}-/);
      if (m) {
        const name = `invoices_y${m[1]}m${m[2]}`;
        const check = await query(`SELECT to_regclass($1) IS NOT NULL AS e`, [`public.${name}`]);
        if (check[0].e) table = name;
      }

      const rows = await query(`
        UPDATE "${table}"
        SET proof_transfer = $1
        WHERE invoice_code = $2
        RETURNING id
      `, [proofUrl, invoiceCode]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Invoice page is cached in Redis; drop it so the proof shows immediately.
      await redis.del(`invoice:${invoiceCode}`).catch(() => {});
    }

    return NextResponse.json({ success: true, url: proofUrl });
  } catch (error: any) {
    console.error('Invoice Proof Update Error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
