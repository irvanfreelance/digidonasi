import { notFound } from 'next/navigation';
import { websiteEnabled } from '@/lib/env';
import React from 'react';
import Link from 'next/link';
import { DollarSign, Globe, MapPin, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getWebLegality, getWebBankAccounts } from '@/lib/web-queries';
import Reveal from '@/components/public/shared/Reveal';

export default async function LayananZiswafPage() {
  if (!websiteEnabled()) notFound();
  const [legality, banks] = (await Promise.all([
    getWebLegality(),
    getWebBankAccounts(),
  ])) as [any, any[]];

  const TYPES = [
    { t:"Zakat Penghasilan", d:"2,5% dari penghasilan bersih per bulan jika telah mencapai nisab setara 85gr emas.", c:"text-[#83b64e]" },
    { t:"Zakat Maal", d:"2,5% dari total harta yang telah tersimpan selama setahun dan mencapai nisab.", c:"text-[#83b64e]" },
    { t:"Zakat Fitrah", d:"Wajib ditunaikan di bulan Ramadan sebelum shalat Idul Fitri untuk setiap jiwa.", c:"text-[#83b64e]" },
    { t:"Infaq & Sedekah", d:"Pemberian sukarela di luar kewajiban zakat. Tidak ada batas minimal.", c:"text-[#1a6b3c]" },
    { t:"Wakaf Tunai", d:"Aset wakaf berupa uang tunai yang dikelola produktif untuk umat secara permanen.", c:"text-[#83b64e]" },
    { t:"Fidyah", d:"Penggantian puasa yang tidak dapat dilakukan dengan memberi makan fakir miskin.", c:"text-[#1a6b3c]" },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[#83b64e] pt-24 pb-14 px-6 text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-[18px] h-0.5 bg-[#ffffff] rounded-full" />
            <span className="text-[12px] font-bold text-[#ffffff] tracking-[1.5px] uppercase">Layanan ZISWAF</span>
          </div>
          <h1 className="font-cabin text-[34px] font-bold text-white mb-3">Salurkan Zakat, Infaq, Sedekah & Wakaf</h1>
          <p className="text-white/70 text-[16px] leading-relaxed">Tunaikan kewajiban dan raih keberkahan melalui kanal resmi LAZ Darul Hikam.</p>
        </div>
      </div>

      <section className="bg-[#f4f6fb] py-16 px-6">
        <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Guide */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Panduan Donasi</span>
            </div>
            <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-4">Cara Mudah Berzakat</h2>
            <p className="text-[#475569] leading-relaxed text-[15px] mb-6">
              Salurkan ZISWAF Anda melalui tiga cara yang mudah, aman, dan terverifikasi oleh tim amil kami.
            </p>
            <div className="grid gap-4 mb-7">
              {[
                { n:"01", icon:<DollarSign size={20} className="text-[#83b64e]" />, t:"Transfer Bank", d:"Transfer ke rekening resmi LAZ Darul Hikam, lalu konfirmasi via WhatsApp ke 0800-1-ZAKAT." },
                { n:"02", icon:<Globe size={20} className="text-[#1a6b3c]" />, t:"Portal Donasi Online", d:"Gunakan platform crowdfunding LAZ untuk donasi online dengan berbagai metode pembayaran digital." },
                { n:"03", icon:<MapPin size={20} className="text-[#83b64e]" />, t:"Datang Langsung", d:"Kunjungi kantor kami di Jl. Darul Hikam No.1, Bandung pada hari kerja pukul 08.00-17.00 WIB." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="hover-lift flex gap-4 items-start p-4 bg-white rounded-xl border border-[#e2e8f0]">
                    <div className="w-10 h-10 bg-[#e8f0fb] rounded-xl flex items-center justify-center shrink-0">{s.icon}</div>
                    <div>
                      <div className="text-[11px] font-bold text-[#83b64e] tracking-[1px] mb-0.5">LANGKAH {s.n}</div>
                      <div className="font-cabin text-[14.5px] font-bold text-[#0f1b35] mb-1">{s.t}</div>
                      <div className="text-[13.5px] text-[#94a3b8] leading-relaxed">{s.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            {/* CTA */}
            <div className="bg-[#83b64e] rounded-xl p-6 text-center">
              <div className="font-cabin font-bold text-[15px] text-white mb-2">Donasi Online Lebih Mudah</div>
              <p className="text-[13.5px] text-white/70 mb-4 leading-relaxed">
                Akses portal donasi untuk memilih program, nominal, dan metode pembayaran favorit Anda.
              </p>
              <Link href="/donasi" className="cta-pulse bg-white text-[#83b64e] border-none py-3 px-6 rounded-xl font-cabin font-bold text-[14px] inline-flex items-center gap-2 transition-all hover:opacity-90 hover:scale-105 active:scale-95">
                <Heart size={15} className="fill-[#83b64e]" /> Buka Portal Donasi
              </Link>
            </div>
          </div>

          {/* Jenis ZISWAF */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Jenis Layanan</span>
            </div>
            <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-4">Pilih Jenis Ibadah Anda</h2>
            <div className="grid gap-3">
              {TYPES.map((x, i) => (
                <Reveal key={x.t} delay={i * 70}>
                  <div className="hover-lift flex gap-3 items-start p-3.5 bg-white rounded-xl border border-[#e2e8f0]">
                    <CheckCircle2 size={16} className={`${x.c} shrink-0 mt-0.5`} />
                    <div>
                      <div className="font-cabin text-[14px] font-bold text-[#0f1b35] mb-0.5" dangerouslySetInnerHTML={{__html: x.t}} />
                      <div className="text-[13px] text-[#94a3b8] leading-relaxed">{x.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bank Accounts */}
      {banks?.length > 0 && (
        <section className="bg-[#ffffff] py-16 px-6">
          <div className="max-w-[1060px] mx-auto text-center">
            <Reveal>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
                <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Rekening Resmi</span>
              </div>
              <h2 className="font-cabin text-[28px] font-bold text-[#0f1b35] leading-tight mb-8">Rekening Donasi Terpercaya</h2>
            </Reveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[900px] mx-auto">
              {banks.map((r: any, i: number) => (
                <Reveal key={r.account_number} delay={i * 60}>
                  <div className="hover-lift bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 h-full">
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.bank_name} className="h-6 mx-auto mb-3 object-contain" />
                    ) : (
                      <div className="inline-block bg-[#83b64e] text-white font-cabin font-bold text-[11px] py-1 px-2.5 rounded-md mb-3">{r.bank_code || r.bank_name}</div>
                    )}
                    <div className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px]">{r.bank_name}</div>
                    <div className="font-cabin text-[18px] font-bold text-[#83b64e] tracking-[1px] my-1">{r.account_number}</div>
                    <div className="text-[12px] text-[#94a3b8]">a.n. {r.account_name}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="max-w-[760px] mx-auto mt-5 bg-[#eef5e4] rounded-xl p-3.5 flex items-center justify-center gap-2.5">
              <AlertTriangle size={15} className="text-[#83b64e] shrink-0" />
              <span className="text-[13.5px] text-[#83b64e] text-left leading-snug">LAZ Darul Hikam <strong>tidak memiliki rekening selain di atas</strong>. Harap waspada terhadap penipuan yang mengatasnamakan LAZ.</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
