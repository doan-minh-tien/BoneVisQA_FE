"use client";

import { useEffect, useState } from 'react';
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
  Loader2,
} from 'lucide-react';

import RecentUsersTable from '@/components/admin/dashboard/RecentUsersTable';
import RoleDistributionChart from '@/components/admin/dashboard/RoleDistributionChart';
import SystemActivityFeed from '@/components/admin/dashboard/SystemActivityFeed';
import {
  fetchAdminUserStats,
  fetchAdminActivityStats,
  fetchAdminRagStats,
  fetchAdminExpertReviewStats,
  fetchAdminRecentUsers,
  type AdminUserStat,
  type AdminActivityStat,
  type AdminRagStat,
  type AdminExpertReviewStat,
  type AdminRecentUser,
} from '@/lib/api/admin-dashboard';
import { useToast } from '@/components/ui/toast';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [userStats, setUserStats] = useState<AdminUserStat | null>(null);
  const [activityStats, setActivityStats] = useState<AdminActivityStat | null>(null);
  const [ragStats, setRagStats] = useState<AdminRagStat | null>(null);
  const [expertStats, setExpertStats] = useState<AdminExpertReviewStat | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminRecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [user, rag, expert, users, activity] = await Promise.all([
          fetchAdminUserStats(),
          fetchAdminRagStats(),
          fetchAdminExpertReviewStats(),
          fetchAdminRecentUsers(),
          fetchAdminActivityStats(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        ]);
        if (!cancelled) {
          setUserStats(user);
          setRagStats(rag);
          setExpertStats(expert);
          setRecentUsers(users);
          setActivityStats(activity);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
          console.error('Failed to fetch admin stats:', msg);
          setStatsError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const totalUsers = userStats?.totalUsers || 0;
  const newUsers = userStats?.newUsersThisMonth || 0;
  const students = userStats?.usersByRole?.['Student'] || 0;
  const lecturers = userStats?.usersByRole?.['Lecturer'] || 0;
  const experts = userStats?.usersByRole?.['Expert'] || 0;
  const admins = userStats?.usersByRole?.['Admin'] || 0;

  const roleDistribution = [
    { role: 'Students', count: students, color: 'bg-primary' },
    { role: 'Lecturers', count: lecturers, color: 'bg-accent' },
    { role: 'Experts', count: experts, color: 'bg-warning' },
    { role: 'Admins', count: admins, color: 'bg-destructive' },
  ].map(item => ({
    ...item,
    percentage: totalUsers > 0 ? Number(((item.count / totalUsers) * 100).toFixed(1)) : 0
  })).sort((a,b) => b.count - a.count);

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

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="System overview and management" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading dashboard data...
            </div>
          </div>
        ) : statsError ? (
          <div className="rounded-2xl border border-destructive bg-destructive/10 px-6 py-8 text-center">
            <p className="text-destructive font-medium">{statsError}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {currentStats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 space-y-6">
                <RecentUsersTable users={recentUsers} isLoading={isLoading} />
                <RoleDistributionChart isLoading={false} roleDistribution={roleDistribution} />
              </div>

              <div className="space-y-6">
                <SystemActivityFeed activityStats={activityStats} />
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
                        {ragStats?.totalDocuments?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Total Reviews</span>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {expertStats?.totalReviews?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Pending Reviews</span>
                      </div>
                      <span className="text-sm font-semibold text-warning">
                        {expertStats?.pendingAnswers?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-card-foreground">Document Chunks</span>
                      </div>
                      <span className="text-sm font-semibold text-card-foreground">
                        {ragStats?.totalChunks?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-primary">
                  {expertStats?.approvedReviews?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Approved Reviews</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-success">
                  {ragStats?.totalCitations?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Citations</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-warning">
                  {ragStats?.outdatedDocuments?.toLocaleString() ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Outdated Documents</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <p className="text-3xl font-bold text-accent">
                  {userStats?.pendingUsers?.toLocaleString() ?? '—'}
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
