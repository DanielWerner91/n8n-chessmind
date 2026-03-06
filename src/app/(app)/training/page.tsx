'use client';

import { useState, useMemo } from 'react';
import { GraduationCap, Square, CheckSquare } from 'lucide-react';
import { useChess } from '@/lib/ChessContext';
import Colors from '@/lib/colors';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  tactics: { bg: 'rgba(239,83,80,0.15)', text: Colors.loss, border: Colors.loss },
  openings: { bg: 'rgba(59,130,246,0.15)', text: Colors.accent, border: Colors.accent },
  endgames: { bg: 'rgba(244,197,66,0.15)', text: Colors.gold, border: Colors.gold },
  strategy: { bg: 'rgba(76,175,80,0.15)', text: Colors.win, border: Colors.win },
  review: { bg: 'rgba(120,144,156,0.15)', text: Colors.draw, border: Colors.draw },
};

export default function TrainingPage() {
  const { trainingTasks, initTrainingMutation, toggleTask } = useChess();
  const [selectedDay, setSelectedDay] = useState(1);

  const completedCount = trainingTasks.filter((t) => t.completed).length;
  const totalCount = trainingTasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const dayTasks = useMemo(() => {
    return trainingTasks.filter((t) => t.day === selectedDay);
  }, [trainingTasks, selectedDay]);

  const dayCompletion = useMemo(() => {
    const map = new Map<number, boolean>();
    for (let d = 1; d <= 7; d++) {
      const tasks = trainingTasks.filter((t) => t.day === d);
      map.set(d, tasks.length > 0 && tasks.every((t) => t.completed));
    }
    return map;
  }, [trainingTasks]);

  if (trainingTasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-10 text-center">
        <GraduationCap size={56} className="text-text-tertiary mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">No Training Plan</h2>
        <p className="text-text-secondary text-sm mb-6">
          Generate a personalized 7-day training plan based on your playing style and weaknesses.
        </p>
        <button
          onClick={() => initTrainingMutation.mutate()}
          disabled={initTrainingMutation.isPending}
          className="py-3.5 px-7 rounded-2xl font-bold transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
          style={{ backgroundColor: Colors.gold, color: Colors.background }}
        >
          {initTrainingMutation.isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <GraduationCap size={18} />
              Generate Training Plan
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <h1 className="text-2xl font-extrabold text-white mb-1">Training</h1>
      <p className="text-text-secondary text-sm mb-4">7-Day Improvement Plan</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-surface rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-text-secondary text-xs text-right">{completedCount}/{totalCount} completed</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 mb-6">
        {DAY_LABELS.map((label, i) => {
          const day = i + 1;
          const isActive = day === selectedDay;
          const isComplete = dayCompletion.get(day);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="flex-1 flex flex-col items-center py-2.5 rounded-xl gap-1 transition-colors"
              style={{
                backgroundColor: isActive ? Colors.gold : Colors.card,
                borderWidth: isComplete && !isActive ? 1 : 0,
                borderColor: Colors.win,
                borderStyle: 'solid',
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: isActive ? Colors.background : Colors.textSecondary }}
              >
                {label}
              </span>
              <div
                className="w-1 h-1 rounded-full"
                style={{
                  backgroundColor: isActive ? Colors.background : isComplete ? Colors.win : Colors.textTertiary,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Day title */}
      <h3 className="text-white text-base font-bold mb-3">
        {DAY_LABELS[selectedDay - 1]} - Day {selectedDay}
      </h3>

      {/* Tasks */}
      {dayTasks.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-text-tertiary text-sm">No tasks for this day</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dayTasks.map((task) => {
            const cat = categoryColors[task.category] || categoryColors.review;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex gap-3 p-3.5 rounded-2xl border text-left transition-all"
                style={{
                  backgroundColor: Colors.card,
                  borderColor: task.completed ? Colors.win : Colors.border,
                  opacity: task.completed ? 0.7 : 1,
                }}
              >
                <div className="pt-0.5">
                  {task.completed ? (
                    <CheckSquare size={20} className="text-win" />
                  ) : (
                    <Square size={20} className="text-text-tertiary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border"
                      style={{ backgroundColor: cat.bg, color: cat.text, borderColor: cat.border }}
                    >
                      {task.category}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-semibold mb-1 ${task.completed ? 'line-through text-text-secondary' : 'text-white'}`}
                  >
                    {task.title}
                  </p>
                  <p className="text-text-secondary text-xs">{task.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
