import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmHost } from "@/components/ui/confirm-toast";
import { loadPublicOrg } from "@/lib/org-public";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await loadPublicOrg();
  return {
    title: org.nama,
    description: org.tagline,
    icons: { icon: org.favicon_url || "/brand/favicon.svg" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster richColors position="top-right" />
        <ConfirmHost />
      </body>
    </html>
  );
}
