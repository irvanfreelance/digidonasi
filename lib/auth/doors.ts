import type { Audience } from "@/lib/auth/token";

export const COOKIE = {
  donor: "digidonasi.donor",
  panel: "digidonasi.panel",
  affiliate: "digidonasi.affiliate",
} as const;

export const STATE_COOKIE = {
  donor: "digidonasi.donor.state",
  panel: "digidonasi.panel.state",
  affiliate: "digidonasi.affiliate.state",
} as const;

export const DOOR = {
  donor: { login: "/masuk", home: "/profil", callback: "/api/auth/donor/callback" },
  panel: { login: "/panel/login", home: "/dashboard", callback: "/api/auth/admin/callback" },
  affiliate: { login: "/afiliasi/masuk", home: "/afiliasi", callback: "/api/auth/affiliate/callback" },
} as const;

export const PANEL_PREFIXES = [
  "/dashboard",
  "/campaigns",
  "/transactions",
  "/donatur",
  "/pembayaran",
  "/affiliates",
  "/website",
  "/users",
  "/app-config",
];

const AUDIENCE_PARAM = { donor: "donor", admin: "panel", affiliate: "affiliate" } as const;

export function audienceFromParam(value: string): Audience | null {
  if (value === "donor" || value === "admin" || value === "affiliate") return AUDIENCE_PARAM[value];
  return null;
}

export function paramFromAudience(aud: Audience): "donor" | "admin" | "affiliate" {
  if (aud === "panel") return "admin";
  return aud;
}

function safePath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) return null;
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  return path || null;
}

function matches(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function safeNext(aud: Audience, raw: string | null) {
  const path = safePath(raw);
  if (!path) return DOOR[aud].home;
  if (aud === "donor" && (path === "/profil" || matches(path, "/donasi"))) return path;
  if (aud === "panel" && (path === "/panel" || PANEL_PREFIXES.some((prefix) => matches(path, prefix)))) return path;
  if (aud === "affiliate" && path !== "/afiliasi/masuk" && matches(path, "/afiliasi")) return path;
  return DOOR[aud].home;
}

export function authMode(): "mock" | "google" | "unconfigured" {
  if (process.env.AUTH_PROVIDER === "mock") return "mock";
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && authSecretPresent()) return "google";
  return "unconfigured";
}

function authSecretPresent() {
  return (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").length >= 16;
}

export function appOrigin(fallback: string) {
  const configured = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return configured || fallback;
}
