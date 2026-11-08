import { notFound } from "next/navigation";
import { websiteEnabled } from "@/lib/env";

export default function Page() {
  if (!websiteEnabled()) notFound();
  return (
    <div>
      <h1 className="mt-0 text-[20px] font-bold text-[var(--primary)]">Konten website</h1>
      <p className="text-[13px] text-[#555]">Editor CMS menyusul pada hari 6. Draf di basis tidak dihapus saat paket mati.</p>
    </div>
  );
}
