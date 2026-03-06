'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, CheckSquare, Square, ExternalLink, Clock, Info,
  ChevronRight, Target, Brain, Zap, BookOpen, Shield, Trophy, Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { NumberTicker } from '@/components/ui/number-ticker';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import ProgressHeader from '@/components/ProgressHeader';
import { defaultGamificationState, getPhaseForWeek, PHASE_DESCRIPTIONS, BADGE_CATALOG } from '@/lib/gamification';
import type { WeekPlan, DayModule, PlayerArchetype, PhaseName } from '@/lib/types';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const archetypeIcons: Record<PlayerArchetype, typeof Brain> = {
  tactician: Zap,
  positionalGrinder: Shield,
  aggressiveAttacker: Target,
  endgameSpecialist: Trophy,
  chaoticBlitzer: Zap,
  allRounder: Brain,
};

const severityColors: Record<string, string> = {
  critical: Colors.loss,
  moderate: Colors.gold,
  minor: Colors.textSecondary,
};

const phaseIcons: Record<number, typeof Shield> = {
  1: Shield,
  2: Target,
  3: Trophy,
};

export default function TrainingPage() {
  const { trainingPlan, generatePlanMutation, toggleModule, analysisReport } = useChess();
  const router = useRouter();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // No plan — show generation CTA
  if (!trainingPlan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <GraduationCap size={56} className="text-text-tertiary mb-4 mx-auto" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-xl font-bold mb-2"
        >
          8-Week Training Plan
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-text-secondary text-sm mb-6 max-w-md"
        >
          {analysisReport
            ? 'Generate a personalized 8-week training plan based on your game analysis, playing style, and weaknesses.'
            : 'Run an analysis first, then generate a personalized 8-week training plan tailored to your level.'}
        </motion.p>
        {generatePlanMutation.isError && (
          <p className="text-loss text-sm mb-4">{generatePlanMutation.error?.message || 'Failed to generate plan'}</p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ShimmerButton
            onClick={() => generatePlanMutation.mutate()}
            disabled={generatePlanMutation.isPending}
            shimmerColor="#10B981"
            background="rgba(30, 42, 58, 0.95)"
            shimmerDuration="2.5s"
            className="py-3.5 px-7 text-base font-bold disabled:opacity-60"
          >
            {generatePlanMutation.isPending ? (
              <span className="flex items-center gap-2 text-gold">
                <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Analyzing & Building Plan...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gold">
                <GraduationCap size={18} />
                Generate 8-Week Plan
              </span>
            )}
          </ShimmerButton>
        </motion.div>
      </div>
    );
  }

  const { diagnosis, diagnostic, weeks, currentWeek, gamification } = trainingPlan;
  const gam = gamification || defaultGamificationState();
  const ArchetypeIcon = archetypeIcons[diagnosis.archetype] || Brain;

  // Group weeks by phase
  const phases = useMemo(() => {
    const grouped: { phase: number; phaseName: PhaseName; weeks: WeekPlan[] }[] = [];
    for (const week of weeks) {
      const { phase, phaseName } = week.phase && week.phaseName
        ? { phase: week.phase, phaseName: week.phaseName }
        : getPhaseForWeek(week.weekNumber);
      const existing = grouped.find((g) => g.phase === phase);
      if (existing) {
        existing.weeks.push(week);
      } else {
        grouped.push({ phase, phaseName, weeks: [week] });
      }
    }
    return grouped;
  }, [weeks]);

  return (
    <div className="px-5 pt-4 pb-8">
      {/* Welcome Overlay */}
      <WelcomeOverlay />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-1"
      >
        <h1 className="text-2xl font-extrabold text-white">Training</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/training/chess-os')}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors hover:opacity-80"
          style={{ backgroundColor: Colors.cardLight, color: Colors.gold }}
        >
          <BookOpen size={12} className="inline mr-1" />
          Chess OS
        </motion.button>
      </motion.div>
      <p className="text-text-secondary text-sm mb-4">8-Week Improvement Program</p>

      {/* Progress Header (XP, Level, Streak, Badges) */}
      <ProgressHeader gamification={gam} />

      {/* Badge Showcase */}
      {gam.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: Colors.textTertiary }}>
            Earned Badges
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {gam.badges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl"
                style={{ backgroundColor: Colors.surface, minWidth: 64 }}
                title={badge.description}
              >
                <Award size={16} style={{ color: Colors.gold }} />
                <span className="text-[8px] font-medium text-center leading-tight" style={{ color: Colors.textSecondary }}>
                  {badge.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Diagnostic Summary — Neon Card */}
      <motion.div variants={fadeUp}>
        <NeonGradientCard className="mb-4" borderSize={1} neonColors={{ firstColor: '#10B981', secondColor: '#059669' }}>
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10"
            >
              <ArchetypeIcon size={20} className="text-gold" />
            </motion.div>
            <div className="flex-1">
              <p className="text-white text-sm font-bold capitalize">{diagnosis.archetype.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-text-tertiary text-xs">{diagnostic.currentRating} rating · {diagnostic.gamesAnalyzed} games analyzed</p>
            </div>
          </div>
          <p className="text-text-secondary text-xs leading-relaxed mb-3">{diagnosis.archetypeDescription}</p>

          {diagnosis.weaknesses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {diagnosis.weaknesses.slice(0, 4).map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                  style={{
                    color: severityColors[w.severity],
                    borderColor: severityColors[w.severity],
                    backgroundColor: `${severityColors[w.severity]}15`,
                  }}
                >
                  {w.area}: {w.severity}
                </motion.span>
              ))}
            </div>
          )}
        </NeonGradientCard>
      </motion.div>

      {/* Phases with Week Cards */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">
        {phases.map((phaseGroup) => {
          const PhaseIcon = phaseIcons[phaseGroup.phase] || Shield;
          const phaseComplete = phaseGroup.weeks.every((w) => w.completed);
          return (
            <motion.div key={phaseGroup.phase} variants={fadeUp}>
              {/* Phase Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: phaseComplete ? `${Colors.win}20` : `${Colors.gold}15`,
                  }}
                >
                  <PhaseIcon size={14} style={{ color: phaseComplete ? Colors.win : Colors.gold }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: Colors.textSecondary }}>
                      Phase {phaseGroup.phase}: {phaseGroup.phaseName}
                    </span>
                    {phaseComplete && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${Colors.win}20`, color: Colors.win }}>
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-[10px]" style={{ color: Colors.textTertiary }}>
                    {PHASE_DESCRIPTIONS[phaseGroup.phase]}
                  </p>
                </div>
              </div>

              {/* Week Cards */}
              <div className="space-y-2">
                {phaseGroup.weeks.map((week) => (
                  <WeekCard
                    key={week.weekNumber}
                    week={week}
                    isCurrent={week.weekNumber === currentWeek}
                    onOpenWeek={() => router.push(`/training/week/${week.weekNumber}`)}
                    onToggleModule={(id) => toggleModule(week.weekNumber, id)}
                    expandedModule={expandedModule}
                    setExpandedModule={setExpandedModule}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Regenerate */}
      <div className="mt-6 text-center">
        <button
          onClick={() => generatePlanMutation.mutate()}
          disabled={generatePlanMutation.isPending}
          className="text-text-tertiary text-xs hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          {generatePlanMutation.isPending ? 'Regenerating...' : 'Regenerate Plan'}
          {trainingPlan.regenerationCount > 0 && ` (${trainingPlan.regenerationCount}x regenerated)`}
        </button>
      </div>
    </div>
  );
}

// --- Week Card ---

function WeekCard({
  week,
  isCurrent,
  onOpenWeek,
  onToggleModule,
  expandedModule,
  setExpandedModule,
}: {
  week: WeekPlan;
  isCurrent: boolean;
  onOpenWeek: () => void;
  onToggleModule: (id: string) => void;
  expandedModule: string | null;
  setExpandedModule: (id: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const completed = week.days.filter((d) => d.completed).length;
  const total = week.days.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dayGroups = useMemo(() => {
    const groups = new Map<number, DayModule[]>();
    for (const d of week.days) {
      const existing = groups.get(d.dayOfWeek) || [];
      existing.push(d);
      groups.set(d.dayOfWeek, existing);
    }
    return groups;
  }, [week.days]);

  return (
    <div
      className="rounded-2xl border transition-all overflow-hidden backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(30, 42, 58, 0.8)',
        borderColor: isCurrent ? Colors.gold : week.completed ? Colors.win : 'rgba(255,255,255,0.05)',
        borderWidth: isCurrent ? 2 : 1,
        boxShadow: isCurrent ? '0 0 20px rgba(16,185,129,0.1)' : undefined,
      }}
    >
      {/* Week header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: week.completed ? Colors.win : isCurrent ? Colors.gold : Colors.surface,
            color: week.completed || isCurrent ? Colors.background : Colors.textSecondary,
          }}
        >
          {week.completed ? '\u2713' : week.weekNumber}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-bold">Week {week.weekNumber}: {week.theme}</span>
            {isCurrent && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: Colors.gold, color: Colors.background }}
              >
                Current
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-text-tertiary text-xs">{week.focus}</span>
            <span className="text-text-tertiary text-xs">&middot;</span>
            <span className="text-text-tertiary text-xs">{completed}/{total} done</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <svg width={28} height={28} className="shrink-0">
            <circle cx={14} cy={14} r={11} fill="none" stroke={Colors.surface} strokeWidth={3} />
            <motion.circle
              cx={14} cy={14} r={11} fill="none"
              stroke={week.completed ? Colors.win : Colors.gold}
              strokeWidth={3}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
              initial={{ strokeDasharray: '0 69.1' }}
              animate={{ strokeDasharray: `${(pct / 100) * 69.1} 69.1` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} className="text-text-tertiary" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5">
              <p className="text-text-secondary text-xs mb-2">{week.description}</p>

              {/* Week Goal */}
              {week.weekGoal && (
                <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl" style={{ backgroundColor: `${Colors.gold}08` }}>
                  <Target size={13} style={{ color: Colors.gold }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: Colors.gold }}>
                      Week Goal
                    </p>
                    <p className="text-[11px]" style={{ color: Colors.textSecondary }}>{week.weekGoal}</p>
                  </div>
                </div>
              )}

              {/* Milestone */}
              {week.milestone && (
                <div className="flex items-center gap-2 mb-3">
                  <Award size={12} style={{ color: week.completed ? Colors.gold : Colors.textTertiary }} />
                  <span className="text-[10px] font-medium" style={{ color: week.completed ? Colors.gold : Colors.textTertiary }}>
                    {week.completed ? `Unlocked: ${week.milestone.name}` : `Unlock: ${week.milestone.name}`}
                  </span>
                </div>
              )}

              {/* Day grid */}
              <div className="flex gap-1 mb-3">
                {DAY_LABELS.map((label, i) => {
                  const dayNum = i + 1;
                  const modules = dayGroups.get(dayNum) || [];
                  const dayDone = modules.length > 0 && modules.every((m) => m.completed);
                  const hasModules = modules.length > 0;
                  return (
                    <motion.div
                      key={dayNum}
                      whileHover={hasModules ? { scale: 1.05 } : undefined}
                      className="flex-1 flex flex-col items-center py-1.5 rounded-lg"
                      style={{
                        backgroundColor: dayDone ? 'rgba(76,175,80,0.15)' : hasModules ? Colors.surface : 'transparent',
                        borderWidth: hasModules ? 1 : 0,
                        borderColor: dayDone ? Colors.win : Colors.border,
                        borderStyle: 'solid',
                      }}
                    >
                      <span className="text-[10px] font-medium" style={{ color: dayDone ? Colors.win : Colors.textTertiary }}>
                        {label}
                      </span>
                      <span className="text-[9px]" style={{ color: Colors.textTertiary }}>
                        {hasModules ? modules.length : '\u2014'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Module list for current week */}
              {isCurrent && (
                <div className="space-y-1.5">
                  {week.days.map((mod, i) => (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ModuleRow
                        mod={mod}
                        onToggle={() => onToggleModule(mod.id)}
                        isExpanded={expandedModule === mod.id}
                        onExpandToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Open week detail */}
              {!isCurrent && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenWeek}
                  className="w-full py-2 text-xs font-semibold rounded-xl transition-colors hover:opacity-80"
                  style={{ backgroundColor: Colors.surface, color: Colors.textSecondary }}
                >
                  View Week Details &rarr;
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Module Row ---

function ModuleRow({
  mod,
  onToggle,
  isExpanded,
  onExpandToggle,
}: {
  mod: DayModule;
  onToggle: () => void;
  isExpanded: boolean;
  onExpandToggle: () => void;
}) {
  const cat = categoryColors[mod.category] || categoryColors.review;
  const srcInfo = sourceLabels[mod.source];

  return (
    <motion.div
      layout
      className="rounded-xl border transition-all"
      style={{
        backgroundColor: Colors.surface,
        borderColor: mod.completed ? Colors.win : Colors.border,
        opacity: mod.completed ? 0.7 : 1,
      }}
    >
      <button onClick={onToggle} className="w-full flex gap-2.5 p-3 text-left">
        <div className="pt-0.5">
          <motion.div
            whileTap={{ scale: 0.8 }}
            animate={mod.completed ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {mod.completed ? (
              <CheckSquare size={18} className="text-win" />
            ) : (
              <Square size={18} className="text-text-tertiary" />
            )}
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md border"
              style={{ backgroundColor: cat.bg, color: cat.text, borderColor: cat.border }}
            >
              {mod.category}
            </span>
            <span className="text-text-tertiary text-[9px]">{DAY_LABELS[mod.dayOfWeek - 1]}</span>
            {mod.estimatedMinutes && (
              <span className="text-text-tertiary text-[9px] flex items-center gap-0.5">
                <Clock size={8} />{mod.estimatedMinutes}m
              </span>
            )}
            {srcInfo && srcInfo.label !== 'Best practice' && (
              <span className="text-[9px]" style={{ color: srcInfo.color }}>{srcInfo.label}</span>
            )}
          </div>
          <p className={`text-xs font-semibold ${mod.completed ? 'line-through text-text-secondary' : 'text-white'}`}>
            {mod.title}
          </p>
          <p className="text-text-tertiary text-[11px] mt-0.5 line-clamp-2">{mod.description}</p>
        </div>
      </button>

      <div className="px-3 pb-2 flex items-center gap-2">
        {mod.rationale && (
          <button onClick={onExpandToggle} className="flex items-center gap-1 text-text-tertiary hover:text-text-secondary transition-colors">
            <Info size={10} />
            <span className="text-[9px]">Why?</span>
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
            <ExternalLink size={10} />
            <span className="text-[9px] font-medium">Lichess</span>
          </a>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && mod.rationale && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2">
              <p className="text-text-tertiary text-[10px] italic leading-relaxed">{mod.rationale}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
