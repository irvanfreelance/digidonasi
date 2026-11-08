import { NextResponse } from "next/server";
import { blocked, decide } from "@/lib/auth/http";

export function GET(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  const status = decision.kind === "allow" ? decision.session?.status ?? "PENDING" : "PENDING";
  return NextResponse.json({ status, linksActive: false, balance: 0 });
}

export function POST(request: Request) {
  const denied = blocked(decide(request));
  return denied ?? NextResponse.json({ error: "Kerangka hari 2. Operasi afiliasi belum diimplementasikan." }, { status: 501 });
}
