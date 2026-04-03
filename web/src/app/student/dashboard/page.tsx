'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import StatCard from '@/components/StatCard';
import QuickActionCard from '@/components/student/QuickActionCard';
import ProgressRing from '@/components/student/ProgressRing';
import TopicProgressCard from '@/components/student/dashboard/TopicProgressCard';
import RecentActivityCard from '@/components/student/dashboard/RecentActivityCard';
import LearningInsights from '@/components/student/dashboard/LearningInsights';
import OverallProgressCard from '@/components/student/dashboard/OverallProgressCard';
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
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  BotMessageSquare,
  CheckCircle2,
  Clock,
  ImageUp,
  Loader2,
  MessageSquare,
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

export default function StudentDashboardPage() {
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
              value: `${progress.avgQuizScore}%`,
              change: `${progress.completedQuizzes} completed quizzes`,
              changeType: progress.avgQuizScore >= 70 ? 'positive' : 'neutral',
              icon: Trophy,
              iconColor: 'bg-warning/10 text-warning',
            },
            {
              title: 'Quiz accuracy',
              value: `${progress.quizAccuracyRate}%`,
              change: `${progress.totalQuizAttempts} total attempts`,
              changeType: progress.quizAccuracyRate >= 70 ? 'positive' : 'neutral',
              icon: Target,
              iconColor: 'bg-success/10 text-success',
            },
          ]
        : [],
    [progress],
  );

  return (
    <div className="min-h-screen">
      <Header title="Welcome back" subtitle="Your live progress snapshot across cases, Q&A, and quizzes" />

      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading student progress...
            </div>
          </div>
        ) : !progress ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-card-foreground">No progress data available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The student progress endpoint returned no data for this account yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
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
                    <ProgressRing progress={Math.min(100, progress.quizAccuracyRate)} size={140} strokeWidth={10} />
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Latest quiz score: <span className="font-medium text-card-foreground">{progress.latestQuizScore}%</span>
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
