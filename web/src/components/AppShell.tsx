import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

export function AppShell({
  role,
  children,
}: {
  role: RoleKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text-main">
      <AppSidebar role={role} />
      <main className="ml-[260px] min-h-screen bg-background">{children}</main>
    </div>
  );
}
