import { AffiliateShell } from "@/components/afiliasi/shell";
import { getAffiliateSession } from "@/lib/auth/panel-session";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PromoPage() {
  const session = await getAffiliateSession();
  const active = session?.status === "ACTIVE";
  let campaigns: { slug: string; title: string }[] = [];
  if (active) {
    try {
      campaigns = await dbQuery(`SELECT slug, title FROM campaigns WHERE publication_status = 'ACTIVE' ORDER BY sort_order, id`);
    } catch {
      campaigns = [];
    }
  }
  return (
    <AffiliateShell title="Promosi">
      {active ? (
        <ul className="grid gap-3">
          {campaigns.map((row) => {
            const href = `/api/klik?slug=${encodeURIComponent(row.slug)}&ref=${session?.id}`;
            return (
              <li key={row.slug} className="rounded-2xl border border-gray-100 p-3">
                <div className="text-sm font-bold">{row.title}</div>
                <p className="text-[12px] break-all text-gray-500">{href}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">Tautan promosi aktif setelah superadmin menyetujui akun. Dasbor tetap bisa dilihat.</p>
      )}
    </AffiliateShell>
  );
}
