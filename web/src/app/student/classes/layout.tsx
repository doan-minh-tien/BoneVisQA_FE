import type { ReactNode } from 'react';

/** Parent `student/layout.tsx` already wraps with `AppShell` — avoid double sidebar. */
export default function StudentClassesLayout({ children }: { children: ReactNode }) {
  return children;
}
