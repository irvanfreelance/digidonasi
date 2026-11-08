import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmHost } from "@/components/ui/confirm-toast";
import { fallbackOrg } from "@/types/org";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
});

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const org = fallbackOrg();
  return {
    title: org.nama,
    description: org.tagline,
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
