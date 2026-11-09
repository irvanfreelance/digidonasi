import Link from "next/link";
import { PublicScaffold } from "@/components/public/scaffold";
import { getDonorSession } from "@/lib/auth/panel-session";
import { dbQuery } from "@/lib/db";
import { donorHistory } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getDonorSession();
  if (!session) return <PublicScaffold title="Riwayat donasi" body="Riwayat memakai sesi donatur. Email yang diketik tamu tidak masuk ke sini." />;
  const query = await searchParams;
  let result = { rows: [] as Record<string, unknown>[], page: 1, pageSize: 6, total: 0 };
  try {
    result = await donorHistory(dbQuery, session.id, { page: Number(query.page || "1") });
  } catch {
    result = { rows: [], page: 1, pageSize: 6, total: 0 };
  }
  return (
    <PublicScaffold title="Riwayat donasi" body="Hanya invoice yang dibuat saat sesi ini. Invoice tamu tidak diklaim otomatis.">
      <ul className="mt-4 grid gap-2">
        {result.rows.map((row) => (
          <li key={String(row.invoice_code)}>
            <Link href={`/invoice/${row.invoice_code}`} className="block rounded-2xl bg-white p-3 text-[14px] shadow-sm">
              {String(row.invoice_code)} · {String(row.total_amount)} · {String(row.status)}
            </Link>
          </li>
        ))}
      </ul>
      {result.rows.length === 0 ? <p className="mt-4 text-[14px]">Belum ada donasi pada sesi ini.</p> : null}
    </PublicScaffold>
  );
}
