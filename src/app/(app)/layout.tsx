'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Swords, Brain, GraduationCap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.03)_0%,transparent_50%)]" />
      </div>

      {/* Sidebar - desktop */}
      <nav
        className="hidden md:flex flex-col w-60 border-r p-4 gap-1 shrink-0 fixed h-full z-20 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(15, 22, 35, 0.95)', borderColor: Colors.border }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 px-3 py-6 mb-4"
        >
          <span className="text-gold text-3xl animate-float">&#9822;</span>
          <div>
            <span className="text-white text-xl font-bold">ChessMind</span>
            <AnimatedShinyText className="text-[10px] !mx-0 !max-w-none" shimmerWidth={60}>
              AI Coach
            </AnimatedShinyText>
          </div>
        </motion.div>
        {tabs.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <Link
                href={href}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive ? 'text-background' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                style={isActive ? { backgroundColor: Colors.gold } : undefined}
              >
                <Icon size={20} />
                {label}
              </Link>
            </motion.div>
          );
        })}

        {/* Bottom glow bar in sidebar */}
        <div className="mt-auto px-3 pb-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:ml-60 relative z-10">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom tab bar - mobile */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t flex items-center justify-around px-2 h-16 z-50 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(15, 22, 35, 0.95)', borderColor: Colors.border }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 relative ${isActive ? 'text-gold' : 'text-text-tertiary'}`}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={22} />
              </motion.div>
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gold shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
