import { createRemoteJWKSet, jwtVerify } from "jose";
import { DOOR, appOrigin, authMode, safeNext } from "@/lib/auth/doors";
import { AuthError, signIn, type Profile, type Sql } from "@/lib/auth/identity";
import {
  authSecret,
  newOauthState,
  openMock,
  openState,
  sealSession,
  type Audience,
  type Claims,
} from "@/lib/auth/token";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function cookieJar(header: string | null) {
  const jar: Record<string, string> = {};
  if (!header) return jar;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    jar[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return jar;
}

export function beginAuth(aud: Audience, nextRaw: string | null, origin: string) {
  const secret = authSecret();
  const mode = authMode();
  if (!secret || mode === "unconfigured") return { error: "google_belum_dikonfigurasi" as const };
  const next = safeNext(aud, nextRaw);
  const created = newOauthState(aud, next, secret);
  if (mode === "mock") {
    const login = new URL(DOOR[aud].login, origin);
    login.searchParams.set("mock", "1");
    login.searchParams.set("state", created.state);
    return { location: login.toString(), stateToken: created.token };
  }
  const redirectUri = new URL(DOOR[aud].callback, appOrigin(origin)).toString();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  google.searchParams.set("redirect_uri", redirectUri);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", created.state);
  google.searchParams.set("nonce", created.nonce);
  google.searchParams.set("prompt", "select_account");
  return { location: google.toString(), stateToken: created.token };
}

async function profileFromGoogle(aud: Audience, code: string, nonce: string, origin: string, fetchImpl: typeof fetch) {
  const redirectUri = new URL(DOOR[aud].callback, appOrigin(origin)).toString();
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new AuthError("google_token_ditolak");
  const json = (await response.json()) as { id_token?: unknown };
  if (typeof json.id_token !== "string") throw new AuthError("google_token_ditolak");
  const verified = await jwtVerify(json.id_token, googleKeys, {
    audience: process.env.GOOGLE_CLIENT_ID,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });
  if (verified.payload.nonce !== nonce) throw new AuthError("nonce_tidak_sah");
  if (verified.payload.email_verified !== true) throw new AuthError("email_google_belum_terverifikasi");
  const email = verified.payload.email;
  const sub = verified.payload.sub;
  if (typeof email !== "string" || typeof sub !== "string") throw new AuthError("profil_google_tidak_lengkap");
  const name = typeof verified.payload.name === "string" ? verified.payload.name : email;
  return { sub, email, name, emailVerified: true } satisfies Profile;
}

export async function finishAuth(input: {
  aud: Audience;
  origin: string;
  state: string | null;
  code: string | null;
  stateToken: string | undefined;
  sql: Sql;
  fetchImpl?: typeof fetch;
}) {
  const secret = authSecret();
  const mode = authMode();
  const saved = openState(input.stateToken, input.aud, secret);
  if (!secret || !saved || !input.state || saved.state !== input.state) throw new AuthError("state_tidak_sah");
  let profile: Profile;
  if (mode === "mock") {
    const mock = openMock(input.code, input.aud, secret);
    if (!mock || mock.nonce !== saved.nonce || !mock.emailVerified) throw new AuthError("mock_tidak_sah");
    profile = mock;
  } else if (mode === "google") {
    if (!input.code || input.code.startsWith("mock.")) throw new AuthError("kode_google_tidak_sah");
    profile = await profileFromGoogle(input.aud, input.code, saved.nonce, input.origin, input.fetchImpl ?? fetch);
  } else {
    throw new AuthError("google_belum_dikonfigurasi");
  }
  const identity = await signIn(input.aud, input.sql, profile);
  const claims: Claims = {
    aud: input.aud,
    sub: profile.sub,
    email: identity.email,
    name: identity.name,
    id: identity.id,
    role: identity.role,
    status: identity.status,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  return { location: new URL(saved.next, input.origin).toString(), sessionToken: sealSession(claims, secret) };
}
