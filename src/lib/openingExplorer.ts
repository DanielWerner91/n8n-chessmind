import { Chess } from 'chess.js';

interface MasterStats {
  white: number;
  draws: number;
  black: number;
  totalGames: number;
  whiteWinRate: number;
}

const cache = new Map<string, MasterStats>();

/**
 * Fetches master game statistics for a given opening name by:
 * 1. Deriving a FEN from the opening's typical first moves
 * 2. Querying the Lichess Opening Explorer API
 */
export async function fetchMasterStats(openingMoves: string[]): Promise<MasterStats | null> {
  try {
    // Derive FEN from moves
    const chess = new Chess();
    const movesToPlay = openingMoves.slice(0, 10); // First 10 half-moves
    for (const move of movesToPlay) {
      const result = chess.move(move);
      if (!result) break;
    }
    const fen = chess.fen();

    // Check cache
    if (cache.has(fen)) return cache.get(fen)!;

    const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const white = data.white || 0;
    const draws = data.draws || 0;
    const black = data.black || 0;
    const totalGames = white + draws + black;

    if (totalGames === 0) return null;

    const stats: MasterStats = {
      white,
      draws,
      black,
      totalGames,
      whiteWinRate: Math.round((white / totalGames) * 100),
    };

    cache.set(fen, stats);
    return stats;
  } catch {
    return null;
  }
}

/**
 * Enriches opening analysis items with master statistics.
 * Called from the analysis page to add master comparison data.
 */
export async function enrichOpeningsWithMasterData(
  openings: { name: string; games: number; winRate: number; recommendation: string }[],
  gamesByOpening: Map<string, string[][]>
): Promise<{ name: string; masterWinRate: number; masterGames: number }[]> {
  const results: { name: string; masterWinRate: number; masterGames: number }[] = [];

  // Process top 5 openings to avoid too many API calls
  const toProcess = openings.slice(0, 5);

  for (const opening of toProcess) {
    const moves = gamesByOpening.get(opening.name);
    if (!moves || moves.length === 0) continue;

    // Use the first game's moves for this opening
    const stats = await fetchMasterStats(moves[0]);
    if (stats) {
      results.push({
        name: opening.name,
        masterWinRate: stats.whiteWinRate / 100, // Normalize to 0-1
        masterGames: stats.totalGames,
      });
    }

    // Small delay between API calls to be respectful
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}
