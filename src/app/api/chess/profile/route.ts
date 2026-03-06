import { fetchProfile } from '@/lib/chessApi';
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
    const profile = await fetchProfile(username, platform);
    return NextResponse.json(profile);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch profile';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
