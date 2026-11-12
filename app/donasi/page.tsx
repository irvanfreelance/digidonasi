import Link from "next/link";
import { CampaignListCard, UrgentCard } from "@/components/public/campaign-card";
import { DonationShell } from "@/components/public/donation-shell";
import { dbQuery } from "@/lib/db";
import { listCampaigns, listCatalogRails } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function DonasiPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; kategori?: string }> }) {
  const query = await searchParams;
  const page = Number(query.page || "1");
  const kategori = query.kategori || "";
  let result = { rows: [] as Record<string, unknown>[], page: 1, pageSize: 6, total: 0 };
  let rails = { categories: [] as Record<string, unknown>[], urgent: [] as Record<string, unknown>[], carousel: [] as Record<string, unknown>[] };
  try {
    result = await listCampaigns(dbQuery, { q: query.q || "", page, category: kategori });
    rails = await listCatalogRails(dbQuery);
  } catch {
    result = { rows: [], page: 1, pageSize: 6, total: 0 };
  }
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (kategori) params.set("kategori", kategori);
    if (nextPage > 1) params.set("page", String(nextPage));
    const text = params.toString();
    return text ? `/donasi?${text}` : "/donasi";
  };
  return (
    <DonationShell>
      <form action="/donasi" className="relative mx-5 mt-5 mb-4">
        {kategori ? <input type="hidden" name="kategori" value={kategori} /> : null}
        <input name="q" defaultValue={query.q || ""} placeholder="Cari program atau kategori" className="w-full rounded-full border border-gray-100 bg-white py-3.5 pr-4 pl-11 text-sm text-gray-800" />
        <span className="pointer-events-none absolute top-3.5 left-4 text-xs text-gray-400">Cari</span>
      </form>
      {rails.carousel.length > 0 ? (
        <div className="mb-6 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2">
          {rails.carousel.map((row) => (
            <Link key={String(row.slug)} href={`/donasi/${row.slug}`} className="relative h-36 min-w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl shadow-md">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900/85 to-teal-700/30" />
              <div className="relative flex h-full flex-col justify-center p-5 text-white">
                <div className="mb-1 text-[10px] font-bold tracking-wider text-teal-100 uppercase">{String(row.category)}</div>
                <div className="line-clamp-2 w-5/6 text-lg leading-tight font-bold">{String(row.title)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      <section className="mb-6 px-5">
        <h2 className="mb-3 text-sm font-extrabold text-gray-900">Kategori</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <Link href="/donasi" className={`flex min-w-[72px] flex-col items-center text-[11px] font-semibold ${kategori ? "text-gray-500" : "text-teal-700"}`}>
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-50 bg-white shadow-sm">Semua</span>
            Semua
          </Link>
          {rails.categories.map((category) => (
            <Link key={String(category.slug)} href={`/donasi?kategori=${category.slug}`} className={`flex min-w-[72px] flex-col items-center text-[11px] font-semibold ${kategori === category.slug ? "text-teal-700" : "text-gray-600"}`}>
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-50 bg-teal-50 font-bold text-teal-700 shadow-sm">
                {String(category.name).slice(0, 1)}
              </span>
              {String(category.name)}
            </Link>
          ))}
        </div>
      </section>
      {rails.urgent.length > 0 && !kategori ? (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between px-5">
            <h2 className="text-sm font-extrabold text-gray-900">Butuh segera</h2>
            <Link href="/donasi/mendesak" className="text-[11px] font-bold text-teal-700">Lainnya</Link>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-2">
            {rails.urgent.map((row) => (
              <UrgentCard key={String(row.slug)} row={row} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="px-5">
        <h2 className="mb-3 text-sm font-extrabold text-gray-900">Program</h2>
        <div className="grid gap-3">
          {result.rows.map((row) => (
            <CampaignListCard key={String(row.slug)} row={row} />
          ))}
        </div>
        {result.rows.length === 0 ? <p className="text-sm text-gray-500">Belum ada program tayang untuk pencarian ini.</p> : null}
        <div className="mt-4 flex items-center justify-between text-[13px] font-semibold">
          {result.page > 1 ? <Link href={href(result.page - 1)} className="min-h-11 text-teal-700">Sebelumnya</Link> : <span />}
          <span className="text-gray-400">{result.page}/{pages}</span>
          {result.page < pages ? <Link href={href(result.page + 1)} className="min-h-11 text-teal-700">Muat lagi</Link> : <span />}
        </div>
      </section>
    </DonationShell>
  );
}
