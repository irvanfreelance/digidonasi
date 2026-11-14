import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsappIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2.05 22l5.28-1.38a9.9 9.9 0 0 0 4.71 1.2h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.24 8.24 0 0 1-1.26-4.36c0-4.55 3.71-8.26 8.28-8.26 2.21 0 4.29.86 5.85 2.43a8.2 8.2 0 0 1 2.42 5.84c0 4.55-3.71 8.23-8.28 8.23Zm4.53-6.19c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.42 1.02 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

const FALLBACK_PROGRAMS = [
  { title: 'Beasiswa Generasi Rabbani', slug: null },
  { title: 'Layanan Kesehatan', slug: null },
  { title: 'Tanggap Bencana', slug: null },
  { title: 'Modal Usaha Dhuafa', slug: null },
];

export default function Footer({ config, programs }: { config: any, programs?: any[] }) {
  const footerPrograms = programs && programs.length > 0 ? programs : FALLBACK_PROGRAMS;

  return (
    <footer className="bg-[#ffffff] border-t border-[#e2e8f0] pt-12 pb-8">
      <div className="max-w-[1060px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            {config?.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="h-[38px] w-auto object-contain" />
            ) : (
              <>
                <div className="w-[34px] h-[34px] bg-[#83b64e] rounded-lg flex items-center justify-center">
                  <Star size={17} className="text-white fill-white" />
                </div>
                <div>
                  <div className="font-cabin font-bold text-sm text-[#83b64e]">{config?.ngo_name || 'LAZ Darul Hikam'}</div>
                  <div className="text-[10px] text-[#94a3b8]">SK Kemenag No. 52/2024</div>
                </div>
              </>
            )}
          </Link>
          <p className="text-[13px] text-[#475569] leading-relaxed mb-4">
            {config?.short_description || "Lembaga amil zakat terpercaya, menyalurkan kebaikan Anda dengan amanah, transparan, dan terukur."}
          </p>
          <div className="flex gap-3">
            <a href={config?.facebook_url || '#'} className="w-8 h-8 rounded-full bg-[#f4f6fb] border border-[#e2e8f0] flex items-center justify-center text-[#83b64e] hover:bg-[#e8f0fb] transition-colors"><FacebookIcon /></a>
            <a href={config?.instagram_url || '#'} className="w-8 h-8 rounded-full bg-[#f4f6fb] border border-[#e2e8f0] flex items-center justify-center text-[#83b64e] hover:bg-[#e8f0fb] transition-colors"><InstagramIcon /></a>
            <a href={config?.whatsapp_number ? `https://wa.me/${config.whatsapp_number}` : '#'} className="w-8 h-8 rounded-full bg-[#f4f6fb] border border-[#e2e8f0] flex items-center justify-center text-[#83b64e] hover:bg-[#e8f0fb] transition-colors"><WhatsappIcon /></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-cabin font-bold text-[15px] text-[#0f1b35] mb-4">Tentang Kami</h4>
          <ul className="space-y-2 text-[13.5px] text-[#475569]">
            <li><Link href="/tentang-kami#profil" className="hover:text-[#83b64e]">Profil Lembaga</Link></li>
            <li><Link href="/tentang-kami#visi-misi" className="hover:text-[#83b64e]">Visi & Misi</Link></li>
            <li><Link href="/tentang-kami#pengurus" className="hover:text-[#83b64e]">Susunan Pengurus</Link></li>
            <li><Link href="/transparansi" className="hover:text-[#83b64e]">Laporan Keuangan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-cabin font-bold text-[15px] text-[#0f1b35] mb-4">Program</h4>
          <ul className="space-y-2 text-[13.5px] text-[#475569]">
            {footerPrograms.map((p: any) => (
              <li key={p.slug || p.title}>
                <Link href={p.slug ? `/donasi/${p.slug}` : '/program'} className="hover:text-[#83b64e]">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-cabin font-bold text-[15px] text-[#0f1b35] mb-4">Kontak</h4>
          <Link href="/kontak" className="block text-[13.5px] text-[#475569] space-y-3 group">
            <p className="group-hover:text-[#83b64e] transition-colors">{config?.address || "Jl. Kebaikan Bangsa No. 99, Gedung Amal Lt. 2, Jakarta Selatan"}</p>
            <p className="group-hover:text-[#83b64e] transition-colors">Telp: {config?.whatsapp_number || "0800-1-ZAKAT"}</p>
            <span className="inline-block mt-2 text-[#83b64e] font-bold group-hover:underline">Hubungi Kami &rarr;</span>
          </Link>
        </div>
      </div>
      
      <div className="border-t border-[#e2e8f0] pt-6 mt-6">
        <div className="max-w-[1060px] mx-auto px-6 text-center text-[12px] text-[#94a3b8]">
          &copy; {new Date().getFullYear()} {config?.ngo_name || 'LAZ Darul Hikam'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
