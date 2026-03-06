'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChess } from '@/lib/ChessContext';

export default function RootPage() {
  const router = useRouter();
  const { isReady, isOnboarded } = useChess();

  useEffect(() => {
    if (!isReady) return;
    if (isOnboarded) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [isReady, isOnboarded, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
