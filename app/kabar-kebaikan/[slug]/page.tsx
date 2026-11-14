import { websiteEnabled } from '@/lib/env';
import React from 'react';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getRelatedArticles } from '@/lib/web-queries';
import ArticleCard from '@/components/public/articles/ArticleCard';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Reveal from '@/components/public/shared/Reveal';

export const revalidate = 120;

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Artikel Tidak Ditemukan' };

  const description = article.seo_description || article.excerpt || article.title_long;

  return {
    title: article.seo_title || article.title,
    description: description,
    openGraph: {
      title: article.seo_title || article.title,
      description: description,
      images: [{ url: article.featured_image_url || '/placeholder.jpg' }],
    }
  };
}

export default async function ArticleDetailPage(props: { params: Promise<{ slug: string }> }) {
  if (!websiteEnabled()) notFound();
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.category_id, article.slug, 3);

  const dateStr = (article.published_at || article.created_at) ? new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '';

  return (
    <div className="animate-in fade-in duration-300 bg-[#ffffff] min-h-screen pb-16">
      <div className="max-w-[800px] mx-auto px-6 pt-10">
        <Link href="/kabar-kebaikan" className="inline-flex items-center gap-1 text-[#83b64e] font-bold text-[13.5px] hover:underline mb-8">
          <ChevronLeft size={16} /> Kembali ke Kabar Kebaikan
        </Link>
        
        <div className="mb-8">
          <div className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase mb-3">
            {article.category_name || (article.category_id ? `Kategori ${article.category_id}` : 'Berita')}
          </div>
          <h1 className="font-cabin text-[32px] md:text-[40px] font-bold text-[#0f1b35] leading-tight mb-4">
            {article.title}
          </h1>
          {dateStr && (
            <div className="text-[14px] text-[#94a3b8] flex items-center gap-2">
              <span>Dipublikasikan: {dateStr}</span>
            </div>
          )}
        </div>

        {article.featured_image_url && (
          <div className="w-full relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden mb-10 border border-[#e2e8f0]">
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        {/* Using news-content utility class from globals.css for proper styling */}
        <div
          className="news-content text-[15.5px] leading-[1.8] text-[#475569]"
          dangerouslySetInnerHTML={{ __html: article.body || '' }}
        />
      </div>

      {relatedArticles.length > 0 && (
        <div className="bg-[#f4f6fb] mt-16 py-16 px-6">
          <div className="max-w-[1060px] mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[18px] h-0.5 bg-[#83b64e] rounded-full" />
              <span className="text-[12px] font-bold text-[#83b64e] tracking-[1.5px] uppercase">Baca Juga</span>
            </div>
            <h2 className="font-cabin text-[24px] font-bold text-[#0f1b35] leading-tight mb-7">Artikel Terkait</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((a: any, i: number) => (
                <Reveal key={a.slug} delay={i * 100}>
                  <ArticleCard a={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
