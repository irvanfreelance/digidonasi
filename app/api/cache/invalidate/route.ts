import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';

const Schema = z.object({
  secret: z.string().min(1),
  keys: z.array(z.string()).optional(),
});

const DEFAULT_KEYS = [
  'web:hero_config',
  'web:impact_metrics',
  'web:impact_categories',
  'web:distribution_points',
  'web:testimonials',
  'web:partners',
  'web:care_categories',
  'web:latest_articles',
];

/**
 * POST /api/cache/invalidate
 * Body: { secret, keys?: string[] }
 *
 * Clears Redis cache keys and triggers Next.js ISR revalidation for the homepage.
 * Call this from the admin panel after saving ngo_configs or homepage settings.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
    }

    if (parsed.data.secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const keysToDelete = parsed.data.keys?.length ? parsed.data.keys : DEFAULT_KEYS;

    const deleted = await Promise.allSettled(keysToDelete.map((k) => redis.del(k)));
    const deletedCount = deleted.filter((r) => r.status === 'fulfilled').length;

    revalidatePath('/');
    revalidatePath('/donasi');

    return NextResponse.json({
      status: 'success',
      message: `${deletedCount}/${keysToDelete.length} cache keys cleared, homepage revalidated`,
    });
  } catch (error: any) {
    console.error('[cache/invalidate]', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
