import Link from "next/link";
import { PublicScaffold } from "@/components/public/scaffold";
import { dbQuery } from "@/lib/db";
import { listCampaigns } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function DonasiPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const query = await searchParams;
  const page = Number(query.page || "1");
  let result = { rows: [] as Record<string, unknown>[], page: 1, pageSize: 6, total: 0 };
  try {
    result = await listCampaigns(dbQuery, { q: query.q || "", page });
  } catch {
    result = { rows: [], page: 1, pageSize: 6, total: 0 };
  }
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <PublicScaffold title="Katalog donasi" body="Hanya kampanye berstatus tayang. Draf tidak bisa dibayar. Pembayaran masih mock.">
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" action="/donasi">
        <input name="q" defaultValue={query.q || ""} placeholder="Cari kampanye" className="min-h-11 w-full px-3 sm:max-w-sm" />
        <button className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-[13px] font-semibold text-white">Cari</button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.rows.map((row) => (
          <Link key={String(row.slug)} href={`/donasi/${row.slug}`} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[12px] text-[#666]">{String(row.category)}</div>
            <div className="mt-1 text-[16px] font-bold text-[var(--primary)]">{String(row.title)}</div>
            <p className="mt-1 mb-0 text-[13px] text-[#444]">{String(row.summary)}</p>
          </Link>
        ))}
      </div>
      {result.rows.length === 0 ? <p className="mt-4 text-[14px] text-[#666]">Belum ada kampanye tayang.</p> : null}
      <div className="mt-4 flex gap-3 text-[13px]">
        {result.page > 1 ? <Link href={`/donasi?q=${encodeURIComponent(query.q || "")}&page=${result.page - 1}`}>Sebelumnya</Link> : null}
        <span>
          Halaman {result.page} dari {pages}
        </span>
        {result.page < pages ? <Link href={`/donasi?q=${encodeURIComponent(query.q || "")}&page=${result.page + 1}`}>Berikutnya</Link> : null}
      </div>
    </PublicScaffold>
  );
}
