import { notFound } from 'next/navigation';
import { websiteEnabled } from '@/lib/env';
import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import Header from "@/components/layout/Header";
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
import { getBaseUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getUpdates() {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/news`, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Failed to fetch updates: ${res.status}`);
      return [];
    }
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('getUpdates error:', error);
    return [];
  }
}

async function getNgoConfig() {
  const cacheKey = `ngo:configs:global_v4`;
  let configsData: any = await redis.get(cacheKey);
  if (!configsData) {
    const confRes = await query('SELECT * FROM ngo_configs LIMIT 1', []);
    if (confRes.length > 0) {
      configsData = confRes[0];
      await redis.set(cacheKey, JSON.stringify(configsData), { ex: 3600 });
    } else {
      configsData = {};
    }
  } else if (typeof configsData === 'string') {
    configsData = JSON.parse(configsData);
  }
  return configsData;
}

export default async function NewsPage() {
  if (!websiteEnabled()) notFound();
  const [updates, configs] = await Promise.all([
    getUpdates(),
    getNgoConfig()
  ]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header subtitle="Kabar Berita Terbaru" logoUrl={configs?.logo_url} ngoName={configs?.ngo_name} />
      
      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Newspaper size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada kabar terbaru saat ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {updates.map((update: any) => {
              const dateObj = new Date(update.created_at);
              const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
              return (
                <Link
                  key={update.id}
                  href={`/news/${update.id}`}
                  prefetch={true}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden block transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {update.image_url && (
                    <div className="h-40 w-full bg-gray-100 relative overflow-hidden">
                      <Image src={update.image_url} alt={update.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{update.category_name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{formattedDate}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base leading-snug mb-2">{update.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{update.excerpt?.replace(/\\n/g, '\n')}</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400">Dari kampanye:</span>
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-1">{update.campaign_title}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
