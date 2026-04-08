'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useLogout';
import { useAuth, type BackendRole } from '@/lib/useAuth';
import { resolveApiAssetUrl } from '@/lib/api/client';
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
  UserCircle,
  ClipboardList,
  Users,
  ShieldCheck,
  FileQuestion,
  BarChart3,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
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
    { label: 'Settings', href: '/expert/settings', icon: Settings },
  ],
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Case Library', href: '/student/catalog', icon: BookOpen },
    { label: 'History', href: '/student/history', icon: ClipboardList },
    { label: 'Visual QA', href: '/student/qa/image', icon: ScanSearch },
    { label: 'Quizzes', href: '/student/quizzes', icon: HelpCircle },
    { label: 'Classes', href: '/student/classes', icon: Users },
    { label: 'Profile', href: '/profile', icon: UserCircle },
  ],
};

const roleMeta: Record<RoleKey, { label: string; actionHref: string; actionLabel: string }> = {
  admin: { label: 'Radiology Education', actionHref: '/admin/documents', actionLabel: 'Upload Document' },
  lecturer: { label: 'Radiology Education', actionHref: '/lecturer/qa-triage', actionLabel: 'Open Triage' },
  expert: { label: 'Radiology Education', actionHref: '/expert/reviews', actionLabel: 'Open Workbench' },
  student: { label: 'Radiology Education', actionHref: '/student/qa/image', actionLabel: 'New Analysis' },
};

function profileHrefForRole(_role: RoleKey): string {
  return '/profile';
}

function mapBackendRoleToRoleKey(role: BackendRole | null | undefined): RoleKey | null {
  if (role === 'Student') return 'student';
  if (role === 'Lecturer') return 'lecturer';
  if (role === 'Expert') return 'expert';
  if (role === 'Admin') return 'admin';
  return null;
}

export function AppSidebar({
  role,
  collapsed,
  onToggleCollapsed,
}: {
  role?: RoleKey;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const { user } = useAuth();
  const resolvedRole = mapBackendRoleToRoleKey(user?.activeRole) ?? role ?? null;
  const items = resolvedRole ? navByRole[resolvedRole] ?? [] : [];
  const meta = resolvedRole ? roleMeta[resolvedRole] : null;

  const profileName = user?.fullName?.trim() || user?.email?.trim() || 'Authenticated User';
  const profileRole = user?.activeRole || 'Member';
  const avatarResolved = user?.avatarUrl?.trim()
    ? resolveApiAssetUrl(user.avatarUrl.trim())
    : '';

  const initials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BV';

  const shellClass = `fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background text-foreground shadow-sm transition-[width] duration-200 ease-out ${
    collapsed ? 'w-[72px]' : 'w-[260px]'
  }`;

  if (!resolvedRole || !meta) {
    return (
      <aside className={shellClass}>
        <div
          className={`flex shrink-0 items-center border-b border-border py-2 ${
            collapsed ? 'flex-col gap-2 px-1' : 'h-14 justify-between px-2'
          }`}
        >
          <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : 'min-w-0 flex-1'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/60">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">BoneVisQA</h1>
                <p className="truncate text-[11px] text-muted-foreground">Radiology Education</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 px-2 py-4 text-center text-xs text-muted-foreground">
          {!collapsed ? 'No role-based navigation available.' : '—'}
        </div>
        <div className="border-t border-border p-2">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-center border-border bg-muted/40 text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? <span className="ml-2">Logout</span> : null}
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={shellClass}>
      <div
        className={`flex shrink-0 items-center border-b border-border py-2 ${
          collapsed ? 'flex-col gap-2 px-1' : 'h-[4.5rem] justify-between gap-1 px-2'
        }`}
      >
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : 'min-w-0 flex-1'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-wide text-foreground">BoneVisQA</h1>
              <p className="truncate text-[11px] text-muted-foreground">{meta.label}</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${resolvedRole}/dashboard` && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-colors duration-150 ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <Link href={meta.actionHref} className="block" title={collapsed ? meta.actionLabel : undefined}>
          <Button className={`w-full justify-center ${collapsed ? 'px-2' : ''}`}>
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="ml-2">{meta.actionLabel}</span> : null}
          </Button>
        </Link>
        <Link
          href={profileHrefForRole(resolvedRole)}
          className={`mt-2 flex items-center rounded-lg border border-border bg-muted/40 hover:bg-muted ${
            collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
          }`}
          title="Account & profile"
        >
          {avatarResolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarResolved}
              alt=""
              className={`shrink-0 rounded-full border border-border object-cover ${collapsed ? 'h-9 w-9' : 'h-10 w-10'}`}
            />
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary ${
                collapsed ? 'h-9 w-9' : 'h-10 w-10'
              }`}
            >
              {initials}
            </div>
          )}
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                <p className="truncate text-xs text-muted-foreground">{profileRole}</p>
              </div>
              <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </>
          ) : null}
        </Link>
        <Button
          onClick={logout}
          variant="outline"
          className="mt-2 w-full justify-center border-border bg-muted/40 text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span className="ml-2">Logout</span> : null}
        </Button>
      </div>
    </aside>
  );
}
