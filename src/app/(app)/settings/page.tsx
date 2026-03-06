'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Link2, RefreshCw, Bell, ChevronRight,
  LogOut, Trash2, Crown, Shield,
} from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="w-11 h-6 rounded-full transition-colors relative"
      style={{ backgroundColor: value ? Colors.gold : Colors.surface }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
        style={{ left: value ? '22px' : '2px' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { username, platform, disconnect, analysisReport, trainingTasks } = useChess();
  const [autoSync, setAutoSync] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleDisconnect = useCallback(() => {
    if (window.confirm('This will remove all your synced data, analysis reports, and training plans. Continue?')) {
      disconnect().then(() => router.replace('/onboarding'));
    }
  }, [disconnect, router]);

  const handleClearData = useCallback(() => {
    if (window.confirm('This will clear your AI analysis report and training plan. Your game data will remain.')) {
      localStorage.removeItem('chessmind_analysis');
      localStorage.removeItem('chessmind_training');
      window.location.reload();
    }
  }, []);

  return (
    <div className="px-5 pt-4 pb-8">
      <h1 className="text-2xl font-extrabold text-white mb-6">Settings</h1>

      {/* Profile card */}
      <div className="rounded-2xl p-4 border flex items-center gap-3.5 mb-6" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="w-13 h-13 rounded-full flex items-center justify-center border-2" style={{ borderColor: Colors.gold, backgroundColor: Colors.surface }}>
          <Crown size={28} className="text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-base font-bold">{username || 'Not connected'}</p>
          <p className="text-text-secondary text-sm mt-0.5">{platform}</p>
        </div>
        <div className="px-3 py-1 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
          <span className="text-text-secondary text-xs font-bold">FREE</span>
        </div>
      </div>

      {/* Account section */}
      <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Account</p>
      <div className="rounded-2xl border overflow-hidden mb-5" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
              <Link2 size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Connected Account</p>
              <p className="text-text-tertiary text-xs mt-0.5">{platform} &middot; {username}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-tertiary" />
        </div>
        <div className="h-px ml-14" style={{ backgroundColor: Colors.border }} />
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244,197,66,0.15)' }}>
              <RefreshCw size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Auto-Sync</p>
              <p className="text-text-tertiary text-xs mt-0.5">Sync games daily</p>
            </div>
          </div>
          <Toggle value={autoSync} onChange={setAutoSync} />
        </div>
        <div className="h-px ml-14" style={{ backgroundColor: Colors.border }} />
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(76,175,80,0.15)' }}>
              <Bell size={16} className="text-win" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Training Reminders</p>
              <p className="text-text-tertiary text-xs mt-0.5">Daily notifications</p>
            </div>
          </div>
          <Toggle value={notifications} onChange={setNotifications} />
        </div>
      </div>

      {/* Subscription */}
      <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Subscription</p>
      <button
        className="w-full rounded-2xl p-4 border flex items-center justify-between gap-3 mb-5 text-left hover:opacity-90 transition-opacity"
        style={{ backgroundColor: Colors.card, borderColor: Colors.gold }}
      >
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-gold" />
          <div>
            <p className="text-gold text-sm font-bold">Upgrade to Pro</p>
            <p className="text-text-secondary text-xs mt-0.5">Full analysis, custom training, unlimited games</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gold" />
      </button>

      {/* Data */}
      <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Data</p>
      <div className="rounded-2xl border overflow-hidden mb-5" style={{ backgroundColor: Colors.card, borderColor: Colors.border }}>
        <div className="flex items-center p-3.5 gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <User size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Analysis Reports</p>
            <p className="text-text-tertiary text-xs mt-0.5">
              {analysisReport ? '1 report generated' : 'No reports yet'}
            </p>
          </div>
        </div>
        <div className="h-px ml-14" style={{ backgroundColor: Colors.border }} />
        <div className="flex items-center p-3.5 gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244,197,66,0.15)' }}>
            <RefreshCw size={16} className="text-gold" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Training Tasks</p>
            <p className="text-text-tertiary text-xs mt-0.5">
              {trainingTasks.length > 0
                ? `${trainingTasks.filter((t) => t.completed).length}/${trainingTasks.length} completed`
                : 'No plan yet'}
            </p>
          </div>
        </div>
        <div className="h-px ml-14" style={{ backgroundColor: Colors.border }} />
        <button onClick={handleClearData} className="w-full flex items-center p-3.5 gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,83,80,0.15)' }}>
            <Trash2 size={16} className="text-loss" />
          </div>
          <p className="text-loss text-sm font-medium">Clear Analysis & Training Data</p>
        </button>
      </div>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border transition-opacity hover:opacity-80"
        style={{ borderColor: Colors.loss }}
      >
        <LogOut size={18} className="text-loss" />
        <span className="text-loss text-sm font-semibold">Disconnect & Sign Out</span>
      </button>

      <p className="text-text-tertiary text-xs text-center mt-6">ChessMind v1.0.0</p>
    </div>
  );
}
