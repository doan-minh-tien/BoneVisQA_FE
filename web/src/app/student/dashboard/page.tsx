'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SectionCard } from '@/components/shared/SectionCard';
import QuickActionCard from '@/components/student/QuickActionCard';
import ProgressRing from '@/components/student/ProgressRing';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
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
  BotMessageSquare,
  CheckCircle2,
  Clock,
  ImageUp,
  Loader2,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  Target,
  Trophy,
} from 'lucide-react';

type StatCardModel = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
};

const quickActions = [
  {
    title: 'AI Q&A by Topic',
    description: 'Use the knowledge base Q&A workflow for text-first study.',
    icon: BotMessageSquare,
    href: '/student/qa/topic',
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'AI Q&A by Image',
    description: 'Upload an X-ray, CT, or MRI and ask one focused clinical question.',
    icon: ImageUp,
    href: '/student/qa/image',
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Practice Quiz',
    description: 'Load a live quiz attempt from the backend by topic.',
    icon: Trophy,
    href: '/student/quiz',
    iconColor: 'bg-cyan-accent/10 text-cyan-accent',
  },
  {
    title: 'My Profile',
    description: 'Review cohort information and update your visible profile fields.',
    icon: BookOpen,
    href: '/student/profile',
    iconColor: 'bg-success/10 text-success',
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
              change: 'Pulled from live progress analytics',
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
              iconColor: 'bg-cyan-accent/10 text-cyan-accent',
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
              iconColor: 'bg-warning/10 text-warning',
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
              iconColor: 'bg-success/10 text-success',
            },
          ]
        : [],
    [progress],
  );

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';
  const goalTopic = topicStats[0]?.topicName ?? 'Musculoskeletal focus';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StudentAppChrome />

      <div className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10 md:px-12">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading student progress...
            </div>
          </div>
        ) : !progress ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest px-6 py-16 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-on-surface-variant" />
            <h2 className="mt-4 text-lg font-semibold text-on-surface">No progress data available</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              The student progress endpoint returned no data for this account yet.
            </p>
          </div>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="font-headline text-4xl font-black tracking-tight text-on-surface md:text-5xl">
                  Good morning, {firstName}!
                </h1>
                <p className="mt-2 max-w-xl text-lg text-on-surface-variant">
                  {progress.quizAccuracyRate != null && !Number.isNaN(progress.quizAccuracyRate) ? (
                    <>
                      You&apos;ve completed {Math.min(100, Math.round(progress.quizAccuracyRate))}% of your weekly
                      radiology goals.{' '}
                    </>
                  ) : (
                    <>No quiz accuracy recorded yet—complete a quiz to see goal progress. </>
                  )}
                  Keep going with a few more case reviews or a quick quiz.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/student/qa/image"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-md transition-transform hover:scale-[1.02]"
                >
                  <PlayCircle className="h-5 w-5 shrink-0" aria-hidden />
                  Resume learning
                </Link>
                <Link
                  href="/student/quiz"
                  className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-6 py-3 font-bold text-on-primary-fixed-variant transition-colors hover:bg-surface-container-highest"
                >
                  Quick quiz
                </Link>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-4xl font-black tracking-tighter">{progress.totalCasesViewed}</span>
                  <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Cases viewed</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, progress.totalCasesViewed * 5)}%` }}
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-4xl font-black tracking-tighter">
                    {formatQuizPercent(progress.avgQuizScore)}
                  </span>
                  <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                    Avg. quiz score
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {progress.completedQuizzes} completed · {progress.totalQuizAttempts} attempts
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-white to-blue-50 p-8 shadow-sm dark:from-slate-900 dark:to-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-headline text-xl font-bold text-on-surface">Study focus</span>
                  <p className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Current goal</p>
                </div>
                <p className="text-sm text-on-surface-variant">Topic spotlight: {goalTopic}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-on-surface-variant">{stat.title}</p>
                        <p className="font-headline text-2xl font-bold text-on-surface">{stat.value}</p>
                        {stat.change ? (
                          <p className="mt-1 text-xs text-on-surface-variant">{stat.change}</p>
                        ) : null}
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconColor}`}>
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
                  <h2 className="mb-4 text-lg font-semibold text-card-foreground">Quick Actions</h2>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {quickActions.map((action) => (
                      <QuickActionCard key={action.title} {...action} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Topic mastery"
                  description="Track quiz accuracy and attempt volume by study topic."
                >
                  {topicStats.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      No topic analytics available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topicStats.map((topic) => (
                        <div key={topic.topicName} className="rounded-xl border border-border bg-background/55 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-card-foreground">{topic.topicName}</p>
                              <p className="text-xs text-muted-foreground">{topic.quizAttempts} quiz attempts</p>
                            </div>
                            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                              {topic.accuracyRate.toFixed(1)}% accuracy
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, topic.accuracyRate))}%` }}
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
                  <h2 className="mb-4 text-lg font-semibold text-card-foreground">Overall Progress</h2>
                  <div className="flex flex-col items-center">
                    <ProgressRing progress={clampPercent(progress.quizAccuracyRate)} size={140} strokeWidth={10} />
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Latest quiz score:{' '}
                        <span className="font-medium text-card-foreground">
                          {formatQuizPercent(progress.latestQuizScore)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
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
                    <p className="text-2xl font-bold text-card-foreground">{progress.totalQuizAttempts}</p>
                    <p className="text-sm text-muted-foreground">Quiz Attempts</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-accent/10">
                      <MessageSquare className="h-6 w-6 text-cyan-accent" />
                    </div>
                    <p className="text-2xl font-bold text-card-foreground">{progress.escalatedAnswers}</p>
                    <p className="text-sm text-muted-foreground">Escalated Answers</p>
                  </div>
                </div>

                <SectionCard title="Recent activity" description="Your latest study, quiz, and expert-review events in chronological order.">
                  {recentActivity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                      No recent activity has been recorded yet.
                    </div>
                  ) : (
                    <ol className="space-y-4">
                      {recentActivity.map((activity) => {
                        const normalizedStatus = activity.status?.toLowerCase();
                        const statusBadge =
                          normalizedStatus === 'approved' || normalizedStatus === 'revised'
                            ? {
                                label: 'Verified by Expert',
                                className: 'bg-success/10 text-success',
                                icon: CheckCircle2,
                              }
                            : normalizedStatus === 'pending' || normalizedStatus === 'pendingexpert'
                              ? {
                                  label: 'Under Expert Review',
                                  className: 'bg-warning/10 text-warning',
                                  icon: ShieldAlert,
                                }
                              : null;
                        const StatusIcon = statusBadge?.icon;

                        return (
                          <li key={activity.id} className="rounded-xl border border-border bg-background/55 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-card-foreground">{activity.title}</p>
                                {activity.description ? (
                                  <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                                ) : null}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">{activity.occurredAt}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-cyan-accent/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-accent">
                                {activity.type}
                              </span>
                              {statusBadge && StatusIcon ? (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}>
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

            <div className="flex justify-end">
              <Link href="/student/quiz" className="text-sm font-medium text-primary hover:underline">
                Open live practice quizzes
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
