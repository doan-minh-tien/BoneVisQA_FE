"use client";

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
} from 'lucide-react';

import RecentUsersTable from '@/components/admin/dashboard/RecentUsersTable';
import RoleDistributionChart from '@/components/admin/dashboard/RoleDistributionChart';
import SystemActivityFeed from '@/components/admin/dashboard/SystemActivityFeed';
import QuickStats from '@/components/admin/dashboard/QuickStats';
import { AdminDashboardSkeleton } from '@/components/shared/DashboardSkeletons';

interface UserStatResult {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    Student?: number;
    Lecturer?: number;
    Admin?: number;
    Expert?: number;
  };
}

export default function AdminDashboardPage() {
  const [statsData, setStatsData] = useState<UserStatResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const response = await fetch(`${apiUrl}/api/Admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatsData(data.result);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  // Map data from API for Stats
  const totalUsers = statsData?.totalUsers || 0;
  const newUsers = statsData?.newUsersThisMonth || 0;
  const students = statsData?.usersByRole?.Student || 0;
  const lecturers = statsData?.usersByRole?.Lecturer || 0;
  const experts = statsData?.usersByRole?.Expert || 0;
  const admins = statsData?.usersByRole?.Admin || 0;

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
      title: 'Active Courses',
      value: '—',
      change: 'Awaiting API',
      changeType: 'positive' as const,
      icon: BookOpen,
      iconColor: 'bg-success/10 text-success',
    },
  ];

  const roleDistribution = [
    { role: 'Students', count: students, color: 'bg-primary' },
    { role: 'Lecturers', count: lecturers, color: 'bg-accent' },
    { role: 'Experts', count: experts, color: 'bg-warning' },
    { role: 'Admins', count: admins, color: 'bg-destructive' },
  ].map(item => ({
    ...item,
    percentage: totalUsers > 0 ? Number(((item.count / totalUsers) * 100).toFixed(1)) : 0
  })).sort((a,b) => b.count - a.count);

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="System overview and management" />

      <div className="mx-auto max-w-[1600px] p-6">
        {isLoading ? (
          <AdminDashboardSkeleton />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {currentStats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <RecentUsersTable />
                <RoleDistributionChart isLoading={false} roleDistribution={roleDistribution} />
              </div>
              <div className="space-y-6">
                <SystemActivityFeed />
                <QuickStats />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-primary">—</p>
                <p className="mt-1 text-sm text-muted-foreground">System Uptime</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-success">—</p>
                <p className="mt-1 text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-warning">—</p>
                <p className="mt-1 text-sm text-muted-foreground">Avg. AI Rating</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-accent">—</p>
                <p className="mt-1 text-sm text-muted-foreground">Certificates Issued</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
