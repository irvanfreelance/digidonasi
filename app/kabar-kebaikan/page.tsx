import { notFound } from 'next/navigation';
import { websiteEnabled } from '@/lib/env';
import React from 'react';
import ArticleCategoryFilter from '@/components/public/articles/ArticleCategoryFilter';
import { getLatestArticles, getWebArticleCategories } from '@/lib/web-queries';

export const revalidate = 120; // ISR 2 minutes

export default async function KabarKebaikanPage() {
  if (!websiteEnabled()) notFound();
  const [articles, categories] = await Promise.all([
    getLatestArticles(24),
    getWebArticleCategories()
  ]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[#83b64e] pt-24 pb-14 px-6 text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-[18px] h-0.5 bg-[#ffffff] rounded-full" />
            <span className="text-[12px] font-bold text-[#ffffff] tracking-[1.5px] uppercase">Kabar Kebaikan</span>
          </div>
          <h1 className="font-cabin text-[34px] font-bold text-white mb-3">Berita, Laporan & Kisah Penerima Manfaat</h1>
        </div>
      </div>

      <section className="bg-[#f4f6fb] py-16 px-6">
        <div className="max-w-[1060px] mx-auto">
          <ArticleCategoryFilter initialArticles={articles} categories={categories} />
        </div>
      </section>
    </div>
  );
}
