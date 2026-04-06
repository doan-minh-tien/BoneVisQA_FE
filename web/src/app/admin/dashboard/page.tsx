"use client";

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Users,
  GraduationCap,
  UserCog,
  TrendingUp,
  FileText,
  Award,
  Clock,
} from 'lucide-react';

import RecentUsersTable from '@/components/admin/dashboard/RecentUsersTable';
import RoleDistributionChart from '@/components/admin/dashboard/RoleDistributionChart';
import SystemActivityFeed from '@/components/admin/dashboard/SystemActivityFeed';
import { AdminDashboardSkeleton } from '@/components/shared/DashboardSkeletons';
import {
  fetchAdminUserStats,
  fetchAdminActivityStats,
  fetchAdminRagStats,
  fetchAdminExpertReviewStats,
  fetchAdminRecentUsersPage,
  type AdminUserStat,
  type AdminActivityStat,
  type AdminRagStat,
  type AdminExpertReviewStat,
  type AdminRecentUser,
} from '@/lib/api/admin-dashboard';
import { useToast } from '@/components/ui/toast';

const RECENT_USERS_PAGE_SIZE = 8;

export default function AdminDashboardPage() {
  const toast = useToast();
  const [recentPage, setRecentPage] = useState(1);
  const swrConfig = {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    keepPreviousData: true,
  };
  const { data: userStats, error: userError, isLoading: userLoading } = useSWR<AdminUserStat>(
    'admin-user-stats',
    fetchAdminUserStats,
    swrConfig,
  );
  const { data: ragStats, error: ragError, isLoading: ragLoading } = useSWR<AdminRagStat>(
    'admin-rag-stats',
    fetchAdminRagStats,
    swrConfig,
  );
  const { data: expertStats, error: expertError, isLoading: expertLoading } = useSWR<AdminExpertReviewStat>(
    'admin-expert-review-stats',
    fetchAdminExpertReviewStats,
    swrConfig,
  );
  const { data: activityStats, error: activityError, isLoading: activityLoading } = useSWR<AdminActivityStat>(
    'admin-activity-stats',
    () => fetchAdminActivityStats(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
    swrConfig,
  );
  const {
    data: recentData,
    error: recentError,
    isLoading: recentLoading,
    isValidating: recentPaging,
  } = useSWR<{ users: AdminRecentUser[]; totalCount: number }>(
    ['admin-recent-users', recentPage],
    ([, page]: [string, number]) => fetchAdminRecentUsersPage(page, RECENT_USERS_PAGE_SIZE),
    swrConfig,
  );
  const recentUsers = recentData?.users ?? [];
  const recentTotal = recentData?.totalCount ?? 0;

  useEffect(() => {
    if (userError) toast.error(userError instanceof Error ? userError.message : 'Failed to load admin user stats.');
  }, [userError, toast]);
  useEffect(() => {
    if (ragError) toast.error(ragError instanceof Error ? ragError.message : 'Failed to load RAG stats.');
  }, [ragError, toast]);
  useEffect(() => {
    if (expertError) {
      toast.error(
        expertError instanceof Error ? expertError.message : 'Failed to load expert review stats.',
      );
    }
  }, [expertError, toast]);
  useEffect(() => {
    if (activityError) {
      toast.error(activityError instanceof Error ? activityError.message : 'Failed to load system activity.');
    }
  }, [activityError, toast]);
  useEffect(() => {
    if (recentError) toast.error(recentError instanceof Error ? recentError.message : 'Failed to load recent users.');
  }, [recentError, toast]);

  const totalUsers = userStats?.totalUsers || 0;
  const newUsers = userStats?.newUsersThisMonth || 0;
  const students = userStats?.usersByRole?.['Student'] || 0;
  const lecturers = userStats?.usersByRole?.['Lecturer'] || 0;
  const experts = userStats?.usersByRole?.['Expert'] || 0;
  const admins = userStats?.usersByRole?.['Admin'] || 0;

  const roleDistribution = useMemo(
    () =>
      [
        { role: 'Students', count: students, color: 'bg-primary' },
        { role: 'Lecturers', count: lecturers, color: 'bg-accent' },
        { role: 'Experts', count: experts, color: 'bg-warning' },
        { role: 'Admins', count: admins, color: 'bg-destructive' },
      ]
        .map((item) => ({
          ...item,
          percentage: totalUsers > 0 ? Number(((item.count / totalUsers) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.count - a.count),
    [admins, experts, lecturers, students, totalUsers],
  );

  const currentStats = [
    {
      title: 'Total Users',
      value: totalUsers.toString(),
      change: `+${newUsers} this month`,
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Students',
      value: students.toString(),
      change: 'active members',
      changeType: 'positive' as const,
      icon: GraduationCap,
      iconColor: 'bg-accent/10 text-accent',
    },
    {
      title: 'Lecturers',
      value: lecturers.toString(),
      change: 'active teaching',
      changeType: 'positive' as const,
      icon: UserCog,
      iconColor: 'bg-warning/10 text-warning',
    },
    {
      title: 'Experts',
      value: experts.toString(),
      change: 'reviewing cases',
      changeType: 'positive' as const,
      icon: Award,
      iconColor: 'bg-success/10 text-success',
    },
  ];
  const showInitialSkeleton = userLoading && ragLoading && expertLoading && activityLoading && recentLoading;

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="System overview and management" />

      <div className="mx-auto max-w-[1600px] p-6">
        {showInitialSkeleton ? (
          <AdminDashboardSkeleton />
        ) : (
          <>
            {(userError || ragError || expertError || activityError || recentError) ? (
              <div className="mb-6 rounded-2xl border border-dashed border-warning bg-warning/10 px-6 py-4 text-sm text-card-foreground">
                Some dashboard widgets could not load. Available data is still shown.
              </div>
            ) : null}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {currentStats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <RecentUsersTable
                  users={recentUsers}
                  isLoading={recentLoading}
                  isPaging={recentPaging}
                  page={recentPage}
                  pageSize={RECENT_USERS_PAGE_SIZE}
                  totalCount={recentTotal}
                  onPageChange={setRecentPage}
                />
                <RoleDistributionChart isLoading={userLoading} roleDistribution={roleDistribution} />
              </div>

              <div className="space-y-6">
                <SystemActivityFeed activityStats={activityLoading ? null : activityStats} />
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-card-foreground">Platform Stats</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Total Cases</span>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {ragLoading ? '...' : ragStats?.totalDocuments?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Total Reviews</span>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {expertLoading ? '...' : expertStats?.totalReviews?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Pending Reviews</span>
                      </div>
                      <span className="text-sm font-semibold text-warning">
                        {expertLoading ? '...' : expertStats?.pendingAnswers?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Document Chunks</span>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {ragLoading ? '...' : ragStats?.totalChunks?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-primary">
                  {expertLoading ? '...' : expertStats?.approvedReviews?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Approved Reviews</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-success">
                  {ragLoading ? '...' : ragStats?.totalCitations?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Citations</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-warning">
                  {ragLoading ? '...' : ragStats?.outdatedDocuments?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Outdated Documents</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-accent">
                  {userLoading ? '...' : userStats?.pendingUsers?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Pending Users</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
