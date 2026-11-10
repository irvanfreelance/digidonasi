import Link from "next/link";
import { PublicScaffold } from "@/components/public/scaffold";
import { getDonorSession } from "@/lib/auth/panel-session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getDonorSession();
  if (!session) {
    return <PublicScaffold title="Profil donatur" body="Masuk terlebih dahulu. Tamu tetap bisa checkout tanpa profil." />;
  }
  return (
    <PublicScaffold title="Profil donatur" body={`${session.name} · ${session.email}`}>
      <Link href="/donasi/riwayat" className="mt-4 inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--primary)]">
        Lihat riwayat
      </Link>
    </PublicScaffold>
  );
}
