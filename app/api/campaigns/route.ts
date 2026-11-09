import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { listCampaigns } from "@/lib/donasi/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "6");
  try {
    const result = await listCampaigns(dbQuery, { q: url.searchParams.get("q") || "", page, pageSize });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ rows: [], page: 1, pageSize: 6, total: 0 });
  }
}
