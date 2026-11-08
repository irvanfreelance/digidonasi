import { LoginScreen } from "@/components/auth/login-screen";
import { MockLoginForm } from "@/components/auth/mock-form";
import { authMode } from "@/lib/auth/doors";
import { fallbackOrg } from "@/types/org";

export const metadata = { title: "Masuk panel", description: "Pintu panel." };

export default async function PanelLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string; state?: string; error?: string }>;
}) {
  const query = await searchParams;
  const mode = authMode();
  const notice =
    query.error === "editor_website_mati"
      ? "Editor website ditolak karena WEBSITE_ENABLED bukan true. Baris pengguna tidak dihapus."
      : query.error
        ? "Masuk ditolak. Tidak ada sesi yang dibuat."
        : mode === "mock"
          ? "Mode uji lokal. Ini bukan login Google sungguhan dan tidak memakai cookie sesi lama."
          : mode === "google"
            ? "Satu kredensial Google untuk klien ini. Sesi panel terpisah dari donatur dan afiliasi."
            : "Google belum dikonfigurasi. Login nyata belum tersedia.";
  return (
    <>
      {mode === "mock" && query.mock === "1" && query.state ? (
        <MockLoginForm action="/api/auth/admin/callback" state={query.state} />
      ) : null}
      <LoginScreen
        org={fallbackOrg()}
        title="Panel"
        notice={notice}
        href="/api/auth/admin?next=/dashboard"
        configured={mode !== "unconfigured"}
      />
    </>
  );
}
