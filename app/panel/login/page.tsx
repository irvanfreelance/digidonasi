import { LoginScreen } from "@/components/auth/login-screen";
import { fallbackOrg } from "@/types/org";

export default function PanelLoginPage() {
  return <LoginScreen org={fallbackOrg()} />;
}
