import Link from "next/link";
import { SiteFooter } from "@/components/public/site-footer";
import { loadPublicOrg } from "@/lib/org-public";

export async function DonationShell({ children }: { children: React.ReactNode }) {
  const org = await loadPublicOrg();
  return (
    <div className="flex min-h-screen justify-center bg-gray-100 font-sans" style={{ "--primary": org.primary_color } as React.CSSProperties}>
      <div className="relative flex min-h-[100dvh] w-full max-w-md flex-col bg-gradient-to-b from-teal-50/70 to-slate-50 sm:shadow-2xl">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-5 pt-8 pb-4 shadow-sm">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={org.favicon_url || "/brand/favicon.svg"} alt="" className="h-10 w-10 rounded-xl" />
            <span>
              <span className="block text-lg leading-none font-extrabold tracking-tight text-[#0A3F34]">{org.nama_singkat}</span>
              <span className="mt-1 block text-[11px] font-semibold text-gray-500">{org.tagline}</span>
            </span>
          </Link>
          <Link href="/masuk" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-xs font-bold text-gray-600" aria-label="Masuk">
            Akun
          </Link>
        </header>
        <div className="flex-1 pb-24">
          {children}
          <SiteFooter org={org} />
        </div>
        <nav className="fixed bottom-0 z-30 flex w-full max-w-md justify-around border-t border-gray-100 bg-white px-2 py-2 text-[11px] font-semibold text-gray-500">
          <Link href="/" className="flex min-h-11 flex-1 flex-col items-center justify-center">Beranda</Link>
          <Link href="/donasi" className="flex min-h-11 flex-1 flex-col items-center justify-center text-[#0E6B56]">Donasi</Link>
          <Link href="/donasi/riwayat" className="flex min-h-11 flex-1 flex-col items-center justify-center">Riwayat</Link>
        </nav>
      </div>
    </div>
  );
}
