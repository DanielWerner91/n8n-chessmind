import {
  ChessGame,
  AnalysisReport,
  AnalysisPoint,
  OpeningAnalysisItem,
  SixAxisScores,
  RatingBracket,
  TimeClass,
} from './types';

export function computeStatsAnalysis(
  games: ChessGame[],
  username: string,
  bestRating?: number
): AnalysisReport {
  if (games.length === 0) {
    return emptyReport();
  }

  const ratingBracket = getRatingBracket(bestRating || estimateRating(games, username));
  const openingAnalysis = computeOpeningAnalysis(games);
  const colorStats = computeColorStats(games);
  const accuracyStats = computeAccuracyStats(games);
  const gameLengthStats = computeGameLengthStats(games);
  const terminationStats = computeTerminationStats(games);
  const timeClassStats = computeTimeClassStats(games);
  const opponentRatingStats = computeOpponentRatingStats(games, username);

  const strengths = identifyStrengths(games, openingAnalysis, colorStats, accuracyStats, gameLengthStats, opponentRatingStats);
  const weaknesses = identifyWeaknesses(games, openingAnalysis, colorStats, accuracyStats, gameLengthStats, terminationStats);
  const tacticalGaps = computeTacticalGaps(games, terminationStats, gameLengthStats);
  const sixAxisScores = computeSixAxisScores(games, openingAnalysis, accuracyStats, colorStats, gameLengthStats, terminationStats);

  const endgameScore = computeEndgameScore(games, gameLengthStats);
  const developmentRating = computeDevelopmentRating(accuracyStats, openingAnalysis, colorStats);

  const playingStyle = generatePlayingStyleNarrative(games, username, openingAnalysis, colorStats, accuracyStats, gameLengthStats, ratingBracket);
  const ratingTip = getRatingTip(ratingBracket);

  return {
    playingStyle,
    strengths,
    weaknesses,
    openingAnalysis,
    tacticalGaps,
    endgameScore,
    developmentRating,
    generatedAt: Date.now(),
    gamesAnalyzed: games.length,
    colorStats,
    accuracyStats: accuracyStats || undefined,
    sixAxisScores,
    ratingBracket,
    ratingTip,
    timeClassStats,
    engineEnhanced: false,
  };
}

// --- Helpers ---

function emptyReport(): AnalysisReport {
  return {
    playingStyle: 'Not enough games to analyze. Play some games and try again!',
    strengths: [],
    weaknesses: [],
    openingAnalysis: [],
    tacticalGaps: [],
    endgameScore: 0,
    developmentRating: 0,
    generatedAt: Date.now(),
    gamesAnalyzed: 0,
    colorStats: { whiteWinRate: 0, blackWinRate: 0, whiteGames: 0, blackGames: 0 },
    sixAxisScores: { openings: 50, tactics: 50, endings: 50, advantageCapitalization: 50, resourcefulness: 50, timeManagement: 50 },
    ratingBracket: 'beginner',
    ratingTip: 'Play more games to get personalized insights!',
    timeClassStats: [],
    engineEnhanced: false,
  };
}

function getRatingBracket(rating: number): RatingBracket {
  if (rating < 1200) return 'beginner';
  if (rating < 1500) return 'intermediate';
  if (rating < 1800) return 'advanced';
  return 'expert';
}

function estimateRating(games: ChessGame[], username: string): number {
  const ratings = games.map((g) => {
    const player = g.white.username.toLowerCase() === username.toLowerCase() ? g.white : g.black;
    return player.rating;
  }).filter((r) => r > 0);
  if (ratings.length === 0) return 1000;
  return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
}

function computeOpeningAnalysis(games: ChessGame[]): OpeningAnalysisItem[] {
  const map = new Map<string, { wins: number; total: number }>();
  for (const g of games) {
    const entry = map.get(g.opening) || { wins: 0, total: 0 };
    entry.total++;
    if (g.result === 'win') entry.wins++;
    map.set(g.opening, entry);
  }

  return [...map.entries()]
    .filter(([, data]) => data.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([name, data]) => {
      const winRate = data.total > 0 ? data.wins / data.total : 0;
      return {
        name,
        games: data.total,
        winRate,
        recommendation: winRate >= 0.55 ? 'keep' as const : winRate >= 0.35 ? 'improve' as const : 'drop' as const,
      };
    });
}

interface ColorStats {
  whiteWinRate: number;
  blackWinRate: number;
  whiteGames: number;
  blackGames: number;
}

function computeColorStats(games: ChessGame[]): ColorStats {
  const white = games.filter((g) => g.userColor === 'white');
  const black = games.filter((g) => g.userColor === 'black');
  const whiteWins = white.filter((g) => g.result === 'win').length;
  const blackWins = black.filter((g) => g.result === 'win').length;
  return {
    whiteWinRate: white.length > 0 ? Math.round((whiteWins / white.length) * 100) : 0,
    blackWinRate: black.length > 0 ? Math.round((blackWins / black.length) * 100) : 0,
    whiteGames: white.length,
    blackGames: black.length,
  };
}

interface AccuracyStats {
  average: number;
  inWins: number;
  inLosses: number;
  trend: 'improving' | 'declining' | 'stable';
}

function computeAccuracyStats(games: ChessGame[]): AccuracyStats | null {
  const withAcc = games.filter((g) => g.accuracy !== undefined);
  if (withAcc.length < 3) return null;

  const avg = withAcc.reduce((s, g) => s + (g.accuracy || 0), 0) / withAcc.length;
  const wins = withAcc.filter((g) => g.result === 'win');
  const losses = withAcc.filter((g) => g.result === 'loss');
  const inWins = wins.length > 0 ? wins.reduce((s, g) => s + (g.accuracy || 0), 0) / wins.length : avg;
  const inLosses = losses.length > 0 ? losses.reduce((s, g) => s + (g.accuracy || 0), 0) / losses.length : avg;

  // Trend: compare first half vs second half (games sorted newest first)
  const half = Math.floor(withAcc.length / 2);
  const recentAvg = withAcc.slice(0, half).reduce((s, g) => s + (g.accuracy || 0), 0) / half;
  const olderAvg = withAcc.slice(half).reduce((s, g) => s + (g.accuracy || 0), 0) / (withAcc.length - half);
  const diff = recentAvg - olderAvg;
  const trend = diff > 3 ? 'improving' as const : diff < -3 ? 'declining' as const : 'stable' as const;

  return {
    average: Math.round(avg * 10) / 10,
    inWins: Math.round(inWins * 10) / 10,
    inLosses: Math.round(inLosses * 10) / 10,
    trend,
  };
}

interface GameLengthStats {
  avgMoveCount: number;
  shortLosses: number;
  shortLossRate: number;
  longGames: number;
  longGameWinRate: number;
}

function computeGameLengthStats(games: ChessGame[]): GameLengthStats {
  const avgMoveCount = games.length > 0
    ? Math.round(games.reduce((s, g) => s + g.moveCount, 0) / games.length)
    : 0;

  const losses = games.filter((g) => g.result === 'loss');
  const shortLosses = losses.filter((g) => g.moveCount < 25).length;
  const shortLossRate = losses.length > 0 ? shortLosses / losses.length : 0;

  const longGames = games.filter((g) => g.moveCount > 40);
  const longGameWins = longGames.filter((g) => g.result === 'win').length;
  const longGameWinRate = longGames.length > 0 ? longGameWins / longGames.length : 0;

  return { avgMoveCount, shortLosses, shortLossRate, longGames: longGames.length, longGameWinRate };
}

interface TerminationStats {
  resignations: number;
  checkmates: number;
  timeouts: number;
  other: number;
  totalLosses: number;
}

function computeTerminationStats(games: ChessGame[]): TerminationStats {
  const losses = games.filter((g) => g.result === 'loss');
  let resignations = 0, checkmates = 0, timeouts = 0, other = 0;

  for (const g of losses) {
    const termMatch = g.pgn.match(/\[Termination\s+"([^"]+)"\]/i);
    const term = termMatch ? termMatch[1].toLowerCase() : '';
    if (term.includes('resign')) resignations++;
    else if (term.includes('checkmate') || term.includes('mated')) checkmates++;
    else if (term.includes('time')) timeouts++;
    else other++;
  }

  return { resignations, checkmates, timeouts, other, totalLosses: losses.length };
}

function computeTimeClassStats(games: ChessGame[]): { timeClass: TimeClass; games: number; winRate: number }[] {
  const map = new Map<TimeClass, { wins: number; total: number }>();
  for (const g of games) {
    const entry = map.get(g.timeClass) || { wins: 0, total: 0 };
    entry.total++;
    if (g.result === 'win') entry.wins++;
    map.set(g.timeClass, entry);
  }
  return [...map.entries()]
    .filter(([, d]) => d.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([tc, d]) => ({ timeClass: tc, games: d.total, winRate: Math.round((d.wins / d.total) * 100) }));
}

interface OpponentRatingStats {
  vsHigherWinRate: number;
  vsLowerWinRate: number;
  vsHigherGames: number;
  vsLowerGames: number;
}

function computeOpponentRatingStats(games: ChessGame[], username: string): OpponentRatingStats {
  let higherWins = 0, higherTotal = 0, lowerWins = 0, lowerTotal = 0;
  for (const g of games) {
    const isWhite = g.white.username.toLowerCase() === username.toLowerCase();
    const userRating = isWhite ? g.white.rating : g.black.rating;
    const oppRating = isWhite ? g.black.rating : g.white.rating;
    if (oppRating > userRating + 50) {
      higherTotal++;
      if (g.result === 'win') higherWins++;
    } else if (oppRating < userRating - 50) {
      lowerTotal++;
      if (g.result === 'win') lowerWins++;
    }
  }
  return {
    vsHigherWinRate: higherTotal > 0 ? Math.round((higherWins / higherTotal) * 100) : 0,
    vsLowerWinRate: lowerTotal > 0 ? Math.round((lowerWins / lowerTotal) * 100) : 0,
    vsHigherGames: higherTotal,
    vsLowerGames: lowerTotal,
  };
}

// --- Strengths ---

function identifyStrengths(
  games: ChessGame[],
  openings: OpeningAnalysisItem[],
  color: ColorStats,
  accuracy: AccuracyStats | null,
  gameLength: GameLengthStats,
  oppRating: OpponentRatingStats
): AnalysisPoint[] {
  const strengths: AnalysisPoint[] = [];

  if (accuracy && accuracy.average >= 80) {
    strengths.push({ title: 'Consistent Move Quality', description: `Your average accuracy of ${accuracy.average}% is excellent — you make strong, reliable moves.` });
  }
  if (accuracy && accuracy.trend === 'improving') {
    strengths.push({ title: 'Improving Accuracy', description: 'Your recent games show higher accuracy than earlier ones — your play is getting sharper.' });
  }

  const bestOpening = openings.find((o) => o.winRate >= 0.65 && o.games >= 3);
  if (bestOpening) {
    strengths.push({ title: `Strong ${bestOpening.name}`, description: `${Math.round(bestOpening.winRate * 100)}% win rate across ${bestOpening.games} games — this opening suits your style well.` });
  }

  if (gameLength.longGameWinRate >= 0.6 && gameLength.longGames >= 3) {
    strengths.push({ title: 'Endgame Conversion', description: `You win ${Math.round(gameLength.longGameWinRate * 100)}% of long games (40+ moves) — you handle endgames well.` });
  }

  if (Math.abs(color.whiteWinRate - color.blackWinRate) <= 10 && games.length >= 10) {
    strengths.push({ title: 'Balanced Color Play', description: `You perform consistently as both colors (White: ${color.whiteWinRate}%, Black: ${color.blackWinRate}%).` });
  }

  if (oppRating.vsHigherWinRate >= 40 && oppRating.vsHigherGames >= 3) {
    strengths.push({ title: 'Giant Killer', description: `You win ${oppRating.vsHigherWinRate}% against higher-rated opponents — you rise to the challenge.` });
  }

  return strengths.slice(0, 5);
}

// --- Weaknesses ---

function identifyWeaknesses(
  games: ChessGame[],
  openings: OpeningAnalysisItem[],
  color: ColorStats,
  accuracy: AccuracyStats | null,
  gameLength: GameLengthStats,
  termination: TerminationStats
): AnalysisPoint[] {
  const weaknesses: AnalysisPoint[] = [];

  if (accuracy && accuracy.average < 70) {
    weaknesses.push({ title: 'Move Accuracy', description: `Your average accuracy is ${accuracy.average}% — focus on double-checking moves before playing them.` });
  }

  if (accuracy && accuracy.inWins - accuracy.inLosses > 10) {
    weaknesses.push({ title: 'Accuracy Inconsistency', description: `${accuracy.inWins}% accuracy in wins vs ${accuracy.inLosses}% in losses — a ${Math.round(accuracy.inWins - accuracy.inLosses)}% gap. Your play drops when behind.` });
  }

  if (gameLength.shortLossRate > 0.3 && gameLength.shortLosses >= 2) {
    weaknesses.push({ title: 'Opening Preparation', description: `${Math.round(gameLength.shortLossRate * 100)}% of your losses come in under 25 moves — you may be underprepared in the opening.` });
  }

  const colorGap = Math.abs(color.whiteWinRate - color.blackWinRate);
  if (colorGap > 15 && games.length >= 10) {
    const weak = color.whiteWinRate < color.blackWinRate ? 'White' : 'Black';
    const weakRate = weak === 'White' ? color.whiteWinRate : color.blackWinRate;
    weaknesses.push({ title: `Weaker as ${weak}`, description: `Only ${weakRate}% win rate as ${weak} — a ${colorGap}% gap between your colors. Study ${weak} opening repertoire.` });
  }

  const worstOpening = openings.find((o) => o.winRate < 0.35 && o.games >= 3);
  if (worstOpening) {
    weaknesses.push({ title: `Struggling with ${worstOpening.name}`, description: `${Math.round(worstOpening.winRate * 100)}% win rate in ${worstOpening.games} games — consider changing or studying this opening.` });
  }

  if (gameLength.longGameWinRate < 0.4 && gameLength.longGames >= 3) {
    weaknesses.push({ title: 'Endgame Technique', description: `Only ${Math.round(gameLength.longGameWinRate * 100)}% win rate in long games (40+ moves) — endgame practice would help.` });
  }

  if (termination.totalLosses > 0 && termination.timeouts / termination.totalLosses > 0.25) {
    weaknesses.push({ title: 'Time Management', description: `${Math.round((termination.timeouts / termination.totalLosses) * 100)}% of your losses are by timeout — work on managing your clock.` });
  }

  if (accuracy && accuracy.trend === 'declining') {
    weaknesses.push({ title: 'Declining Accuracy', description: 'Your recent games show lower accuracy than earlier ones — you may be in a slump or playing too fast.' });
  }

  return weaknesses.slice(0, 5);
}

// --- Tactical Gaps ---

function computeTacticalGaps(
  games: ChessGame[],
  termination: TerminationStats,
  gameLength: GameLengthStats
): string[] {
  const gaps: string[] = [];

  if (termination.checkmates >= 2) {
    gaps.push(`Got checkmated in ${termination.checkmates} games — practice checkmate pattern recognition`);
  }
  if (termination.timeouts >= 2) {
    gaps.push(`Lost on time in ${termination.timeouts} games — practice time management in rapid/blitz`);
  }
  if (gameLength.shortLosses >= 3) {
    gaps.push(`${gameLength.shortLosses} losses in under 25 moves — you may be falling for opening traps`);
  }

  const losses = games.filter((g) => g.result === 'loss');
  const lowAccLosses = losses.filter((g) => g.accuracy !== undefined && g.accuracy < 60);
  if (lowAccLosses.length >= 2) {
    gaps.push(`${lowAccLosses.length} losses with accuracy below 60% — indicates missed tactical opportunities`);
  }

  const wins = games.filter((g) => g.result === 'win');
  const closeWins = wins.filter((g) => g.accuracy !== undefined && g.accuracy < 70);
  if (closeWins.length >= 2) {
    gaps.push(`Won ${closeWins.length} games with sub-70% accuracy — you may be winning on opponent mistakes rather than strong play`);
  }

  return gaps.slice(0, 5);
}

// --- 6-Axis Scores ---

function computeSixAxisScores(
  games: ChessGame[],
  openings: OpeningAnalysisItem[],
  accuracy: AccuracyStats | null,
  color: ColorStats,
  gameLength: GameLengthStats,
  termination: TerminationStats
): SixAxisScores {
  const totalWinRate = games.length > 0
    ? games.filter((g) => g.result === 'win').length / games.length
    : 0.5;

  // Openings: based on repertoire diversity and win rates
  const avgOpeningWinRate = openings.length > 0
    ? openings.reduce((s, o) => s + o.winRate, 0) / openings.length
    : 0.5;
  const openingsScore = Math.round(clamp(avgOpeningWinRate * 80 + (1 - gameLength.shortLossRate) * 20, 0, 100));

  // Tactics: based on accuracy
  const tacticsScore = accuracy
    ? Math.round(clamp(accuracy.average * 1.1 - 10, 0, 100))
    : Math.round(clamp(totalWinRate * 100, 30, 70));

  // Endings: based on long game performance
  const endingsScore = gameLength.longGames >= 2
    ? Math.round(clamp(gameLength.longGameWinRate * 100, 0, 100))
    : 50;

  // Advantage capitalization: win rate when accuracy is higher than opponent
  const advGames = games.filter((g) => g.accuracy !== undefined && g.opponentAccuracy !== undefined);
  const advantageGames = advGames.filter((g) => (g.accuracy || 0) > (g.opponentAccuracy || 0));
  const advWins = advantageGames.filter((g) => g.result === 'win').length;
  const advCapScore = advantageGames.length >= 3
    ? Math.round(clamp((advWins / advantageGames.length) * 100, 0, 100))
    : 50;

  // Resourcefulness: drawing or winning from behind (low accuracy but not losing)
  const resourceGames = games.filter((g) => g.accuracy !== undefined && (g.accuracy || 0) < 70);
  const resourceSaves = resourceGames.filter((g) => g.result !== 'loss').length;
  const resourceScore = resourceGames.length >= 3
    ? Math.round(clamp((resourceSaves / resourceGames.length) * 100, 0, 100))
    : 50;

  // Time management: based on timeout losses
  const timeScore = termination.totalLosses > 0
    ? Math.round(clamp((1 - termination.timeouts / termination.totalLosses) * 100, 0, 100))
    : 75;

  return {
    openings: openingsScore,
    tactics: tacticsScore,
    endings: endingsScore,
    advantageCapitalization: advCapScore,
    resourcefulness: resourceScore,
    timeManagement: timeScore,
  };
}

function computeEndgameScore(games: ChessGame[], gameLength: GameLengthStats): number {
  if (gameLength.longGames < 2) return 50;
  return Math.round(clamp(gameLength.longGameWinRate * 80 + (gameLength.avgMoveCount > 35 ? 15 : 0), 0, 100));
}

function computeDevelopmentRating(accuracy: AccuracyStats | null, openings: OpeningAnalysisItem[], color: ColorStats): number {
  const accComponent = accuracy ? accuracy.average * 0.5 : 35;
  const openingDiversity = Math.min(openings.length / 6, 1) * 25;
  const colorBalance = (100 - Math.abs(color.whiteWinRate - color.blackWinRate)) * 0.25;
  return Math.round(clamp(accComponent + openingDiversity + colorBalance, 0, 100));
}

// --- Playing Style Narrative ---

function generatePlayingStyleNarrative(
  games: ChessGame[],
  username: string,
  openings: OpeningAnalysisItem[],
  color: ColorStats,
  accuracy: AccuracyStats | null,
  gameLength: GameLengthStats,
  bracket: RatingBracket
): string {
  const totalWins = games.filter((g) => g.result === 'win').length;
  const winRate = Math.round((totalWins / games.length) * 100);

  let style = `Over your last ${games.length} games, you score ${winRate}%`;
  style += ` — ${color.whiteWinRate}% as White and ${color.blackWinRate}% as Black.`;

  if (accuracy) {
    style += ` Your average accuracy is ${accuracy.average}%`;
    if (accuracy.trend === 'improving') style += ' and trending upward.';
    else if (accuracy.trend === 'declining') style += ', though it has dipped recently.';
    else style += '.';
  }

  const bestOpening = openings.length > 0 ? openings.reduce((a, b) => a.winRate > b.winRate ? a : b) : null;
  if (bestOpening && bestOpening.games >= 2) {
    style += ` Your strongest opening is ${bestOpening.name} (${Math.round(bestOpening.winRate * 100)}% in ${bestOpening.games} games).`;
  }

  if (gameLength.shortLossRate > 0.3) {
    style += ' You tend to lose quickly in the opening, suggesting preparation gaps.';
  } else if (gameLength.longGameWinRate > 0.6 && gameLength.longGames >= 3) {
    style += ' You perform well in longer games, showing solid endgame understanding.';
  } else if (gameLength.avgMoveCount < 30) {
    style += ' Your games tend to be short and tactical.';
  }

  // Rating-aware flavor
  if (bracket === 'beginner') {
    style += ' At your level, the biggest gains come from tactical pattern recognition and avoiding piece blunders.';
  } else if (bracket === 'intermediate') {
    style += ' At your level, strengthening pawn structure understanding and basic endgames will unlock the next rating jump.';
  }

  return style;
}

function getRatingTip(bracket: RatingBracket): string {
  switch (bracket) {
    case 'beginner':
      return 'Focus on not hanging pieces — daily tactical puzzles (forks, pins, mate-in-1) are your #1 priority.';
    case 'intermediate':
      return 'Start learning pawn structures and basic rook endgames. Analyze your losses — most games are decided by 1-2 key mistakes.';
    case 'advanced':
      return 'Positional understanding is your next breakthrough area. Study master games and deepen your opening repertoire.';
    case 'expert':
      return 'Deepen opening preparation, sharpen endgame precision, and focus on calculation accuracy in complex positions.';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
