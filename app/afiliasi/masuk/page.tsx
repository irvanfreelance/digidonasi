import { LoginScreen } from "@/components/auth/login-screen";
import { MockLoginForm } from "@/components/auth/mock-form";
import { authMode } from "@/lib/auth/doors";
import { loadPublicOrg } from "@/lib/org-public";

export default async function AffiliateLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string; state?: string }>;
}) {
  const query = await searchParams;
  const mode = authMode();
  return (
    <>
      {mode === "mock" && query.mock === "1" && query.state ? (
        <MockLoginForm action="/api/auth/affiliate/callback" state={query.state} />
      ) : null}
      <LoginScreen
        org={await loadPublicOrg()}
        title="Afiliasi"
        notice="Hanya pintu ini yang membuat akun afiliasi. Status awal menunggu persetujuan. Bukan persetujuan otomatis."
        href="/api/auth/affiliate?next=/afiliasi"
        configured={mode !== "unconfigured"}
      />
    </>
  );
}
