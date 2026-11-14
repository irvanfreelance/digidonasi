import { notFound } from 'next/navigation';
import { websiteEnabled } from '@/lib/env';
import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import FaqAccordion from '@/components/public/shared/FaqAccordion';
import { getWebFaqs, getWebLegality } from '@/lib/web-queries';
import Reveal from '@/components/public/shared/Reveal';

export const revalidate = 86400; // SSG/ISR Daily

export default async function KontakPage() {
  if (!websiteEnabled()) notFound();
  const [faqs, config] = await Promise.all([
    getWebFaqs(),
    getWebLegality()
  ]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[#83b64e] pt-24 pb-14 px-6 text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-[18px] h-0.5 bg-[#ffffff] rounded-full" />
            <span className="text-[12px] font-bold text-[#ffffff] tracking-[1.5px] uppercase">Kontak & FAQ</span>
          </div>
          <h1 className="font-cabin text-[34px] font-bold text-white mb-3">Ada Pertanyaan? Kami Siap Membantu</h1>
        </div>
      </div>

      <section className="bg-[#f4f6fb] py-16 px-6">
        <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <Reveal>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Kantor Pusat</span>
            </div>
            <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-6">Hubungi Amil Kami</h2>

            <div className="grid gap-4 mb-8">
              {[
                { icon: <MapPin size={20} className="text-[#83b64e]" />, t: "Alamat Lengkap", d: config?.address || "Jl. Kebaikan Bangsa No. 99, Gedung Amal Lt. 2, Jakarta Selatan" },
                { icon: <Phone size={20} className="text-[#83b64e]" />, t: "Telepon / WhatsApp", d: config?.whatsapp_number || "0800-1-ZAKAT" },
                { icon: <Mail size={20} className="text-[#83b64e]" />, t: "Email Resmi", d: config?.email || "layanan@lazdarulhikam.org" },
                { icon: <Clock size={20} className="text-[#83b64e]" />, t: "Jam Operasional", d: config?.office_hours || "Senin - Jumat: 08.00 - 17.00 WIB" },
              ].map((c, i) => (
                <Reveal key={c.t} delay={i * 80}>
                  <div className="hover-lift flex gap-4 items-start p-4 bg-white rounded-xl border border-[#e2e8f0]">
                    <div className="w-11 h-11 bg-[#e8f0fb] rounded-xl flex items-center justify-center shrink-0">
                      {c.icon}
                    </div>
                    <div>
                      <div className="font-cabin font-bold text-[14.5px] text-[#0f1b35] mb-1">{c.t}</div>
                      <div className="text-[13.5px] text-[#94a3b8] leading-relaxed">{c.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">FAQ</span>
            </div>
            <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-6">Pertanyaan Umum</h2>
            <FaqAccordion faqs={faqs} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
