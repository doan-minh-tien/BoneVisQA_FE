'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useLogout';
import {
  LayoutDashboard,
  FileText,
  Database,
  ShieldCheck,
  Tags,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react';

const curatorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/curator/dashboard' },
  { icon: FileText, label: 'Documents', href: '/curator/documents' },
  { icon: Database, label: 'Indexing Pipeline', href: '/curator/indexing' },
  { icon: ShieldCheck, label: 'Content Quality', href: '/curator/quality' },
  { icon: Tags, label: 'Tags & Topics', href: '/curator/tags' },
  { icon: Settings, label: 'Settings', href: '/curator/settings' },
];

export default function CuratorSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">BoneVisQA</h1>
          <p className="text-xs opacity-70">Curator Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {curatorMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/curator/dashboard' && pathname.startsWith(item.href));
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
          href="/curator/settings"
          className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-150"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            KC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Knowledge Curator</p>
            <p className="text-xs opacity-70 truncate">Content Manager</p>
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
