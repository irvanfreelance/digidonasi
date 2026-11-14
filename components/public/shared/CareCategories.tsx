'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';

// Fallback icons for categories that predate icon upload — shown only
// until the admin uploads a custom icon_url for that category.
import { GraduationCap, HandCoins, Leaf, HeartPulse, Users, MoonStar } from 'lucide-react';
const FALLBACK_ICONS: Record<string, React.ComponentType<any>> = {
  GraduationCap, HandCoins, Leaf, HeartPulse, Users, MoonStar, Heart,
};

interface CareCategory {
  icon_name: string;
  icon_url: string | null;
  label: string;
  quote_text: string | null;
  quote_source: string | null;
  description: string | null;
  photo_url: string | null;
}

function CategoryIcon({ category, size }: { category: CareCategory; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = FALLBACK_ICONS[category.icon_name] || Heart;
  if (category.icon_url && !imgFailed) {
    return <img src={category.icon_url} alt="" className="w-full h-full object-contain" onError={() => setImgFailed(true)} />;
  }
  return <Icon size={size} className="text-white" />;
}

// Renders **bold** segments as <strong>, everything else as plain text.
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function CareCategories({ categories }: { categories: CareCategory[] }) {
  const [selected, setSelected] = useState<CareCategory | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!categories || categories.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-5 md:gap-6">
        {categories.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setSelected(c)}
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className="w-20 h-20 md:w-[88px] md:h-[88px] bg-[#83b64e] rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 group-active:scale-95 overflow-hidden p-3.5">
              <CategoryIcon category={c} size={38} />
            </div>
            <span className="text-[13.5px] font-bold text-[#334155] text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      {isMounted && selected && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelected(null)}
          />

          <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm text-gray-500 hover:text-gray-700 rounded-full shadow-md transition-colors"
            >
              <X size={20} />
            </button>

            {selected.photo_url && (
              <div className="w-full overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
                <img src={selected.photo_url} alt={selected.label} className="w-full h-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}

            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-[#83b64e] rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                  <CategoryIcon category={selected} size={20} />
                </div>
                <h3 className="font-cabin text-xl font-bold text-[#0f1b35]">{selected.label}</h3>
              </div>

              {selected.quote_text && (
                <div className="border-l-4 border-[#83b64e] pl-4 mb-5">
                  <p className="text-[15px] font-semibold text-[#0f1b35] italic leading-snug">
                    &ldquo;{selected.quote_text}&rdquo;
                  </p>
                  {selected.quote_source && (
                    <p className="text-[12.5px] text-[#83b64e] font-bold mt-1.5">{selected.quote_source}</p>
                  )}
                </div>
              )}

              {selected.description && (
                <p className="text-[14px] text-[#475569] leading-relaxed">
                  <FormattedText text={selected.description} />
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
