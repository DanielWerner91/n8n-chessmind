'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckSquare, Square, ExternalLink, Clock, Info, Target, Award, Sparkles,
} from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import type { DayModule } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  tactics: { bg: 'rgba(239,83,80,0.15)', text: Colors.loss, border: Colors.loss },
  openings: { bg: 'rgba(59,130,246,0.15)', text: Colors.accent, border: Colors.accent },
  endgames: { bg: 'rgba(16,185,129,0.15)', text: Colors.gold, border: Colors.gold },
  strategy: { bg: 'rgba(76,175,80,0.15)', text: Colors.win, border: Colors.win },
  review: { bg: 'rgba(120,144,156,0.15)', text: Colors.draw, border: Colors.draw },
  play: { bg: 'rgba(76,175,80,0.15)', text: Colors.win, border: Colors.win },
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  weakness: { label: 'From weaknesses', color: Colors.loss },
  'own-game': { label: 'From your games', color: Colors.accent },
  archetype: { label: 'For your style', color: Colors.gold },
  general: { label: 'Best practice', color: Colors.textTertiary },
};

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const weekNum = parseInt(params.n as string, 10);
  const { trainingPlan, toggleModule, setCurrentWeek } = useChess();
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  if (!trainingPlan || isNaN(weekNum) || weekNum < 1 || weekNum > 8) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <p className="text-text-secondary text-sm mb-4">Week not found</p>
        <button onClick={() => router.push('/training')} className="text-accent text-sm">Back to Training</button>
      </div>
    );
  }

  const week = trainingPlan.weeks[weekNum - 1];
  if (!week) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-text-secondary text-sm">Week not found</p>
      </div>
    );
  }

  const completed = week.days.filter((d) => d.completed).length;
  const total = week.days.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCurrent = trainingPlan.currentWeek === weekNum;

  const dayModules = useMemo(() => {
    return week.days.filter((d) => d.dayOfWeek === selectedDay);
  }, [week.days, selectedDay]);

  const dayCompletion = useMemo(() => {
    const map = new Map<number, boolean>();
    for (let d = 1; d <= 7; d++) {
      const mods = week.days.filter((m) => m.dayOfWeek === d);
      map.set(d, mods.length > 0 && mods.every((m) => m.completed));
    }
    return map;
  }, [week.days]);

  const estimatedMinutes = useMemo(() => {
    return dayModules.reduce((sum, m) => sum + (m.estimatedMinutes || 15), 0);
  }, [dayModules]);

  return (
    <div className="px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/training')} className="text-text-tertiary hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white">Week {weekNum}: {week.theme}</h1>
          <p className="text-text-secondary text-xs">{week.description}</p>
        </div>
        {!isCurrent && (
          <button
            onClick={() => setCurrentWeek(weekNum)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
            style={{ backgroundColor: Colors.gold, color: Colors.background }}
          >
            Set Current
          </button>
        )}
      </div>

      {/* Motivational Intro */}
      {week.motivationalIntro && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3.5 rounded-xl border-l-2"
          style={{ backgroundColor: `${Colors.gold}08`, borderLeftColor: Colors.gold }}
        >
          <p className="text-xs italic leading-relaxed" style={{ color: Colors.textSecondary }}>
            {week.motivationalIntro}
          </p>
        </motion.div>
      )}

      {/* Week Goal */}
      {week.weekGoal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-2.5 mb-3 p-3 rounded-xl"
          style={{ backgroundColor: Colors.card }}
        >
          <Target size={16} style={{ color: Colors.gold }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: Colors.gold }}>
              Week Goal
            </p>
            <p className="text-xs" style={{ color: Colors.textSecondary }}>{week.weekGoal}</p>
          </div>
        </motion.div>
      )}

      {/* Milestone Tracker */}
      {week.milestone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2.5 mb-4 p-3 rounded-xl"
          style={{ backgroundColor: week.completed ? `${Colors.gold}15` : Colors.card }}
        >
          <Award size={16} style={{ color: week.completed ? Colors.gold : Colors.textTertiary }} />
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: week.completed ? Colors.gold : Colors.textSecondary }}>
              {week.completed ? `Unlocked: ${week.milestone.name}` : week.milestone.name}
            </p>
            <p className="text-[10px]" style={{ color: Colors.textTertiary }}>
              {week.completed
                ? week.milestone.description
                : `Complete ${total - completed} more module${total - completed !== 1 ? 's' : ''} to earn this badge`}
            </p>
          </div>
          {week.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Sparkles size={16} style={{ color: Colors.gold }} />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="h-2 bg-surface rounded-full overflow-hidden mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gold rounded-full"
          />
        </div>
        <p className="text-text-secondary text-xs text-right">{completed}/{total} modules completed</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 mb-5">
        {DAY_SHORT.map((label, i) => {
          const day = i + 1;
          const isActive = day === selectedDay;
          const isComplete = dayCompletion.get(day);
          const hasMods = week.days.some((m) => m.dayOfWeek === day);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="flex-1 flex flex-col items-center py-2.5 rounded-xl gap-1 transition-colors"
              style={{
                backgroundColor: isActive ? Colors.gold : Colors.card,
                borderWidth: isComplete && !isActive ? 1 : 0,
                borderColor: Colors.win,
                borderStyle: 'solid',
                opacity: hasMods ? 1 : 0.5,
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: isActive ? Colors.background : Colors.textSecondary }}
              >
                {label}
              </span>
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: isActive ? Colors.background : isComplete ? Colors.win : Colors.textTertiary }}
              />
            </button>
          );
        })}
      </div>

      {/* Day title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-base font-bold">{DAY_LABELS[selectedDay - 1]}</h3>
        {dayModules.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-text-tertiary" />
            <span className="text-text-tertiary text-xs">~{estimatedMinutes} min</span>
          </div>
        )}
      </div>

      {/* Modules */}
      {dayModules.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-text-tertiary text-sm">Rest day or no modules</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dayModules.map((mod) => {
            const cat = categoryColors[mod.category] || categoryColors.review;
            const isExpanded = expandedModule === mod.id;
            const srcInfo = sourceLabels[mod.source];

            return (
              <div
                key={mod.id}
                className="rounded-2xl border transition-all"
                style={{
                  backgroundColor: Colors.card,
                  borderColor: mod.completed ? Colors.win : Colors.border,
                  opacity: mod.completed ? 0.7 : 1,
                }}
              >
                <button
                  onClick={() => toggleModule(weekNum, mod.id)}
                  className="w-full flex gap-3 p-3.5 text-left"
                >
                  <div className="pt-0.5">
                    {mod.completed ? <CheckSquare size={20} className="text-win" /> : <Square size={20} className="text-text-tertiary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border"
                        style={{ backgroundColor: cat.bg, color: cat.text, borderColor: cat.border }}
                      >
                        {mod.category}
                      </span>
                      {mod.estimatedMinutes && (
                        <span className="text-text-tertiary text-[10px]">{mod.estimatedMinutes} min</span>
                      )}
                      {srcInfo && srcInfo.label !== 'Best practice' && (
                        <span className="text-[10px]" style={{ color: srcInfo.color }}>{srcInfo.label}</span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${mod.completed ? 'line-through text-text-secondary' : 'text-white'}`}>
                      {mod.title}
                    </p>
                    <p className="text-text-secondary text-xs">{mod.description}</p>
                  </div>
                </button>

                <div className="px-3.5 pb-3 flex items-center gap-2">
                  {mod.rationale && (
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                      className="flex items-center gap-1 text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      <Info size={12} />
                      <span className="text-[10px]">Why this?</span>
                    </button>
                  )}
                  {mod.lichessUrl && (
                    <a
                      href={mod.lichessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      <span className="text-[10px] font-medium">Open on Lichess</span>
                    </a>
                  )}
                </div>

                {isExpanded && mod.rationale && (
                  <div className="px-3.5 pb-3">
                    <p className="text-text-tertiary text-xs italic leading-relaxed">{mod.rationale}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
