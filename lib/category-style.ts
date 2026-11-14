// Static map so Tailwind can see every class (dynamic `bg-${x}-500` would be purged).
// Keys mirror the color_theme values chosen in the admin panel.
const COLOR_CLASS: Record<string, string> = {
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  sky: 'bg-sky-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  yellow: 'bg-yellow-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  violet: 'bg-violet-500',
};

const FALLBACK = 'bg-[#83b64e]';

/** Returns either a Tailwind class or an inline style (for hex / unknown values). */
export function getCategoryColor(theme?: string | null): { className: string; style?: React.CSSProperties } {
  const t = (theme || '').trim().toLowerCase();
  if (COLOR_CLASS[t]) return { className: COLOR_CLASS[t] };
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return { className: '', style: { backgroundColor: t } };
  if (t.startsWith('bg-')) return { className: t };
  return { className: FALLBACK };
}
