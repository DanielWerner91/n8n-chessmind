'use client';

import { Brain, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle, RefreshCw, Zap, AlertTriangle, TrendingUp, Cpu } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import ChessBoard from '@/components/ChessBoard';
import Colors from '@/lib/colors';

const AXIS_LABELS: { key: keyof typeof AXIS_MAP; label: string }[] = [
  { key: 'openings', label: 'Openings' },
  { key: 'tactics', label: 'Tactics' },
  { key: 'endings', label: 'Endings' },
  { key: 'advantageCapitalization', label: 'Advantage' },
  { key: 'resourcefulness', label: 'Resourceful' },
  { key: 'timeManagement', label: 'Time Mgmt' },
];
const AXIS_MAP = { openings: 0, tactics: 0, endings: 0, advantageCapitalization: 0, resourcefulness: 0, timeManagement: 0 };

export default function AnalysisPage() {
  const { analysisReport, runAnalysisMutation, runEngineAnalysis, engineProgress, isEngineRunning } = useChess();

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  if (!analysisReport) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <Brain size={56} className="text-text-tertiary mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">No Analysis Yet</h2>
        <p className="text-text-secondary text-sm mb-6">
          Run an AI analysis to get personalized insights about your playing style, strengths, and areas for improvement.
        </p>
        {runAnalysisMutation.isError && (
          <p className="text-loss text-sm mb-4">{runAnalysisMutation.error?.message || 'Analysis failed'}</p>
        )}
        <button
          onClick={handleRunAnalysis}
          disabled={runAnalysisMutation.isPending}
          className="py-3.5 px-7 rounded-2xl font-bold transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
          style={{ backgroundColor: Colors.gold, color: Colors.background }}
        >
          {runAnalysisMutation.isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Analyzing your games...
            </>
          ) : (
            <>
              <Brain size={18} />
              Run Analysis Now
            </>
          )}
        </button>
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
    <div className="px-5 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Analysis</h1>
          <p className="text-text-secondary text-sm mt-1">
            Based on {analysisReport.gamesAnalyzed} games
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(244,197,66,0.15)', color: Colors.gold }}>
          {bracketLabel(analysisReport.ratingBracket)}
        </span>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <MiniStat
          label="Games"
          value={analysisReport.gamesAnalyzed.toString()}
        />
        <MiniStat
          label="White"
          value={`${analysisReport.colorStats.whiteWinRate}%`}
          color={analysisReport.colorStats.whiteWinRate >= 50 ? Colors.win : Colors.loss}
        />
        <MiniStat
          label="Black"
          value={`${analysisReport.colorStats.blackWinRate}%`}
          color={analysisReport.colorStats.blackWinRate >= 50 ? Colors.win : Colors.loss}
        />
        {analysisReport.accuracyStats && (
          <MiniStat
            label="Accuracy"
            value={`${analysisReport.accuracyStats.average}%`}
            color={analysisReport.accuracyStats.average >= 75 ? Colors.win : analysisReport.accuracyStats.average >= 60 ? Colors.gold : Colors.loss}
          />
        )}
      </div>

      {/* Rating Tip */}
      <div className="rounded-2xl p-3.5 border mb-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(244,197,66,0.08)', borderColor: 'rgba(244,197,66,0.3)' }}>
        <TrendingUp size={18} className="text-gold shrink-0 mt-0.5" />
        <p className="text-text-secondary text-sm leading-relaxed">{analysisReport.ratingTip}</p>
      </div>

      {/* Playing Style */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <h3 className="text-gold text-sm font-semibold mb-2">Playing Style Profile</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{analysisReport.playingStyle}</p>
      </div>

      {/* 6-Axis Scores */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <h3 className="text-white text-sm font-semibold mb-3">Performance Breakdown</h3>
        <div className="space-y-2.5">
          {AXIS_LABELS.map(({ key, label }) => {
            const score = analysisReport.sixAxisScores[key as keyof typeof analysisReport.sixAxisScores];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-secondary text-xs">{label}</span>
                  <span className="text-xs font-semibold" style={{ color: scoreColor(score) }}>
                    {score}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 rounded-2xl p-4 border" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Endgame Score</p>
          <p className="text-2xl font-bold mb-2" style={{ color: scoreColor(analysisReport.endgameScore) }}>
            {analysisReport.endgameScore}/100
          </p>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${analysisReport.endgameScore}%`, backgroundColor: scoreColor(analysisReport.endgameScore) }} />
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-4 border" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Development</p>
          <p className="text-2xl font-bold mb-2" style={{ color: scoreColor(analysisReport.developmentRating) }}>
            {analysisReport.developmentRating}/100
          </p>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${analysisReport.developmentRating}%`, backgroundColor: scoreColor(analysisReport.developmentRating) }} />
          </div>
        </div>
      </div>

      {/* Accuracy Stats */}
      {analysisReport.accuracyStats && (
        <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-gold" />
            <h3 className="text-white text-sm font-semibold">Accuracy Analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-text-tertiary text-xs">Average</p>
              <p className="text-white text-lg font-bold">{analysisReport.accuracyStats.average}%</p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs">In Wins</p>
              <p className="text-win text-lg font-bold">{analysisReport.accuracyStats.inWins}%</p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs">In Losses</p>
              <p className="text-loss text-lg font-bold">{analysisReport.accuracyStats.inLosses}%</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  analysisReport.accuracyStats.trend === 'improving' ? Colors.win
                  : analysisReport.accuracyStats.trend === 'declining' ? Colors.loss
                  : Colors.draw,
              }}
            />
            <span className="text-text-secondary text-xs">
              Trend: {analysisReport.accuracyStats.trend === 'improving' ? 'Improving' : analysisReport.accuracyStats.trend === 'declining' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
      )}

      {/* Time Class Performance */}
      {analysisReport.timeClassStats.length > 0 && (
        <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <h3 className="text-white text-sm font-semibold mb-3">Time Control Performance</h3>
          <div className="flex gap-2">
            {analysisReport.timeClassStats.map((tc) => (
              <div key={tc.timeClass} className="flex-1 rounded-xl p-3 border text-center" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-1">{tc.timeClass}</p>
                <p className="text-white text-lg font-bold">{tc.winRate}%</p>
                <p className="text-text-tertiary text-[10px]">{tc.games} games</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-win" />
          <h3 className="text-white text-sm font-semibold">Strengths</h3>
        </div>
        {analysisReport.strengths.length === 0 ? (
          <p className="text-text-tertiary text-sm">Play more games to identify your strengths.</p>
        ) : (
          <div className="space-y-3">
            {analysisReport.strengths.map((s) => (
              <div key={s.title} className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-win mt-1.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{s.title}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weaknesses */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-loss" />
          <h3 className="text-white text-sm font-semibold">Areas for Improvement</h3>
        </div>
        {analysisReport.weaknesses.length === 0 ? (
          <p className="text-text-tertiary text-sm">No significant weaknesses detected — nice!</p>
        ) : (
          <div className="space-y-3">
            {analysisReport.weaknesses.map((w) => (
              <div key={w.title} className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-loss mt-1.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{w.title}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opening Repertoire */}
      {analysisReport.openingAnalysis.length > 0 && (
        <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <h3 className="text-white text-sm font-semibold mb-3">Opening Repertoire</h3>
          <div className="space-y-2">
            {analysisReport.openingAnalysis.map((o) => (
              <div key={o.name} className="py-1.5">
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
        </div>
      )}

      {/* Tactical Gaps */}
      {analysisReport.tacticalGaps.length > 0 && (
        <div className="rounded-2xl p-4 border mb-6" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <h3 className="text-white text-sm font-semibold mb-3">Tactical Pattern Gaps</h3>
          <div className="space-y-2">
            {analysisReport.tacticalGaps.map((gap, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                <p className="text-text-secondary text-sm">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engine Analysis Section */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: analysisReport.engineEnhanced ? Colors.win : Colors.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className={analysisReport.engineEnhanced ? 'text-win' : 'text-text-tertiary'} />
          <h3 className="text-white text-sm font-semibold">Engine Analysis</h3>
          {analysisReport.engineEnhanced && (
            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: 'rgba(76,175,80,0.15)', color: Colors.win }}>
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
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${(engineProgress.currentGame / engineProgress.totalGames) * 100}%` }}
              />
            </div>
            <p className="text-text-tertiary text-[10px] mt-1">
              Move {engineProgress.currentMove}/{engineProgress.totalMoves}
            </p>
          </div>
        )}

        {analysisReport.engineEnhanced ? (
          <>
            {/* Blunder/Mistake/Inaccuracy summary */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(239,83,80,0.1)' }}>
                <p className="text-loss text-lg font-bold">{analysisReport.blunders || 0}</p>
                <p className="text-text-tertiary text-[10px]">Blunders</p>
              </div>
              <div className="flex-1 rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(244,197,66,0.1)' }}>
                <p className="text-gold text-lg font-bold">{analysisReport.mistakes || 0}</p>
                <p className="text-text-tertiary text-[10px]">Mistakes</p>
              </div>
              <div className="flex-1 rounded-xl p-2.5 text-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <p className="text-accent text-lg font-bold">{analysisReport.inaccuracies || 0}</p>
                <p className="text-text-tertiary text-[10px]">Inaccuracies</p>
              </div>
            </div>

            {/* Missed Tactics */}
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

            {/* Critical Moments */}
            {analysisReport.criticalMoments && analysisReport.criticalMoments.length > 0 && (
              <div>
                <p className="text-text-secondary text-xs font-medium mb-2">Critical Moments</p>
                <div className="space-y-2">
                  {analysisReport.criticalMoments.slice(0, 3).map((cm, i) => (
                    <div key={i} className="rounded-xl p-3 border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
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
              Run Stockfish engine analysis to find blunders, mistakes, and missed tactics in your games.
            </p>
            <button
              onClick={runEngineAnalysis}
              disabled={isEngineRunning}
              className="py-2.5 px-5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 hover:opacity-90 flex items-center gap-2 mx-auto"
              style={{ backgroundColor: Colors.accent, color: 'white' }}
            >
              {isEngineRunning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Cpu size={16} />
                  Run Engine Analysis
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Regenerate */}
      <button
        onClick={handleRunAnalysis}
        disabled={runAnalysisMutation.isPending}
        className="w-full py-3.5 rounded-2xl font-bold transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 border"
        style={{ borderColor: Colors.gold, color: Colors.gold }}
      >
        {runAnalysisMutation.isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <RefreshCw size={18} />
            Regenerate Analysis
          </>
        )}
      </button>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-xl p-2.5 border text-center min-w-[70px]" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
      <p className="text-text-tertiary text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={{ color: color || Colors.textSecondary }}>{value}</p>
    </div>
  );
}
