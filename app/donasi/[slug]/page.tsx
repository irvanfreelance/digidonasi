import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/public/checkout-form";
import { CampaignArt, RichCopy, daysRemaining, progressPercent, rupiah } from "@/components/public/campaign-card";
import { DonationShell } from "@/components/public/donation-shell";
import { dbQuery } from "@/lib/db";
import { getPublicCampaign } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let detail: Awaited<ReturnType<typeof getPublicCampaign>> = null;
  try {
    detail = await getPublicCampaign(dbQuery, slug);
  } catch {
    detail = null;
  }
  if (!detail) notFound();
  const campaign = detail.campaign;
  const collected = Number(campaign.collected_amount ?? 0);
  const target = campaign.target_amount == null ? null : Number(campaign.target_amount);
  const percent = progressPercent(collected, target, Boolean(campaign.has_no_target));
  const days = daysRemaining(campaign.end_date as string | null, Boolean(campaign.has_no_time_limit));
  return (
    <DonationShell>
      <Link href="/donasi" className="block px-5 pt-4 text-[13px] font-semibold text-teal-700">Kembali ke katalog</Link>
      <div className="px-5 pt-3">
        <CampaignArt
          row={{ slug, title: String(campaign.title), image_url: campaign.image_url as string, image_alt: campaign.image_alt as string, category: String(campaign.category_name) }}
          className="h-44 w-full rounded-2xl"
        />
        <div className="mt-3 text-[10px] font-bold uppercase tracking-wide text-teal-600">{String(campaign.category_name)}</div>
        <h1 className="mt-1 text-xl leading-tight font-extrabold text-gray-900">{String(campaign.title)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{String(campaign.description)}</p>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="text-sm font-bold text-gray-800">{rupiah(collected)}</div>
          {Number(campaign.donor_count) > 0 ? (
            <div className="text-[11px] text-gray-500">{Number(campaign.donor_count).toLocaleString("id-ID")} donatur</div>
          ) : null}
          {percent == null ? (
            <div className="mt-1 text-[11px] font-semibold text-teal-700">Tanpa target</div>
          ) : (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-bold text-teal-700">
                <span>{days == null ? "Tanpa batas" : `Sisa ${days} hari`}</span>
                <span>{percent}%</span>
              </div>
            </>
          )}
        </div>
        <ul className="mt-4 grid gap-2">
          {detail.updates.map((item) => (
            <li key={String(item.title)} className="rounded-2xl bg-white p-3 text-[13px] shadow-sm">
              <strong>{String(item.title)}</strong>
              <RichCopy text={String(item.body)} />
            </li>
          ))}
        </ul>
        <CheckoutForm
          slug={slug}
          minimum={Number(campaign.minimum_amount)}
          fixed={Boolean(campaign.is_fixed_amount) && !campaign.is_qurban}
          qurban={Boolean(campaign.is_qurban)}
          variants={detail.variants as { id: string; name: string; price_rupiah: string; names_per_qty: number }[]}
          bundles={detail.bundles as { slug: string; title: string; qty: number }[]}
        />
      </div>
    </DonationShell>
  );
}
