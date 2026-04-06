'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { fetchNotifications } from '@/lib/api/notifications';
import type { AppNotificationItem } from '@/lib/api/types';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const fullName = user?.fullName?.trim() || user?.email?.trim() || 'Authenticated User';
  const roleLabel = useMemo(() => {
    const activeRole = user?.activeRole;
    const labelMap = {
      Admin: 'System Administrator',
      Lecturer: 'Senior Lecturer',
      Expert: 'Clinical Expert',
      Student: 'Medical Student',
    } as const;
    return activeRole ? labelMap[activeRole] : 'Signed-in Session';
  }, [user?.activeRole]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [fullName]);

  useEffect(() => {
    let cancelled = false;
    void fetchNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = searchQuery.trim();
      if (!query) return;
      if (user?.activeRole === 'Student') {
        router.replace(`/student/catalog?q=${encodeURIComponent(query)}`);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [router, searchQuery, user?.activeRole]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleNotificationClick = (item: AppNotificationItem) => {
    if (item.type === 'quiz_assigned') {
      router.push('/student/quiz');
      setOpenNotifications(false);
      return;
    }
    if (item.route) {
      router.push(item.route);
      setOpenNotifications(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    if (user?.activeRole === 'Student') {
      router.push(`/student/catalog?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="relative hidden w-full max-w-2xl md:block">
          <form onSubmit={onSearchSubmit}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search studies, cases, lectures, or AI findings..."
              className="pl-10"
            />
          </form>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border-color bg-surface text-text-muted hover:text-text-main"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-accent px-1 text-[10px] font-semibold text-slate-900">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {openNotifications ? (
            <div className="absolute right-6 top-16 z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-xl">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">No notifications.</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                      >
                        <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                        {item.message ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-3 rounded-xl border border-border-color bg-surface px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials || 'BV'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-main">{fullName}</p>
              <p className="truncate text-xs text-text-muted">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="px-6 pb-4 md:hidden">
        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={pathname.startsWith('/student') ? 'Search catalog...' : 'Search...'}
            className="pl-10"
          />
        </form>
      </div>
    </header>
  );
}
