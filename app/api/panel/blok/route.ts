import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { dbQuery } from "@/lib/db";
import { saveDonationBlock } from "@/lib/donasi/manage";

const schema = z.object({
  seedKey: z.string().min(3),
  heading: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

export async function POST(request: Request) {
  const denied = blocked(decide(request));
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Blok tidak valid" }, { status: 400 });
  const row = await saveDonationBlock(dbQuery, parsed.data);
  if (!row) return NextResponse.json({ error: "Blok tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
