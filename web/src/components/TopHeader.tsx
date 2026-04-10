'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, type BackendRole } from '@/lib/useAuth';
import { useLogout } from '@/lib/useLogout';
import { resolveApiAssetUrl } from '@/lib/api/client';
import { fetchNotifications } from '@/lib/api/notifications';
import type { AppNotificationItem, NotificationDto } from '@/lib/api/types';
import { useSignalR } from '@/hooks/useSignalR';

type RoleKey = 'admin' | 'lecturer' | 'expert' | 'student';

function notificationDtoToAppItem(d: NotificationDto): AppNotificationItem {
  return {
    id: d.id,
    type: d.type,
    title: d.title,
    message: d.message,
    route: d.targetUrl,
    createdAt: d.createdAt,
    isRead: d.isRead,
  };
}

function mapBackendRoleToRoleKey(role: BackendRole | null | undefined): RoleKey | null {
  if (role === 'Student') return 'student';
  if (role === 'Lecturer') return 'lecturer';
  if (role === 'Expert') return 'expert';
  if (role === 'Admin') return 'admin';
  return null;
}

function settingsHrefForRole(role: RoleKey): string {
  switch (role) {
    case 'admin':
      return '/admin/settings';
    case 'lecturer':
      return '/lecturer/settings';
    case 'expert':
      return '/expert/settings';
    case 'student':
      return '/profile';
    default:
      return '/profile';
  }
}

export interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const router = useRouter();
  const logout = useLogout();
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [serverNotifications, setServerNotifications] = useState<AppNotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { connectionStatus, notifications: realtimeNotifications } = useSignalR();

  const fullName = user?.fullName?.trim() || user?.email?.trim() || 'Authenticated User';
  const roleLabel = user?.activeRole?.trim() || '—';
  const resolvedRole = mapBackendRoleToRoleKey(user?.activeRole) ?? 'student';

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [fullName]);

  const avatarSrc = useMemo(() => {
    const raw = user?.avatarUrl?.trim();
    if (!raw) return '';
    return resolveApiAssetUrl(raw);
  }, [user?.avatarUrl]);

  useEffect(() => {
    let cancelled = false;
    void fetchNotifications()
      .then((data) => {
        if (!cancelled) setServerNotifications(data);
      })
      .catch(() => {
        if (!cancelled) setServerNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t)) setMenuOpen(false);
      if (!notifRef.current?.contains(t)) setOpenNotifications(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const mergedNotifications = useMemo(() => {
    const map = new Map<string, AppNotificationItem>();
    for (const n of serverNotifications) {
      map.set(n.id, { ...n });
    }
    for (const d of realtimeNotifications) {
      const prev = map.get(d.id);
      const next = notificationDtoToAppItem(d);
      map.set(d.id, {
        ...prev,
        ...next,
        isRead: next.isRead ?? prev?.isRead ?? false,
      });
    }
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  }, [serverNotifications, realtimeNotifications]);

  const unreadCount = mergedNotifications.filter((item) => !item.isRead).length;

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

  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0 flex-1" />
        <div className="relative flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeToggle />
          <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border-color bg-surface text-text-muted hover:text-text-main"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {connectionStatus === 'connected' ? (
              <span
                className="absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
                title="Live notifications connected"
                aria-hidden
              />
            ) : null}
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
          {openNotifications ? (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-xl">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notifications
              </div>
              {mergedNotifications.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">No notifications.</div>
              ) : (
                <ul className="scrollbar-hide max-h-72 overflow-y-auto">
                  {mergedNotifications.map((item) => (
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
          </div>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex max-w-[220px] items-center gap-2 rounded-xl border border-border-color bg-surface px-2 py-1.5 hover:bg-muted/40 sm:max-w-none sm:gap-3 sm:px-3 sm:py-2"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-border object-cover sm:h-10 sm:w-10"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary sm:h-10 sm:w-10 sm:text-sm">
                  {initials || 'BV'}
                </div>
              )}
              <div className="min-w-0 hidden text-left sm:block">
                <p className="truncate text-sm font-semibold text-text-main">{fullName}</p>
                <p className="truncate text-xs text-text-muted">{roleLabel}</p>
              </div>
              <ChevronDown
                className={`hidden h-4 w-4 shrink-0 text-text-muted sm:block ${menuOpen ? 'rotate-180' : ''} transition-transform`}
                aria-hidden
              />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 min-w-[200px] rounded-xl border border-border bg-card py-1 shadow-xl"
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-card-foreground hover:bg-muted/60"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Profile
                </Link>
                <Link
                  href={settingsHrefForRole(resolvedRole)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-card-foreground hover:bg-muted/60"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive hover:bg-muted/60"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}
