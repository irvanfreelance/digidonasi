import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { withDbTransaction } from "@/lib/db";
import { AffiliateError, rejectPayout, setAffiliateStatus, settlePayout } from "@/lib/afiliasi/ledger";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string().regex(/^\d+$/), status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]) }),
  z.object({ action: z.literal("settle"), id: z.string().regex(/^\d+$/), settlementRef: z.string().trim().min(3).max(80) }),
  z.object({ action: z.literal("reject"), id: z.string().regex(/^\d+$/), reason: z.string().trim().min(3).max(300) }),
]);

export async function POST(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  if (decision.kind !== "allow" || decision.session?.role !== "SUPERADMIN" || !decision.session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "data_tidak_sah" }, { status: 400 });
  const userId = decision.session.id;
  try {
    const result = await withDbTransaction((sql) => {
      const body = parsed.data;
      if (body.action === "status") return setAffiliateStatus(sql, { affiliateId: body.id, status: body.status, userId });
      if (body.action === "settle") return settlePayout(sql, { payoutId: body.id, settlementRef: body.settlementRef, userId });
      return rejectPayout(sql, { payoutId: body.id, reason: body.reason, userId });
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AffiliateError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
