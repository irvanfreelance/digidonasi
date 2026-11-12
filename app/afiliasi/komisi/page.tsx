import { AffiliateShell } from "@/components/afiliasi/shell";
import { getAffiliateSession } from "@/lib/auth/panel-session";
import { dbQuery } from "@/lib/db";
import { rupiah } from "@/lib/afiliasi/read";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  commission_hold: "Komisi ditahan",
  hold_to_available: "Komisi bisa ditarik",
  reverse_pending: "Pembalikan tahan",
  reverse_available: "Pembalikan saldo",
  payout_reserve: "Permintaan tarik",
  payout_release: "Tarik dibatalkan",
  payout_settle: "Tarik dicairkan",
};

export default async function CommissionPage() {
  const session = await getAffiliateSession();
  let rows: { idempotency_key: string; movement: string; amount_rupiah: string; created_at: string }[] = [];
  if (session) {
    try {
      rows = await dbQuery(
        `SELECT idempotency_key, movement, amount_rupiah::text, created_at FROM affiliate_ledger
         WHERE affiliate_id = $1 ORDER BY created_at DESC, id DESC LIMIT 30`,
        [session.id],
      );
    } catch {
      rows = [];
    }
  }
  return (
    <AffiliateShell title="Komisi">
      {rows.length === 0 ? <p className="text-sm text-gray-600">Belum ada gerakan pada buku Anda.</p> : null}
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.idempotency_key} className="rounded-2xl border border-gray-100 p-3 text-sm">
            <div className="font-semibold">{LABEL[row.movement] || row.movement}</div>
            <div>{rupiah(Number(row.amount_rupiah))}</div>
          </li>
        ))}
      </ul>
    </AffiliateShell>
  );
}
