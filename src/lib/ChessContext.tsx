'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChessGame,
  ChessProfile,
  ChessStats,
  Platform,
  AnalysisReport,
  TrainingTask,
  TrainingPlan,
  GamificationState,
} from './types';
import { computeStatsAnalysis } from './analysisEngine';
import {
  defaultGamificationState,
  computeLevel,
  updateStreak,
  getTodayString,
  getPhaseForWeek,
  BADGE_CATALOG,
} from './gamification';

interface StoredUser {
  username: string;
  platform: Platform;
}

interface EngineProgress {
  currentGame: number;
  totalGames: number;
  currentMove: number;
  totalMoves: number;
  gameName: string;
}

interface ChessContextValue {
  username: string | null;
  platform: Platform;
  isReady: boolean;
  isOnboarded: boolean;
  connectMutation: ReturnType<typeof useMutation<{ name: string; plat: Platform }, Error, { name: string; plat: Platform }>>;
  disconnect: () => Promise<void>;
  analysisReport: AnalysisReport | null;
  runAnalysisMutation: ReturnType<typeof useMutation<AnalysisReport, Error, void>>;
  runEngineAnalysis: () => void;
  engineProgress: EngineProgress | null;
  isEngineRunning: boolean;
  // Legacy 7-day (kept for backward compat, unused by new UI)
  trainingTasks: TrainingTask[];
  initTrainingMutation: ReturnType<typeof useMutation<TrainingTask[], Error, void>>;
  toggleTask: (taskId: string) => void;
  // 8-week plan
  trainingPlan: TrainingPlan | null;
  generatePlanMutation: ReturnType<typeof useMutation<TrainingPlan, Error, void>>;
  toggleModule: (weekNum: number, moduleId: string) => void;
  setCurrentWeek: (week: number) => void;
  clearTrainingPlan: () => void;
  // Gamification
  dismissWelcome: () => void;
}

const ChessContext = createContext<ChessContextValue | null>(null);

export function ChessProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [isReady, setIsReady] = useState(false);
  const [trainingTasks, setTrainingTasks] = useState<TrainingTask[]>([]);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [engineProgress, setEngineProgress] = useState<EngineProgress | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('chessmind_user');
      if (stored) {
        const data: StoredUser = JSON.parse(stored);
        setUsername(data.username);
        setPlatform(data.platform);
      }
      const storedTasks = localStorage.getItem('chessmind_training');
      if (storedTasks) setTrainingTasks(JSON.parse(storedTasks));
      const storedAnalysis = localStorage.getItem('chessmind_analysis');
      if (storedAnalysis) setAnalysisReport(JSON.parse(storedAnalysis));
      const storedPlan = localStorage.getItem('chessmind_plan');
      if (storedPlan) {
        const plan = JSON.parse(storedPlan) as TrainingPlan;
        // Migrate: add gamification defaults for existing plans
        if (!plan.gamification) {
          plan.gamification = defaultGamificationState();
          let xp = 0;
          for (const week of plan.weeks) {
            for (const day of week.days) {
              if (day.completed) xp += day.estimatedMinutes || 15;
            }
            if (!week.phase) {
              const { phase, phaseName } = getPhaseForWeek(week.weekNumber);
              week.phase = phase;
              week.phaseName = phaseName;
            }
          }
          plan.gamification.xp = xp;
          plan.gamification.level = computeLevel(xp);
        }
        if (plan.welcomeDismissed === undefined) {
          plan.welcomeDismissed = true; // existing users skip welcome
        }
        setTrainingPlan(plan);
        localStorage.setItem('chessmind_plan', JSON.stringify(plan));
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsReady(true);
    }
  }, []);

  const connectMutation = useMutation({
    mutationFn: async ({ name, plat }: { name: string; plat: Platform }) => {
      const res = await fetch(`/api/chess/profile?username=${encodeURIComponent(name)}&platform=${encodeURIComponent(plat)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Connection failed' }));
        throw new Error(err.error || 'Player not found');
      }
      return { name, plat };
    },
    onSuccess: ({ name, plat }) => {
      setUsername(name);
      setPlatform(plat);
      localStorage.setItem('chessmind_user', JSON.stringify({ username: name, platform: plat }));
      queryClient.invalidateQueries({ queryKey: ['chess'] });
    },
  });

  const disconnect = useCallback(async () => {
    setUsername(null);
    setAnalysisReport(null);
    setTrainingTasks([]);
    setTrainingPlan(null);
    localStorage.removeItem('chessmind_user');
    localStorage.removeItem('chessmind_training');
    localStorage.removeItem('chessmind_analysis');
    localStorage.removeItem('chessmind_plan');
    queryClient.clear();
  }, [queryClient]);

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch games for analysis');
      const games: ChessGame[] = await res.json();
      if (games.length === 0) throw new Error('No games found to analyze');

      let bestRating: number | undefined;
      try {
        const statsRes = await fetch(`/api/chess/stats?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          const ratings = [
            stats.chess_rapid?.best?.rating || stats.chess_rapid?.last?.rating || 0,
            stats.chess_blitz?.best?.rating || stats.chess_blitz?.last?.rating || 0,
            stats.chess_bullet?.best?.rating || stats.chess_bullet?.last?.rating || 0,
          ];
          bestRating = Math.max(...ratings);
        }
      } catch { /* use estimated rating */ }

      return computeStatsAnalysis(games, username!, bestRating);
    },
    onSuccess: (report) => {
      setAnalysisReport(report);
      localStorage.setItem('chessmind_analysis', JSON.stringify(report));
    },
  });

  // Legacy 7-day training mutation (kept for backward compat)
  const initTrainingMutation = useMutation({
    mutationFn: async () => {
      let report = analysisReport;
      if (!report) {
        const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
        if (!res.ok) throw new Error('Failed to fetch games');
        const games: ChessGame[] = await res.json();
        report = computeStatsAnalysis(games, username!);
        setAnalysisReport(report);
        localStorage.setItem('chessmind_analysis', JSON.stringify(report));
      }
      // This import is kept for backward compat but the new UI uses generatePlanMutation
      const { generate8WeekPlan } = await import('./trainingPlanner');
      // Generate plan and extract flat tasks for legacy compat
      const { extractPlayerDiagnostic, generateDiagnostic } = await import('./diagnosticEngine');
      const gamesRes = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      const games: ChessGame[] = gamesRes.ok ? await gamesRes.json() : [];
      let stats: ChessStats | null = null;
      try {
        const statsRes = await fetch(`/api/chess/stats?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
        if (statsRes.ok) stats = await statsRes.json();
      } catch { /* no stats */ }
      const playerDiag = extractPlayerDiagnostic(games, stats, username!, platform);
      const diagnosis = generateDiagnostic(playerDiag);
      const plan = generate8WeekPlan(playerDiag, diagnosis);
      setTrainingPlan(plan);
      localStorage.setItem('chessmind_plan', JSON.stringify(plan));
      // Return flat tasks from week 1 for legacy compat
      return plan.weeks[0]?.days.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        category: d.category === 'play' ? 'strategy' as const : d.category,
        day: d.dayOfWeek,
        completed: d.completed,
        lichessUrl: d.lichessUrl,
        puzzleTheme: d.puzzleTheme,
        estimatedMinutes: d.estimatedMinutes,
        source: d.source === 'archetype' ? 'general' as const : d.source,
        rationale: d.rationale,
      })) || [];
    },
    onSuccess: (tasks) => {
      setTrainingTasks(tasks);
      localStorage.setItem('chessmind_training', JSON.stringify(tasks));
    },
  });

  // 8-week plan generation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      // Fetch games
      const gamesRes = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!gamesRes.ok) throw new Error('Failed to fetch games');
      const games: ChessGame[] = await gamesRes.json();
      if (games.length === 0) throw new Error('No games found — play some games first');

      // Fetch stats
      let stats: ChessStats | null = null;
      try {
        const statsRes = await fetch(`/api/chess/stats?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
        if (statsRes.ok) stats = await statsRes.json();
      } catch { /* proceed without stats */ }

      // Run analysis if not yet done
      if (!analysisReport) {
        const report = computeStatsAnalysis(games, username!);
        setAnalysisReport(report);
        localStorage.setItem('chessmind_analysis', JSON.stringify(report));
      }

      const { extractPlayerDiagnostic, generateDiagnostic } = await import('./diagnosticEngine');
      const { generate8WeekPlan } = await import('./trainingPlanner');

      const playerDiag = extractPlayerDiagnostic(games, stats, username!, platform);
      const diagnosis = generateDiagnostic(playerDiag);
      const plan = generate8WeekPlan(playerDiag, diagnosis);

      // Track regeneration
      const existing = trainingPlan;
      if (existing) {
        plan.regenerationCount = existing.regenerationCount + 1;
        // Preserve rating log
        plan.ratingLog = [...existing.ratingLog, { date: Date.now(), rating: playerDiag.currentRating, note: 'Plan regenerated' }];
      }

      return plan;
    },
    onSuccess: (plan) => {
      setTrainingPlan(plan);
      localStorage.setItem('chessmind_plan', JSON.stringify(plan));
    },
  });

  const runEngineAnalysis = useCallback(async () => {
    if (isEngineRunning || !username || !analysisReport) return;
    setIsEngineRunning(true);
    setEngineProgress(null);

    try {
      const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch games');
      const games: ChessGame[] = await res.json();

      const { selectGamesForAnalysis, analyzeGames } = await import('./gameAnalyzer');
      const selected = selectGamesForAnalysis(games);

      if (selected.length === 0) {
        setIsEngineRunning(false);
        return;
      }

      const result = await analyzeGames(selected, username, (progress) => {
        setEngineProgress(progress);
      });

      const enhanced: AnalysisReport = {
        ...analysisReport,
        engineEnhanced: true,
        blunders: result.blunders,
        mistakes: result.mistakes,
        inaccuracies: result.inaccuracies,
        criticalMoments: result.criticalMoments,
        missedTactics: result.missedTactics,
      };

      setAnalysisReport(enhanced);
      localStorage.setItem('chessmind_analysis', JSON.stringify(enhanced));
    } catch (err) {
      console.error('Engine analysis failed:', err);
    } finally {
      setIsEngineRunning(false);
      setEngineProgress(null);
    }
  }, [isEngineRunning, username, platform, analysisReport]);

  const toggleTask = useCallback(
    (taskId: string) => {
      const updated = trainingTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setTrainingTasks(updated);
      localStorage.setItem('chessmind_training', JSON.stringify(updated));
    },
    [trainingTasks]
  );

  const toggleModule = useCallback(
    (weekNum: number, moduleId: string) => {
      if (!trainingPlan) return;

      // Find the module being toggled
      const week = trainingPlan.weeks.find((w) => w.weekNumber === weekNum);
      const mod = week?.days.find((d) => d.id === moduleId);
      if (!mod) return;

      const wasCompleted = mod.completed;
      const xpDelta = mod.estimatedMinutes || 15;

      const updated: TrainingPlan = {
        ...trainingPlan,
        weeks: trainingPlan.weeks.map((w) => {
          if (w.weekNumber !== weekNum) return w;
          const days = w.days.map((d) =>
            d.id === moduleId ? { ...d, completed: !d.completed } : d
          );
          const allDone = days.every((d) => d.completed);
          return { ...w, days, completed: allDone };
        }),
      };

      // Update gamification
      const gam: GamificationState = { ...(updated.gamification || defaultGamificationState()) };
      gam.badges = [...gam.badges];
      gam.weekMilestones = { ...gam.weekMilestones };
      gam.phaseCompletions = { ...gam.phaseCompletions };

      if (!wasCompleted) {
        // Completing a module
        gam.xp += xpDelta;
        gam.level = computeLevel(gam.xp);
        gam.streak = updateStreak({ ...gam.streak }, getTodayString());

        // First module badge
        if (!gam.badges.some((b) => b.id === 'first-module')) {
          const def = BADGE_CATALOG['first-module'];
          gam.badges.push({ id: 'first-module', name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon });
        }

        // Streak badges
        for (const threshold of [3, 7, 14]) {
          const badgeId = `streak-${threshold}`;
          if (gam.streak.current >= threshold && !gam.badges.some((b) => b.id === badgeId)) {
            const def = BADGE_CATALOG[badgeId];
            if (def) gam.badges.push({ id: badgeId, name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon });
          }
        }

        // Check if week is now complete
        const updatedWeek = updated.weeks.find((w) => w.weekNumber === weekNum);
        if (updatedWeek?.completed && !gam.weekMilestones[weekNum]) {
          gam.weekMilestones[weekNum] = true;
          const weekBadgeId = `week-${weekNum}-complete`;
          const def = BADGE_CATALOG[weekBadgeId];
          if (def && !gam.badges.some((b) => b.id === weekBadgeId)) {
            gam.badges.push({ id: weekBadgeId, name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon });
          }

          // Check phase completion
          const { phase } = getPhaseForWeek(weekNum);
          const phaseWeeks = updated.weeks.filter((w) => (w.phase || getPhaseForWeek(w.weekNumber).phase) === phase);
          if (phaseWeeks.every((w) => w.completed) && !gam.phaseCompletions[phase]) {
            gam.phaseCompletions[phase] = true;
            const phaseBadgeId = `phase-${phase}-complete`;
            const pdef = BADGE_CATALOG[phaseBadgeId];
            if (pdef && !gam.badges.some((b) => b.id === phaseBadgeId)) {
              gam.badges.push({ id: phaseBadgeId, name: pdef.name, description: pdef.description, earnedAt: Date.now(), icon: pdef.icon });
            }
          }
        }

        // Check plan complete
        if (updated.weeks.every((w) => w.completed) && !gam.badges.some((b) => b.id === 'plan-complete')) {
          const def = BADGE_CATALOG['plan-complete'];
          if (def) gam.badges.push({ id: 'plan-complete', name: def.name, description: def.description, earnedAt: Date.now(), icon: def.icon });
        }
      } else {
        // Uncompleting a module
        gam.xp = Math.max(0, gam.xp - xpDelta);
        gam.level = computeLevel(gam.xp);
      }

      updated.gamification = gam;
      setTrainingPlan(updated);
      localStorage.setItem('chessmind_plan', JSON.stringify(updated));
    },
    [trainingPlan]
  );

  const setCurrentWeek = useCallback(
    (week: number) => {
      if (!trainingPlan) return;
      const updated = { ...trainingPlan, currentWeek: week };
      setTrainingPlan(updated);
      localStorage.setItem('chessmind_plan', JSON.stringify(updated));
    },
    [trainingPlan]
  );

  const clearTrainingPlan = useCallback(() => {
    setTrainingPlan(null);
    setTrainingTasks([]);
    localStorage.removeItem('chessmind_plan');
    localStorage.removeItem('chessmind_training');
  }, []);

  const dismissWelcome = useCallback(() => {
    if (!trainingPlan) return;
    const updated = { ...trainingPlan, welcomeDismissed: true };
    setTrainingPlan(updated);
    localStorage.setItem('chessmind_plan', JSON.stringify(updated));
  }, [trainingPlan]);

  return (
    <ChessContext.Provider
      value={{
        username,
        platform,
        isReady,
        isOnboarded: !!username,
        connectMutation,
        disconnect,
        analysisReport,
        runAnalysisMutation,
        runEngineAnalysis,
        engineProgress,
        isEngineRunning,
        trainingTasks,
        initTrainingMutation,
        toggleTask,
        trainingPlan,
        generatePlanMutation,
        toggleModule,
        setCurrentWeek,
        clearTrainingPlan,
        dismissWelcome,
      }}
    >
      {children}
    </ChessContext.Provider>
  );
}

export function useChess() {
  const ctx = useContext(ChessContext);
  if (!ctx) throw new Error('useChess must be used within ChessProvider');
  return ctx;
}

export function useProfile() {
  const { username, platform } = useChess();
  return useQuery<ChessProfile>({
    queryKey: ['chess', 'profile', username, platform],
    queryFn: async () => {
      const res = await fetch(`/api/chess/profile?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  const { username, platform } = useChess();
  return useQuery<ChessStats>({
    queryKey: ['chess', 'stats', username, platform],
    queryFn: async () => {
      const res = await fetch(`/api/chess/stats?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGames() {
  const { username, platform } = useChess();
  return useQuery<ChessGame[]>({
    queryKey: ['chess', 'games', username, platform],
    queryFn: async () => {
      const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}
