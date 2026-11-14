import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number | null | undefined): string {
  if (amount == null) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Resolves the site's public base URL: an explicit NEXT_PUBLIC_BASE_URL first,
// then Vercel's auto-injected deployment URL, only falling back to localhost
// when neither is set (local dev). Prevents share/callback links from silently
// pointing at localhost in a deployed environment that lacks NEXT_PUBLIC_BASE_URL.
export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  if (!raw || raw.trim() === '') return 'http://localhost:3000';
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

export function truncateText(text: string | null | undefined, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
};

// Rich-text fields (campaign description, article body) are stored as HTML for the
// full detail view. Card previews need a plain-text excerpt — this strips tags/entities
// and collapses whitespace so every card gets a clean, consistently truncated summary.
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags.replace(/&[a-zA-Z#0-9]+;/g, (m) => HTML_ENTITIES[m] ?? ' ');
  return decoded.replace(/\s+/g, ' ').trim();
}
