'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';

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
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    if (token === null) return;
    if (!token) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/sign-in${redirect}`);
    }
  }, [pathname, router, token]);

  if (token === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        Checking session...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main">
      <AppSidebar role={role} />
      <main className="ml-[260px] min-h-screen bg-background">{children}</main>
    </div>
  );
}
