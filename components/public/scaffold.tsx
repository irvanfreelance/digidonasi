import Link from "next/link";
import { SiteFooter } from "@/components/public/site-footer";
import { loadPublicOrg } from "@/lib/org-public";

export async function PublicScaffold({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  const org = await loadPublicOrg();
  return (
    <div className="min-h-dvh bg-[#f4f5f7] text-[#1a1a1a]" style={{ "--primary": org.primary_color } as React.CSSProperties}>
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[var(--primary)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={org.favicon_url || "/brand/favicon.svg"} alt="" className="h-8 w-8 rounded-lg" />
            {org.nama_singkat}
          </Link>
          <nav className="flex flex-wrap gap-3 text-[13px]">
            <Link href="/donasi">Donasi</Link>
            <Link href="/masuk">Masuk</Link>
            <Link href="/afiliasi/masuk">Afiliasi</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mt-0 mb-3 text-[28px] font-bold text-[var(--primary)]">{title}</h1>
        {body ? <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-[#444]">{body}</p> : null}
        {children}
        <SiteFooter org={org} />
      </main>
    </div>
  );
}
