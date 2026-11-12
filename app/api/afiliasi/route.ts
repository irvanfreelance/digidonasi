import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { dbQuery, withDbTransaction } from "@/lib/db";
import { AffiliateError, balanceOf, releaseDue } from "@/lib/afiliasi/ledger";

function sessionOf(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return { denied };
  if (decision.kind !== "allow" || !decision.session?.id) return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { id: decision.session.id, status: decision.session.status || "PENDING" };
}

export async function GET(request: Request) {
  const session = sessionOf(request);
  if ("denied" in session && session.denied) return session.denied;
  const id = session.id;
  try {
    await withDbTransaction((sql) => releaseDue(sql));
    const balance = await withDbTransaction((sql) => balanceOf(sql, id));
    const profile = await dbQuery(`SELECT nama, email, status FROM affiliates WHERE id = $1`, [id]);
    return NextResponse.json({ status: profile[0]?.status ?? session.status, balance, profile: profile[0] ?? null });
  } catch {
    return NextResponse.json({ error: "basis_belum_terbaca" }, { status: 503 });
  }
}

const profileSchema = z.object({ nama: z.string().trim().min(2).max(120) });

export async function POST(request: Request) {
  const session = sessionOf(request);
  if ("denied" in session && session.denied) return session.denied;
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "nama_tidak_sah" }, { status: 400 });
  try {
    const rows = await withDbTransaction((sql) => sql(`UPDATE affiliates SET nama = $2 WHERE id = $1 RETURNING nama`, [session.id, parsed.data.nama]));
    return NextResponse.json(rows[0] ?? { error: "afiliasi_tidak_ada" });
  } catch (error) {
    if (error instanceof AffiliateError) return NextResponse.json({ error: error.code }, { status: 400 });
    throw error;
  }
}
