import {
  ChessGame,
  ChessStats,
  Platform,
  TimeClass,
  SixAxisScores,
  RatingBracket,
  PlayerDiagnostic,
  Diagnostic,
  WeaknessItem,
  StrengthItem,
  PlayerArchetype,
  AdaptiveFlags,
  OpeningRecord,
} from './types';

// --- PlayerDiagnostic extraction ---

export function extractPlayerDiagnostic(
  games: ChessGame[],
  stats: ChessStats | null,
  username: string,
  platform: Platform
): PlayerDiagnostic {
  const currentRating = estimateCurrentRating(games, stats, username);
  const peakRating = estimatePeakRating(stats, currentRating);
  const ratingBracket = getRatingBracket(currentRating);
  const primaryTimeControl = detectPrimaryTimeControl(games);

  const overall = computeOverall(games);
  const byColor = computeByColor(games);
  const openingsByColor = computeOpeningsByColor(games);
  const accuracy = computeAccuracy(games);
  const gameLength = computeGameLength(games);
  const terminationProfile = computeTerminationProfile(games);
  const timeManagement = computeTimeManagement(games);
  const endgameConversion = computeEndgameConversion(games);
  const tiltIndicators = computeTiltIndicators(games);
  const opponentAnalysis = computeOpponentAnalysis(games, username);
  const sixAxisScores = computeSixAxis(games, accuracy, gameLength, terminationProfile, openingsByColor);

  return {
    username,
    platform,
    generatedAt: Date.now(),
    gamesAnalyzed: games.length,
    currentRating,
    peakRating,
    ratingBracket,
    primaryTimeControl,
    overall,
    byColor,
    openingsByColor,
    accuracy,
    gameLength,
    terminationProfile,
    timeManagement,
    endgameConversion,
    tiltIndicators,
    opponentAnalysis,
    sixAxisScores,
  };
}

// --- Diagnostic generation ---

export function generateDiagnostic(diag: PlayerDiagnostic): Diagnostic {
  const weaknesses = identifyWeaknesses(diag);
  const strengths = identifyStrengths(diag);
  const archetype = detectArchetype(diag);
  const archetypeDescription = getArchetypeDescription(archetype);
  const adaptiveFlags = computeAdaptiveFlags(diag, weaknesses);
  const priorityOrder = derivePriorityOrder(weaknesses, diag.ratingBracket);

  return {
    weaknesses,
    strengths,
    archetype,
    archetypeDescription,
    adaptiveFlags,
    priorityOrder,
  };
}

// --- Helpers ---

function getRatingBracket(rating: number): RatingBracket {
  if (rating < 1200) return 'beginner';
  if (rating < 1500) return 'intermediate';
  if (rating < 1800) return 'advanced';
  return 'expert';
}

function estimateCurrentRating(games: ChessGame[], stats: ChessStats | null, username: string): number {
  // Try stats first
  if (stats) {
    const ratings = [
      stats.chess_rapid?.last?.rating,
      stats.chess_blitz?.last?.rating,
      stats.chess_bullet?.last?.rating,
    ].filter((r): r is number => r !== undefined && r > 0);
    if (ratings.length > 0) return Math.max(...ratings);
  }
  // Fallback to game ratings
  const recent = games.slice(0, 10);
  const playerRatings = recent.map((g) => {
    const isWhite = g.white.username.toLowerCase() === username.toLowerCase();
    return isWhite ? g.white.rating : g.black.rating;
  }).filter((r) => r > 0);
  return playerRatings.length > 0 ? Math.round(playerRatings.reduce((a, b) => a + b, 0) / playerRatings.length) : 1000;
}

function estimatePeakRating(stats: ChessStats | null, current: number): number {
  if (!stats) return current;
  const peaks = [
    stats.chess_rapid?.best?.rating,
    stats.chess_blitz?.best?.rating,
    stats.chess_bullet?.best?.rating,
  ].filter((r): r is number => r !== undefined && r > 0);
  return peaks.length > 0 ? Math.max(...peaks) : current;
}

function detectPrimaryTimeControl(games: ChessGame[]): TimeClass {
  const counts = new Map<TimeClass, number>();
  for (const g of games) {
    counts.set(g.timeClass, (counts.get(g.timeClass) || 0) + 1);
  }
  let best: TimeClass = 'rapid';
  let max = 0;
  for (const [tc, count] of counts) {
    if (count > max) { best = tc; max = count; }
  }
  return best;
}

function computeOverall(games: ChessGame[]) {
  const wins = games.filter((g) => g.result === 'win').length;
  const losses = games.filter((g) => g.result === 'loss').length;
  const draws = games.filter((g) => g.result === 'draw').length;
  return { wins, losses, draws, winRate: games.length > 0 ? Math.round((wins / games.length) * 100) : 0 };
}

function computeByColor(games: ChessGame[]) {
  const compute = (color: 'white' | 'black') => {
    const colorGames = games.filter((g) => g.userColor === color);
    const wins = colorGames.filter((g) => g.result === 'win').length;
    const losses = colorGames.filter((g) => g.result === 'loss').length;
    const draws = colorGames.filter((g) => g.result === 'draw').length;
    return {
      wins, losses, draws,
      winRate: colorGames.length > 0 ? Math.round((wins / colorGames.length) * 100) : 0,
      games: colorGames.length,
    };
  };
  return { white: compute('white'), black: compute('black') };
}

function computeOpeningsByColor(games: ChessGame[]): { white: OpeningRecord[]; black: OpeningRecord[] } {
  const build = (color: 'white' | 'black'): OpeningRecord[] => {
    const map = new Map<string, { wins: number; total: number; accuracies: number[]; moves: string[][] }>();
    for (const g of games.filter((g) => g.userColor === color)) {
      const entry = map.get(g.opening) || { wins: 0, total: 0, accuracies: [], moves: [] };
      entry.total++;
      if (g.result === 'win') entry.wins++;
      if (g.accuracy !== undefined) entry.accuracies.push(g.accuracy);
      if (entry.moves.length < 3) entry.moves.push(g.moves);
      map.set(g.opening, entry);
    }
    return [...map.entries()]
      .filter(([, d]) => d.total >= 2)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([name, d]) => ({
        name,
        games: d.total,
        winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
        avgAccuracy: d.accuracies.length > 0 ? Math.round(d.accuracies.reduce((a, b) => a + b, 0) / d.accuracies.length) : 0,
        moves: d.moves,
      }));
  };
  return { white: build('white'), black: build('black') };
}

function computeAccuracy(games: ChessGame[]) {
  const withAcc = games.filter((g) => g.accuracy !== undefined);
  if (withAcc.length < 3) {
    return { overall: 0, inWins: 0, inLosses: 0, trend: 'stable' as const, last10: [] };
  }
  const avg = withAcc.reduce((s, g) => s + (g.accuracy || 0), 0) / withAcc.length;
  const wins = withAcc.filter((g) => g.result === 'win');
  const losses = withAcc.filter((g) => g.result === 'loss');
  const inWins = wins.length > 0 ? wins.reduce((s, g) => s + (g.accuracy || 0), 0) / wins.length : avg;
  const inLosses = losses.length > 0 ? losses.reduce((s, g) => s + (g.accuracy || 0), 0) / losses.length : avg;

  const half = Math.floor(withAcc.length / 2);
  const recentAvg = withAcc.slice(0, half).reduce((s, g) => s + (g.accuracy || 0), 0) / half;
  const olderAvg = withAcc.slice(half).reduce((s, g) => s + (g.accuracy || 0), 0) / (withAcc.length - half);
  const diff = recentAvg - olderAvg;
  const trend = diff > 3 ? 'improving' as const : diff < -3 ? 'declining' as const : 'stable' as const;

  const last10 = withAcc.slice(0, 10).map((g) => g.accuracy || 0);

  return {
    overall: Math.round(avg * 10) / 10,
    inWins: Math.round(inWins * 10) / 10,
    inLosses: Math.round(inLosses * 10) / 10,
    trend,
    last10,
  };
}

function computeGameLength(games: ChessGame[]) {
  const avg = games.length > 0 ? Math.round(games.reduce((s, g) => s + g.moveCount, 0) / games.length) : 0;
  const losses = games.filter((g) => g.result === 'loss');
  const shortLosses = losses.filter((g) => g.moveCount < 25).length;
  const shortLossRate = losses.length > 0 ? Math.round((shortLosses / losses.length) * 100) : 0;
  const longGames = games.filter((g) => g.moveCount > 40);
  const longWins = longGames.filter((g) => g.result === 'win').length;
  const longGameWinRate = longGames.length > 0 ? Math.round((longWins / longGames.length) * 100) : 0;
  return { average: avg, shortLossRate, longGameWinRate, longGames: longGames.length };
}

function computeTerminationProfile(games: ChessGame[]) {
  const losses = games.filter((g) => g.result === 'loss');
  const total = losses.length || 1;
  let resigns = 0, checkmates = 0, timeouts = 0;
  for (const g of losses) {
    const term = (g.pgn.match(/\[Termination\s+"([^"]+)"\]/i)?.[1] || '').toLowerCase();
    if (term.includes('resign')) resigns++;
    else if (term.includes('checkmate') || term.includes('mated')) checkmates++;
    else if (term.includes('time')) timeouts++;
  }
  const draws = games.filter((g) => g.result === 'draw').length;
  return {
    resignRate: Math.round((resigns / total) * 100),
    checkmateRate: Math.round((checkmates / total) * 100),
    timeoutRate: Math.round((timeouts / total) * 100),
    drawRate: games.length > 0 ? Math.round((draws / games.length) * 100) : 0,
  };
}

function computeTimeManagement(games: ChessGame[]) {
  const losses = games.filter((g) => g.result === 'loss');
  const timeoutLosses = losses.filter((g) => {
    const term = (g.pgn.match(/\[Termination\s+"([^"]+)"\]/i)?.[1] || '').toLowerCase();
    return term.includes('time');
  });
  const timeoutLossRate = losses.length > 0 ? Math.round((timeoutLosses.length / losses.length) * 100) : 0;
  const avgMovesInTimeouts = timeoutLosses.length > 0
    ? Math.round(timeoutLosses.reduce((s, g) => s + g.moveCount, 0) / timeoutLosses.length)
    : 0;
  return { timeoutLossRate, avgMovesInTimeouts };
}

function computeEndgameConversion(games: ChessGame[]) {
  const longGames = games.filter((g) => g.moveCount > 40);
  const longWins = longGames.filter((g) => g.result === 'win').length;
  return {
    longGameWinRate: longGames.length > 0 ? Math.round((longWins / longGames.length) * 100) : 0,
    longGameCount: longGames.length,
  };
}

function computeTiltIndicators(games: ChessGame[]) {
  // Sort by time (newest first — already sorted)
  let maxStreak = 0, currentStreak = 0;
  const afterLossResults: ('win' | 'loss' | 'draw')[] = [];
  const afterLossAccuracies: number[] = [];

  for (let i = 0; i < games.length; i++) {
    if (games[i].result === 'loss') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    // Check if previous game was a loss
    if (i > 0 && games[i - 1].result === 'loss') {
      afterLossResults.push(games[i].result);
      if (games[i].accuracy !== undefined) afterLossAccuracies.push(games[i].accuracy!);
    }
  }

  const afterLossWins = afterLossResults.filter((r) => r === 'win').length;
  const winRateAfterLoss = afterLossResults.length > 0 ? Math.round((afterLossWins / afterLossResults.length) * 100) : 50;

  const overallAcc = games.filter((g) => g.accuracy !== undefined);
  const avgAcc = overallAcc.length > 0 ? overallAcc.reduce((s, g) => s + (g.accuracy || 0), 0) / overallAcc.length : 0;
  const avgAfterLoss = afterLossAccuracies.length > 0 ? afterLossAccuracies.reduce((a, b) => a + b, 0) / afterLossAccuracies.length : avgAcc;
  const accuracyDropAfterLoss = Math.round(avgAcc - avgAfterLoss);

  return { losingStreakMax: maxStreak, winRateAfterLoss, accuracyDropAfterLoss };
}

function computeOpponentAnalysis(games: ChessGame[], username: string) {
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

function computeSixAxis(
  games: ChessGame[],
  accuracy: PlayerDiagnostic['accuracy'],
  gameLength: PlayerDiagnostic['gameLength'],
  termination: PlayerDiagnostic['terminationProfile'],
  openings: PlayerDiagnostic['openingsByColor']
): SixAxisScores {
  const totalWinRate = games.length > 0
    ? games.filter((g) => g.result === 'win').length / games.length : 0.5;

  const allOpenings = [...openings.white, ...openings.black];
  const avgOpeningWR = allOpenings.length > 0
    ? allOpenings.reduce((s, o) => s + o.winRate, 0) / allOpenings.length / 100 : 0.5;
  const openingsScore = clamp(Math.round(avgOpeningWR * 80 + (1 - gameLength.shortLossRate / 100) * 20), 0, 100);

  const tacticsScore = accuracy.overall > 0
    ? clamp(Math.round(accuracy.overall * 1.1 - 10), 0, 100)
    : clamp(Math.round(totalWinRate * 100), 30, 70);

  const endingsScore = gameLength.longGames >= 2
    ? clamp(gameLength.longGameWinRate, 0, 100) : 50;

  const advGames = games.filter((g) => g.accuracy !== undefined && g.opponentAccuracy !== undefined);
  const advantageGames = advGames.filter((g) => (g.accuracy || 0) > (g.opponentAccuracy || 0));
  const advWins = advantageGames.filter((g) => g.result === 'win').length;
  const advCapScore = advantageGames.length >= 3
    ? clamp(Math.round((advWins / advantageGames.length) * 100), 0, 100) : 50;

  const resourceGames = games.filter((g) => g.accuracy !== undefined && (g.accuracy || 0) < 70);
  const resourceSaves = resourceGames.filter((g) => g.result !== 'loss').length;
  const resourceScore = resourceGames.length >= 3
    ? clamp(Math.round((resourceSaves / resourceGames.length) * 100), 0, 100) : 50;

  const timeScore = clamp(100 - termination.timeoutRate, 0, 100);

  return {
    openings: openingsScore,
    tactics: tacticsScore,
    endings: endingsScore,
    advantageCapitalization: advCapScore,
    resourcefulness: resourceScore,
    timeManagement: timeScore,
  };
}

// --- Weakness / Strength identification ---

function identifyWeaknesses(diag: PlayerDiagnostic): WeaknessItem[] {
  const w: WeaknessItem[] = [];

  if (diag.accuracy.overall > 0 && diag.accuracy.overall < 65) {
    w.push({ area: 'accuracy', severity: 'critical', detail: `Average accuracy ${diag.accuracy.overall}% is below target`, metric: diag.accuracy.overall });
  } else if (diag.accuracy.overall > 0 && diag.accuracy.overall < 75) {
    w.push({ area: 'accuracy', severity: 'moderate', detail: `Average accuracy ${diag.accuracy.overall}% needs improvement`, metric: diag.accuracy.overall });
  }

  if (diag.gameLength.shortLossRate > 35) {
    w.push({ area: 'openings', severity: 'critical', detail: `${diag.gameLength.shortLossRate}% of losses in under 25 moves`, metric: diag.gameLength.shortLossRate });
  } else if (diag.gameLength.shortLossRate > 20) {
    w.push({ area: 'openings', severity: 'moderate', detail: `${diag.gameLength.shortLossRate}% of losses come early`, metric: diag.gameLength.shortLossRate });
  }

  if (diag.endgameConversion.longGameCount >= 3 && diag.endgameConversion.longGameWinRate < 35) {
    w.push({ area: 'endgames', severity: 'critical', detail: `Only ${diag.endgameConversion.longGameWinRate}% win rate in long games`, metric: diag.endgameConversion.longGameWinRate });
  } else if (diag.endgameConversion.longGameCount >= 3 && diag.endgameConversion.longGameWinRate < 50) {
    w.push({ area: 'endgames', severity: 'moderate', detail: `${diag.endgameConversion.longGameWinRate}% endgame win rate needs work`, metric: diag.endgameConversion.longGameWinRate });
  }

  if (diag.timeManagement.timeoutLossRate > 30) {
    w.push({ area: 'timeManagement', severity: 'critical', detail: `${diag.timeManagement.timeoutLossRate}% of losses by timeout`, metric: diag.timeManagement.timeoutLossRate });
  } else if (diag.timeManagement.timeoutLossRate > 15) {
    w.push({ area: 'timeManagement', severity: 'moderate', detail: `${diag.timeManagement.timeoutLossRate}% timeout losses`, metric: diag.timeManagement.timeoutLossRate });
  }

  const colorGap = Math.abs(diag.byColor.white.winRate - diag.byColor.black.winRate);
  if (colorGap > 20) {
    const weak = diag.byColor.white.winRate < diag.byColor.black.winRate ? 'White' : 'Black';
    w.push({ area: 'colorBalance', severity: 'moderate', detail: `${colorGap}% gap — weaker as ${weak}`, metric: colorGap });
  }

  if (diag.tiltIndicators.losingStreakMax >= 5) {
    w.push({ area: 'tilt', severity: 'moderate', detail: `${diag.tiltIndicators.losingStreakMax}-game losing streak detected`, metric: diag.tiltIndicators.losingStreakMax });
  }

  if (diag.tiltIndicators.accuracyDropAfterLoss > 5) {
    w.push({ area: 'tilt', severity: 'minor', detail: `Accuracy drops ${diag.tiltIndicators.accuracyDropAfterLoss}% after a loss`, metric: diag.tiltIndicators.accuracyDropAfterLoss });
  }

  if (diag.accuracy.trend === 'declining') {
    w.push({ area: 'trend', severity: 'minor', detail: 'Accuracy trending downward in recent games' });
  }

  // Sort by severity
  const severityOrder = { critical: 0, moderate: 1, minor: 2 };
  w.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return w.slice(0, 8);
}

function identifyStrengths(diag: PlayerDiagnostic): StrengthItem[] {
  const s: StrengthItem[] = [];

  if (diag.accuracy.overall >= 80) {
    s.push({ area: 'accuracy', detail: `${diag.accuracy.overall}% average accuracy — consistent quality`, metric: diag.accuracy.overall });
  }
  if (diag.accuracy.trend === 'improving') {
    s.push({ area: 'trend', detail: 'Accuracy trending upward recently' });
  }
  if (diag.endgameConversion.longGameCount >= 3 && diag.endgameConversion.longGameWinRate >= 60) {
    s.push({ area: 'endgames', detail: `${diag.endgameConversion.longGameWinRate}% endgame win rate — strong conversion`, metric: diag.endgameConversion.longGameWinRate });
  }
  if (diag.opponentAnalysis.vsHigherGames >= 3 && diag.opponentAnalysis.vsHigherWinRate >= 40) {
    s.push({ area: 'resilience', detail: `${diag.opponentAnalysis.vsHigherWinRate}% win rate vs higher-rated — rises to the challenge`, metric: diag.opponentAnalysis.vsHigherWinRate });
  }

  const colorGap = Math.abs(diag.byColor.white.winRate - diag.byColor.black.winRate);
  if (colorGap <= 10 && diag.gamesAnalyzed >= 10) {
    s.push({ area: 'colorBalance', detail: 'Balanced performance across both colors' });
  }

  const allOpenings = [...diag.openingsByColor.white, ...diag.openingsByColor.black];
  const bestOpening = allOpenings.find((o) => o.winRate >= 65 && o.games >= 3);
  if (bestOpening) {
    s.push({ area: 'openings', detail: `${bestOpening.winRate}% win rate in ${bestOpening.name}`, metric: bestOpening.winRate });
  }

  if (diag.timeManagement.timeoutLossRate <= 5 && diag.gamesAnalyzed >= 10) {
    s.push({ area: 'timeManagement', detail: 'Excellent clock management' });
  }

  return s.slice(0, 5);
}

// --- Archetype detection ---

function detectArchetype(diag: PlayerDiagnostic): PlayerArchetype {
  const scores: Record<PlayerArchetype, number> = {
    tactician: 0,
    positionalGrinder: 0,
    aggressiveAttacker: 0,
    endgameSpecialist: 0,
    chaoticBlitzer: 0,
    allRounder: 0,
  };

  // Tactical indicators
  if (diag.sixAxisScores.tactics >= 70) scores.tactician += 3;
  if (diag.accuracy.overall >= 78) scores.tactician += 2;
  if (diag.gameLength.average < 30) scores.tactician += 1;

  // Positional grinder
  if (diag.gameLength.average > 35) scores.positionalGrinder += 3;
  if (diag.endgameConversion.longGameWinRate >= 55) scores.positionalGrinder += 2;
  if (diag.sixAxisScores.endings >= 60) scores.positionalGrinder += 2;

  // Aggressive attacker
  if (diag.gameLength.average < 28) scores.aggressiveAttacker += 3;
  if (diag.terminationProfile.checkmateRate > 15) scores.aggressiveAttacker += 2;
  if (diag.overall.winRate > 55 && diag.gameLength.average < 30) scores.aggressiveAttacker += 1;

  // Endgame specialist
  if (diag.endgameConversion.longGameWinRate >= 65 && diag.endgameConversion.longGameCount >= 5) scores.endgameSpecialist += 4;
  if (diag.sixAxisScores.endings >= 70) scores.endgameSpecialist += 2;

  // Chaotic blitzer
  if (diag.primaryTimeControl === 'bullet' || diag.primaryTimeControl === 'blitz') scores.chaoticBlitzer += 2;
  if (diag.timeManagement.timeoutLossRate > 20) scores.chaoticBlitzer += 2;
  if (diag.accuracy.overall > 0 && diag.accuracy.overall < 70) scores.chaoticBlitzer += 1;

  // All-rounder (balanced scores)
  const axes = Object.values(diag.sixAxisScores);
  const axisRange = Math.max(...axes) - Math.min(...axes);
  if (axisRange < 25) scores.allRounder += 3;
  if (diag.accuracy.overall >= 72 && diag.accuracy.overall <= 82) scores.allRounder += 1;

  let best: PlayerArchetype = 'allRounder';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) { best = type as PlayerArchetype; bestScore = score; }
  }
  return best;
}

function getArchetypeDescription(archetype: PlayerArchetype): string {
  switch (archetype) {
    case 'tactician': return 'You thrive on sharp tactics and combinations. Your pattern recognition is a strength — build on it with advanced calculation.';
    case 'positionalGrinder': return 'You excel in slow, strategic play and endgame conversion. Your patience is an asset — deepen your positional understanding.';
    case 'aggressiveAttacker': return 'You prefer attacking chess and quick decisive games. Channel this energy with better preparation and defense awareness.';
    case 'endgameSpecialist': return 'Your endgame technique sets you apart. Keep sharpening it while adding middlegame tactical sharpness.';
    case 'chaoticBlitzer': return 'You play fast and dynamic chess. To break through, slow down occasionally and build calculation depth.';
    case 'allRounder': return 'You have balanced skills across all areas. Focus on turning your best area into a real weapon while shoring up any weaknesses.';
  }
}

// --- Adaptive flags ---

function computeAdaptiveFlags(diag: PlayerDiagnostic, weaknesses: WeaknessItem[]): AdaptiveFlags {
  const hasWeakness = (area: string) => weaknesses.some((w) => w.area === area && (w.severity === 'critical' || w.severity === 'moderate'));

  return {
    doubleUpTactics: diag.sixAxisScores.tactics < 50 || (diag.accuracy.overall > 0 && diag.accuracy.overall < 68),
    prioritizeEndgames: hasWeakness('endgames') || diag.sixAxisScores.endings < 40,
    addTiltManagement: diag.tiltIndicators.losingStreakMax >= 4 || diag.tiltIndicators.accuracyDropAfterLoss > 5,
    focusTimeManagement: hasWeakness('timeManagement'),
    heavyOpeningWork: hasWeakness('openings') || diag.gameLength.shortLossRate > 30,
    needsCalculationDrills: diag.ratingBracket === 'advanced' || diag.ratingBracket === 'expert',
  };
}

function derivePriorityOrder(weaknesses: WeaknessItem[], bracket: RatingBracket): string[] {
  // Rating-dependent base priorities
  const basePriorities: Record<RatingBracket, string[]> = {
    beginner: ['tactics', 'openings', 'endgames', 'timeManagement'],
    intermediate: ['tactics', 'endgames', 'openings', 'strategy'],
    advanced: ['strategy', 'calculation', 'openings', 'endgames'],
    expert: ['calculation', 'openings', 'endgames', 'strategy'],
  };

  const priorities = [...basePriorities[bracket]];

  // Promote critical weaknesses
  for (const w of weaknesses) {
    if (w.severity === 'critical') {
      const idx = priorities.indexOf(w.area);
      if (idx > 0) {
        priorities.splice(idx, 1);
        priorities.unshift(w.area);
      } else if (idx === -1) {
        priorities.unshift(w.area);
      }
    }
  }

  return priorities.slice(0, 5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
