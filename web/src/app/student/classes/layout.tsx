'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

export default function StudentClassesLayout({ children }: { children: ReactNode }) {
  return <AppShell role="student">{children}</AppShell>;
}
