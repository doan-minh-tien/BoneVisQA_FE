'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquareText,
  CheckCircle,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';

const expertMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/expert/dashboard' },
  { icon: FolderOpen, label: 'Case Library', href: '/expert/cases', badge: '8' },
  { icon: MessageSquareText, label: 'Q&A Reviews', href: '/expert/reviews', badge: '12' },
  { icon: CheckCircle, label: 'Approved Cases', href: '/expert/approved' },
  { icon: FileText, label: 'Quiz Management', href: '/expert/quiz' },
  { icon: ClipboardCheck, label: 'Reports', href: '/expert/reports' },
  { icon: AlertCircle, label: 'Pending Items', href: '/expert/pending', badge: '5' },
  { icon: Settings, label: 'Settings', href: '/expert/settings' },
];

export default function ExpertSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">BoneVisQA</h1>
          <p className="text-xs opacity-70">Expert Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {expertMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/expert/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-bg font-medium'
                        : 'hover:bg-sidebar-hover'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-destructive rounded-full text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/expert/settings"
          className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-150"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            DR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Dr. Expert</p>
            <p className="text-xs opacity-70 truncate">Clinical Expert</p>
          </div>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-hover cursor-pointer transition-colors duration-150">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
