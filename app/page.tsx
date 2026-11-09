import Link from "next/link";
import { PublicScaffold } from "@/components/public/scaffold";
import { websiteEnabled } from "@/lib/env";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (websiteEnabled()) {
    return (
      <PublicScaffold
        title="Beranda lembaga"
        body="Konten lembaga menyusul pada hari 6. Donasi tetap lewat katalog."
      />
    );
  }
  let blocks: Record<string, unknown>[] = [];
  try {
    blocks = await dbQuery(
      `SELECT seed_key, heading, body FROM donation_blocks WHERE publication_status = 'ACTIVE' ORDER BY seed_key`,
    );
  } catch {
    blocks = [];
  }
  return (
    <PublicScaffold title="Beranda donasi" body="Website paket mati. Donasi tetap dibuka. Blok di bawah hanya yang sudah diterbitkan.">
      <div className="mt-4 grid gap-3">
        {blocks.map((block) => (
          <article key={String(block.seed_key)} className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mt-0 text-[18px]">{String(block.heading || "")}</h2>
            <p className="mb-0 text-[14px]">{String(block.body || "")}</p>
          </article>
        ))}
      </div>
      <Link href="/donasi" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[var(--primary)]">
        Lihat katalog
      </Link>
    </PublicScaffold>
  );
}
