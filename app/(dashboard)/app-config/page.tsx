import { BlockForm } from "@/components/forms/block-form";
import { OrgSettingsForm } from "@/components/forms/org-settings-form";
import { dbQuery } from "@/lib/db";
import { fallbackOrg, type OrgProfile } from "@/types/org";

export const dynamic = "force-dynamic";

export default async function OrgPage() {
  let org = fallbackOrg();
  let blocks: { seed_key: string; heading: string | null; body: string | null; publication_status: string }[] = [];
  try {
    const rows = await dbQuery<OrgProfile>("SELECT * FROM org_profile WHERE id = 1 LIMIT 1");
    if (rows[0]) org = rows[0];
    blocks = await dbQuery("SELECT seed_key, heading, body, publication_status FROM donation_blocks ORDER BY seed_key");
  } catch {
    blocks = [];
  }
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="mt-0 mb-1 text-[20px] font-bold text-[var(--primary)]">Pengaturan lembaga</h1>
        <p className="mb-4 text-[13px] text-[#666]">Nama, logo, dan warna. Blok beranda donasi disunting di bawah. Website lembaga tetap mengikuti env.</p>
        <OrgSettingsForm org={org} />
      </div>
      <BlockForm blocks={blocks} />
    </div>
  );
}
