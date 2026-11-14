import { NextRequest, NextResponse } from 'next/server';
import { getKwitansiData, buildKwitansiPdf } from '@/lib/kwitansi-pdf';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceCode: string }> }
) {
  const { invoiceCode } = await params;
  try {
    const data = await getKwitansiData(invoiceCode);
    if (!data) return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });

    const pdf = await buildKwitansiPdf(data);

    return new Response(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="kwitansi-${invoiceCode}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    console.error('[Kwitansi PDF] error:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
