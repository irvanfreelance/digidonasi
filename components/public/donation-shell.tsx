import Link from "next/link";
import { fallbackOrg } from "@/types/org";

export function DonationShell({ children }: { children: React.ReactNode }) {
  const org = fallbackOrg();
  return (
    <div className="flex min-h-screen justify-center bg-gray-100 font-sans">
      <div className="relative flex min-h-[100dvh] w-full max-w-md flex-col bg-gradient-to-b from-teal-50/70 to-slate-50 sm:shadow-2xl">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-5 pt-8 pb-4 shadow-sm">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white shadow-md">
              {org.nama_singkat.slice(0, 1)}
            </span>
            <span>
              <span className="block text-lg leading-none font-extrabold tracking-tight text-teal-700">{org.nama_singkat}</span>
              <span className="mt-1 block text-[11px] font-semibold text-gray-500">{org.tagline}</span>
            </span>
          </Link>
          <Link href="/masuk" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-xs font-bold text-gray-600" aria-label="Masuk">
            Akun
          </Link>
        </header>
        <div className="flex-1 pb-24">{children}</div>
        <nav className="fixed bottom-0 z-30 flex w-full max-w-md justify-around border-t border-gray-100 bg-white px-2 py-2 text-[11px] font-semibold text-gray-500">
          <Link href="/" className="flex min-h-11 flex-1 flex-col items-center justify-center">Beranda</Link>
          <Link href="/donasi" className="flex min-h-11 flex-1 flex-col items-center justify-center text-teal-700">Donasi</Link>
          <Link href="/donasi/riwayat" className="flex min-h-11 flex-1 flex-col items-center justify-center">Riwayat</Link>
        </nav>
      </div>
    </div>
  );
}
