import type { Audience } from "@/lib/auth/token";
import { websiteEnabled } from "@/lib/env";

export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export type Profile = {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export type Identity = {
  id: string;
  email: string;
  name: string;
  role?: "SUPERADMIN" | "WEBSITE_EDITOR";
  status?: string;
};

export class AuthError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function clean(profile: Profile) {
  const email = profile.email.trim().toLowerCase();
  const sub = profile.sub.trim();
  const name = profile.name.trim() || email;
  if (!profile.emailVerified || !email.includes("@") || !sub) throw new AuthError("profil_google_tidak_lengkap");
  return { email, sub, name };
}

export async function signInDonor(sql: Sql, profile: Profile): Promise<Identity> {
  const { email, sub, name } = clean(profile);
  const bySub = await sql(`SELECT id, email, nama FROM donors WHERE google_sub = $1 LIMIT 1`, [sub]);
  if (bySub[0]) return { id: String(bySub[0].id), email: String(bySub[0].email), name: String(bySub[0].nama) };
  const byEmail = await sql(
    `SELECT id FROM donors WHERE google_sub IS NULL AND lower(email) = $1 LIMIT 1`,
    [email],
  );
  if (byEmail[0]) {
    await sql(`UPDATE donors SET google_sub = $1 WHERE id = $2 AND google_sub IS NULL`, [sub, byEmail[0].id]);
    return { id: String(byEmail[0].id), email, name };
  }
  const created = await sql(
    `INSERT INTO donors (nama, email, google_sub) VALUES ($1, $2, $3) RETURNING id`,
    [name, email, sub],
  );
  return { id: String(created[0].id), email, name };
}

export async function signInPanel(sql: Sql, profile: Profile, siteOn = websiteEnabled()): Promise<Identity> {
  const { email, sub, name } = clean(profile);
  const rows = await sql(
    `SELECT id, email, nama, role, is_active, google_sub
     FROM users
     WHERE deleted_at IS NULL AND (google_sub = $1 OR (google_sub IS NULL AND lower(email) = $2))
     ORDER BY google_sub NULLS LAST
     LIMIT 1`,
    [sub, email],
  );
  const row = rows[0];
  if (!row) throw new AuthError("panel_tidak_terdaftar");
  const role = String(row.role);
  if (role !== "SUPERADMIN" && role !== "WEBSITE_EDITOR") throw new AuthError("peran_panel_tidak_sah");
  if (!row.is_active) throw new AuthError("panel_nonaktif");
  if (role === "WEBSITE_EDITOR" && !siteOn) throw new AuthError("editor_website_mati");
  if (!row.google_sub) await sql(`UPDATE users SET google_sub = $1 WHERE id = $2 AND google_sub IS NULL`, [sub, row.id]);
  return { id: String(row.id), email: String(row.email), name: String(row.nama || name), role };
}

export async function signInAffiliate(sql: Sql, profile: Profile): Promise<Identity> {
  const { email, sub, name } = clean(profile);
  const bySub = await sql(`SELECT id, email, nama, status FROM affiliates WHERE google_sub = $1 LIMIT 1`, [sub]);
  if (bySub[0]) {
    return { id: String(bySub[0].id), email: String(bySub[0].email), name: String(bySub[0].nama), status: String(bySub[0].status) };
  }
  const byEmail = await sql(
    `SELECT id, status FROM affiliates WHERE google_sub IS NULL AND lower(email) = $1 LIMIT 1`,
    [email],
  );
  if (byEmail[0]) {
    await sql(`UPDATE affiliates SET google_sub = $1 WHERE id = $2 AND google_sub IS NULL`, [sub, byEmail[0].id]);
    return { id: String(byEmail[0].id), email, name, status: String(byEmail[0].status) };
  }
  const created = await sql(
    `INSERT INTO affiliates (nama, email, google_sub, status) VALUES ($1, $2, $3, 'PENDING') RETURNING id`,
    [name, email, sub],
  );
  return { id: String(created[0].id), email, name, status: "PENDING" };
}

export async function signIn(aud: Audience, sql: Sql, profile: Profile) {
  if (aud === "donor") return signInDonor(sql, profile);
  if (aud === "panel") return signInPanel(sql, profile);
  return signInAffiliate(sql, profile);
}
