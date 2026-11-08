import type { PanelRole } from "@/lib/auth/panel-session";
import { websiteEnabled } from "@/lib/env";

const WEBSITE_RESOURCES = new Set(["website"]);

export function panelAllows(role: PanelRole, resource: string, siteOn = websiteEnabled()): boolean {
  if (role === "SUPERADMIN") {
    if (resource === "website" && !siteOn) return false;
    return true;
  }
  if (role === "WEBSITE_EDITOR") {
    return siteOn && WEBSITE_RESOURCES.has(resource);
  }
  return false;
}
