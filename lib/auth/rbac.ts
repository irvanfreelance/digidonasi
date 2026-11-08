import type { PanelRole } from "@/lib/auth/panel-session";
import { websiteEnabled } from "@/lib/env";

const WEBSITE_RESOURCES = new Set(["website"]);

export function panelAllows(role: PanelRole, resource: string): boolean {
  if (role === "SUPERADMIN") {
    if (resource === "website" && !websiteEnabled()) return false;
    return true;
  }
  if (role === "WEBSITE_EDITOR") {
    return websiteEnabled() && WEBSITE_RESOURCES.has(resource);
  }
  return false;
}
