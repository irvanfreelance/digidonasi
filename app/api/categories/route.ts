import { NextResponse } from 'next/server';
import { getActiveCategories } from '@/lib/campaigns';

export async function GET() {
  try {
    const categories = await getActiveCategories();
    const response = { status: 'success', data: categories };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Categories Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
