import React from 'react';
import Link from 'next/link';
import { stripHtml, truncateText } from '@/lib/utils';

export default function ProgramCard({ p }: { p: any }) {
  const target = Number(p.target_amount) || 1;
  const collected = Number(p.collected) || 0;
  const prog = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const fmt = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
  const excerpt = truncateText(stripHtml(p.description), 160);

  let catLabel = "Program";
  if (p.category_name) {
    catLabel = p.category_name;
  }

  return (
    <div className="group h-full bg-[#ffffff] rounded-2xl overflow-hidden border border-[#e2e8f0] flex flex-col hover-lift">
      <div className="h-[200px] overflow-hidden relative shrink-0">
        <img src={p.image_url || '/placeholder.jpg'} alt={p.title} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-2.5 left-2.5 bg-[#83b64e] text-white text-[11px] font-bold py-1 px-3 rounded-full">
          {catLabel}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-cabin text-[16px] font-bold text-[#0f1b35] mb-2 leading-snug line-clamp-2 min-h-[2.6em]">
          {p.title}
        </h3>
        <p className="text-[13.5px] text-[#475569] leading-relaxed flex-1 mb-4 line-clamp-3">
          {excerpt}
        </p>
        {!p.has_no_target && (
          <div className="mb-3">
            <div className="flex justify-between text-[12.5px] mb-1.5">
              <span className="text-[#94a3b8]">Terkumpul</span>
              <span className="text-[#83b64e] font-bold">{prog}%</span>
            </div>
            <div className="h-[7px] bg-[#eef5e4] rounded-full overflow-hidden">
              <div className="h-full bg-[#83b64e] rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${prog}%` }} />
            </div>
            <div className="flex justify-between text-[12px] text-[#94a3b8] mt-1">
              <span>{fmt(collected)}</span>
              <span>Target: {fmt(target)}</span>
            </div>
          </div>
        )}
        <Link href={`/donasi/${p.slug}`} className="w-full py-2.5 bg-[#83b64e] text-white text-center rounded-xl font-cabin font-bold text-[13.5px] transition-all hover:opacity-90 hover:scale-[1.03] active:scale-95">
          Donasi Sekarang
        </Link>
      </div>
    </div>
  );
}
