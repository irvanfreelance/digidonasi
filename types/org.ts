import { DEFAULT_ORG } from "@/lib/nav";

export type OrgProfile = {
  id: number;
  nama: string;
  nama_singkat: string;
  tagline: string;
  short_description?: string;
  address?: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  sidebar_color: string;
  accent_color: string;
  facebook_url?: string | null;
  instagram_url?: string | null;
  whatsapp_number?: string | null;
  public_email?: string | null;
  is_seed_default: boolean;
  updated_at?: string;
};

export function fallbackOrg(): OrgProfile {
  return {
    id: 1,
    nama: DEFAULT_ORG.nama,
    nama_singkat: DEFAULT_ORG.namaSingkat,
    tagline: DEFAULT_ORG.tagline,
    short_description: DEFAULT_ORG.shortDescription,
    address: DEFAULT_ORG.address,
    logo_url: DEFAULT_ORG.logoUrl,
    favicon_url: DEFAULT_ORG.faviconUrl,
    primary_color: DEFAULT_ORG.primaryColor,
    sidebar_color: DEFAULT_ORG.sidebarColor,
    accent_color: DEFAULT_ORG.accentColor,
    facebook_url: DEFAULT_ORG.facebookUrl,
    instagram_url: DEFAULT_ORG.instagramUrl,
    whatsapp_number: DEFAULT_ORG.whatsappNumber,
    public_email: DEFAULT_ORG.publicEmail,
    is_seed_default: true,
  };
}
