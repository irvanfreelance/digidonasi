import { NextResponse } from "next/server";
import { websiteEnabled } from "@/lib/env";

function closed() {
  if (!websiteEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ error: "Kerangka hari 1. API website belum diimplementasikan." }, { status: 501 });
}

export function GET() { return closed(); }
export function POST() { return closed(); }
export function PUT() { return closed(); }
