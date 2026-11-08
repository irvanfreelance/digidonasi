import { PublicScaffold } from "@/components/public/scaffold";
import { websiteEnabled } from "@/lib/env";

export default function HomePage() {
  if (websiteEnabled()) {
    return (
      <PublicScaffold
        title="Beranda lembaga"
        body="Kerangka beranda website. Blok konten sudah ada di basis sebagai draf, tetapi halaman ini belum merender CMS. Itu pekerjaan hari 6."
      />
    );
  }
  return (
    <PublicScaffold
      title="Beranda donasi"
      body="Website paket mati lewat env, jadi beranda ini kerangka donasi. Katalog, pembayaran, dan blok yang bisa disunting belum ditampilkan. Data demo tetap tersimpan."
    />
  );
}
