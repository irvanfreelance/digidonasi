import { NextResponse } from "next/server";
import { withDbTransaction } from "@/lib/db";
import { PaymentError, applyProviderEvent } from "@/lib/pembayaran/apply";
import { mapXenditStatus, verifyXenditToken } from "@/lib/pembayaran/verify";

export async function POST(request: Request) {
  if (!verifyXenditToken(request.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "tanda_tangan_tidak_sah" }, { status: 401 });
  }
  const body = (await request.json()) as { id?: string; external_id?: string; amount?: number; status?: string };
  const mapped = mapXenditStatus(String(body.status || ""));
  if (!body.id || !body.external_id || mapped == null || typeof body.amount !== "number") {
    return NextResponse.json({ error: "payload_tidak_sah" }, { status: 400 });
  }
  try {
    const result = await withDbTransaction((sql) => applyProviderEvent(sql, { provider: "xendit", eventId: body.id!, invoiceCode: body.external_id!, amount: body.amount!, mapped }));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
