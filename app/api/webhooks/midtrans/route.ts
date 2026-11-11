import { NextResponse } from "next/server";
import { withDbTransaction } from "@/lib/db";
import { PaymentError, applyProviderEvent } from "@/lib/pembayaran/apply";
import { mapMidtransStatus, verifyMidtransSignature } from "@/lib/pembayaran/verify";

export async function POST(request: Request) {
  const body = (await request.json()) as { order_id?: string; transaction_id?: string; transaction_status?: string; status_code?: string; gross_amount?: string; signature_key?: string };
  if (!body.order_id || !body.transaction_id || !body.transaction_status || !body.status_code || !body.gross_amount) {
    return NextResponse.json({ error: "payload_tidak_sah" }, { status: 400 });
  }
  if (!verifyMidtransSignature({ orderId: body.order_id, statusCode: body.status_code, grossAmount: body.gross_amount, signature: body.signature_key ?? null })) {
    return NextResponse.json({ error: "tanda_tangan_tidak_sah" }, { status: 401 });
  }
  const mapped = mapMidtransStatus(body.transaction_status);
  if (!mapped) return NextResponse.json({ error: "status_tidak_dikenal" }, { status: 400 });
  const amount = Number(body.gross_amount);
  if (!Number.isSafeInteger(amount)) return NextResponse.json({ error: "nominal_tidak_sah" }, { status: 400 });
  try {
    const result = await withDbTransaction((sql) => applyProviderEvent(sql, { provider: "midtrans", eventId: body.transaction_id!, invoiceCode: body.order_id!, amount, mapped }));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
