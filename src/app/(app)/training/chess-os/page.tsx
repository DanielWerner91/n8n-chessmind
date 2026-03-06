'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Swords, Crown, ListChecks, ShieldAlert, ExternalLink, Star,
} from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';

const priorityColors = {
  high: Colors.loss,
  medium: Colors.gold,
  low: Colors.textTertiary,
};

export default function ChessOSPage() {
  const router = useRouter();
  const { trainingPlan } = useChess();

  if (!trainingPlan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <BookOpen size={48} className="text-text-tertiary mb-4" />
        <p className="text-text-secondary text-sm mb-4">Generate a training plan first to access your Chess OS.</p>
        <button onClick={() => router.push('/training')} className="text-accent text-sm">Back to Training</button>
      </div>
    );
  }

  const { chessOS, diagnosis, diagnostic } = trainingPlan;

  return (
    <div className="px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/training')} className="text-text-tertiary hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-white">Chess OS</h1>
          <p className="text-text-secondary text-xs">Your personal chess reference document</p>
        </div>
      </div>

      {/* Player Summary */}
      <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.gold, borderWidth: 1 }}>
        <div className="flex items-center gap-3 mb-2">
          <Star size={18} style={{ color: Colors.gold }} />
          <span className="text-white text-sm font-bold">{diagnostic.username} · {diagnostic.currentRating} rating</span>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed">{diagnosis.archetypeDescription}</p>
        {diagnosis.strengths.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {diagnosis.strengths.slice(0, 3).map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(76,175,80,0.15)', color: Colors.win }}>
                {s.area}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Opening Repertoire */}
      <Section icon={Swords} title="Opening Repertoire">
        {chessOS.openingRepertoire.asWhite.length > 0 && (
          <div className="mb-3">
            <p className="text-text-secondary text-xs font-semibold mb-2 uppercase">As White</p>
            {chessOS.openingRepertoire.asWhite.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: Colors.border }}>
                <div>
                  <p className="text-white text-sm font-medium">{o.name}</p>
                  <p className="text-text-tertiary text-xs">{o.notes}</p>
                </div>
                <a href={o.studyUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
        {chessOS.openingRepertoire.asBlack.length > 0 && (
          <div>
            <p className="text-text-secondary text-xs font-semibold mb-2 uppercase">As Black</p>
            {chessOS.openingRepertoire.asBlack.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: Colors.border }}>
                <div>
                  <p className="text-white text-sm font-medium">{o.name}</p>
                  <p className="text-text-tertiary text-xs">{o.notes}</p>
                </div>
                <a href={o.studyUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
        {chessOS.openingRepertoire.asWhite.length === 0 && chessOS.openingRepertoire.asBlack.length === 0 && (
          <p className="text-text-tertiary text-xs">Play more games to build your repertoire reference.</p>
        )}
      </Section>

      {/* Endgame Reference */}
      <Section icon={Crown} title="Endgame Reference">
        <div className="space-y-2">
          {chessOS.endgameReference.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorityColors[e.priority] }}
                />
                <p className="text-white text-sm">{e.topic}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: priorityColors[e.priority] }}>
                  {e.priority}
                </span>
                <a href={e.studyUrl} target="_blank" rel="noopener noreferrer" className="text-accent">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pre-Move Ritual */}
      <Section icon={ListChecks} title="Pre-Move Ritual">
        <div className="space-y-2">
          {chessOS.preMoveRitual.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: Colors.surface, color: Colors.textSecondary }}
              >
                {i + 1}
              </span>
              <p className="text-text-secondary text-sm">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tilt Protocol */}
      <Section icon={ShieldAlert} title="Tilt Protocol">
        <div className="space-y-2">
          {chessOS.tiltProtocol.map((rule, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(239,83,80,0.1)', color: Colors.loss }}
              >
                {i + 1}
              </span>
              <p className="text-text-secondary text-sm">{rule}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Six-Axis Scores */}
      <Section icon={Star} title="Skill Profile">
        <div className="space-y-2">
          {Object.entries(diagnostic.sixAxisScores).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-text-secondary text-xs w-32 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${value}%`,
                    backgroundColor: value >= 70 ? Colors.win : value >= 45 ? Colors.gold : Colors.loss,
                  }}
                />
              </div>
              <span className="text-white text-xs font-bold w-8 text-right">{value}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1 }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: Colors.gold }} />
        <h2 className="text-white text-sm font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
