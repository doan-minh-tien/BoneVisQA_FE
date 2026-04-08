'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/useAuth';
import { resolveApiAssetUrl } from '@/lib/api/client';
import { fetchNotifications } from '@/lib/api/notifications';
import { searchGlobal, type SearchResultItem } from '@/lib/api/users';
import type { AppNotificationItem, NotificationDto } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { useSignalR } from '@/hooks/useSignalR';

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

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [serverNotifications, setServerNotifications] = useState<AppNotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { connectionStatus, notifications: realtimeNotifications } = useSignalR();
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
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
    const query = searchQuery.trim();
    if (!query) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchGlobal(query)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results);
            setSearchOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = desktopSearchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
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

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(true);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResultItem[]>();
    for (const item of searchResults) {
      const group = item.type?.trim() || 'Results';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(item);
    }
    return Array.from(map.entries());
  }, [searchResults]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="shrink-0 font-headline text-lg font-bold tracking-tight text-text-main md:hidden"
        >
          BoneVisQA
        </Link>
        <div ref={desktopSearchRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-2xl">
          <form onSubmit={onSearchSubmit}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const next = e.target.value;
                setSearchQuery(next);
                setSearchOpen(true);
                if (!next.trim()) {
                  setSearchResults([]);
                  setSearchLoading(false);
                } else {
                  setSearchLoading(true);
                }
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search studies, cases, lectures, or AI findings..."
              className="pl-10"
            />
          </form>
          {searchOpen && (searchQuery.trim() || searchLoading) ? (
            <div className="absolute left-0 right-0 top-12 z-50 max-h-[360px] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
              {searchLoading ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">Searching...</div>
              ) : grouped.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No matching results.</div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="pb-2 last:pb-0">
                    <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    <ul>
                      {items.map((item) => (
                        <li key={`${group}-${item.id}`}>
                          <Link
                            href={item.href}
                            className="block w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                            {item.subtitle ? (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border-color bg-surface text-text-muted hover:text-text-main"
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
            <div className="absolute right-6 top-16 z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-xl">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notifications
              </div>
              {mergedNotifications.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">No notifications.</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
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
          <Link
            href="/profile"
            className="flex max-w-[200px] items-center gap-3 rounded-xl border border-border-color bg-surface px-3 py-2 hover:bg-muted/40 sm:max-w-none"
            title="My profile"
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {initials || 'BV'}
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <p className="truncate text-sm font-semibold text-text-main">{fullName}</p>
              <p className="truncate text-xs text-text-muted">{roleLabel}</p>
            </div>
          </Link>
        </div>
      </div>
      <div className="px-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="px-6 pb-4 md:hidden">
        <div ref={mobileSearchRef} className="relative">
        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const next = e.target.value;
              setSearchQuery(next);
              setSearchOpen(true);
              if (!next.trim()) {
                setSearchResults([]);
                setSearchLoading(false);
              } else {
                setSearchLoading(true);
              }
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={pathname.startsWith('/student') ? 'Search catalog...' : 'Search...'}
            className="pl-10"
          />
        </form>
        {searchOpen && (searchQuery.trim() || searchLoading) ? (
          <div className="absolute left-0 right-0 top-12 z-50 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
            {searchLoading ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">Searching...</div>
            ) : grouped.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">No matching results.</div>
            ) : (
              grouped.map(([group, items]) => (
                <div key={`mobile-${group}`} className="pb-2 last:pb-0">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  <ul>
                    {items.map((item) => (
                      <li key={`mobile-${group}-${item.id}`}>
                        <Link
                          href={item.href}
                          className="block w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                          {item.subtitle ? (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        ) : null}
        </div>
      </div>
    </header>
  );
}
