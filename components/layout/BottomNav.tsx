'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide BottomNav on detail campaign, checkout flow, invoice, and status pages
  const isDonasiListPage = pathname === '/donasi/mendesak' || pathname === '/donasi/riwayat';
  if ((pathname?.startsWith('/donasi/') && !isDonasiListPage) || pathname?.startsWith('/invoice/') || pathname?.startsWith('/status/')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around px-2 py-2 pb-safe z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <Link href="/donasi" prefetch={true} className={cn("flex flex-col items-center flex-1 py-1", pathname === '/donasi' ? "text-brand-600" : "text-gray-400")}>
        <div className={cn(pathname === '/donasi' ? "bg-brand-50 px-4 py-1.5 rounded-full mb-1" : "mb-1.5")}>
          <Home size={20} className={pathname === '/donasi' ? "fill-brand-100" : ""} />
        </div>
        <span className={cn("text-[10px]", pathname === '/donasi' ? "font-bold" : "font-medium")}>Beranda</span>
      </Link>

      <Link href="/news" prefetch={true} className={cn("flex flex-col items-center flex-1 py-1", pathname?.startsWith('/news') ? "text-brand-600" : "text-gray-400")}>
        <div className={cn(pathname?.startsWith('/news') ? "bg-brand-50 px-4 py-1.5 rounded-full mb-1" : "mb-1.5")}>
          <Newspaper size={20} className={pathname?.startsWith('/news') ? "fill-brand-100" : ""} />
        </div>
        <span className={cn("text-[10px]", pathname?.startsWith('/news') ? "font-bold" : "font-medium")}>Kabar Berita</span>
      </Link>

      <Link href="/donasi/riwayat" prefetch={true} className={cn("flex flex-col items-center flex-1 py-1", pathname?.startsWith('/donasi/riwayat') ? "text-brand-600" : "text-gray-400")}>
        <div className={cn(pathname?.startsWith('/donasi/riwayat') ? "bg-brand-50 px-4 py-1.5 rounded-full mb-1" : "mb-1.5")}>
          <Heart size={20} className={pathname?.startsWith('/donasi/riwayat') ? "fill-brand-100" : ""} />
        </div>
        <span className={cn("text-[10px]", pathname?.startsWith('/donasi/riwayat') ? "font-bold" : "font-medium")}>Donasi Saya</span>
      </Link>
    </div>
  );
}
