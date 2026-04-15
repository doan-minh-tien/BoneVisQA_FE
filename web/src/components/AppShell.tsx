'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';
import { SessionGateSkeleton } from '@/components/shared/DashboardSkeletons';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

type AuthSnapshot = {
  token: string | null;
  isGuestOrUnassigned: boolean;
};

function readAuthSnapshot(): AuthSnapshot {
  if (typeof window === 'undefined') {
    return { token: null, isGuestOrUnassigned: false };
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
  const guestStatus = status === 'guest';
  const unassignedRole =
    normalizedRoles.length === 0 ||
    normalizedRoles.includes('none') ||
    normalizedRoles.includes('unassigned') ||
    normalizedRoles.includes('guest') ||
    !hasUsableRole;
  return {
    token: nextToken,
    isGuestOrUnassigned: Boolean(nextToken) && (guestStatus || unassignedRole),
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
  const [{ token, isGuestOrUnassigned }] = useState<AuthSnapshot>(readAuthSnapshot);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /** Avoid pathname-dependent `className` differing on SSR vs first client paint (hydration mismatch). */
  const [layoutMounted, setLayoutMounted] = useState(false);
  useEffect(() => {
    setLayoutMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/sign-in${redirect}`);
      return;
    }
    if (isGuestOrUnassigned) {
      router.replace('/pending-approval');
    }
  }, [isGuestOrUnassigned, pathname, router, token]);

  if (!token) {
    return <SessionGateSkeleton />;
  }

  if (isGuestOrUnassigned) {
    return <SessionGateSkeleton />;
  }

  const sidebarPx = sidebarCollapsed ? 72 : 260;
  const gutterPx = 24;
  /** Full-height workbench: only inner panels scroll (applied after mount so SSR/client markup match). */
  const shellMainScrollLocked = layoutMounted && (pathname?.startsWith('/student/qa/image') ?? false);

  return (
    <div className="flex min-h-0 h-screen w-full overflow-hidden bg-background text-text-main">
      <AppSidebar
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background py-6 pr-6 transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: `${sidebarPx + gutterPx}px` }}
      >
        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500',
            shellMainScrollLocked
              ? 'overflow-hidden'
              : 'overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
