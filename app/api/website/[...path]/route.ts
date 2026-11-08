import { NextResponse } from "next/server";
import { blocked, decide } from "@/lib/auth/http";

function guard(request: Request) {
  const denied = blocked(decide(request));
  return denied ?? NextResponse.json({ error: "CMS menyusul pada hari 6." }, { status: 501 });
}

export function GET(request: Request) {
  return guard(request);
}

export function POST(request: Request) {
  return guard(request);
}

export function PUT(request: Request) {
  return guard(request);
}
