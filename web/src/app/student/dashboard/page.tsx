'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { StudentDashboardSkeleton } from '@/components/shared/DashboardSkeletons';
import QuickActionCard from '@/components/student/QuickActionCard';
import ProgressRing from '@/components/student/ProgressRing';
import {
  fetchStudentProgress,
  fetchStudentRecentActivity,
  fetchStudentTopicStats,
} from '@/lib/api/student';
import type {
  StudentProgress,
  StudentRecentActivityItem,
  StudentTopicStat,
} from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/useAuth';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  History,
  ImageUp,
  Library,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  Target,
  Trophy,
  User,
} from 'lucide-react';

type StatCardModel = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
};

/** API-backed destinations only — no legacy topic chat routes. */
const quickActions = [
  {
    title: 'New visual QA',
    description: 'Upload an imaging study and ask one focused clinical question.',
    icon: ImageUp,
    href: '/student/qa/image',
    iconColor: 'bg-primary/15 text-primary',
  },
  {
    title: 'View history',
    description: 'Review your past visual QA requests and expert review status.',
    icon: History,
    href: '/student/history',
    iconColor: 'bg-slate-500/15 text-slate-700',
  },
  {
    title: 'Case catalog',
    description: 'Browse curated teaching cases by location, lesion type, and difficulty.',
    icon: Library,
    href: '/student/catalog',
    iconColor: 'bg-sky-500/15 text-sky-800',
  },
  {
    title: 'Practice quiz',
    description: 'Load a live quiz attempt from the backend by topic.',
    icon: Trophy,
    href: '/student/quiz',
    iconColor: 'bg-cyan-accent/15 text-primary',
  },
  {
    title: 'My profile',
    description: 'Update your cohort and profile fields visible to instructors.',
    icon: User,
    href: '/student/profile',
    iconColor: 'bg-emerald-500/15 text-emerald-800',
  },
];

function formatQuizPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

function clampPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [topicStats, setTopicStats] = useState<StudentTopicStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<StudentRecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progressData, topicData, activityData] = await Promise.all([
          fetchStudentProgress(),
          fetchStudentTopicStats(),
          fetchStudentRecentActivity(),
        ]);
        if (!cancelled) {
          setProgress(progressData);
          setTopicStats(topicData);
          setRecentActivity(activityData);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load student progress.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const statCards = useMemo<StatCardModel[]>(
    () =>
      progress
        ? [
            {
              title: 'Cases viewed',
              value: progress.totalCasesViewed,
              change: 'From live progress analytics',
              changeType: 'neutral' as const,
              icon: BookOpen,
              iconColor: 'bg-primary/10 text-primary',
            },
            {
              title: 'Questions asked',
              value: progress.totalQuestionsAsked,
              change: `${progress.escalatedAnswers} escalated to experts`,
              changeType: 'neutral' as const,
              icon: MessageSquare,
              iconColor: 'bg-cyan-accent/10 text-primary',
            },
            {
              title: 'Average quiz score',
              value: formatQuizPercent(progress.avgQuizScore),
              change: `${progress.completedQuizzes} completed quizzes`,
              changeType:
                progress.avgQuizScore != null && !Number.isNaN(progress.avgQuizScore) && progress.avgQuizScore >= 70
                  ? 'positive'
                  : 'neutral',
              icon: Trophy,
              iconColor: 'bg-amber-500/10 text-amber-700',
            },
            {
              title: 'Quiz accuracy',
              value: formatQuizPercent(progress.quizAccuracyRate),
              change: `${progress.totalQuizAttempts} total attempts`,
              changeType:
                progress.quizAccuracyRate != null &&
                !Number.isNaN(progress.quizAccuracyRate) &&
                progress.quizAccuracyRate >= 70
                  ? 'positive'
                  : 'neutral',
              icon: Target,
              iconColor: 'bg-emerald-500/10 text-emerald-700',
            },
          ]
        : [],
    [progress],
  );

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';
  const goalTopic = topicStats[0]?.topicName ?? 'Musculoskeletal focus';

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Header
        title="Student dashboard"
        subtitle="Track progress, browse cases, and continue your radiology learning path."
      />

      <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-6">
        {loading ? (
          <StudentDashboardSkeleton />
        ) : !progress ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No progress data available</h2>
            <p className="mt-2 text-sm text-slate-600">
              The student progress endpoint returned no data for this account yet.
            </p>
          </div>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Welcome back, {firstName}
                </h2>
                <p className="mt-2 max-w-xl text-base text-slate-600">
                  {progress.quizAccuracyRate != null && !Number.isNaN(progress.quizAccuracyRate) ? (
                    <>
                      You&apos;ve completed {Math.min(100, Math.round(progress.quizAccuracyRate))}% of your weekly
                      radiology goals.{' '}
                    </>
                  ) : (
                    <>No quiz accuracy recorded yet. Complete a quiz to see goal progress. </>
                  )}
                  Continue with case reviews or a practice quiz.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/student/qa/image"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <PlayCircle className="h-5 w-5 shrink-0" aria-hidden />
                  New visual QA
                </Link>
                <Link
                  href="/student/quiz"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  Practice quiz
                </Link>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-3xl font-bold tracking-tight text-slate-900">
                    {progress.totalCasesViewed}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cases viewed</p>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, progress.totalCasesViewed * 5)}%` }}
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-3xl font-bold tracking-tight text-slate-900">
                    {formatQuizPercent(progress.avgQuizScore)}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. quiz score</p>
                </div>
                <p className="text-xs text-slate-600">
                  {progress.completedQuizzes} completed · {progress.totalQuizAttempts} attempts
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-800">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-lg font-bold text-slate-900">Study focus</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current goal</p>
                </div>
                <p className="text-sm text-slate-600">Topic spotlight: {goalTopic}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-600">{stat.title}</p>
                        <p className="font-headline text-2xl font-bold text-slate-900">{stat.value}</p>
                        {stat.change ? <p className="mt-1 text-xs text-slate-500">{stat.change}</p> : null}
                      </div>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <SectionCard>
                  <div className="mb-5">
                    <h2 className="font-headline text-xl font-bold tracking-tight text-slate-900">Quick actions</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Shortcuts to live workflows backed by the BoneVisQA API.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                      <QuickActionCard key={action.title} {...action} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Topic mastery"
                  description="Quiz accuracy and attempts by topic from your progress analytics."
                >
                  {topicStats.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-slate-600">
                      No topic analytics available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topicStats.map((topic, idx) => (
                        <div
                          key={topic.topicName?.trim() || `topic-${idx}`}
                          className="rounded-xl border border-border bg-card p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {topic.topicName?.trim() || 'Unnamed topic'}
                              </p>
                              <p className="text-xs text-slate-600">
                                {typeof topic.quizAttempts === 'number' && Number.isFinite(topic.quizAttempts)
                                  ? topic.quizAttempts
                                  : 0}{' '}
                                quiz attempts
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800">
                              {typeof topic.accuracyRate === 'number' && Number.isFinite(topic.accuracyRate)
                                ? `${topic.accuracyRate.toFixed(1)}% accuracy`
                                : '—'}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    typeof topic.accuracyRate === 'number' && Number.isFinite(topic.accuracyRate)
                                      ? topic.accuracyRate
                                      : 0,
                                  ),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard>
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Overall progress</h2>
                  <div className="flex flex-col items-center">
                    <ProgressRing progress={clampPercent(progress.quizAccuracyRate)} size={140} strokeWidth={10} />
                    <div className="mt-4 text-center">
                      <p className="text-sm text-slate-600">
                        Latest quiz score:{' '}
                        <span className="font-medium text-slate-900">{formatQuizPercent(progress.latestQuizScore)}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {progress.completedQuizzes} completed quizzes across {progress.totalQuizAttempts} attempts
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{progress.totalQuizAttempts}</p>
                    <p className="text-sm text-slate-600">Quiz attempts</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-accent/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{progress.escalatedAnswers}</p>
                    <p className="text-sm text-slate-600">Escalated answers</p>
                  </div>
                </div>

                <SectionCard
                  title="Recent activity"
                  description="Latest study, quiz, and expert-review events (chronological)."
                >
                  {recentActivity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-slate-600">
                      No recent activity has been recorded yet.
                    </div>
                  ) : (
                    <ol className="space-y-4">
                      {recentActivity.map((activity, actIdx) => {
                        const normalizedStatus = activity.status?.toLowerCase();
                        const statusBadge =
                          normalizedStatus === 'approved' || normalizedStatus === 'revised'
                            ? {
                                label: 'Verified by Expert',
                                className: 'bg-emerald-500/10 text-emerald-800',
                                icon: CheckCircle2,
                              }
                            : normalizedStatus === 'pending' || normalizedStatus === 'pendingexpert'
                              ? {
                                  label: 'Under Expert Review',
                                  className: 'bg-amber-500/10 text-amber-800',
                                  icon: ShieldAlert,
                                }
                              : null;
                        const StatusIcon = statusBadge?.icon;

                        return (
                          <li
                            key={activity.id?.trim() || `activity-${actIdx}`}
                            className="rounded-xl border border-border bg-card p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {activity.title?.trim() || 'Activity'}
                                </p>
                                {activity.description?.trim() ? (
                                  <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                                ) : null}
                              </div>
                              <span className="shrink-0 text-xs text-slate-500">
                                {activity.occurredAt?.trim() || '—'}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-900">
                                {activity.type?.trim() || 'General'}
                              </span>
                              {statusBadge && StatusIcon ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {statusBadge.label}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </SectionCard>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-6">
              <Link href="/student/quiz" className="text-sm font-medium text-primary hover:underline">
                Open practice quizzes
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
