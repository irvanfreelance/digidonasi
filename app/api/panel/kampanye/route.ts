import { NextResponse } from "next/server";
import { z } from "zod";
import { blocked, decide } from "@/lib/auth/http";
import { withDbTransaction } from "@/lib/db";
import { saveBundle, saveCampaign, saveCategory, saveUpdate, saveVariant, setCampaignStatus } from "@/lib/donasi/manage";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), slug: z.string().min(1), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }),
  z.object({ action: z.literal("campaign"), slug: z.string().min(1), title: z.string().min(2), summary: z.string().min(2), minimumAmount: z.number().int().nonnegative() }),
  z.object({ action: z.literal("category"), slug: z.string().min(1), name: z.string().min(2) }),
  z.object({ action: z.literal("variant"), campaignSlug: z.string().min(1), name: z.string().min(1), price: z.number().int().positive(), namesPerQty: z.number().int().positive() }),
  z.object({ action: z.literal("bundle"), bundleSlug: z.string().min(1), itemSlug: z.string().min(1), qty: z.number().int().positive() }),
  z.object({ action: z.literal("update"), campaignSlug: z.string().min(1), title: z.string().min(2), body: z.string().min(2) }),
]);

export async function POST(request: Request) {
  const denied = blocked(decide(request));
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data kampanye tidak valid" }, { status: 400 });
  const body = parsed.data;
  const row = await withDbTransaction(async (sql) => {
    if (body.action === "status") return setCampaignStatus(sql, body.slug, body.status);
    if (body.action === "campaign") return saveCampaign(sql, body);
    if (body.action === "category") return saveCategory(sql, body);
    if (body.action === "variant") return saveVariant(sql, body);
    if (body.action === "bundle") return saveBundle(sql, body);
    return saveUpdate(sql, body);
  });
  if (!row) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
