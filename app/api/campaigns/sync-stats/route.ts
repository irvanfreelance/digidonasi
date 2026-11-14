import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

/**
 * POST /api/campaigns/sync-stats
 * Recalculates campaign_stats from actual PAID invoices.
 * Used when admin panel manually marks donations as PAID (bypassing webhooks).
 * Body: { secret, campaignId? }  — omit campaignId to sync all campaigns.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetCampaignId: number | null = body.campaignId ? Number(body.campaignId) : null;

  // Aggregate from all invoice partitions via the parent table (includes all partitions)
  const rows = await query(`
    SELECT t.campaign_id,
           SUM(i.total_amount)::bigint AS total_collected,
           COUNT(DISTINCT i.id)::int    AS total_donors
    FROM invoices i
    JOIN transactions t ON t.invoice_id = i.id AND t.invoice_created_at = i.created_at
    WHERE i.status = 'PAID'
      ${targetCampaignId ? 'AND t.campaign_id = $1' : ''}
    GROUP BY t.campaign_id
  `, targetCampaignId ? [targetCampaignId] : []);

  const synced: number[] = [];

  for (const row of rows) {
    const { campaign_id, total_collected, total_donors } = row;
    const collected = Number(total_collected);
    const donors = Number(total_donors);

    // Upsert campaign_stats
    await query(`
      INSERT INTO campaign_stats (campaign_id, collected_amount, donor_count, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (campaign_id) DO UPDATE
        SET collected_amount = EXCLUDED.collected_amount,
            donor_count      = EXCLUDED.donor_count,
            updated_at       = CURRENT_TIMESTAMP
    `, [campaign_id, collected, donors]);

    // Overwrite Redis stats (not HINCRBY — full reset from source of truth)
    const statsKey = `campaign:${campaign_id}:stats`;
    await redis.hset(statsKey, { collected_amount: collected, donor_count: donors });

    synced.push(campaign_id);
  }

  return NextResponse.json({ ok: true, synced_campaigns: synced });
}
