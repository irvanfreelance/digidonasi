import { dbQuery } from "@/lib/db";
import { fallbackOrg, type OrgProfile } from "@/types/org";

export async function loadPublicOrg(): Promise<OrgProfile> {
  try {
    const rows = await dbQuery<OrgProfile>(
      `SELECT id, nama, nama_singkat, tagline, short_description, address, logo_url, favicon_url,
              primary_color, sidebar_color, accent_color, facebook_url, instagram_url,
              whatsapp_number, public_email, is_seed_default
       FROM org_profile WHERE id = 1 LIMIT 1`,
    );
    if (rows[0]?.nama) return { ...fallbackOrg(), ...rows[0] };
  } catch {
    /* Basis belum terbaca. Tampilkan merek contoh dari kode. */
  }
  return fallbackOrg();
}
