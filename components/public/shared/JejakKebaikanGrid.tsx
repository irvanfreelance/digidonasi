"use client";

import React from 'react';
import { GraduationCap, HandCoins, Leaf, HeartPulse, Users, MoonStar, Heart } from 'lucide-react';
import CountUp from './CountUp';

// Fallback icons for categories without a custom icon_url — matched by label,
// mirroring the admin panel's default set at web-impact-categories.
const FALLBACK_ICONS: Record<string, React.ComponentType<any>> = {
  'Peduli Pendidikan': GraduationCap,
  'Peduli Lingkungan': Leaf,
  'Peduli Umat': Users,
  'Peduli Kesehatan': HeartPulse,
  'Peduli Ekonomi': HandCoins,
  'Program Khusus': MoonStar,
};

interface ImpactCategory {
  icon_url: string | null;
  label: string;
  value: number | string;
  suffix: string | null;
}

function CategoryIcon({ category }: { category: ImpactCategory }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const FallbackIcon = FALLBACK_ICONS[category.label] || Heart;
  if (category.icon_url && !imgFailed) {
    return (
      <img
        src={category.icon_url}
        alt=""
        className="w-9 h-9 mb-3 object-contain"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <FallbackIcon size={36} strokeWidth={1.75} className="text-white mb-3" />;
}

export default function JejakKebaikanGrid({ categories }: { categories: ImpactCategory[] }) {
  if (!categories || categories.length === 0) return null;

  const total = categories.reduce((sum, cat) => sum + Number(cat.value), 0);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 flex-1 w-full">
        {categories.map((cat) => (
          <div key={cat.label} className="text-left">
            <CategoryIcon category={cat} />
            <div className="font-cabin text-[17px] font-bold text-white leading-snug mb-1">{cat.label}</div>
            <div className="font-cabin text-[34px] font-bold text-white leading-none">
              <CountUp target={Number(cat.value)} />{cat.suffix}
            </div>
            <div className="text-[13px] text-white/75 mt-1">Penerima Manfaat</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center text-center lg:pl-16 lg:border-l lg:border-white/20 shrink-0">
        <div className="font-cabin text-[20px] font-bold text-white mb-2 self-start lg:self-center">Total</div>
        <Users size={90} strokeWidth={1.5} className="text-white mb-3" />
        <div className="font-cabin text-[48px] font-bold text-white leading-none">
          <CountUp target={total} />
        </div>
        <div className="text-[15px] text-white/75 mt-2">Penerima Manfaat</div>
      </div>
    </div>
  );
}
