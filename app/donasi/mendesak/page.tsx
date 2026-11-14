import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
import Header from '@/components/layout/Header';
import CampaignList from '@/components/CampaignList';
import { getAllCampaigns, getActiveCategories } from '@/lib/campaigns';

async function getData() {
  const campaigns = await getAllCampaigns();

  const categories = await getActiveCategories();

  const cacheKeyConf = `ngo:configs:global_v4`;
  let configsData: any = await redis.get(cacheKeyConf);
  if (!configsData) {
    const confRes = await query('SELECT * FROM ngo_configs LIMIT 1');
    if (confRes.length > 0) {
      configsData = confRes[0];
      await redis.set(cacheKeyConf, JSON.stringify(configsData), { ex: 3600 });
    } else {
      configsData = {};
    }
  } else if (typeof configsData === 'string') {
    configsData = JSON.parse(configsData);
  }

  return {
    campaigns: campaigns || [],
    categories,
    configs: configsData,
  };
}

export default async function BantuanMendesakPage() {
  const { campaigns, categories, configs } = await getData();
  const urgentCampaigns = campaigns.filter((c: any) => c.is_urgent);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-50/60 to-slate-50 relative pb-24">
      <Header isSearching title="Bantuan Mendesak" logoUrl={configs?.logo_url} ngoName={configs?.ngo_name} />

      <div className="px-5 pt-5 pb-6">
        {urgentCampaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Belum ada program mendesak saat ini.</p>
          </div>
        ) : (
          <CampaignList campaigns={urgentCampaigns} categories={categories} collapsible={false} defaultUrgentOnly hideUrgentChip />
        )}
      </div>
    </div>
  );
}
