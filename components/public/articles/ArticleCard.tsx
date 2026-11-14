import React from 'react';
import Link from 'next/link';

export default function ArticleCard({ a }: { a: any }) {
  const dateStr = (a.published_at || a.created_at) ? new Date(a.published_at || a.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : '';

  // Deskripsi singkat: prioritaskan title_long (jika diisi deskripsi di admin panel) atau excerpt
  const description = (a.title_long && (a.title_long.length > 80 || !a.excerpt))
    ? a.title_long
    : (a.excerpt || a.title_long);

  return (
    <Link href={`/kabar-kebaikan/${a.slug}`} className="group bg-[#ffffff] rounded-xl overflow-hidden border border-[#e2e8f0] hover-lift flex flex-col h-full block">
      <div className="h-[180px] overflow-hidden relative shrink-0 bg-slate-100">
        <img
          src={a.featured_image_url || '/placeholder.jpg'}
          alt={a.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[11px] font-bold text-[#83b64e] uppercase tracking-widest mb-1.5">
          {a.category_name || 'Kabar Kebaikan'}
        </div>
        <h4 className="font-cabin text-[15px] font-bold text-[#0f1b35] leading-snug mb-2 line-clamp-2">
          {a.title}
        </h4>
        {description && (
          <p className="text-[12.5px] text-[#64748b] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}
        <div className="text-[12px] text-[#94a3b8] mt-auto pt-1">
          {dateStr}
        </div>
      </div>
    </Link>
  );
}

