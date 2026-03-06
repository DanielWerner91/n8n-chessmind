'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, RefreshCw, Brain } from 'lucide-react';
import { useChess, useProfile, useStats, useGames } from '@/lib/ChessContext';
import DonutChart from '@/components/DonutChart';
import StatCard from '@/components/StatCard';
import Colors from '@/lib/colors';

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
    return (sum / withAcc.length).toFixed(1);
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
    <div className="px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {profileQuery.data?.avatar ? (
            <img
              src={profileQuery.data.avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-gold"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center bg-surface">
              <span className="text-gold text-xl">&#9822;</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{username}</h1>
            <div className="flex items-center gap-2">
              {bestRating > 0 && (
                <span className="text-gold text-sm font-semibold">{bestRating} Best</span>
              )}
              <span className="text-text-tertiary text-sm">{gameStats.total} games</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-xl border transition-colors hover:bg-card"
          style={{ borderColor: Colors.border }}
        >
          <RefreshCw size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Donut + Stats */}
      <div className="flex items-center gap-6 mb-6">
        <DonutChart wins={gameStats.wins} draws={gameStats.draws} losses={gameStats.losses} size={130} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Colors.win }} />
            <span className="text-text-secondary text-sm flex-1">Wins</span>
            <span className="text-white font-semibold">{gameStats.wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Colors.draw }} />
            <span className="text-text-secondary text-sm flex-1">Draws</span>
            <span className="text-white font-semibold">{gameStats.draws}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Colors.loss }} />
            <span className="text-text-secondary text-sm flex-1">Losses</span>
            <span className="text-white font-semibold">{gameStats.losses}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-3 mb-6">
        <StatCard
          title="Avg Accuracy"
          value={avgAccuracy ? `${avgAccuracy}%` : 'N/A'}
          icon={<Target size={14} className="text-gold" />}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Best Rating"
          value={bestRating > 0 ? bestRating.toString() : 'N/A'}
          icon={<TrendingUp size={14} className="text-gold" />}
          subtitle="All time"
        />
      </div>

      {/* Top Openings */}
      {topOpenings.length > 0 && (
        <div className="rounded-2xl p-4 border mb-6" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Top Openings</h3>
          {topOpenings.map(([name, data], i) => (
            <div key={name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold text-sm w-5">{i + 1}</span>
                <span className="text-white text-sm font-medium truncate max-w-[200px]">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary text-xs">{data.total} games</span>
                <span className="text-win text-xs font-semibold">
                  {Math.round((data.wins / data.total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Insights */}
      <div className="rounded-2xl p-4 border mb-6" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Quick Insights</h3>
        {analysisReport ? (
          <div className="space-y-2">
            {analysisReport.strengths.slice(0, 2).map((s) => (
              <div key={s.title} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-win" />
                <span className="text-white text-sm"><strong>Strength:</strong> {s.title}</span>
              </div>
            ))}
            {analysisReport.weaknesses.slice(0, 2).map((w) => (
              <div key={w.title} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-loss" />
                <span className="text-white text-sm"><strong>Work on:</strong> {w.title}</span>
              </div>
            ))}
            {analysisReport.ratingTip && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-text-secondary text-xs">{analysisReport.ratingTip}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-tertiary text-sm">Run an analysis to see personalized insights.</p>
        )}
      </div>

      {/* Run Analysis CTA */}
      <button
        onClick={handleRunAnalysis}
        disabled={runAnalysisMutation.isPending}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ backgroundColor: Colors.gold, color: Colors.background }}
      >
        {runAnalysisMutation.isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Brain size={20} />
            Run Full AI Analysis
          </>
        )}
      </button>
    </div>
  );
}
