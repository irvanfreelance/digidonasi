import { notFound } from 'next/navigation';
import { websiteEnabled } from '@/lib/env';
import React from 'react';
import {
  getWebTeamMembers,
  getWebAboutContent,
  getWebHistoryTimeline,
  getWebMissionPoints,
  getWebLegalDocuments,
} from '@/lib/web-queries';
import Reveal from '@/components/public/shared/Reveal';

export const revalidate = 3600; // ISR: about content follows the Redis cache TTL

export default async function TentangKami() {
  if (!websiteEnabled()) notFound();
  const [teamMembers, about, timeline, missionPoints, legalDocs] = await Promise.all([
    getWebTeamMembers(),
    getWebAboutContent(),
    getWebHistoryTimeline(),
    getWebMissionPoints(),
    getWebLegalDocuments(),
  ]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[#83b64e] pt-24 pb-14 px-6 text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-[18px] h-0.5 bg-[#ffffff] rounded-full" />
            <span className="text-[12px] font-bold text-[#ffffff] tracking-[1.5px] uppercase">Tentang Kami</span>
          </div>
          <h1 className="font-cabin text-[34px] font-bold text-white mb-3">{about?.hero_title}</h1>
          <p className="text-white/70 text-[16px] leading-relaxed">{about?.hero_subtitle}</p>
        </div>
      </div>

      <section id="profil" className="bg-[#ffffff] py-16 px-6 scroll-mt-20">
        <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Sejarah Kami</span>
            </div>
            <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-4">{about?.sejarah_heading}</h2>
            <p className="text-[#475569] leading-relaxed mb-4 text-[15px]">
              {about?.sejarah_paragraph_1}
            </p>
            <p className="text-[#475569] leading-relaxed text-[15px]">
              {about?.sejarah_paragraph_2}
            </p>
          </Reveal>
          <div className="grid gap-4">
            {timeline.map((t: any, i: number) => (
              <Reveal key={t.year} delay={i * 90}>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-[#e8f0fb] rounded-xl flex items-center justify-center font-cabin font-bold text-[13px] text-[#83b64e] shrink-0">
                    {t.year}
                  </div>
                  <div className="text-[14px] text-[#475569] leading-relaxed pt-1">{t.description}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="visi-misi" className="bg-[#f4f6fb] py-16 px-6 scroll-mt-20">
        <div className="max-w-[1060px] mx-auto">
          <Reveal>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
                <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Visi & Misi</span>
              </div>
              <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight">Fondasi Kerja Kami</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal>
              <div className="hover-lift bg-[#83b64e] rounded-2xl p-8 h-full">
                <div className="font-cabin text-[13px] font-bold text-[#ffffff] tracking-widest uppercase mb-3">Visi</div>
                <p className="text-white/85 text-[15.5px] leading-relaxed italic">
                  "{about?.visi_text}"
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="hover-lift bg-white rounded-2xl p-8 border border-[#e2e8f0] h-full">
                <div className="font-cabin text-[13px] font-bold text-[#83b64e] tracking-widest uppercase mb-3">Misi</div>
                <ul className="list-disc pl-5 text-[#475569] text-[14.5px] leading-relaxed space-y-1">
                  {missionPoints.map((m: any, i: number) => (
                    <li key={i}>{m.content}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="pengurus" className="bg-[#ffffff] py-16 px-6 scroll-mt-20">
        <div className="max-w-[1060px] mx-auto">
          <Reveal>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
                <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Pengurus</span>
              </div>
              <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight">Tim Kepemimpinan</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((t: any, i: number) => (
              <Reveal key={t.name} delay={(i % 4) * 90}>
                <div className="hover-lift bg-[#f8fafc] rounded-xl p-6 text-center border border-[#e2e8f0] h-full">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-14 h-14 rounded-full mx-auto mb-4 object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center font-cabin font-bold text-[18px] text-white"
                      style={{ backgroundColor: t.accent_color || '#83b64e' }}
                    >
                      {t.initials}
                    </div>
                  )}
                  <div className="font-cabin font-bold text-[14.5px] mb-1">{t.name}</div>
                  <div className="text-[13px] text-[#94a3b8]">{t.title}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f6fb] py-16 px-6">
        <div className="max-w-[1060px] mx-auto">
          <Reveal>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
                <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Legalitas</span>
              </div>
              <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight">Dokumen Resmi</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {legalDocs.map((l: any, i: number) => (
              <Reveal key={l.title} delay={i * 70}>
                <div className="hover-lift bg-white rounded-xl p-5 border border-[#e2e8f0] border-l-4 border-l-[#83b64e] h-full">
                  <div className="text-[11.5px] font-bold text-[#94a3b8] uppercase tracking-wide mb-1.5">{l.title}</div>
                  <div className="font-cabin text-[15px] font-bold text-[#83b64e]">{l.document_number}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
