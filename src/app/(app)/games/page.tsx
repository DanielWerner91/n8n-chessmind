'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { useChess, useGames } from '@/lib/ChessContext';
import GameCard from '@/components/GameCard';
import Colors from '@/lib/colors';

const FILTERS = ['All', 'Wins', 'Losses', 'Draws', 'Rapid', 'Blitz', 'Bullet'];

export default function GamesPage() {
  const router = useRouter();
  const { username } = useChess();
  const gamesQuery = useGames();
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredGames = useMemo(() => {
    const games = gamesQuery.data || [];
    switch (activeFilter) {
      case 'Wins': return games.filter((g) => g.result === 'win');
      case 'Losses': return games.filter((g) => g.result === 'loss');
      case 'Draws': return games.filter((g) => g.result === 'draw');
      case 'Rapid': return games.filter((g) => g.timeClass === 'rapid');
      case 'Blitz': return games.filter((g) => g.timeClass === 'blitz');
      case 'Bullet': return games.filter((g) => g.timeClass === 'bullet');
      default: return games;
    }
  }, [gamesQuery.data, activeFilter]);

  if (gamesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <h1 className="text-2xl font-extrabold text-white mb-1">Games</h1>
      <p className="text-text-secondary text-sm mb-4">Last 30 days</p>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border"
            style={{
              backgroundColor: activeFilter === filter ? Colors.gold : Colors.card,
              color: activeFilter === filter ? Colors.background : Colors.textSecondary,
              borderColor: activeFilter === filter ? Colors.gold : Colors.border,
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Game list */}
      {filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Swords size={48} className="text-text-tertiary mb-4" />
          <h3 className="text-white text-lg font-bold mb-1">
            {(gamesQuery.data || []).length === 0 ? 'No games found' : 'No matching games'}
          </h3>
          <p className="text-text-secondary text-sm">
            {(gamesQuery.data || []).length === 0
              ? 'Play some games and they\'ll appear here!'
              : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div>
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              username={username || ''}
              onPress={() => router.push(`/games/${game.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
