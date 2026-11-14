import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

// Lightweight polling endpoint for the live donation counter.
// Redis hash `campaign:{id}:stats` is the hot path (HINCRBY'd by payment webhooks
// on every paid donation). Postgres is only touched once per campaign, to seed a
// cold hash via HSETNX — which never clobbers a concurrent HINCRBY.
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await props.params;

    const idCacheKey = `campaign:slug:${slug}:id`;
    let campaignId: number | null = await redis.get(idCacheKey);

    if (!campaignId) {
      const rows = await query(`SELECT id FROM campaigns WHERE slug = $1 AND status = 'ACTIVE'`, [slug]);
      if (rows.length === 0) {
        return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 });
      }
      campaignId = rows[0].id;
      await redis.set(idCacheKey, campaignId, { ex: 3600 });
    }

    const statsKey = `campaign:${campaignId}:stats`;
    let stats = await redis.hgetall(statsKey) as Record<string, string> | null;

    if (!stats?.collected_amount && !stats?.donor_count) {
      const rows = await query(
        `SELECT COALESCE(collected_amount, 0) as collected, COALESCE(donor_count, 0) as donors
         FROM campaign_stats WHERE campaign_id = $1`,
        [campaignId]
      );
      const seed = rows[0] || { collected: 0, donors: 0 };
      await Promise.all([
        redis.hsetnx(statsKey, 'collected_amount', Number(seed.collected)),
        redis.hsetnx(statsKey, 'donor_count', Number(seed.donors)),
      ]);
      stats = await redis.hgetall(statsKey) as Record<string, string> | null;
    }

    return NextResponse.json(
      {
        status: 'success',
        collected: Number(stats?.collected_amount || 0),
        donors: Number(stats?.donor_count || 0),
      },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3, stale-while-revalidate=8' } }
    );
  } catch (error) {
    console.error('API Campaign Stats Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch stats' }, { status: 500 });
  }
}
