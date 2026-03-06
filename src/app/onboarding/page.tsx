'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ExternalLink, Brain, Target, GraduationCap, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import { Platform } from '@/lib/types';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';

export default function OnboardingPage() {
  const router = useRouter();
  const { connectMutation } = useChess();
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [username, setUsername] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    setError('');
    connectMutation.mutate(
      { name: username.trim(), plat: platform },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.replace('/dashboard'), 1000);
        },
        onError: (err) => {
          setError(err.message || 'Could not find that player. Please check the username.');
        },
      }
    );
  };

  const platformUrl = platform === 'chess.com' ? 'https://www.chess.com/login' : 'https://lichess.org/login';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            &#9822;
          </motion.div>
          <h2 className="text-2xl font-bold text-gold">Connected!</h2>
          <p className="text-text-secondary mt-2">Loading your chess data...</p>
        </motion.div>
      </div>
    );
  }

  const words = [
    { text: "Your" },
    { text: "Personal" },
    { text: "AI" },
    { text: "Chess", className: "text-gold" },
    { text: "Coach", className: "text-gold" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#020617] relative overflow-hidden">
      {/* Grid + Emerald Orb Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.15) 1px, transparent 1px),
            radial-gradient(circle at 50% 40%, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.04) 40%, transparent 70%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%',
        }}
      />
      {/* Fade out grid at edges */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,#020617_80%)]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-7xl md:text-8xl mb-5 drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            &#9822;
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight"
          >
            ChessMind
          </motion.h1>
          <TypewriterEffect
            words={words}
            className="text-lg md:text-2xl"
            cursorClassName="bg-gold h-4 md:h-6"
          />
        </motion.div>

        {/* Connect Form — Neon Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-full max-w-md mb-12"
        >
          <NeonGradientCard borderSize={2}>
            <h2 className="text-lg font-bold text-white text-center mb-1">Get Started</h2>
            <p className="text-text-secondary text-sm text-center mb-5">Connect your chess profile</p>

            {/* Platform toggle */}
            <div className="flex rounded-xl overflow-hidden mb-5 border border-white/10">
              {(['chess.com', 'lichess'] as Platform[]).map((p) => {
                const isActive = platform === p;
                return (
                  <motion.button
                    key={p}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setPlatform(p); setError(''); }}
                    className="flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: isActive ? Colors.gold : 'transparent',
                      color: isActive ? '#020617' : Colors.textSecondary,
                    }}
                  >
                    <span className="text-lg">{p === 'chess.com' ? '♚' : '♞'}</span>
                    {p === 'chess.com' ? 'Chess.com' : 'Lichess'}
                  </motion.button>
                );
              })}
            </div>

            {/* Username input */}
            <div className="mb-4">
              <label className="block text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">
                {platform === 'chess.com' ? 'Chess.com' : 'Lichess'} Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder={platform === 'chess.com' ? 'e.g. MagnusCarlsen' : 'e.g. DrNykterstein'}
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-text-tertiary outline-none border border-white/10 focus:border-gold transition-colors bg-white/5"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-loss text-sm mb-4 px-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <ShimmerButton
              onClick={handleConnect}
              disabled={connectMutation.isPending || !username.trim()}
              shimmerDuration="2.5s"
              className="w-full py-4 text-base font-bold disabled:opacity-60"
            >
              {connectMutation.isPending ? (
                <span className="flex items-center justify-center gap-2 text-gold">
                  <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="text-gold font-bold">Connect Profile</span>
              )}
            </ShimmerButton>

            {/* Help */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-full mt-4 py-2 text-text-secondary text-sm flex items-center justify-center gap-1 hover:text-white transition-colors"
            >
              Need help finding your username?
              <motion.div animate={{ rotate: showHelp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl mt-2 border border-white/10 bg-white/5">
                    <p className="text-text-secondary text-sm mb-3">
                      {platform === 'chess.com'
                        ? 'Your username is shown in the top-right corner when logged in to Chess.com.'
                        : 'Your username is shown in the top-right corner when logged in to Lichess.'}
                    </p>
                    <button
                      onClick={() => window.open(platformUrl, '_blank')}
                      className="flex items-center gap-2 text-gold text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                      <ExternalLink size={14} />
                      Open {platform === 'chess.com' ? 'Chess.com' : 'Lichess'} Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </NeonGradientCard>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-3 max-w-lg"
        >
          {[
            { icon: Brain, label: 'AI Analysis' },
            { icon: Target, label: 'Weakness Detection' },
            { icon: GraduationCap, label: '8-Week Training' },
            { icon: Cpu, label: 'Stockfish Engine' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-text-secondary text-xs"
            >
              <f.icon size={12} className="text-gold" />
              {f.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
