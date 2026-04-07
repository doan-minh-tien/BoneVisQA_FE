'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useLogout';
import { useAuth, type BackendRole } from '@/lib/useAuth';
import {
  BookOpen,
  BotMessageSquare,
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
    { label: 'Quizzes', href: '/student/quiz', icon: HelpCircle },
    { label: 'AI Q&A', href: '/student/qa', icon: BotMessageSquare },
    { label: 'Classes', href: '/student/classes', icon: Users },
    { label: 'Profile', href: '/student/profile', icon: UserCircle },
  ],
};

const roleMeta: Record<RoleKey, { label: string; actionHref: string }> = {
  admin: { label: 'Radiology Education', actionHref: '/admin/documents' },
  lecturer: { label: 'Radiology Education', actionHref: '/lecturer/qa-triage' },
  expert: { label: 'Radiology Education', actionHref: '/expert/reviews' },
  student: { label: 'Radiology Education', actionHref: '/student/qa/image' },
};

/** Trang xem / chỉnh sửa thông tin cá nhân theo role (JWT xác định user — không cần gửi userId). */
function profileHrefForRole(role: RoleKey): string {
  if (role === 'student') return '/student/profile';
  return `/${role}/settings`;
}

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

  const profileName = user?.fullName || 'Radiology User';
  const profileRole = user?.activeRole || 'Guest';

  if (!resolvedRole || !meta) {
    return (
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/10 bg-[#0F1F35] text-sidebar-text">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-accent/20 bg-cyan-accent/10 shadow-sm">
              <Stethoscope className="h-5 w-5 text-cyan-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-wide text-white">
                BoneVisQA
              </h1>
              <p className="truncate text-xs text-slate-300">Radiology Education</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-6 text-sm text-slate-300">
          No role-based navigation available.
        </div>
        <div className="border-t border-white/10 px-4 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    );
  }

  return (
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/10 bg-[#0F1F35] text-sidebar-text shadow-[8px_0_40px_rgba(15,23,42,0.18)]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-accent/20 bg-cyan-accent/10 shadow-sm">
            <Stethoscope className="h-5 w-5 text-cyan-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-wide text-white">
              BoneVisQA
            </h1>
            <p className="truncate text-xs text-slate-300">{meta.label}</p>
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
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-white/14 text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)]'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <Link href={meta.actionHref} className="block">
          <Button
            className="w-full justify-center border-0 bg-gradient-to-br from-[#007BFF] to-[#005eb8] text-white shadow-lg hover:from-[#0068e6] hover:to-[#004a9e]"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </Link>
        <Link
          href={profileHrefForRole(resolvedRole)}
          className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 px-3 py-3 transition-colors hover:bg-white/10"
          title="Account & profile"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007BFF] text-sm font-semibold text-white">
            {profileName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('') || 'BV'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profileName}</p>
            <p className="truncate text-xs text-slate-300">{profileRole}</p>
          </div>
          <UserCog className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
        </Link>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
