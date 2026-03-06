export type Platform = 'chess.com' | 'lichess';
export type GameResult = 'win' | 'loss' | 'draw';
export type TimeClass = 'rapid' | 'blitz' | 'bullet' | 'daily';

export interface ChessProfile {
  username: string;
  avatar: string;
  url: string;
  joined: number;
}

export interface ChessStats {
  chess_rapid?: RatingCategory;
  chess_blitz?: RatingCategory;
  chess_bullet?: RatingCategory;
}

export interface RatingCategory {
  last: { rating: number; date: number };
  best?: { rating: number; date: number };
  record: { win: number; loss: number; draw: number };
}

export interface ChessGame {
  id: string;
  white: GamePlayer;
  black: GamePlayer;
  pgn: string;
  timeControl: string;
  timeClass: TimeClass;
  endTime: number;
  url: string;
  opening: string;
  result: GameResult;
  userColor: 'white' | 'black';
  accuracy?: number;
  opponentAccuracy?: number;
  moves: string[];
  moveCount: number;
}

export interface GamePlayer {
  username: string;
  rating: number;
  result: string;
}

export interface AnalysisReport {
  playingStyle: string;
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  openingAnalysis: OpeningAnalysisItem[];
  tacticalGaps: string[];
  endgameScore: number;
  developmentRating: number;
  generatedAt: number;
  // computed metadata
  gamesAnalyzed: number;
  colorStats: { whiteWinRate: number; blackWinRate: number; whiteGames: number; blackGames: number };
  accuracyStats?: { average: number; inWins: number; inLosses: number; trend: 'improving' | 'declining' | 'stable' };
  sixAxisScores: SixAxisScores;
  ratingBracket: RatingBracket;
  ratingTip: string;
  timeClassStats: { timeClass: TimeClass; games: number; winRate: number }[];
  engineEnhanced: boolean;
  // engine-enhanced fields (Phase 5)
  blunders?: number;
  mistakes?: number;
  inaccuracies?: number;
  criticalMoments?: CriticalMoment[];
  missedTactics?: { theme: string; count: number }[];
}

export interface SixAxisScores {
  openings: number;
  tactics: number;
  endings: number;
  advantageCapitalization: number;
  resourcefulness: number;
  timeManagement: number;
}

export type RatingBracket = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CriticalMoment {
  gameId: string;
  moveNumber: number;
  evalBefore: number;
  evalAfter: number;
  classification: 'blunder' | 'mistake';
  fen: string;
}

export interface AnalysisPoint {
  title: string;
  description: string;
}

export interface OpeningAnalysisItem {
  name: string;
  games: number;
  winRate: number;
  recommendation: 'keep' | 'improve' | 'drop';
  masterWinRate?: number;
  masterGames?: number;
}

export interface TrainingTask {
  id: string;
  title: string;
  description: string;
  category: 'tactics' | 'openings' | 'endgames' | 'strategy' | 'review';
  day: number;
  completed: boolean;
  lichessUrl?: string;
  puzzleTheme?: string;
  estimatedMinutes?: number;
  source?: 'weakness' | 'general' | 'own-game';
  rationale?: string;
}

// --- 8-Week Training Plan Types ---

export type PlayerArchetype =
  | 'tactician'
  | 'positionalGrinder'
  | 'aggressiveAttacker'
  | 'endgameSpecialist'
  | 'chaoticBlitzer'
  | 'allRounder';

export interface AdaptiveFlags {
  doubleUpTactics: boolean;
  prioritizeEndgames: boolean;
  addTiltManagement: boolean;
  focusTimeManagement: boolean;
  heavyOpeningWork: boolean;
  needsCalculationDrills: boolean;
}

export interface WeaknessItem {
  area: string;
  severity: 'critical' | 'moderate' | 'minor';
  detail: string;
  metric?: number;
}

export interface StrengthItem {
  area: string;
  detail: string;
  metric?: number;
}

export interface PlayerDiagnostic {
  username: string;
  platform: Platform;
  generatedAt: number;
  gamesAnalyzed: number;
  // Ratings
  currentRating: number;
  peakRating: number;
  ratingBracket: RatingBracket;
  primaryTimeControl: TimeClass;
  // Win/loss/draw
  overall: { wins: number; losses: number; draws: number; winRate: number };
  byColor: {
    white: { wins: number; losses: number; draws: number; winRate: number; games: number };
    black: { wins: number; losses: number; draws: number; winRate: number; games: number };
  };
  // Openings
  openingsByColor: {
    white: OpeningRecord[];
    black: OpeningRecord[];
  };
  // Accuracy
  accuracy: {
    overall: number;
    inWins: number;
    inLosses: number;
    trend: 'improving' | 'declining' | 'stable';
    last10: number[];
  };
  // Game length patterns
  gameLength: {
    average: number;
    shortLossRate: number;
    longGameWinRate: number;
    longGames: number;
  };
  // Termination patterns
  terminationProfile: {
    resignRate: number;
    checkmateRate: number;
    timeoutRate: number;
    drawRate: number;
  };
  // Time management
  timeManagement: {
    timeoutLossRate: number;
    avgMovesInTimeouts: number;
  };
  // Endgame conversion
  endgameConversion: {
    longGameWinRate: number;
    longGameCount: number;
  };
  // Tilt detection
  tiltIndicators: {
    losingStreakMax: number;
    winRateAfterLoss: number;
    accuracyDropAfterLoss: number;
  };
  // Opponent rating performance
  opponentAnalysis: {
    vsHigherWinRate: number;
    vsLowerWinRate: number;
    vsHigherGames: number;
    vsLowerGames: number;
  };
  // Six-axis scores (reuse from analysis)
  sixAxisScores: SixAxisScores;
}

export interface OpeningRecord {
  name: string;
  games: number;
  winRate: number;
  avgAccuracy: number;
  moves: string[][];
}

export interface Diagnostic {
  weaknesses: WeaknessItem[];
  strengths: StrengthItem[];
  archetype: PlayerArchetype;
  archetypeDescription: string;
  adaptiveFlags: AdaptiveFlags;
  priorityOrder: string[];
}

export interface DayModule {
  id: string;
  dayOfWeek: number; // 1-7 (Mon-Sun)
  title: string;
  description: string;
  category: 'tactics' | 'openings' | 'endgames' | 'strategy' | 'review' | 'play';
  estimatedMinutes: number;
  completed: boolean;
  lichessUrl?: string;
  puzzleTheme?: string;
  source: 'weakness' | 'general' | 'own-game' | 'archetype';
  rationale?: string;
}

export interface WeekPlan {
  weekNumber: number; // 1-8
  theme: string;
  focus: string;
  description: string;
  days: DayModule[];
  completed: boolean;
}

export interface ChessOSDocument {
  openingRepertoire: {
    asWhite: { name: string; studyUrl: string; notes: string }[];
    asBlack: { name: string; studyUrl: string; notes: string }[];
  };
  endgameReference: { topic: string; studyUrl: string; priority: 'high' | 'medium' | 'low' }[];
  preMoveRitual: string[];
  tiltProtocol: string[];
}

export interface RatingLogEntry {
  date: number;
  rating: number;
  note?: string;
}

export interface TrainingPlan {
  id: string;
  generatedAt: number;
  diagnostic: PlayerDiagnostic;
  diagnosis: Diagnostic;
  weeks: WeekPlan[];
  chessOS: ChessOSDocument;
  ratingLog: RatingLogEntry[];
  currentWeek: number;
  regenerationCount: number;
}
