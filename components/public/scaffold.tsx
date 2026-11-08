import Link from "next/link";
import { fallbackOrg } from "@/types/org";

export function PublicScaffold({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const org = fallbackOrg();
  return (
    <div className="min-h-dvh bg-[#f4f5f7] text-[#1a1a1a]" style={{ "--primary": org.primary_color } as React.CSSProperties}>
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-[15px] font-bold text-[var(--primary)]">
            {org.nama_singkat}
          </Link>
          <nav className="flex gap-3 text-[13px]">
            <Link href="/donasi">Donasi</Link>
            <Link href="/masuk">Masuk</Link>
            <Link href="/afiliasi/masuk">Afiliasi</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="m-0 text-[12px] font-semibold tracking-wide text-[#01665e] uppercase">Kerangka hari 1</p>
        <h1 className="mt-2 mb-3 text-[28px] font-bold text-[var(--primary)]">{title}</h1>
        <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-[#444]">{body}</p>
      </main>
    </div>
  );
}
