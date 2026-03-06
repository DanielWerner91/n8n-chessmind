'use client';

import { ChessGame } from '@/lib/types';
import { Clock, Zap, Timer } from 'lucide-react';
import Colors from '@/lib/colors';

interface Props {
  game: ChessGame;
  username: string;
  onPress: () => void;
}

const resultLabels: Record<string, string> = { win: 'W', loss: 'L', draw: 'D' };
const resultColors: Record<string, string> = {
  win: Colors.win,
  loss: Colors.loss,
  draw: Colors.draw,
};

function getTimeIcon(timeClass: string) {
  switch (timeClass) {
    case 'bullet': return <Zap size={12} className="text-text-tertiary" />;
    case 'blitz': return <Timer size={12} className="text-text-tertiary" />;
    default: return <Clock size={12} className="text-text-tertiary" />;
  }
}

export default function GameCard({ game, username, onPress }: Props) {
  const opponent = game.white.username.toLowerCase() === username.toLowerCase()
    ? game.black : game.white;
  const date = new Date(game.endTime * 1000);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <button
      onClick={onPress}
      className="w-full flex items-center p-3.5 mb-2.5 rounded-2xl border transition-all text-left
                 hover:opacity-90 active:scale-[0.98]"
      style={{ backgroundColor: Colors.card, borderColor: Colors.border }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0"
        style={{ backgroundColor: resultColors[game.result] }}
      >
        <span className="text-white font-bold text-sm">{resultLabels[game.result]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white text-[15px] font-semibold truncate">vs {opponent.username}</span>
          <span className="text-text-secondary text-sm shrink-0">({opponent.rating})</span>
        </div>
        <p className="text-text-secondary text-sm mt-0.5 truncate">{game.opening}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {getTimeIcon(game.timeClass)}
          <span className="text-text-tertiary text-xs capitalize">{game.timeClass}</span>
          <span className="text-text-tertiary text-xs">&middot;</span>
          <span className="text-text-tertiary text-xs">{game.moveCount} moves</span>
          <span className="text-text-tertiary text-xs">&middot;</span>
          <span className="text-text-tertiary text-xs">{dateStr}</span>
        </div>
      </div>
      {game.accuracy !== undefined && (
        <div className="flex flex-col items-center ml-2 px-2.5 py-1.5 rounded-xl" style={{ backgroundColor: Colors.surface }}>
          <span className="text-gold text-sm font-bold">{game.accuracy.toFixed(1)}%</span>
          <span className="text-text-tertiary text-[10px] mt-0.5">acc</span>
        </div>
      )}
    </button>
  );
}
