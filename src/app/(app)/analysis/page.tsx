'use client';

import { Brain, CheckCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle, RefreshCw, Zap, AlertTriangle, TrendingUp, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChess } from '@/lib/ChessContext';
import ChessBoard from '@/components/ChessBoard';
import Colors from '@/lib/colors';
import { NumberTicker } from '@/components/ui/number-ticker';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { BorderBeam } from '@/components/ui/border-beam';

const AXIS_LABELS: { key: keyof typeof AXIS_MAP; label: string }[] = [
  { key: 'openings', label: 'Openings' },
  { key: 'tactics', label: 'Tactics' },
  { key: 'endings', label: 'Endings' },
  { key: 'advantageCapitalization', label: 'Advantage' },
  { key: 'resourcefulness', label: 'Resourceful' },
  { key: 'timeManagement', label: 'Time Mgmt' },
];
const AXIS_MAP = { openings: 0, tactics: 0, endings: 0, advantageCapitalization: 0, resourcefulness: 0, timeManagement: 0 };

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function AnalysisPage() {
  const { analysisReport, runAnalysisMutation, runEngineAnalysis, engineProgress, isEngineRunning } = useChess();

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  if (!analysisReport) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <Brain size={56} className="text-gold/40 animate-float" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-xl font-bold mb-2"
        >
          No Analysis Yet
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-text-secondary text-sm mb-6"
        >
          Run an AI analysis to get personalized insights about your playing style, strengths, and areas for improvement.
        </motion.p>
        {runAnalysisMutation.isError && (
          <p className="text-loss text-sm mb-4">{runAnalysisMutation.error?.message || 'Analysis failed'}</p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ShimmerButton
            onClick={handleRunAnalysis}
            disabled={runAnalysisMutation.isPending}
            shimmerColor="#10B981"
            background="rgba(30, 42, 58, 0.95)"
            shimmerDuration="2.5s"
            className="py-3.5 px-7 text-base font-bold disabled:opacity-60"
          >
            {runAnalysisMutation.isPending ? (
              <span className="flex items-center gap-2 text-gold">
                <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Analyzing your games...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gold">
                <Brain size={18} />
                Run Analysis Now
              </span>
            )}
          </ShimmerButton>
        </motion.div>
      </div>
    );
  }

  const recIcon = (rec: string) => {
    switch (rec) {
      case 'keep': return <ArrowUpCircle size={16} className="text-win" />;
      case 'improve': return <MinusCircle size={16} className="text-gold" />;
      case 'drop': return <ArrowDownCircle size={16} className="text-loss" />;
    }
  };

  const scoreColor = (score: number) =>
    score > 60 ? Colors.win : score > 40 ? Colors.gold : Colors.loss;

  const bracketLabel = (b: string) => {
    switch (b) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      default: return b;
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="px-5 pt-6 pb-8">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Analysis</h1>
          <p className="text-text-secondary text-sm mt-1">
            Based on {analysisReport.gamesAnalyzed} games
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-gold/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: Colors.gold }}>
          {bracketLabel(analysisReport.ratingBracket)}
        </span>
      </motion.div>

      {/* Stats Summary Bar */}
      <motion.div variants={fadeUp} className="flex gap-2 mb-4 overflow-x-auto">
        <MiniStat label="Games" value={analysisReport.gamesAnalyzed.toString()} />
        <MiniStat label="White" value={`${analysisReport.colorStats.whiteWinRate}%`} color={analysisReport.colorStats.whiteWinRate >= 50 ? Colors.win : Colors.loss} />
        <MiniStat label="Black" value={`${analysisReport.colorStats.blackWinRate}%`} color={analysisReport.colorStats.blackWinRate >= 50 ? Colors.win : Colors.loss} />
        {analysisReport.accuracyStats && (
          <MiniStat label="Accuracy" value={`${analysisReport.accuracyStats.average}%`} color={analysisReport.accuracyStats.average >= 75 ? Colors.win : analysisReport.accuracyStats.average >= 60 ? Colors.gold : Colors.loss} />
        )}
      </motion.div>

      {/* Rating Tip */}
      <motion.div variants={fadeUp} className="rounded-2xl p-3.5 border mb-4 flex items-start gap-3 border-gold/20 bg-gold/5">
        <TrendingUp size={18} className="text-gold shrink-0 mt-0.5" />
        <p className="text-text-secondary text-sm leading-relaxed">{analysisReport.ratingTip}</p>
      </motion.div>

      {/* Playing Style — Neon Card */}
      <motion.div variants={fadeUp}>
        <NeonGradientCard className="mb-4" borderSize={1} neonColors={{ firstColor: '#10B981', secondColor: '#059669' }}>
          <AnimatedShinyText className="text-xs font-semibold uppercase tracking-widest mb-2 !mx-0 !max-w-none" shimmerWidth={80}>
            Playing Style Profile
          </AnimatedShinyText>
          <p className="text-text-secondary text-sm leading-relaxed">{analysisReport.playingStyle}</p>
        </NeonGradientCard>
      </motion.div>

      {/* 6-Axis Scores */}
      <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
        <h3 className="text-white text-sm font-semibold mb-3">Performance Breakdown</h3>
        <div className="space-y-3">
          {AXIS_LABELS.map(({ key, label }, i) => {
            const score = analysisReport.sixAxisScores[key as keyof typeof analysisReport.sixAxisScores];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-text-secondary text-xs">{label}</span>
                  <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>
                    <NumberTicker value={score} />
                  </span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                    style={{
                      backgroundColor: scoreColor(score),
                      boxShadow: `0 0 8px ${scoreColor(score)}40`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Scores */}
      <motion.div variants={fadeUp} className="flex gap-3 mb-4">
        <div className="flex-1 rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm relative overflow-hidden">
          <p className="text-text-secondary text-[10px] uppercase tracking-widest mb-2">Endgame Score</p>
          <p className="text-2xl font-bold mb-2" style={{ color: scoreColor(analysisReport.endgameScore) }}>
            <NumberTicker value={analysisReport.endgameScore} /><span className="text-sm text-text-tertiary">/100</span>
          </p>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${analysisReport.endgameScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ backgroundColor: scoreColor(analysisReport.endgameScore), boxShadow: `0 0 8px ${scoreColor(analysisReport.endgameScore)}40` }}
            />
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm relative overflow-hidden">
          <p className="text-text-secondary text-[10px] uppercase tracking-widest mb-2">Development</p>
          <p className="text-2xl font-bold mb-2" style={{ color: scoreColor(analysisReport.developmentRating) }}>
            <NumberTicker value={analysisReport.developmentRating} /><span className="text-sm text-text-tertiary">/100</span>
          </p>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${analysisReport.developmentRating}%` }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              style={{ backgroundColor: scoreColor(analysisReport.developmentRating), boxShadow: `0 0 8px ${scoreColor(analysisReport.developmentRating)}40` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Accuracy Stats */}
      {analysisReport.accuracyStats && (
        <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-gold" />
            <h3 className="text-white text-sm font-semibold">Accuracy Analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-xl bg-white/5">
              <p className="text-text-tertiary text-[10px] uppercase">Average</p>
              <p className="text-white text-lg font-bold"><NumberTicker value={analysisReport.accuracyStats.average} decimalPlaces={1} />%</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-win/5">
              <p className="text-text-tertiary text-[10px] uppercase">In Wins</p>
              <p className="text-win text-lg font-bold"><NumberTicker value={analysisReport.accuracyStats.inWins} decimalPlaces={1} />%</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-loss/5">
              <p className="text-text-tertiary text-[10px] uppercase">In Losses</p>
              <p className="text-loss text-lg font-bold"><NumberTicker value={analysisReport.accuracyStats.inLosses} decimalPlaces={1} />%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Time Class Performance */}
      {analysisReport.timeClassStats.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
          <h3 className="text-white text-sm font-semibold mb-3">Time Control Performance</h3>
          <div className="flex gap-2">
            {analysisReport.timeClassStats.map((tc) => (
              <div key={tc.timeClass} className="flex-1 rounded-xl p-3 border border-white/5 text-center bg-surface/80">
                <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">{tc.timeClass}</p>
                <p className="text-white text-lg font-bold">{tc.winRate}%</p>
                <p className="text-text-tertiary text-[10px]">{tc.games} games</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strengths */}
      <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-win" />
          <h3 className="text-white text-sm font-semibold">Strengths</h3>
        </div>
        {analysisReport.strengths.length === 0 ? (
          <p className="text-text-tertiary text-sm">Play more games to identify your strengths.</p>
        ) : (
          <div className="space-y-3">
            {analysisReport.strengths.map((s) => (
              <div key={s.title} className="flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-win shadow-[0_0_6px_rgba(76,175,80,0.5)] mt-1.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{s.title}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Weaknesses */}
      <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-loss" />
          <h3 className="text-white text-sm font-semibold">Areas for Improvement</h3>
        </div>
        {analysisReport.weaknesses.length === 0 ? (
          <p className="text-text-tertiary text-sm">No significant weaknesses detected — nice!</p>
        ) : (
          <div className="space-y-3">
            {analysisReport.weaknesses.map((w) => (
              <div key={w.title} className="flex gap-2.5">
                <div className="w-2 h-2 rounded-full bg-loss shadow-[0_0_6px_rgba(239,83,80,0.5)] mt-1.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{w.title}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Opening Repertoire */}
      {analysisReport.openingAnalysis.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-4">
          <AnimatedShinyText className="text-xs font-semibold uppercase tracking-widest mb-3 !mx-0 !max-w-none" shimmerWidth={80}>
            Opening Repertoire
          </AnimatedShinyText>
          <div className="space-y-2">
            {analysisReport.openingAnalysis.map((o) => (
              <div key={o.name} className="py-1.5 border-b border-white/5 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {recIcon(o.recommendation)}
                    <span className="text-white text-sm truncate">{o.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-text-tertiary text-xs">{o.games}g</span>
                    <span className="text-sm font-semibold" style={{ color: o.winRate >= 0.5 ? Colors.win : Colors.loss }}>
                      {Math.round(o.winRate * 100)}%
                    </span>
                  </div>
                </div>
                {o.masterWinRate !== undefined && (
                  <div className="ml-6 mt-0.5">
                    <span className="text-text-tertiary text-[10px]">
                      Masters: {Math.round(o.masterWinRate * 100)}% ({o.masterGames?.toLocaleString()}g)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tactical Gaps */}
      {analysisReport.tacticalGaps.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl p-4 border border-white/5 bg-card/80 backdrop-blur-sm mb-6">
          <h3 className="text-white text-sm font-semibold mb-3">Tactical Pattern Gaps</h3>
          <div className="space-y-2">
            {analysisReport.tacticalGaps.map((gap, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_4px_rgba(16,185,129,0.5)] mt-1.5 shrink-0" />
                <p className="text-text-secondary text-sm">{gap}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Engine Analysis Section */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl p-4 border mb-4 relative overflow-hidden"
        style={{
          backgroundColor: Colors.card,
          borderColor: analysisReport.engineEnhanced ? Colors.win : 'rgba(255,255,255,0.05)',
        }}
      >
        {analysisReport.engineEnhanced && <BorderBeam lightColor={Colors.win} duration={8} borderWidth={1} />}
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className={analysisReport.engineEnhanced ? 'text-win' : 'text-text-tertiary'} />
          <h3 className="text-white text-sm font-semibold">Engine Analysis</h3>
          {analysisReport.engineEnhanced && (
            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-win/15 text-win shadow-[0_0_8px_rgba(76,175,80,0.2)]">
              Complete
            </span>
          )}
        </div>

        {isEngineRunning && engineProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">Analyzing {engineProgress.gameName}...</span>
              <span className="text-text-tertiary">{engineProgress.currentGame}/{engineProgress.totalGames}</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(engineProgress.currentGame / engineProgress.totalGames) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{ boxShadow: '0 0 8px rgba(59,130,246,0.4)' }}
              />
            </div>
          </div>
        )}

        {analysisReport.engineEnhanced ? (
          <>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 rounded-xl p-2.5 text-center bg-loss/10 border border-loss/10">
                <p className="text-loss text-lg font-bold">{analysisReport.blunders || 0}</p>
                <p className="text-text-tertiary text-[10px]">Blunders</p>
              </div>
              <div className="flex-1 rounded-xl p-2.5 text-center bg-gold/10 border border-gold/10">
                <p className="text-gold text-lg font-bold">{analysisReport.mistakes || 0}</p>
                <p className="text-text-tertiary text-[10px]">Mistakes</p>
              </div>
              <div className="flex-1 rounded-xl p-2.5 text-center bg-accent/10 border border-accent/10">
                <p className="text-accent text-lg font-bold">{analysisReport.inaccuracies || 0}</p>
                <p className="text-text-tertiary text-[10px]">Inaccuracies</p>
              </div>
            </div>

            {analysisReport.missedTactics && analysisReport.missedTactics.length > 0 && (
              <div className="mb-3">
                <p className="text-text-secondary text-xs font-medium mb-2">Most Common Mistake Types</p>
                <div className="space-y-1">
                  {analysisReport.missedTactics.map((t) => (
                    <div key={t.theme} className="flex items-center justify-between">
                      <span className="text-white text-sm capitalize">{t.theme}</span>
                      <span className="text-text-tertiary text-xs">{t.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisReport.criticalMoments && analysisReport.criticalMoments.length > 0 && (
              <div>
                <p className="text-text-secondary text-xs font-medium mb-2">Critical Moments</p>
                <div className="space-y-2">
                  {analysisReport.criticalMoments.slice(0, 3).map((cm, i) => (
                    <div key={i} className="rounded-xl p-3 border border-white/5 bg-surface/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${cm.classification === 'blunder' ? 'text-loss' : 'text-gold'}`}>
                          {cm.classification === 'blunder' ? 'Blunder' : 'Mistake'} at move {cm.moveNumber}
                        </span>
                        <span className="text-text-tertiary text-[10px]">
                          {cm.evalBefore > 0 ? '+' : ''}{(cm.evalBefore / 100).toFixed(1)} → {cm.evalAfter > 0 ? '+' : ''}{(cm.evalAfter / 100).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <ChessBoard fen={cm.fen} size={160} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-text-secondary text-xs mb-3">
              Run Stockfish engine analysis to find blunders, mistakes, and missed tactics.
            </p>
            <ShimmerButton
              onClick={runEngineAnalysis}
              disabled={isEngineRunning}
              shimmerColor="#3B82F6"
              background="rgba(21, 34, 56, 0.95)"
              shimmerDuration="2.5s"
              className="py-2.5 px-5 text-sm font-semibold disabled:opacity-60 mx-auto"
            >
              {isEngineRunning ? (
                <span className="flex items-center gap-2 text-accent">
                  <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2 text-accent">
                  <Cpu size={16} />
                  Run Engine Analysis
                </span>
              )}
            </ShimmerButton>
          </div>
        )}
      </motion.div>

      {/* Regenerate */}
      <motion.div variants={fadeUp}>
        <ShimmerButton
          onClick={handleRunAnalysis}
          disabled={runAnalysisMutation.isPending}
          shimmerColor="#10B981"
          background="transparent"
          shimmerDuration="3s"
          className="w-full py-3.5 text-base font-bold disabled:opacity-60 border border-gold/30"
        >
          {runAnalysisMutation.isPending ? (
            <span className="flex items-center gap-2 text-gold">
              <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              Regenerating...
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gold">
              <RefreshCw size={18} />
              Regenerate Analysis
            </span>
          )}
        </ShimmerButton>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-xl p-2.5 border border-white/5 text-center min-w-[70px] bg-surface/80 backdrop-blur-sm">
      <p className="text-text-tertiary text-[10px] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={{ color: color || Colors.textSecondary }}>{value}</p>
    </div>
  );
}
