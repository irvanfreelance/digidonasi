import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/public/checkout-form";
import { PublicScaffold } from "@/components/public/scaffold";
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
  return (
    <PublicScaffold title={String(campaign.title)} body={String(campaign.description)}>
      <p className="mt-3 text-[13px] text-[#666]">{String(campaign.category_name)}</p>
      <ul className="mt-4 grid gap-2">
        {detail.updates.map((item) => (
          <li key={String(item.title)} className="rounded-2xl bg-white p-3 text-[13px] shadow-sm">
            <strong>{String(item.title)}</strong>
            <p className="mb-0">{String(item.body)}</p>
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
    </PublicScaffold>
  );
}
