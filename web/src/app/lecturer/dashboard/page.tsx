'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { SectionCard } from '@/components/shared/SectionCard';
import {
  LecturerDashboardSkeleton,
  LecturerLeaderboardSkeleton,
} from '@/components/shared/DashboardSkeletons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchLecturerClassLeaderboard,
  fetchLecturerDashboardStats,
} from '@/lib/api/lecturer-dashboard';
import { fetchLecturerClasses } from '@/lib/api/lecturer-triage';
import type { ClassItem, LecturerDashboardStats, LecturerLeaderboardEntry } from '@/lib/api/types';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react';

type StatCardModel = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
};

export default function LecturerDashboardPage() {
  const toast = useToast();
  const [selectedClassId, setSelectedClassId] = useState('');
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const swrConfig = {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    keepPreviousData: true,
  };
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<LecturerDashboardStats>('lecturer-dashboard-stats', fetchLecturerDashboardStats, swrConfig);
  const {
    data: classesData,
    error: classesError,
    isLoading: classesLoading,
  } = useSWR<ClassItem[]>(
    userId ? ['lecturer-classes', userId] : null,
    ([, uid]: [string, string]) => fetchLecturerClasses(uid),
    swrConfig,
  );
  const classes = classesData ?? [];
  const selectedClassIdEffective = selectedClassId || classes[0]?.id || '';
  const {
    data: leaderboardData,
    error: leaderboardError,
    isLoading: loadingLeaderboard,
  } = useSWR<LecturerLeaderboardEntry[]>(
    selectedClassIdEffective ? ['lecturer-class-leaderboard', selectedClassIdEffective] : null,
    ([, classId]: [string, string]) => fetchLecturerClassLeaderboard(classId),
    swrConfig,
  );
  const leaderboard = leaderboardData ?? [];

  useEffect(() => {
    if (statsError) {
      toast.error(statsError instanceof Error ? statsError.message : 'Failed to load lecturer dashboard.');
    }
  }, [statsError, toast]);
  useEffect(() => {
    if (classesError) {
      toast.error(classesError instanceof Error ? classesError.message : 'Failed to load lecturer classes.');
    }
  }, [classesError, toast]);
  useEffect(() => {
    if (leaderboardError) {
      toast.error(
        leaderboardError instanceof Error ? leaderboardError.message : 'Failed to load class leaderboard.',
      );
    }
  }, [leaderboardError, toast]);

  const statCards = useMemo<StatCardModel[]>(
    () =>
      stats
        ? [
            {
              title: 'Active classes',
              value:
                typeof stats.totalClasses === 'number' && Number.isFinite(stats.totalClasses)
                  ? stats.totalClasses
                  : '—',
              change: `${typeof stats.totalStudents === 'number' && Number.isFinite(stats.totalStudents) ? stats.totalStudents : 0} students under supervision`,
              changeType: 'neutral' as const,
              icon: ClipboardList,
              iconColor: 'bg-primary/10 text-primary',
            },
            {
              title: 'Student questions',
              value:
                typeof stats.totalQuestions === 'number' && Number.isFinite(stats.totalQuestions)
                  ? stats.totalQuestions
                  : '—',
              change: `${typeof stats.escalatedItems === 'number' && Number.isFinite(stats.escalatedItems) ? stats.escalatedItems : 0} escalated for clinical validation`,
              changeType: 'neutral' as const,
              icon: MessageSquare,
              iconColor: 'bg-cyan-accent/10 text-cyan-accent',
            },
            {
              title: 'Pending reviews',
              value:
                typeof stats.pendingReviews === 'number' && Number.isFinite(stats.pendingReviews)
                  ? stats.pendingReviews
                  : '—',
              change: 'Awaiting expert follow-up',
              changeType: (stats.pendingReviews ?? 0) > 0 ? 'negative' : 'positive',
              icon: Bell,
              iconColor: 'bg-warning/10 text-warning',
            },
            {
              title: 'Average quiz score',
              value:
                typeof stats.averageQuizScore === 'number' && Number.isFinite(stats.averageQuizScore)
                  ? `${Math.round(stats.averageQuizScore)}%`
                  : '—',
              change: 'Across submitted student attempts',
              changeType:
                typeof stats.averageQuizScore === 'number' &&
                Number.isFinite(stats.averageQuizScore) &&
                stats.averageQuizScore >= 70
                  ? 'positive'
                  : 'neutral',
              icon: TrendingUp,
              iconColor: 'bg-success/10 text-success',
            },
          ]
        : [],
    [stats],
  );

  return (
    <div className="min-h-screen">
      <Header title="Lecturer Dashboard" subtitle="Live class activity, triage throughput, and quiz performance" />

      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/lecturer/announcements">
            <Button>
              <Bell className="h-4 w-4" />
              Send Announcement
            </Button>
          </Link>
          <Link href="/lecturer/analytics">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link href="/lecturer/qa-triage">
            <Button variant="outline">
              <MessageSquare className="h-4 w-4" />
              Open Triage Workbench
            </Button>
          </Link>
        </div>

        {statsLoading && classesLoading ? (
          <LecturerDashboardSkeleton />
        ) : (
          <>
            {!stats && !statsLoading ? (
              <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 text-base font-semibold text-card-foreground">Stats widget unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(statsError instanceof Error ? statsError.message : statsError) ??
                    'The lecturer stats endpoint returned no data.'}
                </p>
              </div>
            ) : null}

            {statsLoading ? (
              <LecturerDashboardSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                  <StatCard key={stat.title} {...stat} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <SectionCard title="Operational snapshot">
                  {statsLoading ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                    </div>
                  ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Students</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">
                        {typeof stats?.totalStudents === 'number' && Number.isFinite(stats.totalStudents)
                          ? stats.totalStudents
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Across all active lecturer classes</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-accent/10 text-cyan-accent">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Escalations</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">
                        {typeof stats?.escalatedItems === 'number' && Number.isFinite(stats.escalatedItems)
                          ? stats.escalatedItems
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Requests forwarded to experts</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Quiz performance</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">
                        {typeof stats?.averageQuizScore === 'number' && Number.isFinite(stats.averageQuizScore)
                          ? `${Math.round(stats.averageQuizScore)}%`
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Average score from submitted quizzes</p>
                    </div>
                  </div>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard
                  title="Student leaderboard"
                  description="Monitor who is excelling and who needs support in the selected class."
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-sm flex-1">
                      <label htmlFor="leaderboard-class" className="text-sm font-medium text-card-foreground">
                        Class
                      </label>
                      <select
                        id="leaderboard-class"
                        value={selectedClassIdEffective}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select class...</option>
                        {classes.map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>
                            {classItem.className} ({classItem.semester})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Link href="/lecturer/classes" className="text-sm font-medium text-primary hover:underline">
                      Manage classes
                    </Link>
                  </div>

                  {classesLoading ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      Loading classes...
                    </div>
                  ) : classesError ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      {classesError instanceof Error ? classesError.message : classesError}
                    </div>
                  ) : !selectedClassIdEffective ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      Select a class to load leaderboard analytics.
                    </div>
                  ) : loadingLeaderboard ? (
                    <LecturerLeaderboardSkeleton />
                  ) : leaderboardError ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      {leaderboardError instanceof Error ? leaderboardError.message : leaderboardError}
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      No leaderboard data available for this class yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-background/70 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Cases Viewed</th>
                            <th className="px-4 py-3">Questions Asked</th>
                            <th className="px-4 py-3">Avg Quiz Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {leaderboard.map((entry, index) => {
                            const name = entry.studentName?.trim() || 'N/A';
                            const casesViewed =
                              typeof entry.totalCasesViewed === 'number' && Number.isFinite(entry.totalCasesViewed)
                                ? entry.totalCasesViewed
                                : 0;
                            const questionsAsked =
                              typeof entry.totalQuestionsAsked === 'number' &&
                              Number.isFinite(entry.totalQuestionsAsked)
                                ? entry.totalQuestionsAsked
                                : 0;
                            const avgScore =
                              typeof entry.averageQuizScore === 'number' &&
                              Number.isFinite(entry.averageQuizScore)
                                ? `${entry.averageQuizScore.toFixed(1)}%`
                                : '—';
                            return (
                            <tr key={`${entry.studentId ?? name}-${index}`} className="even:bg-slate-50/55 hover:bg-blue-50/70">
                              <td className="px-4 py-3 font-medium text-card-foreground">{name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{casesViewed}</td>
                              <td className="px-4 py-3 text-muted-foreground">{questionsAsked}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                  {avgScore}
                                </span>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
