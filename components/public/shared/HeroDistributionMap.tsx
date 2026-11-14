"use client";

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { DistributionPoint } from './distribution-map';

const DynamicDistributionMap = dynamic(
  () => import('./distribution-map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white/10 animate-pulse flex items-center justify-center">
        <span className="text-white/70 font-medium text-sm">Memuat Peta...</span>
      </div>
    )
  }
);

export default function HeroDistributionMap({ points }: { points?: DistributionPoint[] }) {
  const provinceCount = points?.filter((p) => p.type === 'province').length ?? 0;
  const countryCount = points?.filter((p) => p.type === 'country').length ?? 0;

  return (
    <div className="relative w-full h-[340px] md:h-[420px] rounded-2xl overflow-hidden border-2 border-white/20 bg-[#6fa93c]">
      <DynamicDistributionMap points={points} className="opacity-95" />

      {(provinceCount > 0 || countryCount > 0) && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2">
          <MapPin size={16} className="text-[#83b64e] shrink-0" />
          <span className="text-[13px] font-semibold text-[#0f1b35]">
            {provinceCount} Provinsi{countryCount > 0 ? ` & ${countryCount} Negara` : ''} Terjangkau
          </span>
        </div>
      )}
    </div>
  );
}
