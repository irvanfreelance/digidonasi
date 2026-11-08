import { NextResponse } from "next/server";
import { COOKIE, DOOR, audienceFromParam } from "@/lib/auth/doors";

export async function POST(request: Request, context: { params: Promise<{ audience: string }> }) {
  const { audience: raw } = await context.params;
  const aud = audienceFromParam(raw);
  if (!aud) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(DOOR[aud].login, url.origin));
  response.cookies.set(COOKIE[aud], "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
