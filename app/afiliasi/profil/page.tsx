import { ActionForm } from "@/components/afiliasi/action-form";
import { AffiliateShell } from "@/components/afiliasi/shell";
import { getAffiliateSession } from "@/lib/auth/panel-session";
import { readAffiliate } from "@/lib/afiliasi/read";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getAffiliateSession();
  const data = session ? await readAffiliate(session.id) : { profile: null, balance: null };
  return (
    <AffiliateShell title="Profil">
      <p className="mt-0 text-sm text-gray-600">{data.profile?.email || session?.email}</p>
      <ActionForm action="/api/afiliasi" label="Simpan nama" fields={[{ name: "nama", label: "Nama", defaultValue: data.profile?.nama || session?.name || "" }]} />
      <form action="/api/auth/affiliate/logout" method="post" className="mt-4">
        <button className="min-h-11 text-[13px] font-semibold text-[#0E6B56]">Keluar</button>
      </form>
    </AffiliateShell>
  );
}
