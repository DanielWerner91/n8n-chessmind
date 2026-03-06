'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Clock, Zap, Timer, BookOpen } from 'lucide-react';
import { useChess, useGames } from '@/lib/ChessContext';
import ChessBoard from '@/components/ChessBoard';
import Colors from '@/lib/colors';

const resultLabels = { win: 'Victory', loss: 'Defeat', draw: 'Draw' };
const resultColors = { win: Colors.win, loss: Colors.loss, draw: Colors.draw };

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { username } = useChess();
  const gamesQuery = useGames();

  const game = useMemo(() => {
    return (gamesQuery.data || []).find((g) => g.id === params.gameId);
  }, [gamesQuery.data, params.gameId]);

  if (gamesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="px-5 pt-4 pb-8 text-center py-20">
        <p className="text-text-secondary">Game not found</p>
        <button onClick={() => router.push('/games')} className="text-gold mt-2 hover:opacity-80">
          Back to Games
        </button>
      </div>
    );
  }

  const opponent = game.white.username.toLowerCase() === (username || '').toLowerCase()
    ? game.black : game.white;
  const userPlayer = game.white.username.toLowerCase() === (username || '').toLowerCase()
    ? game.white : game.black;
  const date = new Date(game.endTime * 1000);
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const TimeIcon = game.timeClass === 'bullet' ? Zap : game.timeClass === 'blitz' ? Timer : Clock;

  const movePairs = useMemo(() => {
    const pairs: { num: number; white: string; black?: string }[] = [];
    for (let i = 0; i < game.moves.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: game.moves[i],
        black: game.moves[i + 1],
      });
    }
    return pairs.slice(0, 30);
  }, [game.moves]);

  const remainingMoves = Math.max(0, Math.ceil(game.moves.length / 2) - 30);

  // AI Commentary (template-based, same as mobile)
  const commentary = [
    {
      title: 'Opening Phase',
      text: `The ${game.opening} led to a ${game.result === 'win' ? 'favorable' : game.result === 'loss' ? 'challenging' : 'balanced'} middlegame position.`,
    },
    {
      title: 'Critical Moment',
      text: `Around move ${Math.min(20, Math.floor(game.moveCount / 2))}, the position reached a critical juncture where ${game.result === 'win' ? 'you found the best continuation' : 'there were opportunities for improvement'}.`,
    },
    {
      title: 'Endgame',
      text: game.moveCount > 40
        ? `The game extended to ${game.moveCount} moves, indicating a complex endgame phase.`
        : `The game concluded in ${game.moveCount} moves, a relatively ${game.moveCount < 25 ? 'short' : 'standard-length'} encounter.`,
    },
  ];

  return (
    <div className="px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-card transition-colors">
          <X size={20} className="text-text-secondary" />
        </button>
        <div
          className="px-4 py-1.5 rounded-full font-bold text-sm text-white"
          style={{ backgroundColor: resultColors[game.result] }}
        >
          {resultLabels[game.result]}
        </div>
      </div>

      {/* Players */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-white font-semibold">{userPlayer.username}</p>
            <p className="text-gold text-sm">{userPlayer.rating}</p>
          </div>
          <span className="text-text-tertiary font-bold mx-4">vs</span>
          <div className="text-center flex-1">
            <p className="text-white font-semibold">{opponent.username}</p>
            <p className="text-text-secondary text-sm">{opponent.rating}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-text-tertiary text-xs">
          <TimeIcon size={12} />
          <span className="capitalize">{game.timeClass}</span>
          <span>&middot;</span>
          <span>{dateStr}</span>
          <span>&middot;</span>
          <span>{game.moveCount} moves</span>
        </div>
      </div>

      {/* Chess Board */}
      <div className="mb-4">
        <ChessBoard size={Math.min(360, 320)} />
      </div>

      {/* Opening */}
      <div className="rounded-2xl p-3 border mb-4 flex items-center gap-2" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <BookOpen size={16} className="text-gold" />
        <span className="text-gold text-sm font-medium">{game.opening}</span>
      </div>

      {/* Accuracy */}
      {(game.accuracy !== undefined || game.opponentAccuracy !== undefined) && (
        <div className="flex gap-3 mb-4">
          {game.accuracy !== undefined && (
            <div className="flex-1 rounded-2xl p-3 border text-center" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
              <p className="text-text-secondary text-xs mb-1">Your Accuracy</p>
              <p className="text-gold text-xl font-bold">{game.accuracy.toFixed(1)}%</p>
            </div>
          )}
          {game.opponentAccuracy !== undefined && (
            <div className="flex-1 rounded-2xl p-3 border text-center" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
              <p className="text-text-secondary text-xs mb-1">Opponent Accuracy</p>
              <p className="text-text-secondary text-xl font-bold">{game.opponentAccuracy.toFixed(1)}%</p>
            </div>
          )}
        </div>
      )}

      {/* AI Commentary */}
      <div className="mb-4">
        <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">AI Commentary</h3>
        <div className="space-y-2">
          {commentary.map((c) => (
            <div key={c.title} className="rounded-xl p-3 border" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
              <p className="text-gold text-xs font-semibold mb-1">{c.title}</p>
              <p className="text-text-secondary text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Move List */}
      <div>
        <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Moves</h3>
        <div className="rounded-2xl p-3 border" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {movePairs.map((pair) => (
              <div key={pair.num} className="flex items-center gap-1 text-sm">
                <span className="text-text-tertiary w-6 text-right">{pair.num}.</span>
                <span className="text-white font-mono">{pair.white}</span>
                {pair.black && <span className="text-text-secondary font-mono">{pair.black}</span>}
              </div>
            ))}
          </div>
          {remainingMoves > 0 && (
            <p className="text-text-tertiary text-xs mt-2 text-center">+{remainingMoves} more moves</p>
          )}
        </div>
      </div>
    </div>
  );
}
