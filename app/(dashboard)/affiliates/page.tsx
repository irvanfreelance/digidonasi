import { ActionForm } from "@/components/afiliasi/action-form";
import { dbQuery } from "@/lib/db";
import { rupiah } from "@/lib/afiliasi/read";

export const dynamic = "force-dynamic";

export default async function AffiliatesAdminPage() {
  let people: { id: string; nama: string; email: string; status: string }[] = [];
  let payouts: { id: string; nama: string; amount_rupiah: string; status: string }[] = [];
  let error = "";
  try {
    people = await dbQuery(`SELECT id::text, nama, email, status FROM affiliates ORDER BY id`);
    payouts = await dbQuery(
      `SELECT p.id::text, a.nama, p.amount_rupiah::text, p.status
       FROM payout_requests p JOIN affiliates a ON a.id = p.affiliate_id
       ORDER BY p.created_at DESC, p.id DESC`,
    );
  } catch {
    error = "Basis belum terbaca.";
  }
  return (
    <section className="grid gap-4">
      <h1 className="mt-0 text-[20px] font-bold text-[var(--primary)]">Afiliasi</h1>
      <p className="m-0 max-w-xl text-[13px] text-[#555]">Superadmin menyetujui akun dan mencatat pencairan sebagai transfer manual. Tidak ada transfer otomatis.</p>
      {error ? <p>{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr><th className="p-2">Nama</th><th className="p-2">Surel</th><th className="p-2">Status</th></tr>
          </thead>
          <tbody>
            {people.map((row) => (
              <tr key={row.id} className="border-t border-[#eee]">
                <td className="p-2">{row.nama}</td>
                <td className="p-2">{row.email}</td>
                <td className="p-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {people.map((row) => (
          <ActionForm
            key={row.id}
            action="/api/panel/afiliasi"
            label={`Status ${row.nama}`}
            hidden={{ action: "status", id: row.id }}
            fields={[{ name: "status", label: "PENDING, ACTIVE, atau SUSPENDED", defaultValue: row.status }]}
          />
        ))}
        {payouts.filter((row) => row.status === "requested").map((row) => (
          <div key={row.id} className="grid gap-2">
            <ActionForm action="/api/panel/afiliasi" label={`Cairkan ${row.nama} ${rupiah(Number(row.amount_rupiah))}`} hidden={{ action: "settle", id: row.id }} fields={[{ name: "settlementRef", label: "Nomor bukti transfer" }]} />
            <ActionForm action="/api/panel/afiliasi" label="Tolak permintaan" hidden={{ action: "reject", id: row.id }} fields={[{ name: "reason", label: "Alasan" }]} />
          </div>
        ))}
      </div>
    </section>
  );
}
