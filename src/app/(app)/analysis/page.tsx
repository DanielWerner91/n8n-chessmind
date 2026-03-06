'use client';

import { Brain, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';

export default function AnalysisPage() {
  const { analysisReport, runAnalysisMutation } = useChess();

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
        <button
          onClick={handleRunAnalysis}
          disabled={runAnalysisMutation.isPending}
          className="py-3.5 px-7 rounded-2xl font-bold transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
          style={{ backgroundColor: Colors.gold, color: Colors.background }}
        >
          {runAnalysisMutation.isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Analyzing...
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

  return (
    <div className="px-5 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Analysis</h1>
          <p className="text-text-secondary text-sm mt-1">Your personalized chess report</p>
        </div>
      </div>

      {/* Playing Style */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <h3 className="text-gold text-sm font-semibold mb-2">Playing Style Profile</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{analysisReport.playingStyle}</p>
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

      {/* Strengths */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-win" />
          <h3 className="text-white text-sm font-semibold">Strengths</h3>
        </div>
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
      </div>

      {/* Weaknesses */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={16} className="text-loss" />
          <h3 className="text-white text-sm font-semibold">Weaknesses & Blind Spots</h3>
        </div>
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
      </div>

      {/* Opening Repertoire */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <h3 className="text-white text-sm font-semibold mb-3">Opening Repertoire</h3>
        <div className="space-y-2">
          {analysisReport.openingAnalysis.map((o) => (
            <div key={o.name} className="flex items-center justify-between py-1.5">
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
          ))}
        </div>
      </div>

      {/* Tactical Gaps */}
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
