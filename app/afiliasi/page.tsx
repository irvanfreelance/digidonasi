import { AffiliateShell } from "@/components/afiliasi/shell";
import { getAffiliateSession } from "@/lib/auth/panel-session";
import { readAffiliate, rupiah } from "@/lib/afiliasi/read";

export const dynamic = "force-dynamic";

export default async function AffiliateHome() {
  const session = await getAffiliateSession();
  const data = session ? await readAffiliate(session.id) : { profile: null, balance: null };
  const balance = data.balance;
  return (
    <AffiliateShell title="Dasbor">
      <p className="mt-0 text-sm text-gray-600">
        {data.profile ? `${data.profile.nama} · ${data.profile.status === "ACTIVE" ? "Aktif" : data.profile.status === "PENDING" ? "Menunggu persetujuan" : "Ditangguhkan"}` : "Masuk untuk melihat saldo Anda."}
      </p>
      {balance ? (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-teal-50 p-3"><dt className="text-[11px] text-gray-500">Menunggu</dt><dd className="m-0 font-bold">{rupiah(balance.pending)}</dd></div>
          <div className="rounded-2xl bg-teal-50 p-3"><dt className="text-[11px] text-gray-500">Bisa ditarik</dt><dd className="m-0 font-bold">{rupiah(balance.available)}</dd></div>
          <div className="rounded-2xl bg-gray-50 p-3"><dt className="text-[11px] text-gray-500">Ditahan tarik</dt><dd className="m-0 font-bold">{rupiah(balance.reserved)}</dd></div>
          <div className="rounded-2xl bg-gray-50 p-3"><dt className="text-[11px] text-gray-500">Sudah cair</dt><dd className="m-0 font-bold">{rupiah(balance.settled)}</dd></div>
        </dl>
      ) : <p className="text-sm text-gray-500">Saldo belum terbaca.</p>}
      <p className="text-[12px] leading-relaxed text-gray-500">Komisi dihitung dari pokok donasi, ditahan 14 hari, lalu bisa ditarik. Pencairan dicatat sebagai transfer manual.</p>
    </AffiliateShell>
  );
}
