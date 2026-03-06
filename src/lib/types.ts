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
}

export interface TrainingTask {
  id: string;
  title: string;
  description: string;
  category: 'tactics' | 'openings' | 'endgames' | 'strategy' | 'review';
  day: number;
  completed: boolean;
}
