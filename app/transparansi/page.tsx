import { notFound } from "next/navigation";
import { PublicScaffold } from "@/components/public/scaffold";
import { websiteEnabled } from "@/lib/env";

export default function Page() {
  if (!websiteEnabled()) notFound();
  return <PublicScaffold title='Transparansi' body='Kerangka halaman website. Hanya hidup bila WEBSITE_ENABLED persis true. Konten draf di basis belum dirender.' />;
}
