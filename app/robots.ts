import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  const baseUrl = rawBaseUrl && rawBaseUrl.trim() !== ''
    ? (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`)
    : 'https://lazdarulhikam.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
