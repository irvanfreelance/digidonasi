import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { withDbTransaction } from "@/lib/db";
import { AffiliateError, requestPayout } from "@/lib/afiliasi/ledger";

const schema = z.object({
  amount: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(80),
});

export async function POST(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  if (decision.kind !== "allow" || !decision.session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decision.session.status !== "ACTIVE") return NextResponse.json({ error: "afiliasi_tidak_aktif" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "nominal_tidak_sah" }, { status: 400 });
  try {
    const result = await withDbTransaction((sql) =>
      requestPayout(sql, { affiliateId: decision.session?.id || "", amount: parsed.data.amount, key: parsed.data.idempotencyKey }),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AffiliateError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
