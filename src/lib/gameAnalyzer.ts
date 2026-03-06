import { Chess } from 'chess.js';
import { evaluateFen, terminate } from './stockfishClient';
import { ChessGame, CriticalMoment } from './types';

export interface GameAnalysisResult {
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  criticalMoments: CriticalMoment[];
  missedTactics: { theme: string; count: number }[];
}

export interface AnalysisProgress {
  currentGame: number;
  totalGames: number;
  currentMove: number;
  totalMoves: number;
  gameName: string;
}

/**
 * Select games to analyze — prioritize recent losses and low-accuracy games.
 * Cap at 8 games to keep analysis time reasonable (~2-4 min).
 */
export function selectGamesForAnalysis(games: ChessGame[]): ChessGame[] {
  const losses = games.filter((g) => g.result === 'loss').slice(0, 4);
  const wins = games.filter((g) => g.result === 'win').slice(0, 2);
  const lowAcc = games
    .filter((g) => g.accuracy !== undefined && g.accuracy < 75 && !losses.includes(g) && !wins.includes(g))
    .slice(0, 2);

  const selected = [...losses, ...wins, ...lowAcc];
  // Deduplicate
  const seen = new Set<string>();
  return selected.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  }).slice(0, 8);
}

/**
 * Analyze selected games with Stockfish, classifying each move.
 */
export async function analyzeGames(
  games: ChessGame[],
  username: string,
  onProgress?: (progress: AnalysisProgress) => void,
  depth = 14 // Lower depth for speed
): Promise<GameAnalysisResult> {
  let totalBlunders = 0;
  let totalMistakes = 0;
  let totalInaccuracies = 0;
  const criticalMoments: CriticalMoment[] = [];
  const tacticsMap = new Map<string, number>();

  for (let gi = 0; gi < games.length; gi++) {
    const game = games[gi];
    const chess = new Chess();
    const isWhite = game.white.username.toLowerCase() === username.toLowerCase();

    onProgress?.({
      currentGame: gi + 1,
      totalGames: games.length,
      currentMove: 0,
      totalMoves: game.moves.length,
      gameName: `vs ${isWhite ? game.black.username : game.white.username}`,
    });

    let prevEval = 0; // Starting position is roughly equal

    for (let mi = 0; mi < game.moves.length; mi++) {
      const move = game.moves[mi];
      const isUserMove = (mi % 2 === 0) === isWhite;

      const result = chess.move(move);
      if (!result) break;

      // Only evaluate user's moves (skip opponent's)
      if (!isUserMove) {
        // Still need to track eval for the position after opponent's move
        if (mi < game.moves.length - 1) {
          try {
            const evalResult = await evaluateFen(chess.fen(), depth);
            prevEval = isWhite ? evalResult.score : -evalResult.score;
          } catch {
            // Skip on error
          }
        }
        continue;
      }

      onProgress?.({
        currentGame: gi + 1,
        totalGames: games.length,
        currentMove: mi + 1,
        totalMoves: game.moves.length,
        gameName: `vs ${isWhite ? game.black.username : game.white.username}`,
      });

      try {
        const evalResult = await evaluateFen(chess.fen(), depth);
        const currentEval = isWhite ? evalResult.score : -evalResult.score;
        const evalDrop = prevEval - currentEval;

        // Classify the move based on eval drop
        if (evalDrop > 100) {
          totalBlunders++;
          const moveNum = Math.floor(mi / 2) + 1;

          criticalMoments.push({
            gameId: game.id,
            moveNumber: moveNum,
            evalBefore: prevEval,
            evalAfter: currentEval,
            classification: 'blunder',
            fen: chess.fen(),
          });

          // Try to detect tactical theme
          const theme = detectTacticalTheme(chess, result);
          if (theme) {
            tacticsMap.set(theme, (tacticsMap.get(theme) || 0) + 1);
          }
        } else if (evalDrop > 50) {
          totalMistakes++;
          const moveNum = Math.floor(mi / 2) + 1;

          if (evalDrop > 75) {
            criticalMoments.push({
              gameId: game.id,
              moveNumber: moveNum,
              evalBefore: prevEval,
              evalAfter: currentEval,
              classification: 'mistake',
              fen: chess.fen(),
            });
          }
        } else if (evalDrop > 25) {
          totalInaccuracies++;
        }

        prevEval = currentEval;
      } catch {
        // Skip move on error
      }
    }
  }

  // Clean up
  terminate();

  return {
    blunders: totalBlunders,
    mistakes: totalMistakes,
    inaccuracies: totalInaccuracies,
    criticalMoments: criticalMoments.slice(0, 10), // Top 10 most critical
    missedTactics: [...tacticsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count })),
  };
}

/**
 * Basic tactical theme detection based on the move context.
 */
function detectTacticalTheme(chess: Chess, move: { from: string; to: string; captured?: string; flags: string }): string | null {
  // Check if it was a capture that was bad
  if (move.captured) return 'hanging piece';

  // Check if king is in check after the position
  if (chess.inCheck()) return 'discovered check missed';

  // Check if back rank is weak
  const fen = chess.fen();
  const isWhite = fen.split(' ')[1] === 'w';
  const backRank = isWhite ? '1' : '8';
  const kingPos = findKing(fen, !isWhite);
  if (kingPos && kingPos[1] === backRank) return 'back rank vulnerability';

  return null;
}

function findKing(fen: string, isBlackKing: boolean): string | null {
  const board = fen.split(' ')[0];
  const target = isBlackKing ? 'k' : 'K';
  const rows = board.split('/');
  for (let r = 0; r < rows.length; r++) {
    let col = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        col += parseInt(ch);
      } else {
        if (ch === target) {
          const file = String.fromCharCode(97 + col);
          const rank = (8 - r).toString();
          return file + rank;
        }
        col++;
      }
    }
  }
  return null;
}
