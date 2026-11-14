'use client';

import { Share2 } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

export default function StatusShareButton({
  campaignTitle,
  campaignSlug,
  donorName,
  amount,
}: {
  campaignTitle: string;
  campaignSlug: string;
  donorName: string;
  amount: number;
}) {
  const handleShare = async () => {
    const baseUrl = window.location.origin;
    const url = campaignSlug ? `${baseUrl}/donasi/${campaignSlug}` : `${baseUrl}/donasi`;
    const text = `Alhamdulillah, ${donorName} telah berdonasi ${formatIDR(amount)} untuk program "${campaignTitle}". Yuk ikut berbagi kebaikan! 🤲`;

    if (navigator.share) {
      try {
        await navigator.share({ title: campaignTitle, text, url });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      alert('Link donasi berhasil disalin!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full bg-white text-teal-600 border border-teal-200 font-bold text-sm py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-teal-50"
    >
      <Share2 size={16} /> Bagikan Kebaikan Ini
    </button>
  );
}
