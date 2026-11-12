import { NextResponse } from "next/server";
import { withDbTransaction } from "@/lib/db";
import { recordClick } from "@/lib/afiliasi/ledger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const ref = url.searchParams.get("ref") || "";
  const back = new URL(slug ? `/donasi/${slug}` : "/donasi", url.origin);
  const response = NextResponse.redirect(back);
  if (!/^\d+$/.test(ref) || !/^[a-z0-9-]+$/.test(slug)) return response;
  try {
    const click = await withDbTransaction((sql) => recordClick(sql, { affiliateId: ref, slug }));
    if (click) {
      response.cookies.set("digidonasi.ref", click.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    }
  } catch {
    /* Klik yang gagal tidak menghalangi halaman program. */
  }
  return response;
}
