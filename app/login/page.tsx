import { LoginScreen } from "@/components/auth/login-screen";
import { fallbackOrg } from "@/types/org";

export const metadata = { title: "Masuk panel", description: "Pintu panel. Google menyusul hari 2." };

export default function LoginPage() {
  return <LoginScreen org={fallbackOrg()} />;
}
