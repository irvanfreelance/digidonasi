import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import AffiliateTracker from "@/components/AffiliateTracker";
import CampaignTabs from "@/components/CampaignTabs";
import LiveCampaignStats from "@/components/LiveCampaignStats";
import type { Metadata } from "next";
import { getCampaignBySlug, getAllCampaigns } from "@/lib/campaigns";
import { getBaseUrl } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const campaign = await getCampaignDetail(params.slug);

  if (!campaign) {
    return { title: 'Kampanye Tidak Ditemukan' };
  }

  const title = campaign.title;
  const description = campaign.description || `Mari bersama wujudkan kebaikan melalui kampanye ${campaign.title}`;
  const imageUrl = campaign.image_url || '/placeholder.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

async function getCampaignDetail(slug: string) {
  try {
    // DIRECT SERVICE CALL: Supercepat anti-delay, bypasses HTTP overhead
    const campaign = await getCampaignBySlug(slug);
    return campaign;
  } catch (error) {
    console.error(`Error in getCampaignDetail for ${slug}:`, error);
    return null;
  }
}

// Pre-generate the top 20 campaigns as static pages at build time
export async function generateStaticParams() {
  try {
    const campaigns = await getAllCampaigns();
    return campaigns.slice(0, 20).map((c: any) => ({ slug: c.slug }));
  } catch (error) {
    console.error('generateStaticParams error:', error);
    return [];
  }
}

export default async function CampaignDetail(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ aff?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const affCode = searchParams?.aff?.trim() || null;
  const campaign = await getCampaignDetail(params.slug);

  if (!campaign) notFound();

  let btnLabel = "Donasi Sekarang";
  if (campaign.is_zakat) btnLabel = "Tunaikan Zakat";
  if (campaign.is_qurban) btnLabel = "Qurban Sekarang";

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Capture ?aff= affiliate code — resolved client-side, no UI */}
      <AffiliateTracker campaignId={campaign.id} affCode={affCode} />

      <div className="relative h-72 w-full shrink-0 bg-gray-900 overflow-hidden">
        {/* Blurred Background Layer for "Whole Image" aesthetic */}
        <div className="absolute inset-0 scale-110 blur-2xl opacity-40">
          <Image
            src={campaign.image_url || '/placeholder.jpg'}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Main "Utuh" (Whole) Image */}
        <Image
          src={campaign.image_url || '/placeholder.jpg'}
          alt={campaign.title}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-contain relative z-10"
          priority
          quality={90}
        />
        
        <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-20">
          <Link href="/donasi" className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/40 transition-all">
            <ChevronLeft size={24} />
          </Link>
          <ShareButton
            url={`${getBaseUrl()}/donasi/${campaign.slug}`}
            title={campaign.title}
            className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/40 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-40 -mt-5 bg-white rounded-t-2xl relative z-10 no-scrollbar shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-4" />
        <div className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
          {campaign.category_name}
        </div>
        <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{campaign.title}</h1>

        <LiveCampaignStats
          slug={campaign.slug}
          initialCollected={Number(campaign.collected)}
          initialDonors={Number(campaign.donors)}
          hasNoTarget={!!campaign.has_no_target}
          targetAmount={Number(campaign.target_amount)}
          hasNoTimeLimit={!!campaign.has_no_time_limit}
          daysLeft={campaign.daysLeft}
        />

        {/* Client-side instant tab switcher — no URL navigation, no animations */}
        <CampaignTabs
          slug={params.slug}
          description={campaign.description}
          updates={campaign.updates}
        />
      </div>

      <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-sm p-4 pb-6 border-t border-gray-100 z-30">
        <CheckoutButton href={`/donasi/${campaign.slug}/checkout`} label={btnLabel} />
      </div>
    </div>
  );
}
