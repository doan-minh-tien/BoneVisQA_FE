'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Header from '@/components/Header';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import QuickStatsCard from '@/components/expert/QuickStatsCard';
import ReviewCard from '@/components/expert/ReviewCard';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import ExpertActivityPanel from '@/components/expert/dashboard/ExpertActivityPanel';
import ExpertBottomStats from '@/components/expert/dashboard/ExpertBottomStats';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Filter,
} from 'lucide-react';
import {
  fetchExpertDashboardBundle,
  type ExpertDashboardBundle,
} from '@/lib/api/expert-dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/shared/EmptyState';

const EXPERT_DASHBOARD_KEY = 'expert-dashboard';

export default function ExpertDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const toastedErrorRef = useRef<string | null>(null);

  const { data, error, isLoading } = useSWR<ExpertDashboardBundle>(
    EXPERT_DASHBOARD_KEY,
    fetchExpertDashboardBundle,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  );

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Failed to load dashboard data.'
    : null;

  useEffect(() => {
    if (!errorMessage) {
      toastedErrorRef.current = null;
      return;
    }
    if (toastedErrorRef.current === errorMessage) return;
    toastedErrorRef.current = errorMessage;
    console.error('Expert dashboard fetch failed:', errorMessage);
    toast.error(errorMessage);
  }, [errorMessage, toast]);

  const stats = data?.stats ?? null;
  const pendingReviews = data?.pendingReviews ?? [];
  const recentCases = data?.recentCases ?? [];
  const activity = data?.activity ?? null;

  const expertStats = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: 'Total Cases',
        value: stats.totalCases.toString(),
        change: stats.totalCases,
        trend: 'up' as const,
        icon: FolderOpen,
        iconColor: 'bg-primary/10 text-primary',
      },
      {
        title: 'Pending Reviews',
        value: stats.pendingReviews.toString(),
        change: -stats.pendingReviews,
        trend: stats.pendingReviews > 0 ? ('down' as const) : ('up' as const),
        icon: Clock,
        iconColor: 'bg-warning/10 text-warning',
      },
      {
        title: 'Approved This Month',
        value: stats.approvedThisMonth.toString(),
        change: stats.approvedThisMonth,
        trend: 'up' as const,
        icon: CheckCircle,
        iconColor: 'bg-success/10 text-success',
      },
      {
        title: 'Student Interactions',
        value: stats.studentInteractions.toLocaleString(),
        change: stats.studentInteractions,
        trend: 'up' as const,
        icon: Users,
        iconColor: 'bg-accent/10 text-accent',
      },
    ];
  }, [stats]);

  const avgDailyReviews = activity?.avgDailyReviews.toFixed(1) ?? '0';
  const [caseTab, setCaseTab] = useState<'all' | 'pending' | 'approved' | 'draft'>('all');
  const filteredRecentCases = useMemo(() => {
    if (caseTab === 'all') return recentCases;
    return recentCases.filter((item) => item.status === caseTab);
  }, [caseTab, recentCases]);

  return (
    <div className="min-h-screen">
      <Header title="Expert workbench" subtitle="Reviews, case library, and clinical quality" />

      <div className="mx-auto max-w-[1200px] p-6">
        {isLoading && !data ? (
          <PageLoadingSkeleton>
            <div className="space-y-6" aria-hidden>
              {/* Mirrors `QuickStatsCard`: icon row + value + title */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-start justify-between">
                      <SkeletonBlock className="h-12 w-12 rounded-lg" />
                      <SkeletonBlock className="h-4 w-14" />
                    </div>
                    <SkeletonBlock className="mb-1 h-9 w-20" />
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SkeletonBlock className="min-h-[280px] rounded-2xl" />
                <SkeletonBlock className="min-h-[280px] rounded-2xl" />
              </div>
            </div>
          </PageLoadingSkeleton>
        ) : errorMessage && !data ? (
          <div className="rounded-2xl border border-destructive bg-destructive/10 px-6 py-8 text-center">
            <p className="font-medium text-destructive">{errorMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your connection and try refocusing the window to retry.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {expertStats.map((stat) => (
                <QuickStatsCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href="/expert/cases"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,123,255,0.22)] transition-all hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                Case library
              </Link>
              <Button type="button" variant="outline" className="gap-2" disabled title="Coming soon">
                <Filter className="h-5 w-5" />
                Filter cases
              </Button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">Pending Q&A Reviews</h2>
                      <p className="text-sm text-muted-foreground">
                        {pendingReviews.length} questions awaiting your review
                      </p>
                    </div>
                    <Link href="/expert/reviews" className="text-sm font-medium text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {pendingReviews.length === 0 ? (
                      <EmptyState
                        title="No pending reviews right now"
                        description="All queued Q&A items are resolved. New questions will appear here automatically."
                        action={
                          <Button type="button" variant="outline" onClick={() => router.push('/expert/reviews')}>
                            Open review queue
                          </Button>
                        }
                      />
                    ) : (
                      pendingReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          id={review.id}
                          studentName={review.studentName}
                          caseTitle={review.caseTitle}
                          question={review.questionSnippet}
                          aiAnswer={review.aiAnswerSnippet}
                          submittedAt={formatSubmittedAt(review.submittedAt)}
                          priority={review.priority}
                          category={review.category}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-card-foreground">Case Management</h2>
                    <Link href="/expert/cases" className="text-sm font-medium text-primary hover:underline">
                      View all cases
                    </Link>
                  </div>
                  <div
                    className="mb-4 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1"
                    role="tablist"
                    aria-label="Case status tabs"
                  >
                    {(
                      [
                        ['all', 'All'],
                        ['pending', 'Pending'],
                        ['approved', 'Approved'],
                        ['draft', 'Draft'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={caseTab === id}
                        className={`flex min-w-[calc(50%-4px)] flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:min-w-0 ${
                          caseTab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setCaseTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredRecentCases.length === 0 ? (
                      <EmptyState
                        title={`No ${caseTab === 'all' ? '' : caseTab + ' '}cases`}
                        description="Try another status tab or add new teaching cases to your library."
                        action={
                          <button
                            type="button"
                            onClick={() => setCaseTab('all')}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-all hover:bg-muted/60 active:scale-[0.98]"
                          >
                            Show all cases
                          </button>
                        }
                      />
                    ) : (
                      filteredRecentCases.map((caseItem) => (
                        <CaseManagementCard
                          key={caseItem.id}
                          id={caseItem.id}
                          title={caseItem.title}
                          boneLocation={caseItem.boneLocation}
                          lesionType={caseItem.lesionType}
                          difficulty={caseItem.difficulty}
                          status={caseItem.status}
                          addedBy={caseItem.addedBy}
                          addedDate={caseItem.addedDate}
                          viewCount={caseItem.viewCount}
                          usageCount={caseItem.usageCount}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <ExpertActivityPanel
                  weeklyActivity={activity?.weeklyActivity ?? []}
                  avgDailyReviews={avgDailyReviews}
                />
              </div>
            </div>

            <ExpertBottomStats
              totalReviews={stats?.totalReviews ?? 0}
              casesApproved={stats?.approvedThisMonth ?? 0}
            />
          </>
        )}
      </div>
    </div>
  );
}

function formatSubmittedAt(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}
