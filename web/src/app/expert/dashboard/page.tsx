'use client';

import { useEffect, useState } from 'react';
import ExpertHeader from '@/components/expert/ExpertHeader';
import QuickStatsCard from '@/components/expert/QuickStatsCard';
import ReviewCard from '@/components/expert/ReviewCard';
import ExpertActivityPanel from '@/components/expert/dashboard/ExpertActivityPanel';
import ExpertBottomStats from '@/components/expert/dashboard/ExpertBottomStats';
import {
  MessageSquare,
  FolderOpen,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  fetchExpertPendingReviews,
  fetchExpertRecentCases,
  fetchExpertActivity,
  type ExpertPendingReview,
  type ExpertRecentCase,
  type ExpertActivity,
} from '@/lib/api/expert-dashboard';
import { useToast } from '@/components/ui/toast';

export default function ExpertDashboardPage() {
  const toast = useToast();
  const [pendingReviews, setPendingReviews] = useState<ExpertPendingReview[]>([]);
  const [recentCases, setRecentCases] = useState<ExpertRecentCase[]>([]);
  const [activity, setActivity] = useState<ExpertActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [reviewsData, casesData, activityData] = await Promise.all([
          fetchExpertPendingReviews(),
          fetchExpertRecentCases(),
          fetchExpertActivity(),
        ]);
        if (!cancelled) {
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

  // Derive quick-stat cards from what we actually have
  const quickStats = [
    {
      title: 'Pending Reviews',
      value: pendingReviews.length.toString(),
      change: pendingReviews.length,
      trend: pendingReviews.length > 0 ? 'down' as const : 'up' as const,
      icon: Clock,
      iconColor: 'bg-warning/10 text-warning',
    },
    {
      title: 'Total Questions',
      value: pendingReviews.length.toString(),
      change: pendingReviews.length,
      trend: 'up' as const,
      icon: MessageSquare,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Recent Cases',
      value: recentCases.length.toString(),
      change: recentCases.length,
      trend: 'up' as const,
      icon: FolderOpen,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Weekly Reviews',
      value: (activity?.weeklyActivity.reduce((s, d) => s + d.reviews, 0) ?? 0).toString(),
      change: activity?.weeklyActivity.reduce((s, d) => s + d.reviews, 0) ?? 0,
      trend: 'up' as const,
      icon: MessageSquare,
      iconColor: 'bg-accent/10 text-accent',
    },
  ];

  const avgDailyReviews = activity?.avgDailyReviews.toFixed(1) ?? '0';

  return (
    <div className="min-h-screen">
      <ExpertHeader
        title="Clinical Expert Dashboard"
        subtitle="Manage cases and review student questions"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading dashboard data...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive bg-destructive/10 px-6 py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Quick stat cards derived from real API data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {quickStats.map((stat) => (
                <QuickStatsCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left col: Pending Q&A Reviews */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">
                        Pending Q&amp;A Reviews
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
              </div>

              {/* Right col: Activity panel */}
              <div className="space-y-6">
                <ExpertActivityPanel
                  weeklyActivity={activity?.weeklyActivity ?? []}
                  avgDailyReviews={avgDailyReviews}
                />
              </div>
            </div>

            <ExpertBottomStats
              totalReviews={pendingReviews.length}
              casesApproved={recentCases.length}
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
