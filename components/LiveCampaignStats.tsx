'use client';

import { useEffect, useRef, useState } from 'react';
import { formatIDR } from '@/lib/utils';

interface Props {
  slug: string;
  initialCollected: number;
  initialDonors: number;
  hasNoTarget: boolean;
  targetAmount: number;
  hasNoTimeLimit: boolean;
  daysLeft: number;
  pollIntervalMs?: number;
}

/**
 * LiveCampaignStats — polls the Redis-backed stats endpoint so the
 * collected amount / donor count / progress bar update in an already-open
 * tab as soon as a donation is marked paid, without a full page reload.
 */
export default function LiveCampaignStats({
  slug,
  initialCollected,
  initialDonors,
  hasNoTarget,
  targetAmount,
  hasNoTimeLimit,
  daysLeft,
  pollIntervalMs = 5000,
}: Props) {
  const [collected, setCollected] = useState(initialCollected);
  const [donors, setDonors] = useState(initialDonors);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await fetch(`/api/campaigns/${slug}/stats`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || json.status !== 'success') return;
        // Never let a stale response move the number backwards
        setCollected((prev) => Math.max(prev, Number(json.collected) || 0));
        setDonors((prev) => Math.max(prev, Number(json.donors) || 0));
      } catch {
        // silent — keep last known good value
      } finally {
        fetchingRef.current = false;
      }
    };

    const interval = setInterval(poll, pollIntervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slug, pollIntervalMs]);

  const progress = hasNoTarget ? 0 : Math.min(100, Math.round((collected / (targetAmount || 1)) * 100));

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-5">
      <p className="text-2xl font-bold text-brand-600 mb-1 transition-all duration-300">
        {formatIDR(collected)}
      </p>
      {!hasNoTarget && (
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="bg-brand-500 h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="flex justify-between text-sm text-gray-600">
        <span className="font-bold text-gray-800">{donors} Donatur</span>
        {hasNoTimeLimit ? (
          <span className="font-bold text-brand-600">Selalu Terbuka</span>
        ) : (
          <span className="font-bold text-gray-800">{daysLeft} Hari</span>
        )}
      </div>
    </div>
  );
}
