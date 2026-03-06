'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';
import { Platform } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { connectMutation } = useChess();
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [username, setUsername] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    setError('');
    connectMutation.mutate(
      { name: username.trim(), plat: platform },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.replace('/dashboard'), 1000);
        },
        onError: (err) => {
          setError(err.message || 'Could not find that player. Please check the username.');
        },
      }
    );
  };

  const platformUrl = platform === 'chess.com' ? 'https://www.chess.com/login' : 'https://lichess.org/login';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(to bottom, ${Colors.background}, ${Colors.surface}, ${Colors.card})` }}>
        <div className="animate-scale-in text-center">
          <div className="text-6xl mb-4">&#9822;</div>
          <h2 className="text-2xl font-bold text-gold">Connected!</h2>
          <p className="text-text-secondary mt-2">Loading your chess data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(to bottom, ${Colors.background}, ${Colors.surface}, ${Colors.card})` }}
    >
      <div className="w-full max-w-md">
        {/* Hero */}
        <div className="animate-hero text-center mb-8">
          <div className="text-7xl mb-4">&#9822;</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">ChessMind</h1>
          <p className="text-text-secondary text-base">
            Your personal AI chess coach.{'\n'}Connect your account to get started.
          </p>
        </div>

        {/* Form */}
        <div className="animate-form">
          {/* Platform toggle */}
          <div className="flex rounded-2xl overflow-hidden mb-6 border" style={{ borderColor: Colors.border }}>
            {(['chess.com', 'lichess'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPlatform(p); setError(''); }}
                className="flex-1 py-3.5 text-center font-semibold transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: platform === p ? Colors.gold : Colors.surface,
                  color: platform === p ? Colors.background : Colors.textSecondary,
                }}
              >
                <span className="text-lg">{p === 'chess.com' ? '♚' : '♞'}</span>
                {p === 'chess.com' ? 'Chess.com' : 'Lichess'}
              </button>
            ))}
          </div>

          {/* Username input */}
          <div className="mb-4">
            <label className="block text-text-secondary text-sm font-medium mb-2 uppercase tracking-wide">
              {platform === 'chess.com' ? 'Chess.com' : 'Lichess'} Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder={platform === 'chess.com' ? 'e.g. MagnusCarlsen' : 'e.g. DrNykterstein'}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-text-tertiary outline-none border focus:border-gold transition-colors"
              style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          {error && (
            <p className="text-loss text-sm mb-4 px-1">{error}</p>
          )}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={connectMutation.isPending || !username.trim()}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: Colors.gold, color: Colors.background }}
          >
            {connectMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect Profile'
            )}
          </button>

          {/* Help section */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full mt-4 py-2 text-text-secondary text-sm flex items-center justify-center gap-1 hover:text-white transition-colors"
          >
            Need help finding your username?
            <ChevronDown size={14} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
          </button>

          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: showHelp ? '200px' : '0' }}
          >
            <div className="p-4 rounded-xl mt-2 border" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
              <p className="text-text-secondary text-sm mb-3">
                {platform === 'chess.com'
                  ? 'Your username is shown in the top-right corner when logged in to Chess.com.'
                  : 'Your username is shown in the top-right corner when logged in to Lichess.'}
              </p>
              <button
                onClick={() => window.open(platformUrl, '_blank')}
                className="flex items-center gap-2 text-gold text-sm font-medium hover:opacity-80"
              >
                <ExternalLink size={14} />
                Open {platform === 'chess.com' ? 'Chess.com' : 'Lichess'} Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
