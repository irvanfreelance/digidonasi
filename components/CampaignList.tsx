'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, X, ListFilter, ArrowDownUp, LayoutGrid, List, Check } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';

const INITIAL_COUNT = 4;

type SortOption = 'newest' | 'urgent';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Terbaru',
  urgent: 'Paling Mendesak',
};

interface Category {
  id: number | string;
  name: string;
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[75dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        </div>
        <div className="py-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

const VIEW_MODE_KEY = 'campaignViewMode';

export default function CampaignList({ campaigns, categories = [], collapsible = true, defaultUrgentOnly = false, hideUrgentChip = false }: { campaigns: any[]; categories?: Category[]; collapsible?: boolean; defaultUrgentOnly?: boolean; hideUrgentChip?: boolean }) {
  const [expanded, setExpanded] = useState(!collapsible);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<SortOption>(defaultUrgentOnly ? 'urgent' : 'newest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(defaultUrgentOnly);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Restore the donor's last choice after mount (keeps SSR and first client render identical).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'list' || saved === 'grid') setViewMode(saved);
    } catch {}
  }, []);

  const toggleViewMode = () => {
    const next = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_MODE_KEY, next);
    } catch {}
  };

  const processedCampaigns = useMemo(() => {
    let list = urgentOnly ? campaigns.filter((c) => c.is_urgent) : campaigns;
    list = selectedCategory ? list.filter((c) => c.category_name === selectedCategory) : list;

    list = [...list].sort((a, b) => {
      if (sortBy === 'urgent') {
        const aUrgent = a.is_urgent ? 1 : 0;
        const bUrgent = b.is_urgent ? 1 : 0;
        if (aUrgent !== bUrgent) return bUrgent - aUrgent;
        return (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [campaigns, selectedCategory, sortBy, urgentOnly]);

  const visibleCampaigns = expanded ? processedCampaigns : processedCampaigns.slice(0, INITIAL_COUNT);
  const canToggle = collapsible && processedCampaigns.length > INITIAL_COUNT;

  return (
    <div>
      {urgentOnly && !hideUrgentChip && (
        <button
          onClick={() => setUrgentOnly(false)}
          className="flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
        >
          Bantuan Mendesak <X size={13} />
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-4">
        <button
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-brand-200 text-brand-600 text-xs font-bold hover:bg-brand-50 transition-colors"
        >
          <ListFilter size={14} /> {selectedCategory || 'Semua'}
        </button>
        <button
          onClick={() => setShowSort(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-brand-200 text-brand-600 text-xs font-bold hover:bg-brand-50 transition-colors"
        >
          <ArrowDownUp size={14} /> Urutkan
        </button>
        <button
          onClick={toggleViewMode}
          className="ml-auto w-9 h-9 flex items-center justify-center rounded-full border border-brand-200 text-brand-600 hover:bg-brand-50 transition-colors shrink-0"
          aria-label={viewMode === 'list' ? 'Tampilan grid' : 'Tampilan list'}
        >
          {viewMode === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {visibleCampaigns.map((camp: any) => (
            <CampaignCard key={camp.id} camp={camp} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleCampaigns.map((camp: any) => (
            <CampaignCard key={camp.id} camp={camp} />
          ))}
        </div>
      )}

      {canToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full mt-5 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-brand-600 font-bold text-sm hover:bg-brand-50 transition-colors"
        >
          {expanded ? (
            <>Lihat Sebagian <ChevronUp size={16} /></>
          ) : (
            <>Lihat Semua <ChevronDown size={16} /></>
          )}
        </button>
      )}

      {showFilter && (
        <BottomSheet title="Semua" onClose={() => setShowFilter(false)}>
          <button
            onClick={() => { setSelectedCategory(null); setShowFilter(false); }}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <span className={selectedCategory === null ? 'font-bold text-gray-800' : 'text-gray-600'}>Semua Program</span>
            {selectedCategory === null && <Check size={18} className="text-brand-600" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); setShowFilter(false); }}
              className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <span className={selectedCategory === cat.name ? 'font-bold text-gray-800' : 'text-gray-600'}>{cat.name}</span>
              {selectedCategory === cat.name && <Check size={18} className="text-brand-600" />}
            </button>
          ))}
        </BottomSheet>
      )}

      {showSort && (
        <BottomSheet title="Urutkan" onClose={() => setShowSort(false)}>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <button
              key={key}
              onClick={() => { setSortBy(key); setShowSort(false); }}
              className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <span className={sortBy === key ? 'font-bold text-gray-800' : 'text-gray-600'}>{SORT_LABELS[key]}</span>
              {sortBy === key && <Check size={18} className="text-brand-600" />}
            </button>
          ))}
        </BottomSheet>
      )}
    </div>
  );
}
