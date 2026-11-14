'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CheckoutButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Prefetch the checkout page as soon as this button is visible
  // so navigation is instant when clicked
  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={!loading ? { '--pulse-color': 'rgba(13, 148, 136, 0.45)', '--pulse-color-fade': 'rgba(13, 148, 136, 0)' } as React.CSSProperties : undefined}
      className={`w-full flex justify-center items-center gap-2 text-center text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform block ${loading ? 'bg-brand-500 shadow-none cursor-not-allowed' : 'cta-pulse bg-brand-600 shadow-brand-600/20 active:scale-[0.98] hover:bg-brand-700'}`}
    >
      {loading ? (
        <><Loader2 className="animate-spin" size={20} /> Memproses...</>
      ) : label}
    </button>
  );
}
