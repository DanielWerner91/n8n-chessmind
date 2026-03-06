import { ChessGame, ChessProfile, ChessStats, GameResult, TimeClass, Platform } from './types';

const CHESSCOM_BASE = 'https://api.chess.com/pub';
const LICHESS_BASE = 'https://lichess.org/api';

export async function fetchProfile(username: string, platform: Platform): Promise<ChessProfile> {
  if (platform === 'lichess') return fetchLichessProfile(username);
  return fetchChessComProfile(username);
}

export async function fetchStats(username: string, platform: Platform): Promise<ChessStats> {
  if (platform === 'lichess') return fetchLichessStats(username);
  return fetchChessComStats(username);
}

export async function fetchGames(username: string, platform: Platform): Promise<ChessGame[]> {
  if (platform === 'lichess') return fetchLichessGames(username);
  return fetchChessComGames(username);
}

async function fetchChessComProfile(username: string): Promise<ChessProfile> {
  const res = await fetch(`${CHESSCOM_BASE}/player/${username}`);
  if (!res.ok) throw new Error('Player not found on chess.com. Please check the username.');
  const data = await res.json();
  return {
    username: data.username,
    avatar: data.avatar || '',
    url: data.url || '',
    joined: data.joined || 0,
  };
}

async function fetchLichessProfile(username: string): Promise<ChessProfile> {
  const res = await fetch(`${LICHESS_BASE}/user/${username}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Player not found on Lichess. Please check the username.');
  const data = await res.json();
  return {
    username: data.username || data.id,
    avatar: '',
    url: `https://lichess.org/@/${data.username || data.id}`,
    joined: data.createdAt ? Math.floor(data.createdAt / 1000) : 0,
  };
}

async function fetchChessComStats(username: string): Promise<ChessStats> {
  const res = await fetch(`${CHESSCOM_BASE}/player/${username}/stats`);
  if (!res.ok) throw new Error('Could not fetch player stats.');
  const data = await res.json();
  return {
    chess_rapid: data.chess_rapid,
    chess_blitz: data.chess_blitz,
    chess_bullet: data.chess_bullet,
  };
}

async function fetchLichessStats(username: string): Promise<ChessStats> {
  const res = await fetch(`${LICHESS_BASE}/user/${username}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Could not fetch Lichess stats.');
  const data = await res.json();
  const perfs = data.perfs || {};

  const mapPerf = (perf: { rating?: number; games?: number } | undefined) => {
    if (!perf) return undefined;
    return {
      last: { rating: perf.rating || 0, date: 0 },
      best: perf.rating ? { rating: perf.rating, date: 0 } : undefined,
      record: { win: perf.games || 0, loss: 0, draw: 0 },
    };
  };

  return {
    chess_rapid: mapPerf(perfs.rapid),
    chess_blitz: mapPerf(perfs.blitz),
    chess_bullet: mapPerf(perfs.bullet),
  };
}

async function fetchChessComGames(username: string): Promise<ChessGame[]> {
  const allGames: ChessGame[] = [];
  const now = new Date();

  const monthsToFetch = [
    { year: now.getFullYear(), month: now.getMonth() + 1 },
  ];
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  monthsToFetch.push({ year: prevDate.getFullYear(), month: prevDate.getMonth() + 1 });

  for (const { year, month } of monthsToFetch) {
    const monthStr = String(month).padStart(2, '0');
    try {
      const res = await fetch(`${CHESSCOM_BASE}/player/${username}/games/${year}/${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        const parsed = parseChessComGames(data.games || [], username);
        allGames.push(...parsed);
      }
    } catch {
      // skip failed months
    }
  }

  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  return allGames
    .filter((g) => g.endTime >= thirtyDaysAgo)
    .sort((a, b) => b.endTime - a.endTime);
}

async function fetchLichessGames(username: string): Promise<ChessGame[]> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const url = `${LICHESS_BASE}/games/user/${username}?since=${thirtyDaysAgo}&max=100&pgnInJson=true&opening=true&clocks=true&evals=true`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/x-ndjson' } });
    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.trim().split('\n').filter((l) => l.length > 0);
    const games: ChessGame[] = [];

    for (const line of lines) {
      try {
        const g = JSON.parse(line);
        const isWhite = g.players?.white?.user?.name?.toLowerCase() === username.toLowerCase();
        const userResult = mapLichessResult(g.winner, isWhite ? 'white' : 'black', g.status);
        const timeClass = mapLichessSpeed(g.speed || g.perf) as TimeClass;
        const moves = (g.moves || '').split(' ').filter((m: string) => m.length > 0);

        games.push({
          id: g.id || `lichess-${games.length}`,
          white: {
            username: g.players?.white?.user?.name || 'Anonymous',
            rating: g.players?.white?.rating || 0,
            result: g.winner === 'white' ? 'win' : g.winner === 'black' ? 'loss' : 'draw',
          },
          black: {
            username: g.players?.black?.user?.name || 'Anonymous',
            rating: g.players?.black?.rating || 0,
            result: g.winner === 'black' ? 'win' : g.winner === 'white' ? 'loss' : 'draw',
          },
          pgn: g.pgn || '',
          timeControl: g.clock ? `${g.clock.initial / 60}+${g.clock.increment}` : '',
          timeClass,
          endTime: g.lastMoveAt ? Math.floor(g.lastMoveAt / 1000) : 0,
          url: `https://lichess.org/${g.id}`,
          opening: g.opening?.name || 'Unknown Opening',
          result: userResult,
          userColor: isWhite ? 'white' : 'black',
          accuracy: isWhite ? g.players?.white?.analysis?.accuracy : g.players?.black?.analysis?.accuracy,
          opponentAccuracy: isWhite ? g.players?.black?.analysis?.accuracy : g.players?.white?.analysis?.accuracy,
          moves,
          moveCount: Math.ceil(moves.length / 2),
        });
      } catch {
        // skip malformed lines
      }
    }

    return games.sort((a, b) => b.endTime - a.endTime);
  } catch {
    return [];
  }
}

function mapLichessResult(winner: string | undefined, userColor: string, status: string): GameResult {
  if (status === 'draw' || status === 'stalemate') return 'draw';
  if (!winner) return 'draw';
  return winner === userColor ? 'win' : 'loss';
}

function mapLichessSpeed(speed: string): string {
  switch (speed) {
    case 'ultraBullet':
    case 'bullet': return 'bullet';
    case 'blitz': return 'blitz';
    case 'rapid':
    case 'classical': return 'rapid';
    case 'correspondence': return 'daily';
    default: return 'rapid';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseChessComGames(rawGames: any[], username: string): ChessGame[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rawGames.map((g: any, index: number) => {
    const isWhite = g.white?.username?.toLowerCase() === username.toLowerCase();
    const userResult = isWhite ? g.white?.result : g.black?.result;
    const userAccuracy = isWhite ? g.accuracies?.white : g.accuracies?.black;
    const opponentAccuracy = isWhite ? g.accuracies?.black : g.accuracies?.white;
    const result = mapResult(userResult);
    const opening = extractOpening(g.pgn || '');
    const moves = extractMoves(g.pgn || '');

    return {
      id: g.uuid || `game-${index}-${g.end_time}`,
      white: {
        username: g.white?.username || 'Unknown',
        rating: g.white?.rating || 0,
        result: g.white?.result || '',
      },
      black: {
        username: g.black?.username || 'Unknown',
        rating: g.black?.rating || 0,
        result: g.black?.result || '',
      },
      pgn: g.pgn || '',
      timeControl: g.time_control || '',
      timeClass: (g.time_class as TimeClass) || 'rapid',
      endTime: g.end_time || 0,
      url: g.url || '',
      opening,
      result,
      userColor: isWhite ? ('white' as const) : ('black' as const),
      accuracy: userAccuracy,
      opponentAccuracy,
      moves,
      moveCount: Math.ceil(moves.length / 2),
    };
  });
}

function mapResult(result: string): GameResult {
  if (!result) return 'draw';
  const winResults = ['win'];
  const drawResults = ['stalemate', 'agreed', 'repetition', 'insufficient', '50move', 'timevsinsufficient'];
  if (winResults.includes(result)) return 'win';
  if (drawResults.includes(result)) return 'draw';
  return 'loss';
}

function extractOpening(pgn: string): string {
  const ecoMatch = pgn.match(/\[ECOUrl\s+"[^"]*\/([^"]+)"\]/);
  if (ecoMatch) return ecoMatch[1].replace(/-/g, ' ').replace(/\.\.\./g, '');
  const openingMatch = pgn.match(/\[Opening\s+"([^"]+)"\]/);
  return openingMatch ? openingMatch[1] : 'Unknown Opening';
}

function extractMoves(pgn: string): string[] {
  const moveSection = pgn.replace(/\[.*?\]\s*/g, '').trim();
  const cleaned = moveSection.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '').trim();
  return cleaned
    .replace(/\d+\.\s*/g, '')
    .replace(/\{[^}]*\}/g, '')
    .split(/\s+/)
    .filter((m) => m.length > 0 && !m.startsWith('{'));
}
