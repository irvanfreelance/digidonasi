import React from 'react';
import Link from 'next/link';
import { 
  Banknote, Gift, Stethoscope, Building2, GraduationCap, 
  CloudLightning, Home, Wallet, Beef, Coins, Heart, 
  Landmark, HandHeart, BookOpen, Baby, Tent, Droplets,
  TreePine, Utensils, Moon, Star, Ambulance, Wheat, HandCoins, HandHelping,
  Leaf, MoonStar, HeartPulse
} from 'lucide-react';
import { getCategoryColor } from '@/lib/category-style';

// Map icon_name from database to lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  // Exact matches from DB
  Banknote, Gift, Stethoscope, Building2, GraduationCap,
  CloudLightning, Home, Wallet, Beef, Coins, Heart,
  Landmark, HandHeart, BookOpen, Baby, Tent, Droplets,
  TreePine, Utensils, Moon, Star, Ambulance, Wheat, HandCoins, HandHelping,
  Leaf, MoonStar, HeartPulse,
};

// Category name to icon mapping (fallback when icon_name doesn't match)
const categoryStyleMap: Record<string, { icon: React.ComponentType<any> }> = {
  'Zakat':         { icon: Banknote },
  'Qurban':        { icon: Gift },
  'Medis':         { icon: Stethoscope },
  'Panti Asuhan':  { icon: Building2 },
  'Pendidikan':    { icon: GraduationCap },
  'Bencana':       { icon: CloudLightning },
  'Infaq':         { icon: HandHeart },
  'Pembangunan':   { icon: Landmark },
  'Kemanusiaan':   { icon: Heart },
  'Lingkungan':    { icon: TreePine },
};

export default function CategoryGrid({ categories }: { categories: any[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat, i) => {
        // Try DB icon_name first, then category name mapping, then fallback
        const style = categoryStyleMap[cat.name];
        const IconComponent = iconMap[cat.icon_name] || style?.icon || Heart;
        const color = getCategoryColor(cat.color_theme);

        return (
          <Link key={cat.id ?? i} href={`/kategori/${encodeURIComponent(cat.name)}`} className="flex flex-col items-center cursor-pointer active:scale-95 group">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-sm ${color.className} transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md`}
              style={color.style}
            >
              {cat.icon_url ? (
                // Admin-uploaded SVG is dark; force white on the colored tile
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.icon_url} alt={cat.name} width={26} height={26} loading="lazy" className="w-[26px] h-[26px] object-contain brightness-0 invert" />
              ) : (
                <IconComponent size={26} className="text-white" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-center text-gray-600">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
