import { NextResponse } from "next/server";
import { z } from "zod";
import { unauthorized, zodError } from "@/lib/api/http";
import { getPanelSession } from "@/lib/auth/panel-session";
import { dbQuery } from "@/lib/db";
import { fallbackOrg, type OrgProfile } from "@/types/org";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const schema = z.object({
  nama: z.string().min(2),
  namaSingkat: z.string().min(1).max(40),
  tagline: z.string().max(200),
  logoUrl: z.union([z.string().url(), z.literal(""), z.null()]),
  faviconUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  primaryColor: hex,
  sidebarColor: hex,
  accentColor: hex,
});

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json(fallbackOrg());
  try {
    const rows = await dbQuery<OrgProfile>("SELECT * FROM org_profile WHERE id = 1 LIMIT 1");
    if (!rows[0]) return NextResponse.json(fallbackOrg());
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json(fallbackOrg());
  }
}

export async function PUT(req: Request) {
  const session = await getPanelSession();
  if (!session) return unauthorized();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return zodError("Data lembaga tidak valid");
  return unauthorized();
}
