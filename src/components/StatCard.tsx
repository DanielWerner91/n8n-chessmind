'use client';

import Colors from '@/lib/colors';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function StatCard({ title, value, subtitle, icon, accentColor }: Props) {
  return (
    <div
      className="rounded-2xl p-4 border flex-1"
      style={{ backgroundColor: Colors.card, borderColor: Colors.border }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span>{icon}</span>}
        <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">{title}</span>
      </div>
      <span className="text-3xl font-bold" style={{ color: accentColor || Colors.gold }}>
        {value}
      </span>
      {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
    </div>
  );
}
