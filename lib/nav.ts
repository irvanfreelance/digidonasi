import type { PanelRole } from "@/lib/auth/panel-session";

export type NavItem = {
  href: string;
  label: string;
  roles: PanelRole[];
  websiteOnly?: boolean;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

const SA: PanelRole[] = ["SUPERADMIN"];
const BOTH: PanelRole[] = ["SUPERADMIN", "WEBSITE_EDITOR"];

/** Menu panel. Kelompok CRM, blasting, dan HCM tidak ada. */
export const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [{ href: "/dashboard", label: "Dasbor", roles: SA }],
  },
  {
    group: "Donasi",
    items: [
      { href: "/campaigns", label: "Kampanye", roles: SA },
      { href: "/transactions", label: "Transaksi", roles: SA },
      { href: "/donatur", label: "Donatur", roles: SA },
      { href: "/pembayaran", label: "Pembayaran", roles: SA },
    ],
  },
  {
    group: "Afiliasi",
    items: [{ href: "/affiliates", label: "Persetujuan", roles: SA }],
  },
  {
    group: "Website",
    items: [{ href: "/website", label: "Konten", roles: BOTH, websiteOnly: true }],
  },
  {
    group: "Konfigurasi",
    items: [
      { href: "/app-config", label: "Pengaturan lembaga", roles: SA },
      { href: "/users", label: "Pengguna", roles: SA },
    ],
  },
];

export function navForRole(role: PanelRole, websiteOn: boolean): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role) && (!item.websiteOnly || websiteOn)),
  })).filter((group) => group.items.length > 0);
}

export const DEFAULT_ORG = {
  nama: process.env.ORG_NAME || "[DEMO] Lembaga Contoh",
  namaSingkat: process.env.ORG_SHORT_NAME || "DEMO",
  tagline: process.env.ORG_TAGLINE || "[DEMO] Bukan lembaga sungguhan",
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: process.env.ORG_PRIMARY_COLOR || "#01665a",
  sidebarColor: process.env.ORG_SIDEBAR_COLOR || "#01665a",
  accentColor: process.env.ORG_ACCENT_COLOR || "#2e8b7a",
};
