'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Heart, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { id: '/', label: 'Beranda' },
  { id: '/tentang-kami', label: 'Tentang Kami' },
  { id: '/program', label: 'Program' },
  { id: '/layanan-ziswaf', label: 'Layanan ZISWAF' },
  { id: '/transparansi', label: 'Transparansi' },
  { id: '/kabar-kebaikan', label: 'Kabar Kebaikan' },
  { id: '/kontak', label: 'Kontak' },
];

export default function Navbar({ config }: { config?: any }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Corporate public pages with dark hero header at the top
  const isDarkHeroPage = [
    '/',
    '/tentang-kami',
    '/program',
    '/layanan-ziswaf',
    '/transparansi',
    '/kabar-kebaikan',
    '/kontak',
  ].some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));

  useEffect(() => {
    if (!isDarkHeroPage) {
      setScrolled(true);
      return;
    }
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDarkHeroPage, pathname]);

  const transparent = isDarkHeroPage && !scrolled && !open;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] px-6 h-16 flex items-center justify-between transition-all duration-300 ${
        transparent
          ? 'bg-transparent border-b border-transparent'
          : 'bg-[#ffffff] border-b border-[#e2e8f0] shadow-sm'
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
        {config?.logo_url ? (
          <img
            src={config.logo_url}
            alt="Logo"
            className={`h-[42px] w-auto object-contain transition-all duration-300 ${
              transparent ? 'brightness-0 invert' : ''
            }`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <>
            <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-colors duration-300 ${transparent ? 'bg-white/15' : 'bg-[#83b64e]'}`}>
              <Star size={17} className="text-white fill-white" />
            </div>
            <div>
              <div className={`font-cabin font-bold text-sm transition-colors duration-300 ${transparent ? 'text-white' : 'text-[#83b64e]'}`}>LAZ Darul Hikam</div>
              <div className={`text-[10px] transition-colors duration-300 ${transparent ? 'text-white/70' : 'text-[#94a3b8]'}`}>SK Kemenag No. 52/2024</div>
            </div>
          </>
        )}
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex gap-1 items-center">
        {NAV_LINKS.map(l => {
          const isActive = pathname === l.id;
          return (
            <Link key={l.id} href={l.id} className={`
              px-3 py-1.5 border-none font-cabin text-[13px] rounded-lg transition-all duration-150
              ${transparent
                ? (isActive ? 'bg-white/20 text-white font-bold' : 'bg-transparent text-white/90 font-medium hover:bg-white/10 hover:text-white')
                : (isActive ? 'bg-[#e8f0fb] text-[#83b64e] font-bold' : 'bg-transparent text-[#475569] font-medium hover:bg-slate-50 hover:text-[#83b64e]')
              }
            `}>
              {l.label}
            </Link>
          );
        })}
        <Link href="/donasi" className={`ml-2 px-4 py-2 text-[13px] rounded-lg inline-flex items-center gap-2 font-cabin font-bold transition-all ${
          transparent
            ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
            : 'bg-[#83b64e] text-white hover:opacity-85'
        }`}>
          <Heart size={14} className="fill-white" /> Donasi
        </Link>
      </div>

      {/* Mobile nav toggle */}
      <div className="md:hidden">
        <button onClick={() => setOpen(!open)} className={`p-2 transition-colors duration-300 ${transparent ? 'text-white' : 'text-[#475569]'}`}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav menu */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#e2e8f0] shadow-lg py-4 px-6 flex flex-col gap-2 md:hidden">
          {NAV_LINKS.map(l => {
            const isActive = pathname === l.id;
            return (
              <Link key={l.id} href={l.id} onClick={() => setOpen(false)} className={`
                block px-4 py-3 rounded-lg font-cabin
                ${isActive ? 'bg-[#e8f0fb] text-[#83b64e] font-bold' : 'text-[#475569]'}
              `}>
                {l.label}
              </Link>
            );
          })}
          <Link href="/donasi" onClick={() => setOpen(false)} className="mt-2 w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 bg-[#83b64e] text-white font-cabin font-bold">
            <Heart size={16} className="fill-white" /> Donasi
          </Link>
        </div>
      )}
    </nav>
  );
}
