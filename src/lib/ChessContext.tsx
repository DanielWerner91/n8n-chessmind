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
} from './types';
import { computeStatsAnalysis } from './analysisEngine';

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
  trainingTasks: TrainingTask[];
  initTrainingMutation: ReturnType<typeof useMutation<TrainingTask[], Error, void>>;
  toggleTask: (taskId: string) => void;
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
    localStorage.removeItem('chessmind_user');
    localStorage.removeItem('chessmind_training');
    localStorage.removeItem('chessmind_analysis');
    queryClient.clear();
  }, [queryClient]);

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      // Fetch games to analyze
      const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
      if (!res.ok) throw new Error('Failed to fetch games for analysis');
      const games: ChessGame[] = await res.json();
      if (games.length === 0) throw new Error('No games found to analyze');

      // Fetch stats for best rating
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

  const initTrainingMutation = useMutation({
    mutationFn: async () => {
      // Require analysis first — if none exists, run it
      let report = analysisReport;
      if (!report) {
        const res = await fetch(`/api/chess/games?username=${encodeURIComponent(username!)}&platform=${encodeURIComponent(platform)}`);
        if (!res.ok) throw new Error('Failed to fetch games');
        const games: ChessGame[] = await res.json();
        report = computeStatsAnalysis(games, username!);
        setAnalysisReport(report);
        localStorage.setItem('chessmind_analysis', JSON.stringify(report));
      }
      // Training planner will be implemented in Phase 4 — for now generate placeholder tasks from analysis
      const { generateTrainingPlan } = await import('./trainingPlanner');
      return generateTrainingPlan(report);
    },
    onSuccess: (tasks) => {
      setTrainingTasks(tasks);
      localStorage.setItem('chessmind_training', JSON.stringify(tasks));
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

      // Merge engine results into the existing analysis report
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
