'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, RefreshCw, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChess, useProfile, useStats, useGames } from '@/lib/ChessContext';
import DonutChart from '@/components/DonutChart';
import Colors from '@/lib/colors';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function DashboardPage() {
  const router = useRouter();
  const { username, runAnalysisMutation, analysisReport } = useChess();
  const profileQuery = useProfile();
  const statsQuery = useStats();
  const gamesQuery = useGames();

  const gameStats = useMemo(() => {
    const games = gamesQuery.data || [];
    return {
      wins: games.filter((g) => g.result === 'win').length,
      losses: games.filter((g) => g.result === 'loss').length,
      draws: games.filter((g) => g.result === 'draw').length,
      total: games.length,
    };
  }, [gamesQuery.data]);

  const bestRating = useMemo(() => {
    const stats = statsQuery.data;
    if (!stats) return 0;
    const ratings = [
      stats.chess_rapid?.best?.rating || stats.chess_rapid?.last?.rating || 0,
      stats.chess_blitz?.best?.rating || stats.chess_blitz?.last?.rating || 0,
      stats.chess_bullet?.best?.rating || stats.chess_bullet?.last?.rating || 0,
    ];
    return Math.max(...ratings);
  }, [statsQuery.data]);

  const avgAccuracy = useMemo(() => {
    const games = gamesQuery.data || [];
    const withAcc = games.filter((g) => g.accuracy !== undefined);
    if (withAcc.length === 0) return null;
    const sum = withAcc.reduce((acc, g) => acc + (g.accuracy || 0), 0);
    return Math.round(sum / withAcc.length * 10) / 10;
  }, [gamesQuery.data]);

  const topOpenings = useMemo(() => {
    const games = gamesQuery.data || [];
    const map = new Map<string, { wins: number; total: number }>();
    for (const g of games) {
      const entry = map.get(g.opening) || { wins: 0, total: 0 };
      entry.total++;
      if (g.result === 'win') entry.wins++;
      map.set(g.opening, entry);
    }
    return [...map.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);
  }, [gamesQuery.data]);

  const isLoading = profileQuery.isLoading || statsQuery.isLoading || gamesQuery.isLoading;

  const handleRefresh = () => {
    profileQuery.refetch();
    statsQuery.refetch();
    gamesQuery.refetch();
  };

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate(undefined, {
      onSuccess: () => router.push('/analysis'),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="px-5 pt-6 pb-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {profileQuery.data?.avatar ? (
            <div className="relative">
              <img
                src={profileQuery.data.avatar}
                alt="avatar"
                className="w-14 h-14 rounded-full border-2 border-gold shadow-[0_0_16px_rgba(16,185,129,0.3)]"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-win border-2 border-background" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center bg-surface shadow-[0_0_16px_rgba(16,185,129,0.3)]">
              <span className="text-gold text-2xl">&#9822;</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{username}</h1>
            <div className="flex items-center gap-2">
              {bestRating > 0 && (
                <span className="text-gold text-sm font-semibold">
                  <NumberTicker value={bestRating} /> Best
                </span>
              )}
              <span className="text-text-tertiary text-sm">{gameStats.total} games</span>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4 }}
          onClick={handleRefresh}
          className="p-2.5 rounded-xl border border-white/10 transition-colors hover:bg-white/5 hover:border-gold/30"
        >
          <RefreshCw size={18} className="text-text-secondary" />
        </motion.button>
      </motion.div>

      {/* Stats Hero — Neon Card with donut */}
      <motion.div variants={fadeUp}>
        <NeonGradientCard className="mb-6" neonColors={{ firstColor: '#10B981', secondColor: '#059669' }}>
          <div className="flex items-center gap-6">
            <DonutChart wins={gameStats.wins} draws={gameStats.draws} losses={gameStats.losses} size={130} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-[0_0_6px_rgba(76,175,80,0.5)]" style={{ backgroundColor: Colors.win }} />
                <span className="text-text-secondary text-sm flex-1">Wins</span>
                <span className="text-white font-bold text-lg">
                  <NumberTicker value={gameStats.wins} />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Colors.draw }} />
                <span className="text-text-secondary text-sm flex-1">Draws</span>
                <span className="text-white font-bold text-lg">
                  <NumberTicker value={gameStats.draws} />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-[0_0_6px_rgba(239,83,80,0.5)]" style={{ backgroundColor: Colors.loss }} />
                <span className="text-text-secondary text-sm flex-1">Losses</span>
                <span className="text-white font-bold text-lg">
                  <NumberTicker value={gameStats.losses} />
                </span>
              </div>
            </div>
          </div>
        </NeonGradientCard>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm relative overflow-hidden group hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={14} className="text-gold" />
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">Accuracy</span>
          </div>
          <span className="text-3xl font-bold text-gold">
            {avgAccuracy ? (
              <><NumberTicker value={avgAccuracy} decimalPlaces={1} /><span className="text-lg">%</span></>
            ) : 'N/A'}
          </span>
          <p className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wide">Last 30 days</p>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>
        <div className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm relative overflow-hidden group hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-gold" />
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">Best Rating</span>
          </div>
          <span className="text-3xl font-bold text-gold">
            {bestRating > 0 ? <NumberTicker value={bestRating} /> : 'N/A'}
          </span>
          <p className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wide">All time peak</p>
          <BorderBeam lightColor="#10B981" duration={6} borderWidth={1} />
        </div>
      </motion.div>

      {/* Top Openings */}
      {topOpenings.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-6"
        >
          <AnimatedShinyText className="text-xs font-medium uppercase tracking-widest mb-4 !mx-0 !max-w-none" shimmerWidth={80}>
            Top Openings
          </AnimatedShinyText>
          {topOpenings.map(([name, data], i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold text-sm w-6 h-6 flex items-center justify-center rounded-md bg-gold/10">{i + 1}</span>
                <span className="text-white text-sm font-medium truncate max-w-[200px]">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary text-xs">{data.total}g</span>
                <span className="text-sm font-bold" style={{ color: (data.wins / data.total) >= 0.5 ? Colors.win : Colors.loss }}>
                  {Math.round((data.wins / data.total) * 100)}%
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick Insights */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-6"
      >
        <AnimatedShinyText className="text-xs font-medium uppercase tracking-widest mb-3 !mx-0 !max-w-none" shimmerWidth={80}>
          Quick Insights
        </AnimatedShinyText>
        {analysisReport ? (
          <div className="space-y-2.5">
            {analysisReport.strengths.slice(0, 2).map((s) => (
              <div key={s.title} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-win shadow-[0_0_6px_rgba(76,175,80,0.5)]" />
                <span className="text-white text-sm"><span className="text-win font-semibold">Strength:</span> {s.title}</span>
              </div>
            ))}
            {analysisReport.weaknesses.slice(0, 2).map((w) => (
              <div key={w.title} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-loss shadow-[0_0_6px_rgba(239,83,80,0.5)]" />
                <span className="text-white text-sm"><span className="text-loss font-semibold">Work on:</span> {w.title}</span>
              </div>
            ))}
            {analysisReport.ratingTip && (
              <div className="flex items-center gap-2.5 pt-1 border-t border-white/5">
                <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-text-secondary text-xs">{analysisReport.ratingTip}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-tertiary text-sm">Run an analysis to see personalized insights.</p>
        )}
      </motion.div>

      {/* Run Analysis CTA — Shimmer Button */}
      <motion.div variants={fadeUp}>
        <ShimmerButton
          onClick={handleRunAnalysis}
          disabled={runAnalysisMutation.isPending}
          shimmerColor="#10B981"
          background="rgba(27, 42, 63, 0.95)"
          shimmerDuration="2.5s"
          className="w-full py-4 text-base font-bold disabled:opacity-60"
        >
          {runAnalysisMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gold">
              <Brain size={20} />
              Run Full AI Analysis
            </span>
          )}
        </ShimmerButton>
      </motion.div>
    </motion.div>
  );
}
