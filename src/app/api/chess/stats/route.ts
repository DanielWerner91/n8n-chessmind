import { fetchStats } from '@/lib/chessApi';
import { Platform } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const platform = searchParams.get('platform') as Platform;

  if (!username || !platform) {
    return NextResponse.json({ error: 'Missing username or platform' }, { status: 400 });
  }

  try {
    const stats = await fetchStats(username, platform);
    return NextResponse.json(stats);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
