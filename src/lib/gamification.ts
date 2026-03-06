import type { ChessLevel, GamificationState, StreakState, PhaseName } from './types';

// --- Level System ---

export const LEVEL_THRESHOLDS: Record<ChessLevel, number> = {
  pawn: 0,
  knight: 200,
  bishop: 500,
  rook: 1000,
  queen: 1800,
  king: 3000,
};

export const LEVEL_ORDER: ChessLevel[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export const LEVEL_INFO: Record<ChessLevel, { label: string; icon: string; color: string }> = {
  pawn: { label: 'Pawn', icon: '♟', color: '#78909C' },
  knight: { label: 'Knight', icon: '♞', color: '#8B9CB5' },
  bishop: { label: 'Bishop', icon: '♝', color: '#10B981' },
  rook: { label: 'Rook', icon: '♜', color: '#3B82F6' },
  queen: { label: 'Queen', icon: '♛', color: '#A855F7' },
  king: { label: 'King', icon: '♚', color: '#F59E0B' },
};

export function computeLevel(xp: number): ChessLevel {
  let level: ChessLevel = 'pawn';
  for (const l of LEVEL_ORDER) {
    if (xp >= LEVEL_THRESHOLDS[l]) level = l;
    else break;
  }
  return level;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevel = computeLevel(xp);
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);
  if (currentIdx === LEVEL_ORDER.length - 1) {
    return { current: xp - LEVEL_THRESHOLDS[currentLevel], needed: 0, progress: 100 };
  }
  const nextLevel = LEVEL_ORDER[currentIdx + 1];
  const base = LEVEL_THRESHOLDS[currentLevel];
  const target = LEVEL_THRESHOLDS[nextLevel];
  const current = xp - base;
  const needed = target - base;
  return { current, needed, progress: Math.round((current / needed) * 100) };
}

// --- Streak ---

export function updateStreak(streak: StreakState, today: string): StreakState {
  if (streak.lastActivityDate === today) return streak;

  const last = new Date(streak.lastActivityDate);
  const now = new Date(today);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const newCurrent = streak.current + 1;
    return {
      current: newCurrent,
      best: Math.max(streak.best, newCurrent),
      lastActivityDate: today,
    };
  }

  // Streak broken (or first activity)
  return {
    current: 1,
    best: Math.max(streak.best, 1),
    lastActivityDate: today,
  };
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// --- Phase Mapping ---

export function getPhaseForWeek(weekNumber: number): { phase: number; phaseName: PhaseName } {
  if (weekNumber <= 3) return { phase: 1, phaseName: 'Foundation' };
  if (weekNumber <= 6) return { phase: 2, phaseName: 'Development' };
  return { phase: 3, phaseName: 'Mastery' };
}

export const PHASE_DESCRIPTIONS: Record<number, string> = {
  1: 'Build your tactical foundation, establish daily habits, and strengthen fundamentals.',
  2: 'Deepen strategic understanding, refine your openings, and develop positional sense.',
  3: 'Target weaknesses, integrate all skills, and reach peak performance.',
};

// --- Badges ---

export const BADGE_CATALOG: Record<string, { name: string; description: string; icon: string }> = {
  'first-module': { name: 'First Step', description: 'Complete your first training module', icon: 'Footprints' },
  'week-1-complete': { name: 'Foundation Builder', description: 'Complete Week 1: Foundation', icon: 'Hammer' },
  'week-2-complete': { name: 'Opening Scholar', description: 'Complete Week 2: Opening Mastery', icon: 'BookOpen' },
  'week-3-complete': { name: 'Tactical Eye', description: 'Complete Week 3: Tactical Sharpness', icon: 'Eye' },
  'week-4-complete': { name: 'Strategist', description: 'Complete Week 4: Strategic Play', icon: 'Map' },
  'week-5-complete': { name: 'Endgame Artist', description: 'Complete Week 5: Endgame Technique', icon: 'Crown' },
  'week-6-complete': { name: 'Battle Tested', description: 'Complete Week 6: Integration Week', icon: 'Swords' },
  'week-7-complete': { name: 'Weakness Crusher', description: 'Complete Week 7: Weakness Targeting', icon: 'Target' },
  'week-8-complete': { name: 'Peak Performer', description: 'Complete Week 8: Peak Performance', icon: 'Trophy' },
  'phase-1-complete': { name: 'Foundation Complete', description: 'Complete Phase 1: Foundation (Weeks 1-3)', icon: 'Shield' },
  'phase-2-complete': { name: 'Development Complete', description: 'Complete Phase 2: Development (Weeks 4-6)', icon: 'Rocket' },
  'phase-3-complete': { name: 'Mastery Achieved', description: 'Complete Phase 3: Mastery (Weeks 7-8)', icon: 'Star' },
  'streak-3': { name: 'Warming Up', description: 'Maintain a 3-day training streak', icon: 'Flame' },
  'streak-7': { name: 'On Fire', description: 'Maintain a 7-day training streak', icon: 'Flame' },
  'streak-14': { name: 'Unstoppable', description: 'Maintain a 14-day training streak', icon: 'Flame' },
  'plan-complete': { name: 'Grandmaster Journey', description: 'Complete the entire 8-week training program', icon: 'GraduationCap' },
};

export const TOTAL_BADGES = Object.keys(BADGE_CATALOG).length;

// --- Default State ---

export function defaultGamificationState(): GamificationState {
  return {
    xp: 0,
    level: 'pawn',
    streak: { current: 0, best: 0, lastActivityDate: '' },
    badges: [],
    weekMilestones: {},
    phaseCompletions: {},
  };
}
