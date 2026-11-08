export type PanelRole = "SUPERADMIN" | "WEBSITE_EDITOR";

export type PanelSession = {
  user: {
    id: string;
    nama: string;
    email: string;
    role: PanelRole;
  };
};

/**
 * Hari 1 sengaja gagal tertutup.
 * Tidak membaca cookie, tidak memakai penanda sesi UI lawas,
 * dan tidak mengangkat admin pertama sebagai sesi.
 * Google tiga audiens masuk pada hari 2.
 */
export async function getPanelSession(): Promise<PanelSession | null> {
  return null;
}
