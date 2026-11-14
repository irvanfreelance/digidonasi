import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export const revalidate = 86400; // Revalidate sitemap every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  const baseUrl = rawBaseUrl && rawBaseUrl.trim() !== ''
    ? (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`)
    : 'https://lazdarulhikam.com';

  let campaigns: any[] = [];
  
  try {
    // Mengambil data campaign yang aktif dari database
    campaigns = await query(`
      SELECT slug, updated_at 
      FROM campaigns 
      WHERE status = 'ACTIVE'
    `);
  } catch (error) {
    console.error("Failed to fetch campaigns for sitemap", error);
  }

  // URL dinamis untuk setiap program/campaign
  const campaignUrls: MetadataRoute.Sitemap = campaigns.map((campaign) => ({
    url: `${baseUrl}/program/${campaign.slug}`,
    lastModified: campaign.updated_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // URL statis yang ada di website
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/program',
    '/tentang-kami',
    '/kontak',
    '/kabar-kebaikan',
    '/layanan-ziswaf',
    '/transparansi'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return [...staticRoutes, ...campaignUrls];
}
