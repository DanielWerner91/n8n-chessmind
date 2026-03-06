'use client';

import React, { useMemo } from 'react';
import Colors from '@/lib/colors';

interface Props {
  wins: number;
  draws: number;
  losses: number;
  size?: number;
}

export default function DonutChart({ wins, draws, losses, size = 140 }: Props) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = wins + draws + losses;

  const segments = useMemo(() => {
    if (total === 0) return [];
    const winPct = wins / total;
    const drawPct = draws / total;
    const lossPct = losses / total;

    let offset = 0;
    const segs = [];

    if (winPct > 0) {
      segs.push({
        color: Colors.win,
        dashArray: `${circumference * winPct} ${circumference * (1 - winPct)}`,
        dashOffset: -offset,
      });
      offset += circumference * winPct;
    }
    if (drawPct > 0) {
      segs.push({
        color: Colors.draw,
        dashArray: `${circumference * drawPct} ${circumference * (1 - drawPct)}`,
        dashOffset: -offset,
      });
      offset += circumference * drawPct;
    }
    if (lossPct > 0) {
      segs.push({
        color: Colors.loss,
        dashArray: `${circumference * lossPct} ${circumference * (1 - lossPct)}`,
        dashOffset: -offset,
      });
    }
    return segs;
  }, [wins, draws, losses, total, circumference]);

  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={center} cy={center} r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center} cy={center} r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${center}, ${center})`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{winRate}%</span>
        <span className="text-xs text-text-secondary mt-0.5">Win Rate</span>
      </div>
    </div>
  );
}
