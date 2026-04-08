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
import { EngagementOverview } from '@/components/lecturer/dashboard/EngagementOverview';
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
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

function formatAverageQuizScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(Number(score))) return '—';
  const n = Number(score);
  return `${n % 1 === 0 ? n : n.toFixed(1)}%`;
}

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
              value: formatAverageQuizScore(stats.averageQuizScore),
              change:
                stats.averageQuizScore == null
                  ? 'No submitted attempts yet'
                  : 'Across submitted student attempts',
              changeType:
                stats.averageQuizScore != null &&
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

  const insightLines = useMemo(() => {
    if (!stats) return [];
    const lines: string[] = [];
    if (stats.pendingReviews > 0) {
      lines.push(`You have ${stats.pendingReviews} review${stats.pendingReviews === 1 ? '' : 's'} waiting in triage.`);
    }
    if (stats.escalatedItems > 0) {
      lines.push(`${stats.escalatedItems} student question(s) need expert validation.`);
    }
    if (stats.averageQuizScore == null && stats.totalStudents > 0) {
      lines.push('Quiz averages will appear after students submit attempts.');
    }
    if (lines.length === 0) {
      lines.push('Workspace looks calm — check analytics for deeper trends.');
    }
    return lines.slice(0, 3);
  }, [stats]);

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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                {stats ? <EngagementOverview stats={stats} /> : null}

                <SectionCard title="Operational snapshot">
                  {statsLoading ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                      <div className="h-36 animate-pulse rounded-xl bg-muted/70" />
                    </div>
                  ) : (
                    <>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-4">
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
                    <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-4">
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
                    <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Quiz performance</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">
                        {formatAverageQuizScore(stats?.averageQuizScore)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Average score from submitted quizzes</p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Shortcuts
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Link
                        href="/lecturer/quizzes"
                        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-card-foreground">Quiz library</span>
                            <span className="text-xs text-muted-foreground">Create, edit, assign</span>
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                      <Link
                        href="/lecturer/cases"
                        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-accent/10 text-cyan-accent">
                            <FolderOpen className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-card-foreground">Cases</span>
                            <span className="text-xs text-muted-foreground">Clinical case bank</span>
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                      <Link
                        href="/lecturer/assignments"
                        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                            <BookOpen className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-card-foreground">Assignments</span>
                            <span className="text-xs text-muted-foreground">Tasks & deadlines</span>
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                      <Link
                        href="/lecturer/analytics"
                        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                            <BarChart3 className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-card-foreground">Analytics</span>
                            <span className="text-xs text-muted-foreground">Trends & reports</span>
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </div>
                  </div>
                    </>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6 xl:col-span-4">
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
                            <th className="px-4 py-3">Cases</th>
                            <th className="px-4 py-3">Questions</th>
                            <th className="px-4 py-3 min-w-[140px]">Avg quiz</th>
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
                            const avgNum =
                              typeof entry.averageQuizScore === 'number' && Number.isFinite(entry.averageQuizScore)
                                ? entry.averageQuizScore
                                : null;
                            const pct = avgNum != null ? Math.min(100, Math.max(0, avgNum)) : 0;
                            const initials = name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w) => w[0]?.toUpperCase() ?? '')
                              .join('') || '?';
                            return (
                              <tr
                                key={`${entry.studentId ?? name}-${index}`}
                                className="even:bg-muted/25 hover:bg-primary/5"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                      {initials}
                                    </div>
                                    <span className="font-medium text-card-foreground">{name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{casesViewed}</td>
                                <td className="px-4 py-3 text-muted-foreground">{questionsAsked}</td>
                                <td className="px-4 py-3">
                                  {avgNum != null ? (
                                    <div className="flex items-center gap-2">
                                      <span className="w-12 shrink-0 text-xs font-bold tabular-nums text-card-foreground">
                                        {avgNum.toFixed(1)}%
                                      </span>
                                      <div className="h-2 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-muted">
                                        <div
                                          className="h-full rounded-full bg-success transition-all"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>

                <section className="rounded-2xl border border-border bg-slate-900 p-5 text-slate-50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
                      <Sparkles className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">Suggested focus</h3>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
                        {insightLines.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/lecturer/qa-triage"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-300 hover:text-sky-200"
                      >
                        Open triage
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
