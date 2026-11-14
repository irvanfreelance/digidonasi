import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 500 });
  }

  const { secret, slug } = await req.json();

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    // Revalidate campaign list pages
    revalidatePath('/');
    revalidatePath('/donasi');

    if (slug) {
      revalidatePath(`/donasi/${slug}`);
      revalidatePath(`/donasi/${slug}/checkout`);
    }

    return NextResponse.json({ revalidated: true, slug: slug || 'all' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
