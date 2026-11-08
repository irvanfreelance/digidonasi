import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { COOKIE, DOOR, STATE_COOKIE, audienceFromParam, authMode } from "@/lib/auth/doors";
import { AuthError } from "@/lib/auth/identity";
import { cookieJar, finishAuth } from "@/lib/auth/flow";
import { authSecret, openState, sealMock } from "@/lib/auth/token";

export async function GET(request: Request, context: { params: Promise<{ audience: string }> }) {
  const { audience: raw } = await context.params;
  const aud = audienceFromParam(raw);
  if (!aud) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const url = new URL(request.url);
  const jar = cookieJar(request.headers.get("cookie"));
  try {
    const done = await finishAuth({
      aud,
      origin: url.origin,
      state: url.searchParams.get("state"),
      code: url.searchParams.get("code"),
      stateToken: jar[STATE_COOKIE[aud]],
      sql: (text, params) => dbQuery(text, params),
    });
    const response = NextResponse.redirect(done.location);
    response.cookies.set(COOKIE[aud], done.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
      secure: url.protocol === "https:",
    });
    response.cookies.set(STATE_COOKIE[aud], "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const code = error instanceof AuthError ? error.code : "masuk_gagal";
    const login = new URL(DOOR[aud].login, url.origin);
    login.searchParams.set("error", code);
    return NextResponse.redirect(login);
  }
}

export async function POST(request: Request, context: { params: Promise<{ audience: string }> }) {
  const { audience: raw } = await context.params;
  const aud = audienceFromParam(raw);
  if (!aud || authMode() !== "mock") return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const url = new URL(request.url);
  const form = await request.formData();
  const jar = cookieJar(request.headers.get("cookie"));
  const secret = authSecret();
  const saved = openState(jar[STATE_COOKIE[aud]], aud, secret);
  const state = String(form.get("state") || "");
  if (!secret || !saved || saved.state !== state) {
    return NextResponse.redirect(new URL(`${DOOR[aud].login}?error=state_tidak_sah`, url.origin));
  }
  const code = sealMock(
    {
      aud,
      sub: String(form.get("sub") || ""),
      email: String(form.get("email") || ""),
      name: String(form.get("name") || ""),
      emailVerified: true,
      nonce: saved.nonce,
    },
    secret,
  );
  const next = new URL(DOOR[aud].callback, url.origin);
  next.searchParams.set("state", state);
  next.searchParams.set("code", code);
  return GET(new Request(next, { headers: { cookie: request.headers.get("cookie") || "" } }), context);
}
