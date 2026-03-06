'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Swords, Brain, GraduationCap, Settings } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/games', label: 'Games', icon: Swords },
  { href: '/analysis', label: 'Analysis', icon: Brain },
  { href: '/training', label: 'Training', icon: GraduationCap },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReady, isOnboarded } = useChess();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isReady, isOnboarded, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - desktop */}
      <nav
        className="hidden md:flex flex-col w-60 border-r p-4 gap-1 shrink-0 fixed h-full"
        style={{ backgroundColor: Colors.tabBar, borderColor: Colors.border }}
      >
        <div className="flex items-center gap-3 px-3 py-6 mb-4">
          <span className="text-gold text-3xl">&#9822;</span>
          <span className="text-white text-xl font-bold">ChessMind</span>
        </div>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors
                ${isActive ? 'text-background' : 'text-text-secondary hover:text-white hover:bg-card'}`}
              style={isActive ? { backgroundColor: Colors.gold } : undefined}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:ml-60">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom tab bar - mobile */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t flex items-center justify-around px-2 h-16 z-50"
        style={{ backgroundColor: Colors.tabBar, borderColor: Colors.border }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 ${isActive ? 'text-gold' : 'text-text-tertiary'}`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
