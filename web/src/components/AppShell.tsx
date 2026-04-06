'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { SessionGateSkeleton } from '@/components/shared/DashboardSkeletons';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

export function AppShell({
  role,
  children,
}: {
  role: RoleKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/sign-in${redirect}`);
    }
  }, [pathname, router, token]);

  if (!token) {
    return <SessionGateSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-text-main">
      <AppSidebar role={role} />
      <main className="ml-[260px] min-h-screen bg-background">{children}</main>
    </div>
  );
}
