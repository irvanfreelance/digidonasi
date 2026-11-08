import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type Audience = "donor" | "panel" | "affiliate";

export type Claims = {
  aud: Audience;
  sub: string;
  email: string;
  name: string;
  id: string;
  role?: "SUPERADMIN" | "WEBSITE_EDITOR";
  status?: string;
  exp: number;
};

export type OauthState = {
  aud: Audience;
  state: string;
  nonce: string;
  next: string;
  exp: number;
};

const enc = (value: string) => Buffer.from(value).toString("base64url");
const dec = (value: string) => Buffer.from(value, "base64url").toString("utf8");

export function authSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (secret.length < 16) return null;
  return secret;
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function pack(payload: unknown, secret: string) {
  const body = enc(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

function unpack<T>(token: string | undefined, secret: string | null): T | null {
  if (!token || !secret) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body, secret);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(dec(body)) as T;
  } catch {
    return null;
  }
}

export function sealSession(claims: Claims, secret: string) {
  return pack(claims, secret);
}

export function openSession(token: string | undefined, expected: Audience, secret = authSecret(), now = Date.now()): Claims | null {
  const claims = unpack<Claims>(token, secret);
  if (!claims || claims.aud !== expected || claims.exp < now) return null;
  if (!claims.sub || !claims.email || !claims.id) return null;
  return claims;
}

export function sealState(state: OauthState, secret: string) {
  return pack(state, secret);
}

export function openState(token: string | undefined, expected: Audience, secret = authSecret(), now = Date.now()): OauthState | null {
  const state = unpack<OauthState>(token, secret);
  if (!state || state.aud !== expected || state.exp < now) return null;
  if (!state.state || !state.nonce || !state.next) return null;
  return state;
}

export function newOauthState(aud: Audience, next: string, secret: string): { token: string; state: string; nonce: string } {
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const token = sealState({ aud, state, nonce, next, exp: Date.now() + 10 * 60 * 1000 }, secret);
  return { token, state, nonce };
}

export type MockProfile = {
  aud: Audience;
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
  nonce: string;
};

export function sealMock(profile: MockProfile, secret: string) {
  return `mock.${pack(profile, secret)}`;
}

export function openMock(code: string | null, expected: Audience, secret = authSecret()): MockProfile | null {
  if (!code?.startsWith("mock.")) return null;
  const profile = unpack<MockProfile>(code.slice(5), secret);
  if (!profile || profile.aud !== expected || !profile.sub || !profile.email) return null;
  return profile;
}
