import type { Sql } from "@/lib/db";

export type PageQuery = { q?: string; page?: number; pageSize?: number };

function pageOf(query: PageQuery) {
  const page = query.page && query.page > 0 ? Math.floor(query.page) : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(50, Math.floor(query.pageSize)) : 6;
  return { page, pageSize, offset: (page - 1) * pageSize, q: (query.q ?? "").replace(/[%_]/g, "").trim() };
}

export async function listCampaigns(sql: Sql, query: PageQuery = {}) {
  const { page, pageSize, offset, q } = pageOf(query);
  const like = `%${q}%`;
  const totalRows = await sql<{ n: number }>(
    `SELECT count(*)::int AS n FROM campaigns c JOIN categories cat ON cat.id = c.category_id
     WHERE c.publication_status = 'ACTIVE' AND ($1 = '%%' OR c.title ILIKE $1 OR cat.name ILIKE $1)`,
    [like],
  );
  const rows = await sql(
    `SELECT c.id, c.slug, c.title, c.summary, c.minimum_amount, c.is_urgent, c.is_zakat, c.is_qurban, c.is_bundle, cat.name AS category
     FROM campaigns c JOIN categories cat ON cat.id = c.category_id
     WHERE c.publication_status = 'ACTIVE' AND ($1 = '%%' OR c.title ILIKE $1 OR cat.name ILIKE $1)
     ORDER BY c.sort_order, c.id LIMIT $2 OFFSET $3`,
    [like, pageSize, offset],
  );
  return { rows, page, pageSize, total: Number(totalRows[0]?.n ?? 0) };
}

export async function getPublicCampaign(sql: Sql, slug: string) {
  const rows = await sql(
    `SELECT c.*, cat.name AS category_name FROM campaigns c
     JOIN categories cat ON cat.id = c.category_id
     WHERE c.slug = $1 AND c.publication_status = 'ACTIVE' LIMIT 1`,
    [slug],
  );
  const campaign = rows[0];
  if (!campaign) return null;
  const variants = await sql(
    `SELECT id, name, price_rupiah, names_per_qty FROM campaign_variants
     WHERE campaign_id = $1 AND is_active = true ORDER BY id`,
    [campaign.id],
  );
  const bundles = await sql(
    `SELECT b.qty, c.slug, c.title FROM campaign_bundles b
     JOIN campaigns c ON c.id = b.item_campaign_id
     WHERE b.bundle_campaign_id = $1 ORDER BY b.seed_key`,
    [campaign.id],
  );
  const updates = await sql(
    `SELECT title, body FROM campaign_updates WHERE campaign_id = $1 AND publication_status = 'ACTIVE' ORDER BY id`,
    [campaign.id],
  );
  return { campaign, variants, bundles, updates };
}

export async function donorHistory(sql: Sql, donorId: string, query: PageQuery = {}) {
  const { page, pageSize, offset } = pageOf(query);
  const totalRows = await sql<{ n: number }>(`SELECT count(*)::int AS n FROM invoices WHERE donor_id = $1`, [donorId]);
  const rows = await sql(
    `SELECT invoice_code, total_amount, status, created_at FROM invoices
     WHERE donor_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
    [donorId, pageSize, offset],
  );
  return { rows, page, pageSize, total: Number(totalRows[0]?.n ?? 0) };
}

export async function getInvoice(sql: Sql, code: string) {
  const rows = await sql(
    `SELECT invoice_code, donor_name_snapshot, total_amount, status, provider_ref, created_at
     FROM invoices WHERE invoice_code = $1 LIMIT 1`,
    [code],
  );
  return rows[0] ?? null;
}
