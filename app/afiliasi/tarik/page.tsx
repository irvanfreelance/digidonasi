import { ActionForm } from "@/components/afiliasi/action-form";
import { AffiliateShell } from "@/components/afiliasi/shell";
import { getAffiliateSession } from "@/lib/auth/panel-session";
import { dbQuery } from "@/lib/db";
import { readAffiliate, rupiah } from "@/lib/afiliasi/read";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const session = await getAffiliateSession();
  const data = session ? await readAffiliate(session.id) : { profile: null, balance: null };
  let requests: { id: string; amount_rupiah: string; status: string; settlement_ref: string | null }[] = [];
  if (session) {
    try {
      requests = await dbQuery(
        `SELECT id::text, amount_rupiah::text, status, settlement_ref FROM payout_requests
         WHERE affiliate_id = $1 ORDER BY created_at DESC, id DESC`,
        [session.id],
      );
    } catch {
      requests = [];
    }
  }
  const active = data.profile?.status === "ACTIVE";
  return (
    <AffiliateShell title="Tarik dana">
      <p className="mt-0 text-sm text-gray-600">
        Bisa ditarik {data.balance ? rupiah(data.balance.available) : "Rp 0"}. Transfer dilakukan manual oleh lembaga, bukan otomatis.
      </p>
      {active ? <ActionForm action="/api/afiliasi/tarik" label="Ajukan" fields={[{ name: "amount", label: "Nominal rupiah", type: "number" }]} /> : <p className="text-sm">Penarikan menunggu akun aktif.</p>}
      <ul className="mt-4 grid gap-2">
        {requests.map((row) => (
          <li key={row.id} className="rounded-2xl border border-gray-100 p-3 text-sm">
            <div className="font-semibold">{rupiah(Number(row.amount_rupiah))}</div>
            <div className="text-[12px] text-gray-500">{row.status}{row.settlement_ref ? ` · ${row.settlement_ref}` : ""}</div>
          </li>
        ))}
      </ul>
    </AffiliateShell>
  );
}
