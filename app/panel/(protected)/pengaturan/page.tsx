import { OrgSettingsForm } from "@/components/forms/org-settings-form";
import { fallbackOrg } from "@/types/org";

export default function Page() {
  const org = fallbackOrg();
  return (
    <div>
      <h1 className="mb-3 mt-0 text-[20px] font-bold text-[var(--primary)]">Pengaturan lembaga</h1>
      <p className="max-w-xl text-[13px] text-[#555]">Formulir mengikuti pola panel. Penyimpanan ditolak sampai sesi panel hari 2 ada.</p>
      <OrgSettingsForm org={org} />
    </div>
  );
}
