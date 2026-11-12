import Link from "next/link";
import { SiteFooter } from "@/components/public/site-footer";
import { loadPublicOrg } from "@/lib/org-public";

const LINKS = [
  ["/afiliasi", "Dasbor"],
  ["/afiliasi/promosi", "Promosi"],
  ["/afiliasi/komisi", "Komisi"],
  ["/afiliasi/tarik", "Tarik"],
  ["/afiliasi/profil", "Profil"],
] as const;

export async function AffiliateShell({ title, children }: { title: string; children: React.ReactNode }) {
  const org = await loadPublicOrg();
  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex min-h-[100dvh] w-full max-w-md flex-col bg-white sm:shadow-2xl">
        <header className="border-b border-gray-100 px-5 pt-8 pb-4">
          <Link href="/afiliasi" className="text-xs font-semibold text-[#0E6B56]">{org.nama_singkat}</Link>
          <h1 className="mt-1 mb-0 text-xl font-extrabold text-[#0A3F34]">{title}</h1>
        </header>
        <div className="flex-1 px-5 py-4 pb-24">{children}</div>
        <SiteFooter org={org} />
        <nav className="fixed bottom-0 z-30 flex w-full max-w-md justify-between border-t border-gray-100 bg-white px-1 py-1 text-[10px] font-semibold text-gray-500">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="flex min-h-11 flex-1 items-center justify-center">{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
