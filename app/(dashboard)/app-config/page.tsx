import { OrgSettingsForm } from "@/components/forms/org-settings-form";
import { fallbackOrg } from "@/types/org";

export default function Page() {
  return (
    <div>
      <h1 className="mt-0 mb-1 text-[20px] font-bold text-[var(--primary)]">Pengaturan lembaga</h1>
      <p className="mb-4 text-[13px] text-[#666]">Nama, logo, dan warna dipakai di seluruh aplikasi. Penyimpanan ditolak sampai sesi hari 2 ada.</p>
      <OrgSettingsForm org={fallbackOrg()} />
    </div>
  );
}
