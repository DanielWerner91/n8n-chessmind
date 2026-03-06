'use client';

import { motion } from 'framer-motion';
import { Flame, Award } from 'lucide-react';
import Colors from '@/lib/colors';
import { NumberTicker } from '@/components/ui/number-ticker';
import { LEVEL_INFO, xpToNextLevel, TOTAL_BADGES } from '@/lib/gamification';
import type { GamificationState } from '@/lib/types';

interface ProgressHeaderProps {
  gamification: GamificationState;
}

export default function ProgressHeader({ gamification }: ProgressHeaderProps) {
  const levelInfo = LEVEL_INFO[gamification.level];
  const { current, needed, progress } = xpToNextLevel(gamification.xp);
  const isMaxLevel = needed === 0;
  const isStreakActive = gamification.streak.current > 0 &&
    gamification.streak.lastActivityDate === new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl p-3.5 mb-4" style={{ backgroundColor: Colors.surface }}>
      {/* Top row: Level + Streak + Badges */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* Level */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5"
        >
          <span className="text-lg">{levelInfo.icon}</span>
          <div>
            <p className="text-white text-xs font-bold" style={{ color: levelInfo.color }}>
              {levelInfo.label}
            </p>
            <p className="text-[9px]" style={{ color: Colors.textTertiary }}>
              Level
            </p>
          </div>
        </motion.div>

        <div className="flex-1" />

        {/* Streak */}
        <motion.div
          className="flex items-center gap-1"
          animate={isStreakActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >
          <Flame
            size={16}
            style={{ color: gamification.streak.current > 0 ? '#F59E0B' : Colors.textTertiary }}
          />
          <span
            className="text-sm font-bold"
            style={{ color: gamification.streak.current > 0 ? '#F59E0B' : Colors.textTertiary }}
          >
            {gamification.streak.current}
          </span>
          <span className="text-[9px]" style={{ color: Colors.textTertiary }}>day{gamification.streak.current !== 1 ? 's' : ''}</span>
        </motion.div>

        {/* Badges */}
        <div className="flex items-center gap-1">
          <Award size={14} style={{ color: Colors.gold }} />
          <span className="text-xs font-semibold" style={{ color: Colors.textSecondary }}>
            {gamification.badges.length}/{TOTAL_BADGES}
          </span>
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-medium" style={{ color: Colors.textTertiary }}>
            {isMaxLevel ? 'Max Level' : `${current} / ${needed} XP`}
          </span>
          <span className="text-[10px] font-bold" style={{ color: Colors.gold }}>
            <NumberTicker value={gamification.xp} /> XP
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: Colors.border }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${isMaxLevel ? 100 : progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${Colors.gold}, ${Colors.goldLight})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
