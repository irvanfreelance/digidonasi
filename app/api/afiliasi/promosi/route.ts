import { NextResponse } from "next/server";
import { blocked, decide } from "@/lib/auth/http";
import { dbQuery } from "@/lib/db";

export async function GET(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  if (decision.kind !== "allow" || !decision.session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decision.session.status !== "ACTIVE") return NextResponse.json({ error: "Tautan afiliasi belum aktif" }, { status: 403 });
  const origin = new URL(request.url).origin;
  try {
    const campaigns = await dbQuery<{ slug: string; title: string }>(
      `SELECT slug, title FROM campaigns WHERE publication_status = 'ACTIVE' ORDER BY sort_order, id`,
    );
    return NextResponse.json({
      links: campaigns.map((row) => ({
        slug: row.slug,
        title: row.title,
        href: `${origin}/api/klik?slug=${encodeURIComponent(row.slug)}&ref=${decision.session?.id}`,
      })),
    });
  } catch {
    return NextResponse.json({ error: "basis_belum_terbaca" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
