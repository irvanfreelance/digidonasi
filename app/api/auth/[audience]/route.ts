import { NextResponse } from "next/server";
import { STATE_COOKIE, audienceFromParam } from "@/lib/auth/doors";
import { beginAuth } from "@/lib/auth/flow";

export async function GET(request: Request, context: { params: Promise<{ audience: string }> }) {
  const { audience: raw } = await context.params;
  const aud = audienceFromParam(raw);
  if (!aud) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const url = new URL(request.url);
  const started = beginAuth(aud, url.searchParams.get("next"), url.origin);
  if ("error" in started) {
    return NextResponse.json(
      { error: "Google belum dikonfigurasi. Login nyata belum tersedia.", code: started.error },
      { status: 503 },
    );
  }
  const response = NextResponse.redirect(started.location);
  response.cookies.set(STATE_COOKIE[aud], started.stateToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: url.protocol === "https:",
  });
  return response;
}
