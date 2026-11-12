import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { getPanelSession } from "@/lib/auth/panel-session";
import { websiteEnabled } from "@/lib/env";
import { loadPublicOrg } from "@/lib/org-public";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getPanelSession();
  if (!session) redirect("/panel/login");
  const org = await loadPublicOrg();
  return (
    <div
      style={
        {
          "--primary": org.primary_color,
          "--sidebar": org.sidebar_color,
          "--accent": org.accent_color,
        } as React.CSSProperties
      }
    >
      <AppShell
        userNama={session.user.nama}
        userEmail={session.user.email}
        userRole={session.user.role}
        websiteOn={websiteEnabled()}
        org={org}
      >
        {children}
      </AppShell>
    </div>
  );
}
