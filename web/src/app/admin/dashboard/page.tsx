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
import { http, getApiErrorMessage } from '@/lib/api/client';

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
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await http.get<{ result?: UserStatResult; message?: string }>(
          '/api/admin/monitoring/users',
        );
        if (!cancelled) {
          setStatsData(data.result ?? (data as unknown as UserStatResult));
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(err);
          console.error('Failed to fetch admin stats:', msg);
          setStatsError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
      value: '48', // Hardcoded temporarily until API returns it
      change: '+3 new this semester',
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

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {currentStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <RecentUsersTable />
            <RoleDistributionChart isLoading={isLoading} roleDistribution={roleDistribution} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SystemActivityFeed />
            <QuickStats />
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-primary">99.8%</p>
            <p className="text-sm text-muted-foreground mt-1">System Uptime</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-success">94.2%</p>
            <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-warning">4.6</p>
            <p className="text-sm text-muted-foreground mt-1">Avg. AI Rating</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-accent">847</p>
            <p className="text-sm text-muted-foreground mt-1">Certificates Issued</p>
          </div>
        </div>
      </div>
    </div>
  );
}
