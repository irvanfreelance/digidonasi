import { cookies } from "next/headers";
import { COOKIE } from "@/lib/auth/doors";
import { authSecret, openSession, type Audience, type Claims } from "@/lib/auth/token";

export type PanelRole = "SUPERADMIN" | "WEBSITE_EDITOR";

export type PanelSession = {
  user: {
    id: string;
    nama: string;
    email: string;
    role: PanelRole;
  };
};

async function readAudience(aud: Audience): Promise<Claims | null> {
  try {
    const jar = await cookies();
    return openSession(jar.get(COOKIE[aud])?.value, aud, authSecret());
  } catch {
    return null;
  }
}

/** Hanya cookie panel. Tidak membaca cookie donor, afiliasi, atau penanda UI lawas. */
export async function getPanelSession(): Promise<PanelSession | null> {
  const claims = await readAudience("panel");
  if (!claims?.role) return null;
  return { user: { id: claims.id, nama: claims.name, email: claims.email, role: claims.role } };
}

export async function getDonorSession() {
  return readAudience("donor");
}

export async function getAffiliateSession() {
  return readAudience("affiliate");
}
