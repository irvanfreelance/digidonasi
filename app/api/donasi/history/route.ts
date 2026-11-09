import { NextResponse } from "next/server";
import { blocked, decide } from "@/lib/auth/http";
import { dbQuery } from "@/lib/db";
import { donorHistory } from "@/lib/donasi/catalog";

export async function GET(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  const url = new URL(request.url);
  const donorId = decision.kind === "allow" ? decision.session?.id : null;
  if (!donorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await donorHistory(dbQuery, donorId, {
      page: Number(url.searchParams.get("page") || "1"),
      pageSize: Number(url.searchParams.get("pageSize") || "6"),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json({ rows: [], page: 1, pageSize: 6, total: 0 });
    }
    throw error;
  }
}
