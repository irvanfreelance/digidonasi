import { websiteEnabled } from "@/lib/env";
import { panelAllows } from "@/lib/auth/rbac";
import { COOKIE, DOOR, PANEL_PREFIXES } from "@/lib/auth/doors";
import { isWebsitePath } from "@/lib/env";
import { authSecret, openSession, type Audience, type Claims } from "@/lib/auth/token";

export type Decision =
  | { kind: "allow"; session: Claims | null }
  | { kind: "redirect"; url: string }
  | { kind: "deny"; status: 401 | 403 | 404; message: string };

function matches(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isPanelPath(path: string) {
  return path === "/panel" || path.startsWith("/panel/") || PANEL_PREFIXES.some((prefix) => matches(path, prefix));
}

export function isDonorPrivate(path: string) {
  return path === "/profil" || path === "/donasi/riwayat" || path.startsWith("/donasi/riwayat/") || path === "/api/donasi/history";
}

export function isAffiliatePrivate(path: string) {
  return (matches(path, "/afiliasi") && path !== "/afiliasi/masuk") || matches(path, "/api/afiliasi");
}

function readOnly(jar: Record<string, string | undefined>, aud: Audience) {
  return openSession(jar[COOKIE[aud]], aud, authSecret());
}

export function gate(path: string, jar: Record<string, string | undefined>, siteOn = websiteEnabled(), method = "GET"): Decision {
  if ((isWebsitePath(path) || matches(path, "/api/website")) && !siteOn) {
    return { kind: "deny", status: 404, message: "Not Found" };
  }
  if (path === "/api/org-profile" && method === "GET") return { kind: "allow", session: null };

  const panelApi = matches(path, "/api/panel") || matches(path, "/api/website") || path === "/api/org-profile";
  if (path === "/panel/login") return { kind: "allow", session: readOnly(jar, "panel") };

  if (isPanelPath(path) || panelApi) {
    const session = readOnly(jar, "panel");
    if (!session?.role) {
      if (path.startsWith("/api/")) return { kind: "deny", status: 401, message: "Unauthorized" };
      return { kind: "redirect", url: `${DOOR.panel.login}?next=${encodeURIComponent(path)}` };
    }
    const resource = matches(path, "/website") || matches(path, "/api/website") || path.includes("/website")
      ? "website"
      : matches(path, "/transactions")
        ? "transaksi"
        : matches(path, "/affiliates")
          ? "afiliasi"
          : matches(path, "/users")
            ? "pengguna"
            : "panel";
    if (!panelAllows(session.role, resource, siteOn)) {
      if (resource === "website" && !siteOn) return { kind: "deny", status: 404, message: "Not Found" };
      return { kind: "deny", status: 403, message: "Forbidden" };
    }
    return { kind: "allow", session };
  }

  if (isDonorPrivate(path)) {
    const session = readOnly(jar, "donor");
    if (!session) {
      if (path.startsWith("/api/")) return { kind: "deny", status: 401, message: "Unauthorized" };
      return { kind: "redirect", url: `${DOOR.donor.login}?next=${encodeURIComponent(path)}` };
    }
    return { kind: "allow", session };
  }

  if (isAffiliatePrivate(path)) {
    const session = readOnly(jar, "affiliate");
    if (!session) {
      if (path.startsWith("/api/")) return { kind: "deny", status: 401, message: "Unauthorized" };
      return { kind: "redirect", url: `${DOOR.affiliate.login}?next=${encodeURIComponent(path)}` };
    }
    if (path.startsWith("/api/afiliasi/promosi") && session.status !== "ACTIVE") {
      return { kind: "deny", status: 403, message: "Tautan afiliasi belum aktif" };
    }
    return { kind: "allow", session };
  }

  return { kind: "allow", session: null };
}
