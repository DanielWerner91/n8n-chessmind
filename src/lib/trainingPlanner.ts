import {
  PlayerDiagnostic,
  Diagnostic,
  TrainingPlan,
  WeekPlan,
  DayModule,
  ChessOSDocument,
  RatingBracket,
  AdaptiveFlags,
  WeaknessItem,
  PlayerArchetype,
  PhaseName,
  WeekMilestone,
} from './types';
import { defaultGamificationState, getPhaseForWeek } from './gamification';

/**
 * Generate a complete 8-week training plan from player diagnostic and diagnosis.
 */
export function generate8WeekPlan(
  diagnostic: PlayerDiagnostic,
  diagnosis: Diagnostic
): TrainingPlan {
  const weeks = buildWeeks(diagnostic, diagnosis);
  const chessOS = buildChessOS(diagnostic, diagnosis);

  return {
    id: `plan-${Date.now()}`,
    generatedAt: Date.now(),
    diagnostic,
    diagnosis,
    weeks,
    chessOS,
    ratingLog: [{ date: Date.now(), rating: diagnostic.currentRating, note: 'Plan start' }],
    currentWeek: 1,
    regenerationCount: 0,
    gamification: defaultGamificationState(),
    welcomeDismissed: false,
  };
}

// Keep backward compat — old code calls generateTrainingPlan(report)
// This won't be called once ChessContext switches to the 8-week flow
export { generate8WeekPlan as generateTrainingPlan8Week };

// --- Week themes ---

interface WeekTemplate {
  theme: string;
  focus: string;
  description: string;
  weekGoal: string;
  milestone: WeekMilestone;
  phase: number;
  phaseName: PhaseName;
}

function getWeekTemplates(bracket: RatingBracket, flags: AdaptiveFlags): WeekTemplate[] {
  const base: WeekTemplate[] = [
    {
      theme: 'Foundation', focus: 'tactics',
      description: 'Build a solid tactical foundation with daily puzzle practice and baseline assessment.',
      weekGoal: 'Complete all daily tactical puzzles and establish your training routine.',
      milestone: { name: 'Foundation Builder', description: 'Complete all Week 1 modules', icon: 'Hammer' },
      ...getPhaseForWeek(1),
    },
    {
      theme: 'Opening Mastery', focus: 'openings',
      description: 'Strengthen your opening repertoire and eliminate early-game blunders.',
      weekGoal: 'Study your main openings and learn the key ideas behind each one.',
      milestone: { name: 'Opening Scholar', description: 'Complete all Week 2 modules', icon: 'BookOpen' },
      ...getPhaseForWeek(2),
    },
    {
      theme: 'Tactical Sharpness', focus: 'tactics',
      description: 'Push tactical depth with harder puzzles, calculation drills, and pattern work.',
      weekGoal: 'Push your puzzle rating higher by solving increasingly difficult tactics.',
      milestone: { name: 'Tactical Eye', description: 'Complete all Week 3 modules', icon: 'Eye' },
      ...getPhaseForWeek(3),
    },
    {
      theme: 'Strategic Play', focus: 'strategy',
      description: 'Develop positional understanding, pawn structures, and planning skills.',
      weekGoal: 'Learn to evaluate positions and form long-term plans.',
      milestone: { name: 'Strategist', description: 'Complete all Week 4 modules', icon: 'Map' },
      ...getPhaseForWeek(4),
    },
    {
      theme: 'Endgame Technique', focus: 'endgames',
      description: 'Master essential endgame patterns and conversion technique.',
      weekGoal: 'Master the fundamental endgame positions for your rating bracket.',
      milestone: { name: 'Endgame Artist', description: 'Complete all Week 5 modules', icon: 'Crown' },
      ...getPhaseForWeek(5),
    },
    {
      theme: 'Integration Week', focus: 'play',
      description: 'Apply everything in rated games. Focus on quality play and post-game analysis.',
      weekGoal: 'Play rated games and apply everything you have learned so far.',
      milestone: { name: 'Battle Tested', description: 'Complete all Week 6 modules', icon: 'Swords' },
      ...getPhaseForWeek(6),
    },
    {
      theme: 'Weakness Targeting', focus: 'weakness',
      description: 'Intensely work on your identified weak areas with focused drills.',
      weekGoal: 'Face your weaknesses head-on and turn them into strengths.',
      milestone: { name: 'Weakness Crusher', description: 'Complete all Week 7 modules', icon: 'Target' },
      ...getPhaseForWeek(7),
    },
    {
      theme: 'Peak Performance', focus: 'review',
      description: 'Tournament preparation mindset. Time management, consistency, and review.',
      weekGoal: 'Consolidate all skills and perform at your best in rated games.',
      milestone: { name: 'Peak Performer', description: 'Complete all Week 8 modules', icon: 'Trophy' },
      ...getPhaseForWeek(8),
    },
  ];

  // Adaptive modifications
  if (flags.doubleUpTactics) {
    base[3] = {
      ...base[3], theme: 'Tactics Deep Dive', focus: 'tactics',
      description: 'Extended tactical training to build stronger pattern recognition.',
      weekGoal: 'Solve 150+ puzzles this week to cement tactical patterns.',
    };
  }
  if (flags.prioritizeEndgames) {
    const endgameWeek = base[4];
    base[4] = base[2];
    base[2] = endgameWeek;
  }
  if (flags.addTiltManagement) {
    base[5] = { ...base[5], description: base[5].description + ' Includes mental resilience and tilt management exercises.' };
  }

  return base.slice(0, 8);
}

// --- Build weeks ---

function buildWeeks(diagnostic: PlayerDiagnostic, diagnosis: Diagnostic): WeekPlan[] {
  const templates = getWeekTemplates(diagnostic.ratingBracket, diagnosis.adaptiveFlags);
  const weeks: WeekPlan[] = [];

  for (let w = 0; w < 8; w++) {
    const template = templates[w];
    const days = buildDaysForWeek(w + 1, template, diagnostic, diagnosis);
    weeks.push({
      weekNumber: w + 1,
      theme: template.theme,
      focus: template.focus,
      description: template.description,
      days,
      completed: false,
      weekGoal: template.weekGoal,
      milestone: template.milestone,
      motivationalIntro: getMotivationalIntro(w + 1, diagnosis.archetype, diagnostic.ratingBracket),
      phase: template.phase,
      phaseName: template.phaseName,
    });
  }

  return weeks;
}

function getMotivationalIntro(weekNum: number, archetype: PlayerArchetype, bracket: RatingBracket): string {
  const archetypeFlavor: Record<PlayerArchetype, string> = {
    tactician: 'Your sharp tactical eye is your greatest weapon.',
    positionalGrinder: 'Your patience and positional sense set you apart.',
    aggressiveAttacker: 'Your attacking instincts give you a natural edge.',
    endgameSpecialist: 'Your endgame technique is a rare and powerful skill.',
    chaoticBlitzer: 'Your speed and intuition are forces to be reckoned with.',
    allRounder: 'Your balanced approach gives you flexibility in any position.',
  };

  const flavor = archetypeFlavor[archetype] || '';

  const intros: Record<number, string> = {
    1: `Welcome to Week 1 — this is where your transformation begins. ${flavor} This week we lay the groundwork that everything else builds on. Trust the process and show up every day.`,
    2: `Week 2 is here, and you are already proving your commitment. ${flavor} Now it is time to strengthen how you start your games. A strong opening leads to confident play.`,
    3: `You have built a solid base — now let us sharpen your blade. ${flavor} This week we push deeper into tactical patterns. The puzzles get harder, and so do you.`,
    4: `Halfway through your journey, and the real growth begins. ${flavor} Strategy is about seeing the bigger picture. This week you will learn to think like a chess player, not just calculate like one.`,
    5: `The endgame is where games are won and lost. ${flavor} This week we master the positions that decide results. Every half-point counts.`,
    6: `Time to put it all together. ${flavor} This week is about playing real games with everything you have learned. Quality over quantity — every move matters.`,
    7: `This is the week that separates good from great. ${flavor} We are targeting your specific weaknesses with surgical precision. Embrace the discomfort — that is where growth happens.`,
    8: `The final week. ${flavor} You have come so far. This week is about consistency, confidence, and peak performance. Play your best chess and trust your preparation.`,
  };

  return intros[weekNum] || '';
}

function buildDaysForWeek(
  weekNum: number,
  template: WeekTemplate,
  diag: PlayerDiagnostic,
  diagnosis: Diagnostic
): DayModule[] {
  const days: DayModule[] = [];
  const bracket = diag.ratingBracket;
  let id = 0;
  const nextId = () => `w${weekNum}-d${++id}`;

  // Mon: Primary focus
  days.push(...buildMondayModules(weekNum, template, bracket, diagnosis, nextId));
  // Tue: Secondary / endgames
  days.push(...buildTuesdayModules(weekNum, template, bracket, diag, diagnosis, nextId));
  // Wed: Play + Review
  days.push(...buildWednesdayModules(weekNum, nextId));
  // Thu: Tactics
  days.push(...buildThursdayModules(weekNum, bracket, diagnosis, nextId));
  // Fri: Openings / Strategy
  days.push(...buildFridayModules(weekNum, template, bracket, diag, diagnosis, nextId));
  // Sat: Long game
  days.push(...buildSaturdayModules(weekNum, nextId));
  // Sun: Review + light
  days.push(...buildSundayModules(weekNum, bracket, diagnosis, nextId));

  return days;
}

// --- Day builders ---

function buildMondayModules(weekNum: number, template: WeekTemplate, bracket: RatingBracket, diagnosis: Diagnostic, nextId: () => string): DayModule[] {
  const modules: DayModule[] = [];
  const themes = getTacticalThemes(bracket, weekNum);

  if (template.focus === 'tactics' || template.focus === 'weakness') {
    modules.push({
      id: nextId(), dayOfWeek: 1, title: `${themes.primary.label} Puzzles`,
      description: `Solve 15-20 ${themes.primary.label.toLowerCase()} puzzles. Week ${weekNum} focus: ${template.theme}.`,
      category: 'tactics', estimatedMinutes: 20, completed: false,
      lichessUrl: puzzleUrl(themes.primary.theme), puzzleTheme: themes.primary.theme,
      source: 'general', rationale: `${themes.primary.label} drills build the core pattern recognition needed at your level.`,
    });

    const weakTheme = getWeaknessTheme(diagnosis);
    if (weakTheme) {
      modules.push({
        id: nextId(), dayOfWeek: 1, title: `Weakness Drill: ${weakTheme.label}`,
        description: weakTheme.description,
        category: 'tactics', estimatedMinutes: 10, completed: false,
        lichessUrl: puzzleUrl(weakTheme.theme), puzzleTheme: weakTheme.theme,
        source: 'weakness', rationale: weakTheme.rationale,
      });
    }
  } else if (template.focus === 'openings') {
    modules.push({
      id: nextId(), dayOfWeek: 1, title: 'Opening Study Session',
      description: 'Review your main openings. Understand the key ideas, typical pawn structures, and plans.',
      category: 'openings', estimatedMinutes: 25, completed: false,
      lichessUrl: studyUrl('opening repertoire'), source: 'general',
    });
    modules.push({
      id: nextId(), dayOfWeek: 1, title: 'Opening Tactics',
      description: 'Solve 10 opening-themed puzzles to recognize tactical patterns in the first 15 moves.',
      category: 'tactics', estimatedMinutes: 10, completed: false,
      lichessUrl: puzzleUrl('opening'), puzzleTheme: 'opening', source: 'general',
    });
  } else if (template.focus === 'endgames') {
    const endgame = getEndgameStudy(bracket, weekNum);
    modules.push({
      id: nextId(), dayOfWeek: 1, title: endgame.title,
      description: endgame.description,
      category: 'endgames', estimatedMinutes: 25, completed: false,
      lichessUrl: endgame.url, source: 'general', rationale: endgame.rationale,
    });
  } else if (template.focus === 'strategy') {
    modules.push({
      id: nextId(), dayOfWeek: 1, title: 'Positional Concepts',
      description: getStrategyTopic(bracket, weekNum),
      category: 'strategy', estimatedMinutes: 25, completed: false,
      lichessUrl: studyUrl('positional chess'), source: 'general',
    });
  } else {
    // play / review weeks — lighter Monday
    modules.push({
      id: nextId(), dayOfWeek: 1, title: 'Warm-up Puzzles',
      description: 'Start the week with 15 mixed puzzles to stay sharp.',
      category: 'tactics', estimatedMinutes: 15, completed: false,
      lichessUrl: puzzleUrl('mix'), puzzleTheme: 'mix', source: 'general',
    });
  }

  return modules;
}

function buildTuesdayModules(weekNum: number, template: WeekTemplate, bracket: RatingBracket, diag: PlayerDiagnostic, diagnosis: Diagnostic, nextId: () => string): DayModule[] {
  const modules: DayModule[] = [];

  if (template.focus === 'endgames') {
    modules.push({
      id: nextId(), dayOfWeek: 2, title: 'Endgame Puzzles',
      description: 'Solve 15 endgame-themed puzzles focusing on conversion and defense.',
      category: 'endgames', estimatedMinutes: 20, completed: false,
      lichessUrl: puzzleUrl('endgame'), puzzleTheme: 'endgame', source: 'general',
    });
  } else {
    const endgame = getEndgameStudy(bracket, weekNum);
    modules.push({
      id: nextId(), dayOfWeek: 2, title: endgame.title,
      description: endgame.description,
      category: 'endgames', estimatedMinutes: 20, completed: false,
      lichessUrl: endgame.url, source: diag.endgameConversion.longGameWinRate < 50 ? 'weakness' : 'general',
      rationale: diag.endgameConversion.longGameWinRate < 50
        ? `Your endgame win rate is ${diag.endgameConversion.longGameWinRate}% — this is a priority area.`
        : 'Endgame knowledge is always valuable for converting advantages.',
    });
  }

  modules.push({
    id: nextId(), dayOfWeek: 2, title: 'Endgame Drills',
    description: 'Solve 10 endgame puzzles to reinforce today\'s study.',
    category: 'endgames', estimatedMinutes: 12, completed: false,
    lichessUrl: puzzleUrl('endgame'), puzzleTheme: 'endgame', source: 'general',
  });

  return modules;
}

function buildWednesdayModules(weekNum: number, nextId: () => string): DayModule[] {
  return [
    {
      id: nextId(), dayOfWeek: 3, title: 'Play a Serious Game',
      description: 'Play one 15+10 or 10+5 rated game. Focus on applying this week\'s themes.',
      category: 'play', estimatedMinutes: 30, completed: false,
      lichessUrl: 'https://lichess.org/', source: 'general',
      rationale: 'Deliberate practice games with full concentration are essential for improvement.',
    },
    {
      id: nextId(), dayOfWeek: 3, title: 'Analyze Your Game',
      description: 'Review the game you just played. Find 2-3 critical moments and understand what went wrong or right.',
      category: 'review', estimatedMinutes: 15, completed: false,
      source: 'own-game',
      rationale: 'Self-analysis is the single most effective improvement method in chess.',
    },
  ];
}

function buildThursdayModules(weekNum: number, bracket: RatingBracket, diagnosis: Diagnostic, nextId: () => string): DayModule[] {
  const themes = getTacticalThemes(bracket, weekNum);
  const modules: DayModule[] = [];

  modules.push({
    id: nextId(), dayOfWeek: 4, title: 'Mixed Tactical Puzzles',
    description: 'Solve 15 puzzles from the general set — variety builds pattern flexibility.',
    category: 'tactics', estimatedMinutes: 15, completed: false,
    lichessUrl: puzzleUrl('mix'), puzzleTheme: 'mix', source: 'general',
  });

  // Weakness-specific drill
  const weakTheme = getWeaknessTheme(diagnosis);
  if (weakTheme) {
    modules.push({
      id: nextId(), dayOfWeek: 4, title: `Target: ${weakTheme.label}`,
      description: weakTheme.description,
      category: 'tactics', estimatedMinutes: 10, completed: false,
      lichessUrl: puzzleUrl(weakTheme.theme), puzzleTheme: weakTheme.theme,
      source: 'weakness', rationale: weakTheme.rationale,
    });
  }

  modules.push({
    id: nextId(), dayOfWeek: 4, title: 'Review Recent Losses',
    description: 'Look at your 2 most recent losses. Identify the turning point in each game.',
    category: 'review', estimatedMinutes: 15, completed: false,
    source: 'own-game',
    rationale: 'Learning from your own mistakes is 3x more effective than generic exercises.',
  });

  return modules;
}

function buildFridayModules(weekNum: number, template: WeekTemplate, bracket: RatingBracket, diag: PlayerDiagnostic, diagnosis: Diagnostic, nextId: () => string): DayModule[] {
  const modules: DayModule[] = [];

  if (template.focus === 'openings' || template.focus === 'weakness') {
    // Opening-focused Friday
    const weakOpening = findWeakestOpening(diag);
    if (weakOpening) {
      modules.push({
        id: nextId(), dayOfWeek: 5, title: `Study: ${weakOpening.name}`,
        description: `Your win rate is ${weakOpening.winRate}% in ${weakOpening.games} games. Study key ideas and typical plans.`,
        category: 'openings', estimatedMinutes: 20, completed: false,
        lichessUrl: studyUrl(weakOpening.name), source: 'weakness',
        rationale: `Based on your ${weakOpening.winRate}% win rate in the ${weakOpening.name}.`,
      });
    }
  }

  // Color-specific work
  const colorGap = Math.abs(diag.byColor.white.winRate - diag.byColor.black.winRate);
  if (colorGap > 15) {
    const weakColor = diag.byColor.white.winRate < diag.byColor.black.winRate ? 'White' : 'Black';
    modules.push({
      id: nextId(), dayOfWeek: 5, title: `Improve ${weakColor} Repertoire`,
      description: `Your ${weakColor} win rate lags behind. Study key ${weakColor === 'White' ? 'first-move options' : 'defensive systems'}.`,
      category: 'openings', estimatedMinutes: 20, completed: false,
      lichessUrl: studyUrl(`${weakColor} opening repertoire ${bracketLabel(bracket)}`),
      source: 'weakness', rationale: `${colorGap}% gap between your White and Black performance.`,
    });
  }

  if (modules.length === 0) {
    // Strategy/opening general work
    if (bracket === 'beginner' || bracket === 'intermediate') {
      modules.push({
        id: nextId(), dayOfWeek: 5, title: 'Opening Principles',
        description: 'Review core principles: control center, develop pieces, castle early, connect rooks.',
        category: 'openings', estimatedMinutes: 20, completed: false,
        lichessUrl: studyUrl('opening principles basics'), source: 'general',
      });
    } else {
      modules.push({
        id: nextId(), dayOfWeek: 5, title: 'Expand Repertoire',
        description: 'Study a new variation in your main opening to add depth and surprise value.',
        category: 'openings', estimatedMinutes: 20, completed: false,
        lichessUrl: studyUrl('opening repertoire advanced'), source: 'general',
      });
    }
  }

  // Strategy component
  modules.push({
    id: nextId(), dayOfWeek: 5, title: 'Strategic Concept',
    description: getStrategyTopic(bracket, weekNum),
    category: 'strategy', estimatedMinutes: 15, completed: false,
    lichessUrl: studyUrl('chess strategy'), source: 'general',
  });

  return modules;
}

function buildSaturdayModules(weekNum: number, nextId: () => string): DayModule[] {
  return [
    {
      id: nextId(), dayOfWeek: 6, title: 'Play a Classical Game',
      description: 'Play one 30+0 or 15+10 game. Take your time on every move — quality over quantity.',
      category: 'play', estimatedMinutes: 45, completed: false,
      lichessUrl: 'https://lichess.org/', source: 'general',
      rationale: 'Longer games build deeper calculation skills and strategic understanding.',
    },
    {
      id: nextId(), dayOfWeek: 6, title: 'Full Game Analysis',
      description: 'Thorough post-game analysis. Use the computer to check your key decisions.',
      category: 'review', estimatedMinutes: 20, completed: false,
      lichessUrl: 'https://lichess.org/analysis', source: 'own-game',
    },
  ];
}

function buildSundayModules(weekNum: number, bracket: RatingBracket, diagnosis: Diagnostic, nextId: () => string): DayModule[] {
  const modules: DayModule[] = [];

  modules.push({
    id: nextId(), dayOfWeek: 7, title: 'Week Review',
    description: `Review your Week ${weekNum} games. What patterns do you notice? What mistakes recur?`,
    category: 'review', estimatedMinutes: 15, completed: false,
    source: 'own-game',
    rationale: 'Identifying recurring patterns is key to breaking through plateaus.',
  });

  modules.push({
    id: nextId(), dayOfWeek: 7, title: 'Light Puzzles',
    description: 'Casual puzzle solving to end the week. Aim for fun, not intensity.',
    category: 'tactics', estimatedMinutes: 10, completed: false,
    lichessUrl: puzzleUrl('mix'), puzzleTheme: 'mix', source: 'general',
  });

  if (bracket === 'advanced' || bracket === 'expert') {
    modules.push({
      id: nextId(), dayOfWeek: 7, title: 'Study a Master Game',
      description: 'Find a master game in your favorite opening and study the strategic ideas.',
      category: 'strategy', estimatedMinutes: 20, completed: false,
      lichessUrl: 'https://lichess.org/study', source: 'general',
      rationale: 'Studying master games develops positional intuition critical at your level.',
    });
  }

  // Tilt management on some Sundays
  if (diagnosis.adaptiveFlags.addTiltManagement && weekNum % 2 === 0) {
    modules.push({
      id: nextId(), dayOfWeek: 7, title: 'Mental Check-in',
      description: 'Review your Chess OS tilt protocol. Rate your mental state 1-10. If below 7, take a rest day tomorrow.',
      category: 'review', estimatedMinutes: 5, completed: false,
      source: 'archetype',
      rationale: 'You show signs of tilt after losses. Regular mental check-ins help maintain consistency.',
    });
  }

  return modules;
}

// --- Chess OS Document ---

function buildChessOS(diagnostic: PlayerDiagnostic, diagnosis: Diagnostic): ChessOSDocument {
  const bracket = diagnostic.ratingBracket;

  // Opening repertoire from actual data
  const asWhite = diagnostic.openingsByColor.white.slice(0, 3).map((o) => ({
    name: o.name,
    studyUrl: studyUrl(o.name),
    notes: o.winRate >= 55 ? `Strong choice — ${o.winRate}% win rate` : `Needs work — ${o.winRate}% win rate`,
  }));
  const asBlack = diagnostic.openingsByColor.black.slice(0, 3).map((o) => ({
    name: o.name,
    studyUrl: studyUrl(o.name),
    notes: o.winRate >= 55 ? `Strong choice — ${o.winRate}% win rate` : `Needs work — ${o.winRate}% win rate`,
  }));

  // Endgame reference
  const endgameRef = getEndgameReferenceForBracket(bracket);

  // Pre-move ritual
  const preMoveRitual = [
    'Check opponent\'s last move — what changed? Any threats?',
    'Scan for checks, captures, and threats (CCT)',
    'Consider your plan — does it still make sense?',
    'Look at the whole board — not just where the action is',
    'Check your clock — manage time wisely',
  ];

  // Tilt protocol
  const tiltProtocol = [
    'After 2 consecutive losses, take a 15-minute break',
    'After 3 losses, stop playing rated games for the day — switch to puzzles',
    'Before queuing: rate your mental state 1-10. Below 6? Do puzzles instead',
    'Never rage-rematch — always take 60 seconds between games',
    'If tilted: solve 10 easy puzzles to rebuild confidence',
  ];

  if (diagnosis.adaptiveFlags.addTiltManagement) {
    tiltProtocol.push('Your data shows accuracy drops after losses. The break rule is especially important for you.');
  }

  return {
    openingRepertoire: { asWhite, asBlack },
    endgameReference: endgameRef,
    preMoveRitual,
    tiltProtocol,
  };
}

// --- Helpers ---

function puzzleUrl(theme: string): string {
  return `https://lichess.org/training/${theme}`;
}

function studyUrl(topic: string): string {
  return `https://lichess.org/study/search?q=${encodeURIComponent(topic)}`;
}

interface ThemeInfo { theme: string; label: string; description: string; rationale: string; }

function getTacticalThemes(bracket: RatingBracket, weekNum: number): { primary: ThemeInfo } {
  // Rotate themes across weeks
  const allThemes: Record<RatingBracket, ThemeInfo[]> = {
    beginner: [
      { theme: 'mateIn1', label: 'Mate in 1', description: 'Spot checkmate in one move.', rationale: 'Foundation of tactical vision.' },
      { theme: 'fork', label: 'Forks', description: 'Attack two pieces at once.', rationale: 'Most common tactical motif at your level.' },
      { theme: 'pin', label: 'Pins', description: 'Exploit pinned pieces.', rationale: 'Pins win material in many positions.' },
      { theme: 'mateIn2', label: 'Mate in 2', description: 'Find checkmate in two moves.', rationale: 'Builds calculation one step deeper.' },
    ],
    intermediate: [
      { theme: 'short', label: 'Short Combinations', description: '2-3 move tactical puzzles.', rationale: 'Build consistent 2-3 move calculation.' },
      { theme: 'pin', label: 'Pins', description: 'Exploit pinned pieces.', rationale: 'Pins are underestimated at this level.' },
      { theme: 'fork', label: 'Double Attacks', description: 'Fork and discovered attack puzzles.', rationale: 'Double attacks are the bread and butter of tactics.' },
      { theme: 'discoveredAttack', label: 'Discovered Attacks', description: 'Find hidden attacking lines.', rationale: 'Discovered attacks are hard to spot and very powerful.' },
    ],
    advanced: [
      { theme: 'long', label: 'Long Combinations', description: 'Multi-move tactical puzzles.', rationale: 'Push your calculation depth.' },
      { theme: 'sacrifice', label: 'Sacrifices', description: 'Sacrificial combinations.', rationale: 'Learning when material investment pays off.' },
      { theme: 'discoveredAttack', label: 'Discovered Attacks', description: 'Advanced discovered attack motifs.', rationale: 'Complex discovered attacks separate levels.' },
      { theme: 'deflection', label: 'Deflection', description: 'Deflect defending pieces.', rationale: 'Critical for breaking through solid defenses.' },
    ],
    expert: [
      { theme: 'veryLong', label: 'Deep Calculations', description: 'Complex long calculations.', rationale: 'Maximum calculation depth training.' },
      { theme: 'sacrifice', label: 'Sacrifices', description: 'Complex sacrificial themes.', rationale: 'Advanced sacrifice evaluation.' },
      { theme: 'deflection', label: 'Deflection & Decoy', description: 'Advanced piece displacement themes.', rationale: 'Sophisticated tactical patterns.' },
      { theme: 'interference', label: 'Interference', description: 'Break communication between pieces.', rationale: 'Rare but decisive tactical motif.' },
    ],
  };

  const themes = allThemes[bracket];
  const idx = (weekNum - 1) % themes.length;
  return { primary: themes[idx] };
}

function getWeaknessTheme(diagnosis: Diagnostic): ThemeInfo | null {
  for (const w of diagnosis.weaknesses) {
    if (w.area === 'endgames') {
      return { theme: 'endgame', label: 'Endgame Tactics', description: 'Solve endgame-focused puzzles.', rationale: w.detail };
    }
    if (w.area === 'openings') {
      return { theme: 'opening', label: 'Opening Traps', description: 'Recognize common opening traps and tactics.', rationale: w.detail };
    }
    if (w.area === 'accuracy') {
      return { theme: 'middlegame', label: 'Middlegame Tactics', description: 'Find tactical shots in typical positions.', rationale: w.detail };
    }
    if (w.area === 'timeManagement') {
      return { theme: 'short', label: 'Quick Decisions', description: 'Practice making good decisions efficiently.', rationale: w.detail };
    }
  }
  return null;
}

function getEndgameStudy(bracket: RatingBracket, weekNum: number): { title: string; description: string; url: string; rationale: string } {
  const topics: Record<RatingBracket, { title: string; description: string; topic: string; rationale: string }[]> = {
    beginner: [
      { title: 'King & Pawn Basics', description: 'Learn opposition, key squares, and pawn promotion.', topic: 'king and pawn endgame basics', rationale: 'The foundation of all endgames.' },
      { title: 'Rook Checkmates', description: 'Practice checkmating with a rook.', topic: 'rook checkmate technique', rationale: 'Essential mating pattern.' },
      { title: 'Queen Checkmates', description: 'Efficient mating with a queen.', topic: 'queen checkmate technique', rationale: 'Must know for converting advantages.' },
      { title: 'Basic Pawn Endings', description: 'Passed pawns, pawn races, and the square rule.', topic: 'basic pawn endgame', rationale: 'Understanding pawn endings saves and wins games.' },
    ],
    intermediate: [
      { title: 'Rook Endgames: Lucena', description: 'The Lucena position — most important endgame technique.', topic: 'lucena position rook endgame', rationale: 'Knowing Lucena wins you countless games.' },
      { title: 'Rook Endgames: Philidor', description: 'Philidor defense — the key drawing technique.', topic: 'philidor position rook endgame', rationale: 'Saves half points in critical moments.' },
      { title: 'King Activity', description: 'Active king play in endgames.', topic: 'king activity endgame', rationale: 'The king is a fighting piece in the endgame.' },
      { title: 'Pawn Structures', description: 'Passed pawns, isolated pawns, pawn majority.', topic: 'pawn structure endgame', rationale: 'Understanding pawn structure guides your plans.' },
    ],
    advanced: [
      { title: 'Complex Rook Endings', description: 'Rook + pawn vs rook positions.', topic: 'complex rook endgame', rationale: 'The most common practical endgame type.' },
      { title: 'Opposite Bishops', description: 'Endgames with opposite-colored bishops.', topic: 'opposite color bishop endgame', rationale: 'Both attacking and drawing potential.' },
      { title: 'Rook vs Minor Piece', description: 'Rook vs bishop/knight technique.', topic: 'rook vs minor piece endgame', rationale: 'Common material imbalance to master.' },
      { title: 'Fortress Concepts', description: 'Drawing techniques in worse endgames.', topic: 'fortress endgame defense', rationale: 'Save half points from losing positions.' },
    ],
    expert: [
      { title: 'Theoretical Rook Endings', description: 'Deep rook endgame theory.', topic: 'theoretical rook endgame', rationale: 'Precise knowledge wins at this level.' },
      { title: 'Queen Endgames', description: 'Queen + pawn endgames.', topic: 'queen endgame theory', rationale: 'Tricky but important at top levels.' },
      { title: 'Complex Pawn Endings', description: 'Multi-pawn endgames with advanced concepts.', topic: 'complex pawn endgame', rationale: 'Concrete calculation in pawn races.' },
      { title: 'Minor Piece Endings', description: 'Bishop vs knight, same-colored bishops.', topic: 'minor piece endgame technique', rationale: 'Nuanced technique for practical play.' },
    ],
  };

  const list = topics[bracket];
  const idx = (weekNum - 1) % list.length;
  const item = list[idx];
  return { title: item.title, description: item.description, url: studyUrl(item.topic), rationale: item.rationale };
}

function getStrategyTopic(bracket: RatingBracket, weekNum: number): string {
  const topics: Record<RatingBracket, string[]> = {
    beginner: [
      'Learn about piece development — get all pieces out before attacking.',
      'Study pawn structure basics — isolated, doubled, and passed pawns.',
      'Practice king safety — when to castle and how to protect your king.',
      'Understand piece activity — place pieces on active, central squares.',
    ],
    intermediate: [
      'Study weak squares and outposts — how to exploit them.',
      'Learn about piece coordination — making your pieces work together.',
      'Practice prophylaxis — preventing your opponent\'s plans.',
      'Study typical pawn structures from your openings.',
    ],
    advanced: [
      'Study strategic sacrifices — exchange sacrifice concepts.',
      'Learn about dynamic vs static advantages.',
      'Practice converting small advantages into wins.',
      'Study complex pawn structures and their plans.',
    ],
    expert: [
      'Study prophylactic thinking — Petrosian style.',
      'Analyze complex positional sacrifices.',
      'Practice evaluation of positions with multiple imbalances.',
      'Study transition from middlegame to favorable endgame.',
    ],
  };
  const list = topics[bracket];
  return list[(weekNum - 1) % list.length];
}

function findWeakestOpening(diag: PlayerDiagnostic) {
  const all = [...diag.openingsByColor.white, ...diag.openingsByColor.black];
  return all.filter((o) => o.games >= 2).sort((a, b) => a.winRate - b.winRate)[0] || null;
}

function getEndgameReferenceForBracket(bracket: RatingBracket) {
  const refs: Record<RatingBracket, { topic: string; studyUrl: string; priority: 'high' | 'medium' | 'low' }[]> = {
    beginner: [
      { topic: 'King & Pawn Opposition', studyUrl: studyUrl('king pawn opposition'), priority: 'high' },
      { topic: 'Rook Checkmate', studyUrl: studyUrl('rook checkmate'), priority: 'high' },
      { topic: 'Queen Checkmate', studyUrl: studyUrl('queen checkmate'), priority: 'medium' },
    ],
    intermediate: [
      { topic: 'Lucena Position', studyUrl: studyUrl('lucena position'), priority: 'high' },
      { topic: 'Philidor Position', studyUrl: studyUrl('philidor position'), priority: 'high' },
      { topic: 'King Activity in Endgames', studyUrl: studyUrl('king activity endgame'), priority: 'medium' },
      { topic: 'Passed Pawns', studyUrl: studyUrl('passed pawn endgame'), priority: 'medium' },
    ],
    advanced: [
      { topic: 'Complex Rook Endings', studyUrl: studyUrl('complex rook endgame'), priority: 'high' },
      { topic: 'Opposite Color Bishops', studyUrl: studyUrl('opposite color bishops'), priority: 'medium' },
      { topic: 'Rook vs Minor Piece', studyUrl: studyUrl('rook vs minor piece'), priority: 'medium' },
      { topic: 'Fortress Concepts', studyUrl: studyUrl('fortress endgame'), priority: 'low' },
    ],
    expert: [
      { topic: 'Theoretical Rook Endings', studyUrl: studyUrl('theoretical rook endgame'), priority: 'high' },
      { topic: 'Queen Endgames', studyUrl: studyUrl('queen endgame'), priority: 'high' },
      { topic: 'Complex Pawn Endings', studyUrl: studyUrl('complex pawn endgame'), priority: 'medium' },
      { topic: 'Minor Piece Endings', studyUrl: studyUrl('minor piece endgame'), priority: 'medium' },
    ],
  };
  return refs[bracket];
}

function bracketLabel(bracket: RatingBracket): string {
  return bracket;
}
