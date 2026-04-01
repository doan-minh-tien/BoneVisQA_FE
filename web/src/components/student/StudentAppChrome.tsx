'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

const NAV = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/catalog', label: 'Case Library' },
  { href: '/student/quiz', label: 'Quizzes' },
  { href: '/student/history', label: 'Progress' },
] as const;

/**
 * Top bar aligned with the AI mockup. Sidebar colors stay on AppSidebar (#0F1F35) — do not reuse MD3 light tokens there.
 */
export function StudentAppChrome({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || 'Med Student';
  const shortLabel =
    user?.activeRole === 'Student' ? 'Med Student' : user?.activeRole || 'Student';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <span className="shrink-0 font-['Manrope',sans-serif] text-xl font-black tracking-tighter text-blue-800 dark:text-blue-300">
              BoneVisQA
            </span>
            <nav className="hidden items-center gap-8 md:flex">
              {NAV.map(({ href, label }) => {
                const active =
                  pathname === href || (href !== '/student/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`font-['Manrope',sans-serif] border-b-2 pb-1 text-sm font-bold tracking-tight transition-colors ${
                      active
                        ? 'border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-slate-200/50 dark:hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 dark:bg-white/10">
              <span className="hidden text-xs font-semibold text-on-surface sm:inline dark:text-slate-100">
                {shortLabel}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {displayName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('') || 'BV'}
              </div>
            </div>
          </div>
        </div>
        {(title || subtitle || children) && (
          <div className="border-t border-slate-100/80 px-6 py-5 dark:border-white/10">
            {title ? (
              <h1 className="font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-on-surface dark:text-slate-100">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-on-surface-variant dark:text-slate-400">{subtitle}</p>
            ) : null}
            {children}
          </div>
        )}
      </header>
    </>
  );
}
