import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { withDbTransaction } from "@/lib/db";
import { PaymentError, reconcileInvoice } from "@/lib/pembayaran/apply";
import { faspayRejected } from "@/lib/pembayaran/verify";

const schema = z.object({
  invoiceCode: z.string().min(4),
  action: z.enum(["cek", "gagal", "kedaluwarsa"]),
  reason: z.string().trim().min(3).max(300),
});

export async function POST(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  if (decision.kind !== "allow" || decision.session?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data rekonsiliasi tidak valid" }, { status: 400 });
  if (faspayRejected(parsed.data.invoiceCode)) return NextResponse.json({ error: "faspay_tidak_tersedia" }, { status: 400 });
  try {
    const result = await withDbTransaction((sql) => reconcileInvoice(sql, { ...parsed.data, userId: decision.session?.id || "" }));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
