import { AnalysisReport, TrainingTask, RatingBracket } from './types';

export function generateTrainingPlan(report: AnalysisReport): TrainingTask[] {
  const tasks: TrainingTask[] = [];
  const bracket = report.ratingBracket;
  let id = 0;
  const nextId = () => `task-${++id}`;

  // Day 1: Tactics (targeting weakest tactical area)
  tasks.push(...generateTacticsTasks(report, bracket, 1, nextId));

  // Day 2: Endgames
  tasks.push(...generateEndgameTasks(report, bracket, 2, nextId));

  // Day 3: Play + Review
  tasks.push(...generatePlayReviewTasks(report, 3, nextId));

  // Day 4: Tactics (mixed + retry mistakes)
  tasks.push(...generateMixedTacticsTasks(report, bracket, 4, nextId));

  // Day 5: Strategy/Openings
  tasks.push(...generateOpeningTasks(report, bracket, 5, nextId));

  // Day 6: Long game day
  tasks.push(...generateLongGameTasks(report, 6, nextId));

  // Day 7: Review + light puzzles
  tasks.push(...generateReviewTasks(report, bracket, 7, nextId));

  return tasks;
}

// --- Lichess puzzle theme URLs ---

function lichessPuzzleUrl(theme: string): string {
  return `https://lichess.org/training/${theme}`;
}

function lichessStudyUrl(topic: string): string {
  return `https://lichess.org/study/search?q=${encodeURIComponent(topic)}`;
}

// --- Day generators ---

function generateTacticsTasks(
  report: AnalysisReport,
  bracket: RatingBracket,
  day: number,
  nextId: () => string
): TrainingTask[] {
  const tasks: TrainingTask[] = [];
  const themes = getTacticalThemesForBracket(bracket);
  const weakTheme = detectWeakTacticalTheme(report);

  tasks.push({
    id: nextId(),
    title: `${themes.primary.label} Puzzles`,
    description: `Solve 15-20 ${themes.primary.label.toLowerCase()} puzzles to build pattern recognition.`,
    category: 'tactics',
    day,
    completed: false,
    lichessUrl: lichessPuzzleUrl(themes.primary.theme),
    puzzleTheme: themes.primary.theme,
    estimatedMinutes: 20,
    source: 'general',
    rationale: `${themes.primary.label} puzzles are the highest-ROI training for ${bracketLabel(bracket)} players.`,
  });

  if (weakTheme) {
    tasks.push({
      id: nextId(),
      title: `Practice: ${weakTheme.label}`,
      description: weakTheme.description,
      category: 'tactics',
      day,
      completed: false,
      lichessUrl: lichessPuzzleUrl(weakTheme.theme),
      puzzleTheme: weakTheme.theme,
      estimatedMinutes: 10,
      source: 'weakness',
      rationale: weakTheme.rationale,
    });
  }

  return tasks;
}

function generateEndgameTasks(
  report: AnalysisReport,
  bracket: RatingBracket,
  day: number,
  nextId: () => string
): TrainingTask[] {
  const tasks: TrainingTask[] = [];
  const endgameType = getEndgameForBracket(bracket);

  tasks.push({
    id: nextId(),
    title: endgameType.title,
    description: endgameType.description,
    category: 'endgames',
    day,
    completed: false,
    lichessUrl: endgameType.url,
    estimatedMinutes: 20,
    source: report.endgameScore < 50 ? 'weakness' : 'general',
    rationale: report.endgameScore < 50
      ? `Your endgame score is ${report.endgameScore}/100 — this is a key area for improvement.`
      : `Endgame technique is essential for converting advantages at your level.`,
  });

  tasks.push({
    id: nextId(),
    title: 'Endgame Puzzles',
    description: 'Solve 10 endgame puzzles to practice converting advantages.',
    category: 'endgames',
    day,
    completed: false,
    lichessUrl: lichessPuzzleUrl('endgame'),
    puzzleTheme: 'endgame',
    estimatedMinutes: 15,
    source: 'general',
  });

  return tasks;
}

function generatePlayReviewTasks(
  report: AnalysisReport,
  day: number,
  nextId: () => string
): TrainingTask[] {
  return [
    {
      id: nextId(),
      title: 'Play a Serious Game',
      description: 'Play one 15+10 or 10+5 rated game. Focus on quality moves, not speed.',
      category: 'strategy',
      day,
      completed: false,
      lichessUrl: 'https://lichess.org/',
      estimatedMinutes: 30,
      source: 'general',
      rationale: 'Deliberate practice games with full concentration are essential for improvement.',
    },
    {
      id: nextId(),
      title: 'Analyze Your Game',
      description: 'Review the game you just played. Find your key mistakes and the turning points.',
      category: 'review',
      day,
      completed: false,
      estimatedMinutes: 15,
      source: 'general',
      rationale: 'Analyzing your own losses is one of the most effective improvement methods.',
    },
  ];
}

function generateMixedTacticsTasks(
  report: AnalysisReport,
  bracket: RatingBracket,
  day: number,
  nextId: () => string
): TrainingTask[] {
  const tasks: TrainingTask[] = [];

  tasks.push({
    id: nextId(),
    title: 'Mixed Tactical Puzzles',
    description: 'Solve 15 puzzles from the general puzzle set — variety builds pattern flexibility.',
    category: 'tactics',
    day,
    completed: false,
    lichessUrl: lichessPuzzleUrl('mix'),
    puzzleTheme: 'mix',
    estimatedMinutes: 15,
    source: 'general',
  });

  // Add a weakness-specific puzzle if we have identified gaps
  const gaps = report.tacticalGaps;
  if (gaps.length > 0) {
    const gapTheme = mapGapToTheme(gaps[0]);
    if (gapTheme) {
      tasks.push({
        id: nextId(),
        title: `Weakness Drill: ${gapTheme.label}`,
        description: gapTheme.description,
        category: 'tactics',
        day,
        completed: false,
        lichessUrl: lichessPuzzleUrl(gapTheme.theme),
        puzzleTheme: gapTheme.theme,
        estimatedMinutes: 10,
        source: 'weakness',
        rationale: `Based on your analysis: "${gaps[0]}"`,
      });
    }
  }

  // Review own games task
  tasks.push({
    id: nextId(),
    title: 'Review Recent Losses',
    description: 'Look at your 2 most recent losses. Identify where you went wrong and what you missed.',
    category: 'review',
    day,
    completed: false,
    estimatedMinutes: 15,
    source: 'own-game',
    rationale: 'Learning from your own mistakes is 3x more effective than generic exercises.',
  });

  return tasks;
}

function generateOpeningTasks(
  report: AnalysisReport,
  bracket: RatingBracket,
  day: number,
  nextId: () => string
): TrainingTask[] {
  const tasks: TrainingTask[] = [];

  // Find weakest opening
  const weakOpening = report.openingAnalysis.find((o) => o.recommendation === 'drop' || o.recommendation === 'improve');
  if (weakOpening) {
    tasks.push({
      id: nextId(),
      title: `Study: ${weakOpening.name}`,
      description: `Your win rate is ${Math.round(weakOpening.winRate * 100)}% in ${weakOpening.games} games. Study the key ideas and typical plans.`,
      category: 'openings',
      day,
      completed: false,
      lichessUrl: lichessStudyUrl(weakOpening.name),
      estimatedMinutes: 20,
      source: 'weakness',
      rationale: `Based on your ${Math.round(weakOpening.winRate * 100)}% win rate in the ${weakOpening.name}.`,
    });
  }

  // Color-specific advice
  const colorStats = report.colorStats;
  const colorGap = Math.abs(colorStats.whiteWinRate - colorStats.blackWinRate);
  if (colorGap > 15) {
    const weakColor = colorStats.whiteWinRate < colorStats.blackWinRate ? 'White' : 'Black';
    tasks.push({
      id: nextId(),
      title: `Improve ${weakColor} Repertoire`,
      description: `Your ${weakColor} win rate (${weakColor === 'White' ? colorStats.whiteWinRate : colorStats.blackWinRate}%) lags behind. Study ${weakColor === 'White' ? 'e4/d4' : 'defenses against e4 and d4'}.`,
      category: 'openings',
      day,
      completed: false,
      lichessUrl: lichessStudyUrl(`${weakColor} opening repertoire ${bracketLabel(bracket)}`),
      estimatedMinutes: 20,
      source: 'weakness',
      rationale: `${colorGap}% gap between your White and Black performance.`,
    });
  }

  // General opening principles for lower rated
  if (bracket === 'beginner' || bracket === 'intermediate') {
    tasks.push({
      id: nextId(),
      title: 'Opening Principles Review',
      description: 'Review core opening principles: control the center, develop pieces, castle early.',
      category: 'openings',
      day,
      completed: false,
      lichessUrl: lichessStudyUrl('opening principles basics'),
      estimatedMinutes: 15,
      source: 'general',
      rationale: 'Solid opening play prevents early losses and sets up a strong middlegame.',
    });
  } else if (!weakOpening) {
    tasks.push({
      id: nextId(),
      title: 'Expand Opening Repertoire',
      description: 'Study a new opening variation to add depth and surprise value to your play.',
      category: 'openings',
      day,
      completed: false,
      lichessUrl: lichessStudyUrl('opening repertoire advanced'),
      estimatedMinutes: 20,
      source: 'general',
    });
  }

  return tasks;
}

function generateLongGameTasks(
  report: AnalysisReport,
  day: number,
  nextId: () => string
): TrainingTask[] {
  return [
    {
      id: nextId(),
      title: 'Play a Classical/Long Game',
      description: 'Play one 30+0 or 15+10 game. Take your time, think on every move. Quality over quantity.',
      category: 'strategy',
      day,
      completed: false,
      lichessUrl: 'https://lichess.org/',
      estimatedMinutes: 45,
      source: 'general',
      rationale: 'Longer games build deeper calculation skills and strategic understanding.',
    },
    {
      id: nextId(),
      title: 'Full Game Analysis',
      description: 'After your game, do a thorough analysis. Use the computer to check your key decisions.',
      category: 'review',
      day,
      completed: false,
      lichessUrl: 'https://lichess.org/analysis',
      estimatedMinutes: 20,
      source: 'own-game',
      rationale: 'Self-analysis of your own games is the most effective improvement method.',
    },
  ];
}

function generateReviewTasks(
  report: AnalysisReport,
  bracket: RatingBracket,
  day: number,
  nextId: () => string
): TrainingTask[] {
  const tasks: TrainingTask[] = [];

  tasks.push({
    id: nextId(),
    title: 'Week Review',
    description: 'Review your games from this week. What patterns do you notice? What mistakes keep recurring?',
    category: 'review',
    day,
    completed: false,
    estimatedMinutes: 15,
    source: 'own-game',
    rationale: 'Identifying recurring patterns in your play is key to breaking through plateaus.',
  });

  tasks.push({
    id: nextId(),
    title: 'Light Puzzle Session',
    description: 'Casual puzzle solving to end the week — aim for fun, not intensity.',
    category: 'tactics',
    day,
    completed: false,
    lichessUrl: lichessPuzzleUrl('mix'),
    puzzleTheme: 'mix',
    estimatedMinutes: 10,
    source: 'general',
  });

  // Strategy task based on bracket
  if (bracket === 'advanced' || bracket === 'expert') {
    tasks.push({
      id: nextId(),
      title: 'Study a Master Game',
      description: 'Find a master game in your favorite opening and study the strategic ideas.',
      category: 'strategy',
      day,
      completed: false,
      lichessUrl: 'https://lichess.org/study',
      estimatedMinutes: 20,
      source: 'general',
      rationale: 'Studying master games develops positional intuition critical at your level.',
    });
  }

  return tasks;
}

// --- Helpers ---

interface ThemeInfo {
  theme: string;
  label: string;
  description: string;
  rationale?: string;
}

function getTacticalThemesForBracket(bracket: RatingBracket): { primary: ThemeInfo; secondary: ThemeInfo } {
  switch (bracket) {
    case 'beginner':
      return {
        primary: { theme: 'mateIn1', label: 'Mate in 1', description: 'Practice spotting checkmate in one move.' },
        secondary: { theme: 'fork', label: 'Forks', description: 'Learn to attack two pieces at once.' },
      };
    case 'intermediate':
      return {
        primary: { theme: 'short', label: 'Short Combinations', description: 'Solve 2-3 move tactical puzzles.' },
        secondary: { theme: 'pin', label: 'Pins', description: 'Practice exploiting pinned pieces.' },
      };
    case 'advanced':
      return {
        primary: { theme: 'long', label: 'Long Combinations', description: 'Solve complex multi-move tactical puzzles.' },
        secondary: { theme: 'discoveredAttack', label: 'Discovered Attacks', description: 'Practice this powerful tactical motif.' },
      };
    case 'expert':
      return {
        primary: { theme: 'veryLong', label: 'Deep Calculations', description: 'Solve complex puzzles requiring deep calculation.' },
        secondary: { theme: 'sacrifice', label: 'Sacrifices', description: 'Practice sacrificial combinations.' },
      };
  }
}

function getEndgameForBracket(bracket: RatingBracket): { title: string; description: string; url: string } {
  switch (bracket) {
    case 'beginner':
      return {
        title: 'King & Pawn Endgames',
        description: 'Learn the basics: opposition, key squares, and pawn promotion.',
        url: lichessStudyUrl('king and pawn endgame basics'),
      };
    case 'intermediate':
      return {
        title: 'Rook Endgames',
        description: 'Study Lucena and Philidor positions — the foundation of rook endgames.',
        url: lichessStudyUrl('rook endgame lucena philidor'),
      };
    case 'advanced':
      return {
        title: 'Complex Endgames',
        description: 'Study rook vs minor piece endgames and opposite-colored bishops.',
        url: lichessStudyUrl('complex endgame technique'),
      };
    case 'expert':
      return {
        title: 'Advanced Endgame Technique',
        description: 'Study theoretical endgames: rook + pawn positions, fortress concepts.',
        url: lichessStudyUrl('advanced endgame theory'),
      };
  }
}

function detectWeakTacticalTheme(report: AnalysisReport): ThemeInfo | null {
  // Use tactical gaps from analysis to suggest specific themes
  for (const gap of report.tacticalGaps) {
    const mapped = mapGapToTheme(gap);
    if (mapped) return mapped;
  }

  // If endgame is weak, suggest endgame tactics
  if (report.endgameScore < 40) {
    return {
      theme: 'endgame',
      label: 'Endgame Tactics',
      description: 'Solve endgame-focused puzzles to improve your conversion.',
      rationale: `Your endgame score is ${report.endgameScore}/100 — endgame tactics will help most.`,
    };
  }

  return null;
}

function mapGapToTheme(gap: string): ThemeInfo | null {
  const lower = gap.toLowerCase();
  if (lower.includes('checkmate') || lower.includes('mated')) {
    return {
      theme: 'backRankMate',
      label: 'Back Rank Defense',
      description: 'Practice recognizing and preventing back-rank mate threats.',
      rationale: gap,
    };
  }
  if (lower.includes('time') || lower.includes('timeout')) {
    return {
      theme: 'short',
      label: 'Quick Decisions',
      description: 'Practice making good decisions under time pressure.',
      rationale: gap,
    };
  }
  if (lower.includes('opening') || lower.includes('25 moves')) {
    return {
      theme: 'opening',
      label: 'Opening Puzzles',
      description: 'Practice common opening tactics and traps.',
      rationale: gap,
    };
  }
  if (lower.includes('accuracy') || lower.includes('tactical')) {
    return {
      theme: 'middlegame',
      label: 'Middlegame Tactics',
      description: 'Practice finding tactical shots in typical middlegame positions.',
      rationale: gap,
    };
  }
  return null;
}

function bracketLabel(bracket: RatingBracket): string {
  switch (bracket) {
    case 'beginner': return 'beginner';
    case 'intermediate': return 'intermediate';
    case 'advanced': return 'advanced';
    case 'expert': return 'expert';
  }
}
