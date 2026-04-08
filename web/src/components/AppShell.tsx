'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { SessionGateSkeleton } from '@/components/shared/DashboardSkeletons';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

type AuthSnapshot = {
  token: string | null;
  isPendingOrUnassigned: boolean;
};

function readAuthSnapshot(): AuthSnapshot {
  if (typeof window === 'undefined') {
    return { token: null, isPendingOrUnassigned: false };
  }
  const nextToken = localStorage.getItem('token');
  const status = (localStorage.getItem('userStatus') || '').trim().toLowerCase();
  let roles: string[] = [];
  try {
    roles = JSON.parse(localStorage.getItem('roles') || '[]') as string[];
  } catch {
    roles = [];
  }
  const normalizedRoles = roles.map((r) => r.trim().toLowerCase()).filter(Boolean);
  const activeRole = (localStorage.getItem('activeRole') || '').trim().toLowerCase();
  const hasUsableRole = Boolean(activeRole) && activeRole !== 'none';
  const pendingStatus = status === 'pending';
  const unassignedRole =
    normalizedRoles.length === 0 ||
    normalizedRoles.includes('none') ||
    normalizedRoles.includes('unassigned') ||
    normalizedRoles.includes('pending') ||
    !hasUsableRole;
  return {
    token: nextToken,
    isPendingOrUnassigned: Boolean(nextToken) && (pendingStatus || unassignedRole),
  };
}

export function AppShell({
  role,
  children,
}: {
  role: RoleKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [{ token, isPendingOrUnassigned }] = useState<AuthSnapshot>(readAuthSnapshot);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!token) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/sign-in${redirect}`);
      return;
    }
    if (isPendingOrUnassigned) {
      router.replace('/pending-approval');
    }
  }, [isPendingOrUnassigned, pathname, router, token]);

  if (!token) {
    return <SessionGateSkeleton />;
  }

  if (isPendingOrUnassigned) {
    return <SessionGateSkeleton />;
  }

  const sidebarPx = sidebarCollapsed ? 72 : 260;
  const gutterPx = 24;

  return (
    <div className="min-h-screen bg-background text-text-main">
      <AppSidebar
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />
      <div
        className="min-h-screen min-w-0 bg-background py-6 pr-6 transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: `${sidebarPx + gutterPx}px` }}
      >
        <main className="min-h-screen min-w-0">{children}</main>
      </div>
    </div>
  );
}
