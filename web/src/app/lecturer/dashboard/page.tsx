'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { useToast } from '@/components/ui/toast';
import {
  fetchLecturerClassLeaderboard,
  fetchLecturerDashboardStats,
} from '@/lib/api/lecturer-dashboard';
import { fetchLecturerClasses } from '@/lib/api/lecturer-triage';
import type { ClassItem, LecturerDashboardStats, LecturerLeaderboardEntry } from '@/lib/api/types';

function toPercent(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Number(n).toFixed(1)}%`;
}

export default function LecturerDashboardPage() {
  const toast = useToast();
  const [selectedClassId, setSelectedClassId] = useState('');
  const lecturerId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<LecturerDashboardStats>(
    'lecturer-dashboard-learning-statistics',
    fetchLecturerDashboardStats,
    { revalidateOnFocus: false },
  );
  const {
    data: classesData,
    error: classesError,
    isLoading: classesLoading,
  } = useSWR<ClassItem[]>(
    lecturerId ? ['lecturer-classes', lecturerId] : null,
    ([, id]: [string, string]) => fetchLecturerClasses(id),
    { revalidateOnFocus: false },
  );

  const classes = classesData ?? [];
  const selectedClass = selectedClassId || classes[0]?.id || '';

  const {
    data: leaderboard,
    error: leaderboardError,
    isLoading: leaderboardLoading,
  } = useSWR<LecturerLeaderboardEntry[]>(
    selectedClass ? ['lecturer-dashboard-top-students', selectedClass] : null,
    ([, classId]: [string, string]) => fetchLecturerClassLeaderboard(classId),
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (statsError) toast.error(statsError instanceof Error ? statsError.message : 'Unable to load learning statistics.');
  }, [statsError, toast]);
  useEffect(() => {
    if (classesError) toast.error(classesError instanceof Error ? classesError.message : 'Unable to load class list.');
  }, [classesError, toast]);
  useEffect(() => {
    if (leaderboardError) toast.error(leaderboardError instanceof Error ? leaderboardError.message : 'Unable to load top active students.');
  }, [leaderboardError, toast]);

  const topActive = useMemo(() => {
    const rows = [...(leaderboard ?? [])];
    rows.sort((a, b) => (b.totalQuestionsAsked ?? 0) - (a.totalQuestionsAsked ?? 0));
    return rows.slice(0, 8);
  }, [leaderboard]);

  const totalCasesLearned = useMemo(() => {
    return (leaderboard ?? []).reduce((sum, row) => sum + (row.totalCasesViewed ?? 0), 0);
  }, [leaderboard]);

  const maxQuestions = useMemo(() => {
    if (topActive.length === 0) return 1;
    return Math.max(1, ...topActive.map((row) => row.totalQuestionsAsked ?? 0));
  }, [topActive]);

  return (
    <div className="min-h-screen">
      <Header
        title="Lecturer Dashboard"
        subtitle="Overview of learning statistics and top-performing active students"
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total studied cases</p>
            <p className="mt-2 text-3xl font-semibold text-card-foreground">
              {leaderboardLoading ? '…' : totalCasesLearned}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Student questions submitted</p>
            <p className="mt-2 text-3xl font-semibold text-card-foreground">
              {statsLoading ? '…' : (stats?.totalQuestions ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Average quiz accuracy</p>
            <p className="mt-2 text-3xl font-semibold text-card-foreground">
              {statsLoading ? '…' : toPercent(stats?.averageQuizScore)}
            </p>
          </div>
        </div>

        <SectionCard
          title="Top active students"
          description="Bar chart of submitted questions based on class-level learning statistics."
        >
          <div className="mb-4 max-w-sm">
            <label htmlFor="lecturer-dashboard-class" className="text-sm font-medium text-card-foreground">
              Class
            </label>
            <select
              id="lecturer-dashboard-class"
              value={selectedClass}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={classesLoading || classes.length === 0}
              className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {classes.length === 0 ? <option value="">No classes available</option> : null}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.semester})
                </option>
              ))}
            </select>
          </div>

          {leaderboardLoading ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground">
              Loading chart...
            </div>
          ) : topActive.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground">
              No student activity data is available for this class.
            </div>
          ) : (
            <div className="space-y-3">
              {topActive.map((row, index) => {
                const count = row.totalQuestionsAsked ?? 0;
                const widthPct = Math.round((count / maxQuestions) * 100);
                return (
                  <div key={`${row.studentId ?? row.studentName}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3 font-medium text-card-foreground">
                        {row.studentName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{count} questions</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
