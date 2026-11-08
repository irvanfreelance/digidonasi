import { LoginScreen } from "@/components/auth/login-screen";
import { MockLoginForm } from "@/components/auth/mock-form";
import { authMode } from "@/lib/auth/doors";
import { fallbackOrg } from "@/types/org";

export default async function DonorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string; state?: string }>;
}) {
  const query = await searchParams;
  const mode = authMode();
  return (
    <>
      {mode === "mock" && query.mock === "1" && query.state ? <MockLoginForm action="/api/auth/donor/callback" state={query.state} /> : null}
      <LoginScreen
        org={fallbackOrg()}
        title="Donatur"
        notice={
          mode === "unconfigured"
            ? "Google belum dikonfigurasi. Login nyata belum tersedia. Checkout tamu tetap ada di kerangka donasi."
            : "Pintu donatur. Masuk di sini tidak membuat sesi panel atau afiliasi, dan tidak mengklaim invoice tamu."
        }
        href="/api/auth/donor?next=/profil"
        configured={mode !== "unconfigured"}
      />
    </>
  );
}
