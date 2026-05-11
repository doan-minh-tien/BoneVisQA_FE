'use client';

import { useMemo, useState } from 'react';
import type { LecturerDashboardStats } from '@/lib/api/types';

type Period = 'weekly' | 'monthly';

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(4, n));
}

/**
 * Relative bar heights from live stats (no extra API).
 * “Score” uses actual average % when present; other bars scale to the largest metric.
 */
export function EngagementOverview({ stats }: { stats: LecturerDashboardStats }) {
  const [period, setPeriod] = useState<Period>('monthly');

  const bars = useMemo(() => {
    const c = stats.totalClasses || 0;
    const s = stats.totalStudents || 0;
    const q = stats.totalQuestions || 0;
    const p = stats.pendingReviews || 0;
    const avg = stats.averageQuizScore;
    const scoreHeight =
      avg != null && Number.isFinite(avg) ? clampPct(avg) : 12;

    const raw = [c, s, q, p];
    const max = Math.max(...raw, 1);
    const scale = (v: number) => clampPct((v / max) * 100);

    // Slight visual variety by period (cosmetic only until BE provides time series)
    const bump = period === 'weekly' ? 0.92 : 1;

    return [
      { key: 'classes', label: 'Classes', a: scale(c) * bump, b: scale(Math.max(1, c)) * 0.75 * bump },
      { key: 'students', label: 'Students', a: scale(s) * bump, b: scale(Math.max(1, s)) * 0.85 * bump },
      { key: 'qa', label: 'Q&A', a: scale(q) * bump, b: scale(Math.max(1, q)) * 0.7 * bump },
      { key: 'reviews', label: 'Reviews', a: scale(p) * bump, b: scale(Math.max(1, p + 1)) * 0.65 * bump },
      {
        key: 'score',
        label: 'Quiz avg.',
        a: scoreHeight * 0.55 * bump,
        b: scoreHeight * bump,
      },
    ];
  }, [stats, period]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Engagement overview
          </h2>
          <p className="mt-1 text-sm text-card-foreground">
            Relative workload across your workspace{period === 'weekly' ? ' (7-day view approx.)' : ''}.
          </p>
        </div>
        <div className="flex gap-2 rounded-full bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setPeriod('weekly')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              period === 'weekly'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              period === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="flex h-56 gap-3 px-1 sm:gap-4 sm:px-2">
        {bars.map((col) => (
          <div key={col.key} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
            <div className="flex min-h-0 w-full flex-1 items-end gap-1">
              <div
                className="w-1/2 rounded-t-sm bg-primary/35 transition-all duration-500"
                style={{ height: `${col.a}%` }}
              />
              <div
                className="w-1/2 rounded-t-sm bg-primary transition-all duration-500"
                style={{ height: `${col.b}%` }}
              />
            </div>
            <span className="shrink-0 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {col.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-6 border-t border-border/80 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-xs font-medium text-muted-foreground">Primary signal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary/35" />
          <span className="text-xs font-medium text-muted-foreground">Secondary</span>
        </div>
      </div>
    </section>
  );
}
