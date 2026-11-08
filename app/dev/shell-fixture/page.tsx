import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { fallbackOrg } from "@/types/org";

export const dynamic = "force-dynamic";

export default function ShellFixturePage() {
  if (process.env.PANEL_SHELL_FIXTURE !== "1") notFound();
  const org = fallbackOrg();
  return (
    <div style={{ "--primary": org.primary_color, "--sidebar": org.sidebar_color, "--accent": org.accent_color } as React.CSSProperties}>
      <AppShell userNama="Pratinjau kerangka" userEmail="bukan-akun@example.com" userRole="SUPERADMIN" websiteOn org={org}>
        <h1 className="mt-0 text-[20px] font-bold text-[var(--primary)]">Pratinjau shell</h1>
        <p className="max-w-xl text-[13px] text-[#555]">
          Ini bukan sesi. Halaman hanya hidup bila PANEL_SHELL_FIXTURE=1 pada proses uji. Masuk Google belum dipasang.
        </p>
      </AppShell>
    </div>
  );
}
