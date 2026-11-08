import { NextResponse } from "next/server";
import { blocked, decide } from "@/lib/auth/http";
import { notImplemented } from "@/lib/api/http";

function guard(request: Request) {
  const decision = decide(request);
  return blocked(decision) ?? NextResponse.json({ ok: true, role: decision.kind === "allow" ? decision.session?.role : null });
}

export function GET(request: Request) {
  return guard(request);
}

export function POST(request: Request) {
  const denied = blocked(decide(request));
  return denied ?? notImplemented("panel");
}

export function PUT(request: Request) {
  return POST(request);
}

export function PATCH(request: Request) {
  return POST(request);
}

export function DELETE(request: Request) {
  return POST(request);
}
