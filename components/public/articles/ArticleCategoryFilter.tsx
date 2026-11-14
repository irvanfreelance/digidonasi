'use client';

import React, { useState } from 'react';
import ArticleCard from './ArticleCard';

interface Category {
  id: string | number;
  label: string;
  slug?: string;
}

interface ArticleCategoryFilterProps {
  initialArticles: any[];
  categories?: any[];
}

export default function ArticleCategoryFilter({
  initialArticles,
  categories = []
}: ArticleCategoryFilterProps) {
  const [activeTab, setActiveTab] = useState<string | number>('all');

  // Build category options
  const defaultTabs: Category[] = [
    { id: 'all', label: 'Semua' },
    ...categories.map((c: any) => ({
      id: String(c.id),
      label: c.name,
      slug: c.slug
    }))
  ];

  // Fallback if db categories empty
  const tabs = defaultTabs.length > 1 ? defaultTabs : [
    { id: 'all', label: 'Semua' },
    { id: 'laporan', label: 'Laporan' },
    { id: 'update', label: 'Update Program' },
    { id: 'kisah', label: 'Kisah' },
  ];

  const filteredArticles = initialArticles.filter((a: any) => {
    if (activeTab === 'all') return true;

    // 1. Cocokkan berdasarkan ID kategori (baik bertipe string maupun number)
    if (a.category_id != null && String(a.category_id) === String(activeTab)) {
      return true;
    }

    // 2. Cocokkan berdasarkan slug atau nama kategori tab aktif
    const currentTab = tabs.find((t) => String(t.id) === String(activeTab));
    if (currentTab) {
      if (currentTab.slug && a.category_slug && currentTab.slug.toLowerCase() === a.category_slug.toLowerCase()) {
        return true;
      }
      if (currentTab.label && a.category_name && currentTab.label.toLowerCase() === a.category_name.toLowerCase()) {
        return true;
      }
    }

    // 3. Fallback jika activeTab berupa slug/keyword langsung (misal: 'laporan', 'kisah')
    const tabKey = String(activeTab).toLowerCase();
    const catSlug = (a.category_slug || '').toLowerCase();
    const catName = (a.category_name || '').toLowerCase();
    return catSlug === tabKey || catSlug.includes(tabKey) || catName.includes(tabKey);
  });

  return (
    <div>
      {/* Category Badge Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {tabs.map((c) => {
          const isActive = activeTab === c.id;
          return (
            <button
              key={String(c.id)}
              onClick={() => setActiveTab(c.id)}
              className={`
                px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all duration-200 cursor-pointer border
                ${isActive
                  ? 'bg-[#83b64e] text-white border-[#83b64e] shadow-sm scale-[1.02]'
                  : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-slate-50 hover:border-slate-300'
                }
              `}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Articles Grid */}
      <div key={String(activeTab)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center text-[#475569] py-12 bg-white rounded-2xl border border-[#e2e8f0]">
            <p className="font-semibold text-[15px] mb-1">Belum ada artikel dipublikasikan.</p>
            <p className="text-[13px] text-[#94a3b8]">Silakan pilih kategori lain untuk melihat berita terbaru.</p>
          </div>
        ) : (
          filteredArticles.map((a: any) => <ArticleCard key={a.slug} a={a} />)
        )}
      </div>
    </div>
  );
}
