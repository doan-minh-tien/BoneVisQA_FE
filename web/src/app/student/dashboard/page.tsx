'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import QuickActionCard from '@/components/student/QuickActionCard';
import ProgressRing from '@/components/student/ProgressRing';
import { fetchStudentProgress } from '@/lib/api/student';
import type { StudentProgress } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  BotMessageSquare,
  Clock,
  ImageUp,
  Loader2,
  MessageSquare,
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

function DemandPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export default function StudentDashboardPage() {
  const toast = useToast();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentProgress();
        if (!cancelled) setProgress(data);
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
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-card-foreground">Quick Actions</h2>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {quickActions.map((action) => (
                      <QuickActionCard key={action.title} {...action} />
                    ))}
                  </div>
                </div>

                <DemandPanel
                  title="Case continuation feed needs a dedicated endpoint"
                  description="The old dashboard showed mocked recent cases and topic progress. Those fake cards are removed until the backend exposes personalized case recommendations or recent study history."
                />
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
                </div>

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

                <DemandPanel
                  title="Recent activity and achievement feed needs API support"
                  description="The dashboard no longer invents badges, study streaks, or activity events. Those sections should return from a future student activity timeline endpoint."
                />
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
