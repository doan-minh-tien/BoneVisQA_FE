'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth, type BackendRole } from '@/lib/useAuth';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

function mapBackendRoleToRoleKey(role: BackendRole | null | undefined): RoleKey {
  if (role === 'Student') return 'student';
  if (role === 'Lecturer') return 'lecturer';
  if (role === 'Expert') return 'expert';
  if (role === 'Admin') return 'admin';
  return 'student';
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <AppShell role={mapBackendRoleToRoleKey(user?.activeRole)}>{children}</AppShell>;
}
