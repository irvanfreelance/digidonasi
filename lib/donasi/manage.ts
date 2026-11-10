import type { Sql } from "@/lib/db";

export async function setCampaignStatus(sql: Sql, slug: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  const rows = await sql(`UPDATE campaigns SET publication_status = $2 WHERE slug = $1 RETURNING slug, publication_status`, [slug, status]);
  return rows[0] ?? null;
}

export async function saveCampaign(sql: Sql, input: { slug: string; title: string; summary: string; minimumAmount: number }) {
  return (
    await sql(
      `UPDATE campaigns SET title = $2, summary = $3, minimum_amount = $4 WHERE slug = $1 RETURNING slug`,
      [input.slug, input.title, input.summary, input.minimumAmount],
    )
  )[0] ?? null;
}

export async function saveCategory(sql: Sql, input: { slug: string; name: string }) {
  return (await sql(`UPDATE categories SET name = $2 WHERE slug = $1 RETURNING slug`, [input.slug, input.name]))[0] ?? null;
}

export async function saveVariant(sql: Sql, input: { campaignSlug: string; name: string; price: number; namesPerQty: number }) {
  const campaign = await sql<{ id: string }>(`SELECT id FROM campaigns WHERE slug = $1`, [input.campaignSlug]);
  if (!campaign[0]) return null;
  const key = `panel-${input.campaignSlug}-${input.name}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return (
    await sql(
      `INSERT INTO campaign_variants (seed_key, campaign_id, name, price_rupiah, names_per_qty)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (seed_key) DO UPDATE SET name = EXCLUDED.name, price_rupiah = EXCLUDED.price_rupiah, names_per_qty = EXCLUDED.names_per_qty
       RETURNING id, name`,
      [key, campaign[0].id, input.name, input.price, input.namesPerQty],
    )
  )[0];
}

export async function saveBundle(sql: Sql, input: { bundleSlug: string; itemSlug: string; qty: number }) {
  const rows = await sql<{ id: string; slug: string }>(`SELECT id, slug FROM campaigns WHERE slug = ANY($1::text[])`, [[input.bundleSlug, input.itemSlug]]);
  const bundle = rows.find((row) => row.slug === input.bundleSlug);
  const item = rows.find((row) => row.slug === input.itemSlug);
  if (!bundle || !item || bundle.id === item.id || input.qty < 1) return null;
  const key = `panel-bundle-${input.bundleSlug}-${input.itemSlug}`;
  return (
    await sql(
      `INSERT INTO campaign_bundles (seed_key, bundle_campaign_id, item_campaign_id, qty)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (seed_key) DO UPDATE SET qty = EXCLUDED.qty
       RETURNING seed_key, qty`,
      [key, bundle.id, item.id, input.qty],
    )
  )[0];
}

export async function saveUpdate(sql: Sql, input: { campaignSlug: string; title: string; body: string }) {
  const campaign = await sql<{ id: string }>(`SELECT id FROM campaigns WHERE slug = $1`, [input.campaignSlug]);
  if (!campaign[0]) return null;
  const key = `panel-update-${input.campaignSlug}-${input.title}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return (
    await sql(
      `INSERT INTO campaign_updates (seed_key, campaign_id, title, body, publication_status)
       VALUES ($1,$2,$3,$4,'DRAFT')
       ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body
       RETURNING seed_key, title`,
      [key, campaign[0].id, input.title, input.body],
    )
  )[0];
}

export async function saveDonationBlock(sql: Sql, input: { seedKey: string; heading: string; body: string; status: "DRAFT" | "ACTIVE" }) {
  return (
    await sql(
      `UPDATE donation_blocks SET heading = $2, body = $3, publication_status = $4 WHERE seed_key = $1 RETURNING seed_key, publication_status`,
      [input.seedKey, input.heading, input.body, input.status],
    )
  )[0] ?? null;
}

export async function saveOrg(sql: Sql, input: { nama: string; namaSingkat: string; tagline: string; logoUrl: string | null; faviconUrl: string | null; primaryColor: string; sidebarColor: string; accentColor: string }) {
  return (
    await sql(
      `UPDATE org_profile SET nama=$1, nama_singkat=$2, tagline=$3, logo_url=$4, favicon_url=$5,
        primary_color=$6, sidebar_color=$7, accent_color=$8 WHERE id = 1 RETURNING nama, primary_color`,
      [input.nama, input.namaSingkat, input.tagline, input.logoUrl, input.faviconUrl, input.primaryColor, input.sidebarColor, input.accentColor],
    )
  )[0] ?? null;
}
