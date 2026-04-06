'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useLogout';
import { getStoredUserInfo } from '@/lib/getStoredUserInfo';
import {
  LayoutDashboard,
  Users,
  FileText,
  BrainCircuit,
  Activity,
  Settings,
  LogOut,
  Stethoscope,
  Database,
} from 'lucide-react';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Database, label: 'Knowledge Base', href: '/admin/documents' },
  { icon: FileText, label: 'Cases', href: '/admin/cases' },
  { icon: BrainCircuit, label: 'AI Config', href: '/admin/ai-config' },
  { icon: Activity, label: 'System Logs', href: '/admin/logs' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const stored = getStoredUserInfo();
  const initials = stored.fullName
    ? stored.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'AD';
  const displayName = stored.fullName || 'Admin';
  const displayEmail = stored.email || '';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">BoneVisQA</h1>
          <p className="text-xs opacity-70">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-bg font-medium'
                        : 'hover:bg-sidebar-hover'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-150"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs opacity-70 truncate">{displayEmail || 'Admin'}</p>
          </div>
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-hover cursor-pointer transition-colors duration-150">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
