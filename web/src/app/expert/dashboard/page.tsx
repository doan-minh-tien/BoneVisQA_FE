'use client';

import { useEffect, useState } from 'react';
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
  fetchExpertDashboardStats,
  fetchExpertPendingReviews,
  fetchExpertRecentCases,
  fetchExpertActivity,
  type ExpertDashboardStats,
  type ExpertPendingReview,
  type ExpertRecentCase,
  type ExpertActivity,
} from '@/lib/api/expert-dashboard';
import { useToast } from '@/components/ui/toast';

export default function ExpertDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<ExpertDashboardStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<ExpertPendingReview[]>([]);
  const [recentCases, setRecentCases] = useState<ExpertRecentCase[]>([]);
  const [activity, setActivity] = useState<ExpertActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsData, reviewsData, casesData, activityData] = await Promise.all([
          fetchExpertDashboardStats(),
          fetchExpertPendingReviews(),
          fetchExpertRecentCases(),
          fetchExpertActivity(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setPendingReviews(reviewsData);
          setRecentCases(casesData);
          setActivity(activityData);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
          console.error('Failed to fetch expert dashboard:', msg);
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const expertStats = stats ? [
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
      trend: stats.pendingReviews > 0 ? 'down' as const : 'up' as const,
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
  ] : [];

  const avgDailyReviews = activity?.avgDailyReviews.toFixed(1) ?? '0';

  return (
    <div className="min-h-screen">
      <Header
        title="Clinical Expert Dashboard"
        subtitle="Manage cases and review student questions"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {isLoading ? (
          <PageLoadingSkeleton>
            <div className="space-y-6" aria-hidden>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <SkeletonBlock className="mb-3 h-4 w-28" />
                    <SkeletonBlock className="h-9 w-16" />
                    <SkeletonBlock className="mt-2 h-3 w-36" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SkeletonBlock className="min-h-[280px] rounded-2xl" />
                <SkeletonBlock className="min-h-[280px] rounded-2xl" />
              </div>
            </div>
          </PageLoadingSkeleton>
        ) : error ? (
          <div className="rounded-2xl border border-destructive bg-destructive/10 px-6 py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {expertStats.map((stat) => (
                <QuickStatsCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add New Case</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer">
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filter Cases</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">
                        Pending Q&A Reviews
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {pendingReviews.length} questions awaiting your review
                      </p>
                    </div>
                    <a
                      href="/expert/reviews"
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      View all
                    </a>
                  </div>
                  <div className="space-y-4">
                    {pendingReviews.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                        No pending reviews at the moment.
                      </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-card-foreground">
                      Case Management
                    </h2>
                    <a
                      href="/expert/cases"
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      View all cases
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentCases.length === 0 ? (
                      <div className="col-span-2 rounded-xl border border-dashed border-border bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                        No recent cases found.
                      </div>
                    ) : (
                      recentCases.map((caseItem) => (
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
