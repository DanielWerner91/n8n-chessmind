import { AnalysisReport, TrainingTask } from './types';

export function generateMockAnalysis(): AnalysisReport {
  return {
    playingStyle:
      "You play an aggressive, tactical style with a preference for open positions. You tend to launch kingside attacks early and favor piece activity over solid pawn structures. Your games show a pattern of seeking complications, which works well when you're in form but can backfire against well-prepared opponents.",
    strengths: [
      {
        title: 'Tactical Vision',
        description:
          'You consistently find tactical shots in complex positions. Your fork and pin detection rate is above average for your rating bracket.',
      },
      {
        title: 'Opening Preparation',
        description:
          'Your main openings show solid theoretical knowledge through move 10-12, giving you comfortable middlegame positions.',
      },
      {
        title: 'Time Management',
        description:
          'You rarely lose on time and maintain consistent clock usage throughout the game, avoiding time pressure.',
      },
      {
        title: 'Attacking Play',
        description:
          'When given the initiative, you convert attacking chances at a high rate, especially with opposite-side castling positions.',
      },
    ],
    weaknesses: [
      {
        title: 'Endgame Technique',
        description:
          "Rook endgames are a significant weakness. You've converted only 40% of winning rook + pawn endings this month.",
      },
      {
        title: 'Positional Understanding',
        description:
          'In quiet positions without tactical opportunities, your move quality drops noticeably. You tend to drift without a plan.',
      },
      {
        title: 'Defense Under Pressure',
        description:
          'When your opponent seizes the initiative, you tend to crack rather than finding resilient defensive resources.',
      },
      {
        title: 'Pawn Structure Awareness',
        description:
          'You frequently create weak pawns (isolated, doubled) without sufficient piece activity to compensate.',
      },
    ],
    openingAnalysis: [
      { name: 'Sicilian Defense', games: 12, winRate: 0.67, recommendation: 'keep' },
      { name: 'Italian Game', games: 8, winRate: 0.75, recommendation: 'keep' },
      { name: "Queen's Gambit", games: 6, winRate: 0.33, recommendation: 'improve' },
      { name: 'Caro-Kann Defense', games: 5, winRate: 0.4, recommendation: 'improve' },
      { name: "King's Indian Defense", games: 3, winRate: 0.33, recommendation: 'drop' },
    ],
    tacticalGaps: [
      'Missed back-rank mate patterns 3 times this month',
      'Failed to spot knight forks in 5 critical positions',
      'Overlooked discovered attacks in 2 winning positions',
      'Missed intermediate moves (zwischenzug) in 4 combinations',
    ],
    endgameScore: 42,
    developmentRating: 68,
    generatedAt: Date.now(),
  };
}

export function generateMockTrainingPlan(): TrainingTask[] {
  return [
    { id: 't1', title: 'Back-Rank Mate Puzzles', description: 'Solve 10 puzzles focused on back-rank mating patterns', category: 'tactics', day: 1, completed: false },
    { id: 't2', title: 'Sicilian Defense: Najdorf', description: 'Study the main lines of the Najdorf up to move 15', category: 'openings', day: 1, completed: false },
    { id: 't3', title: 'Rook Endgame Basics', description: 'Practice Lucena and Philidor positions', category: 'endgames', day: 1, completed: false },
    { id: 't4', title: 'Knight Fork Patterns', description: 'Solve 15 knight fork tactical puzzles', category: 'tactics', day: 2, completed: false },
    { id: 't5', title: 'Review Lost Game #1', description: 'Analyze your loss against a higher-rated opponent this week', category: 'review', day: 2, completed: false },
    { id: 't6', title: 'Pawn Structure Study', description: 'Learn about isolated queen pawn positions and plans', category: 'strategy', day: 2, completed: false },
    { id: 't7', title: 'Discovered Attack Drills', description: 'Solve 10 discovered attack combinations', category: 'tactics', day: 3, completed: false },
    { id: 't8', title: 'Italian Game: Giuoco Piano', description: 'Study the main plans and typical middlegame ideas', category: 'openings', day: 3, completed: false },
    { id: 't9', title: 'King + Pawn Endgames', description: 'Practice opposition and key square concepts', category: 'endgames', day: 3, completed: false },
    { id: 't10', title: 'Pin & Skewer Puzzles', description: 'Solve 15 pin and skewer combinations', category: 'tactics', day: 4, completed: false },
    { id: 't11', title: 'Defensive Technique', description: 'Study 3 games featuring excellent defense by grandmasters', category: 'strategy', day: 4, completed: false },
    { id: 't12', title: 'Review Lost Game #2', description: 'Find the critical turning point in your second loss', category: 'review', day: 4, completed: false },
    { id: 't13', title: 'Zwischenzug Puzzles', description: 'Solve 10 intermediate move puzzles', category: 'tactics', day: 5, completed: false },
    { id: 't14', title: "Queen's Gambit Study", description: 'Learn the Exchange variation and typical plans for both sides', category: 'openings', day: 5, completed: false },
    { id: 't15', title: 'Rook vs Pawns Endgame', description: 'Practice cutting off the king with the rook', category: 'endgames', day: 5, completed: false },
    { id: 't16', title: 'Mixed Tactical Set', description: 'Solve 20 random tactical puzzles for pattern recognition', category: 'tactics', day: 6, completed: false },
    { id: 't17', title: 'Positional Play Study', description: "Study Karpov's prophylactic thinking approach in 2 games", category: 'strategy', day: 6, completed: false },
    { id: 't18', title: 'Weekly Game Review', description: 'Review all games from this week and note recurring patterns', category: 'review', day: 7, completed: false },
    { id: 't19', title: 'Rapid Practice Games', description: 'Play 5 rapid games applying concepts you learned this week', category: 'strategy', day: 7, completed: false },
    { id: 't20', title: 'Endgame Drill', description: 'Practice bishop + knight checkmate technique', category: 'endgames', day: 7, completed: false },
  ];
}
