'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
  Bell,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

const lecturerMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/lecturer/dashboard' },
  { icon: Users, label: 'My Classes', href: '/lecturer/classes', badge: '3' },
  { icon: ClipboardList, label: 'Assignments', href: '/lecturer/assignments', badge: '8' },
  { icon: Calendar, label: 'Schedule', href: '/lecturer/schedule' },
  { icon: BarChart3, label: 'Analytics', href: '/lecturer/analytics' },
  { icon: MessageSquare, label: 'Student Q&A', href: '/lecturer/qa' },
  { icon: Bell, label: 'Announcements', href: '/lecturer/announcements' },
  { icon: FileText, label: 'Reports', href: '/lecturer/reports' },
  { icon: Settings, label: 'Settings', href: '/lecturer/settings' },
];

export default function LecturerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">BoneVisQA</h1>
          <p className="text-xs opacity-70">Lecturer Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {lecturerMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/lecturer/dashboard' && pathname.startsWith(item.href));
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
                    <span className="px-2 py-0.5 bg-accent rounded-full text-xs font-medium">
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
          href="/lecturer/settings"
          className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-150"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            LC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Prof. Lecturer</p>
            <p className="text-xs opacity-70 truncate">Course Coordinator</p>
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
