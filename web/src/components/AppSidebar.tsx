'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useLogout';
import { useAuth, type BackendRole } from '@/lib/useAuth';
import {
  BookOpen,
  CheckSquare,
  Database,
  LayoutDashboard,
  HelpCircle,
  LogOut,
  Plus,
  ScanSearch,
  Stethoscope,
  UserCog,
  ClipboardList,
  Users,
  ShieldCheck,
  FileQuestion,
  BarChart3,
  Megaphone,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navByRole: Record<RoleKey, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Medical Verifications', href: '/admin/verifications', icon: ShieldCheck },
    { label: 'Knowledge Base', href: '/admin/documents', icon: Database },
    { label: 'System Logs', href: '/admin/cases', icon: ClipboardList },
  ],
  lecturer: [
    { label: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutDashboard },
    { label: 'Triage Workbench', href: '/lecturer/qa-triage', icon: Stethoscope },
    { label: 'Classes', href: '/lecturer/classes', icon: Users },
    { label: 'Quiz Library', href: '/lecturer/quizzes', icon: FileQuestion },
    { label: 'Assignments', href: '/lecturer/assignments', icon: ClipboardList },
    { label: 'Cases', href: '/lecturer/cases', icon: BookOpen },
    { label: 'Analytics', href: '/lecturer/analytics', icon: BarChart3 },
    { label: 'Announcements', href: '/lecturer/announcements', icon: Megaphone },
    { label: 'Settings', href: '/lecturer/settings', icon: Settings },
  ],
  expert: [
    { label: 'Dashboard', href: '/expert/dashboard', icon: LayoutDashboard },
    { label: 'Validation Workbench', href: '/expert/reviews', icon: CheckSquare },
    { label: 'Case Library', href: '/expert/cases', icon: BookOpen },
  ],
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Case Catalog', href: '/student/catalog', icon: BookOpen },
    { label: 'History', href: '/student/history', icon: ClipboardList },
    { label: 'Visual QA', href: '/student/qa/image', icon: ScanSearch },
    { label: 'Quizzes', href: '/student/quiz', icon: HelpCircle },
  ],
};

const roleMeta: Record<RoleKey, { label: string; actionHref: string; actionLabel: string }> = {
  admin: { label: 'Radiology Education', actionHref: '/admin/documents', actionLabel: 'Upload Document' },
  lecturer: { label: 'Radiology Education', actionHref: '/lecturer/qa-triage', actionLabel: 'Open Triage' },
  expert: { label: 'Radiology Education', actionHref: '/expert/reviews', actionLabel: 'Open Workbench' },
  student: { label: 'Radiology Education', actionHref: '/student/qa/image', actionLabel: 'New Analysis' },
};

function mapBackendRoleToRoleKey(role: BackendRole | null | undefined): RoleKey | null {
  if (role === 'Student') return 'student';
  if (role === 'Lecturer') return 'lecturer';
  if (role === 'Expert') return 'expert';
  if (role === 'Admin') return 'admin';
  return null;
}

export function AppSidebar({ role }: { role?: RoleKey }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { user } = useAuth();
  const resolvedRole = mapBackendRoleToRoleKey(user?.activeRole) ?? role ?? null;
  const items = resolvedRole ? navByRole[resolvedRole] ?? [] : [];
  const meta = resolvedRole ? roleMeta[resolvedRole] : null;

  const profileName = user?.fullName?.trim() || user?.email?.trim() || 'Authenticated User';
  const profileRole = user?.activeRole || 'Member';

  if (!resolvedRole || !meta) {
    return (
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-slate-50 text-slate-900">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 shadow-sm">
              <Stethoscope className="h-5 w-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-wide text-slate-900">
                BoneVisQA
              </h1>
              <p className="truncate text-xs text-slate-500">Radiology Education</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-6 text-sm text-slate-500">
          No role-based navigation available.
        </div>
        <div className="border-t border-slate-200 px-4 py-4">
          <Button onClick={logout} variant="outline" className="w-full justify-center">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    );
  }

  return (
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 shadow-sm">
            <Stethoscope className="h-5 w-5 text-blue-700" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-wide text-slate-900">
              BoneVisQA
            </h1>
            <p className="truncate text-xs text-slate-500">{meta.label}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${resolvedRole}/dashboard` && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <Link href={meta.actionHref} className="block">
          <Button
            className="w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            {meta.actionLabel}
          </Button>
        </Link>
        <Link href="/profile" className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:bg-slate-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {profileName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('') || 'BV'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
            <p className="truncate text-xs text-slate-500">{profileRole}</p>
          </div>
          <UserCog className="h-4 w-4 text-slate-500" />
        </Link>
        <Button onClick={logout} variant="outline" className="mt-3 w-full justify-center">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
