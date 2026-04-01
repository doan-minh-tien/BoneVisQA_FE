'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchLecturerDashboardStats } from '@/lib/api/lecturer-dashboard';
import type { LecturerDashboardStats } from '@/lib/api/types';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  ClipboardList,
  Loader2,
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

function PlaceholderPanel({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default function LecturerDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<LecturerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLecturerDashboardStats();
        if (!cancelled) {
          setStats(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load lecturer dashboard.');
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
      stats
        ? [
            {
              title: 'Active classes',
              value: stats.totalClasses,
              change: `${stats.totalStudents} students under supervision`,
              changeType: 'neutral' as const,
              icon: ClipboardList,
              iconColor: 'bg-primary/10 text-primary',
            },
            {
              title: 'Student questions',
              value: stats.totalQuestions,
              change: `${stats.escalatedItems} escalated for clinical validation`,
              changeType: 'neutral' as const,
              icon: MessageSquare,
              iconColor: 'bg-cyan-accent/10 text-cyan-accent',
            },
            {
              title: 'Pending reviews',
              value: stats.pendingReviews,
              change: 'Awaiting expert follow-up',
              changeType: stats.pendingReviews > 0 ? 'negative' : 'positive',
              icon: Bell,
              iconColor: 'bg-warning/10 text-warning',
            },
            {
              title: 'Average quiz score',
              value: `${stats.averageQuizScore}%`,
              change: 'Across submitted student attempts',
              changeType: stats.averageQuizScore >= 70 ? 'positive' : 'neutral',
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

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading dashboard metrics...
            </div>
          </div>
        ) : !stats ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-card-foreground">No dashboard data available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The lecturer stats endpoint returned no data. Verify the backend seed data or account scope.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-card-foreground">Operational snapshot</h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Students</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">{stats.totalStudents}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Across all active lecturer classes</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-accent/10 text-cyan-accent">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Escalations</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">{stats.escalatedItems}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Requests forwarded to experts</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Quiz performance</p>
                      <p className="mt-2 text-3xl font-semibold text-card-foreground">{stats.averageQuizScore}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">Average score from submitted quizzes</p>
                    </div>
                  </div>
                </div>

                <PlaceholderPanel
                  title="Class and assignment previews require new APIs"
                  description="The old dashboard mocked active classes, pending assignments, top performers, and recent announcements. Those sections have been purged until dedicated dashboard aggregation endpoints are available."
                  ctaHref="/lecturer/classes"
                  ctaLabel="Manage classes"
                />
              </div>

              <div className="space-y-6">
                <PlaceholderPanel
                  title="Student performance watchlist"
                  description="To restore top performers and needs-attention blocks without faking data, the frontend needs a leaderboard-style endpoint grouped by lecturer class scope."
                />
                <PlaceholderPanel
                  title="Announcement stream"
                  description="You can still create and review announcements in the announcements module, but the dashboard no longer invents a fake recent activity feed."
                  ctaHref="/lecturer/announcements"
                  ctaLabel="Open announcements"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
