'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, type BackendRole } from '@/lib/useAuth';
import { useLogout } from '@/lib/useLogout';
import { resolveApiAssetUrl } from '@/lib/api/client';
import { fetchNotifications } from '@/lib/api/notifications';
import type { AppNotificationItem, NotificationDto } from '@/lib/api/types';
import { useSignalR } from '@/hooks/useSignalR';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

function dashboardHrefForRole(role: RoleKey): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'lecturer':
      return '/lecturer/dashboard';
    case 'expert':
      return '/expert/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/dashboard';
  }
}

export interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { user } = useAuth();
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [serverNotifications, setServerNotifications] = useState<AppNotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const { connectionStatus, notifications: realtimeNotifications } = useSignalR();

  const fullName = user?.fullName?.trim() || user?.email?.trim() || 'Authenticated User';
  const emailDisplay = user?.email?.trim() || '';
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
    setAvatarLoadFailed(false);
  }, [avatarSrc]);

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

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    if (resolvedRole) {
      router.push(dashboardHrefForRole(resolvedRole));
      return;
    }
    router.push('/dashboard');
  };

  const showBackButton = useMemo(() => {
    if (!pathname) return true;
    return !/\/dashboard\/?$/.test(pathname);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          {showBackButton ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="min-w-0 py-0.5">
            <h1 className="truncate font-headline text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-1 sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeToggle />
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifications((prev) => !prev)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
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
                <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex max-w-[220px] items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring sm:max-w-none sm:gap-3 sm:px-3 sm:py-2"
                aria-label="Open account menu"
              >
                {avatarSrc && !avatarLoadFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-border object-cover sm:h-10 sm:w-10"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:h-10 sm:w-10 sm:text-sm">
                    {initials || 'BV'}
                  </div>
                )}
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="cursor-default select-none font-normal">
                <p className="truncate text-sm font-semibold text-card-foreground">{fullName}</p>
                {emailDisplay ? (
                  <p className="truncate text-xs font-normal text-muted-foreground">{emailDisplay}</p>
                ) : null}
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {roleLabel}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
