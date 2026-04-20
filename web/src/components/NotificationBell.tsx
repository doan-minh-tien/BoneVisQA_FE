'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useSignalR } from '@/hooks/useSignalR';
import { fetchNotifications, markNotificationRead } from '@/lib/api/notifications';
import type { AppNotificationItem } from '@/lib/api/types';

const PANEL_WIDTH = 320;
const PANEL_GAP = 8;

export type NotificationBellVariant = 'sidebar' | 'header';

export function NotificationBell({ variant = 'sidebar' }: { variant?: NotificationBellVariant }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { notifications: realtimeNotifications } = useSignalR();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleNotificationNavigate(item: AppNotificationItem) {
    if (item.type === 'quiz_assigned') {
      router.push('/student/quiz');
      setOpen(false);
      return;
    }
    if (item.route?.trim()) {
      router.push(item.route);
      setOpen(false);
    }
  }

  async function fetchNotifs(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      if (!silent && data.some((n) => !n.isRead) && !open) {
        const newNotif = data.find((n) => !n.isRead);
        if (newNotif) {
          const body = newNotif.message?.trim();
          toast.info(body ? `${newNotif.title}: ${body}` : newNotif.title);
        }
      }
    } catch {
      if (!silent) setNotifications([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void fetchNotifs(true);
    const interval = setInterval(() => void fetchNotifs(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (realtimeNotifications.length === 0) return;
    setNotifications((prev) => {
      const map = new Map<string, AppNotificationItem>();
      for (const n of prev) {
        map.set(n.id, n);
      }
      for (const r of realtimeNotifications) {
        const existing = map.get(r.id);
        map.set(r.id, {
          id: r.id,
          type: r.type ?? existing?.type ?? 'general',
          title: r.title ?? existing?.title ?? 'Notification',
          message: r.message || existing?.message,
          route: r.route || existing?.route,
          isRead: r.isRead ?? existing?.isRead ?? false,
          createdAt: r.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
        });
      }
      return Array.from(map.values()).sort(
        (a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        }
      );
    });
  }, [realtimeNotifications]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePosition() {
      const el = buttonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let left = rect.right - PANEL_WIDTH;
      left = Math.max(
        PANEL_GAP,
        Math.min(left, window.innerWidth - PANEL_WIDTH - PANEL_GAP),
      );
      const top = rect.bottom + PANEL_GAP;
      const maxTop = window.innerHeight - PANEL_GAP - 320;
      setPanelPos({ top: Math.min(top, Math.max(PANEL_GAP, maxTop)), left });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function markRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // silently ignore
    }
  }

  function timeAgo(iso: string | undefined): string {
    if (!iso?.trim()) return '—';
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return '—';
    const diff = Date.now() - t;
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
    return new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  const sortedNotifications = [...notifications].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const isHeader = variant === 'header';
  const buttonClass = isHeader
    ? 'relative flex h-11 w-11 items-center justify-center rounded-xl border border-border-color bg-surface text-text-muted transition-colors hover:text-text-main focus:outline-none focus:ring-2 focus:ring-cyan-accent/70'
    : 'relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-accent/40';

  const panelClass = isHeader
    ? 'fixed z-[200] max-h-[min(24rem,calc(100vh-2rem))] w-80 overflow-hidden rounded-xl border border-border-color bg-surface shadow-2xl shadow-black/15'
    : 'fixed z-[200] max-h-[min(24rem,calc(100vh-2rem))] w-80 overflow-hidden rounded-xl border border-white/15 bg-[#0F1F35] shadow-2xl shadow-black/50';

  const headerRowClass = isHeader
    ? 'flex items-center justify-between border-b border-border-color px-4 py-3'
    : 'flex items-center justify-between border-b border-white/10 px-4 py-3';

  const titleClass = isHeader ? 'text-sm font-semibold text-text-main' : 'text-sm font-semibold text-white';
  const mutedClass = isHeader ? 'text-xs text-text-muted' : 'text-xs text-slate-400';
  const emptyClass = isHeader ? 'px-4 py-8 text-center text-sm text-text-muted' : 'px-4 py-8 text-center text-sm text-slate-400';
  const itemBorder = isHeader ? 'border-b border-border-color/60' : 'border-b border-white/5';
  const itemHover = isHeader ? 'hover:bg-muted/50' : 'hover:bg-white/8';
  const unreadBg = isHeader ? 'bg-primary/5' : 'bg-white/5';
  const textMain = isHeader ? 'text-text-main' : 'text-white';
  const textSecondary = isHeader ? 'text-text-muted' : 'text-slate-300';
  const msgClass = isHeader ? 'mt-0.5 line-clamp-2 text-xs text-text-muted' : 'mt-0.5 line-clamp-2 text-xs text-slate-400';
  const timeClass = isHeader ? 'mt-1 text-[10px] text-text-muted/80' : 'mt-1 text-[10px] text-slate-500';
  const footerBorder = isHeader ? 'border-t border-border-color' : 'border-t border-white/10';
  const linkClass = isHeader
    ? 'text-xs font-medium text-primary hover:underline'
    : 'text-xs font-medium text-cyan-400 hover:text-cyan-300';

  const panel = open && mounted && (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className={panelClass}
      style={{ top: panelPos.top, left: panelPos.left }}
    >
      <div className={headerRowClass}>
        <span className={titleClass}>Notifications</span>
        {loading ? <span className={mutedClass}>Loading…</span> : null}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          <div className={emptyClass}>No notifications yet</div>
        ) : (
          sortedNotifications.slice(0, 20).map((n) => {
            const navigable = n.type === 'quiz_assigned' || Boolean(n.route?.trim());
            return (
              <div
                key={n.id}
                className={`group flex gap-3 ${itemBorder} px-4 py-3 transition-colors ${!n.isRead ? unreadBg : ''} ${itemHover}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      disabled={!navigable}
                      onClick={() => handleNotificationNavigate(n)}
                      className={`min-w-0 flex-1 text-left ${!navigable ? 'cursor-default' : 'cursor-pointer'} ${!n.isRead ? `font-semibold ${textMain}` : textSecondary} text-sm`}
                    >
                      {n.title}
                    </button>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markRead(n.id);
                        }}
                        className={`shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${isHeader ? 'text-text-muted hover:text-text-main' : 'text-slate-400 hover:text-white'}`}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {n.message ? <p className={msgClass}>{n.message}</p> : null}
                  <p className={timeClass}>{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sortedNotifications.length > 0 && (
        <div className={`${footerBorder} px-4 py-2 text-center`}>
          <Link href="/notifications" className={linkClass} onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void fetchNotifs();
        }}
        className={buttonClass}
        title="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute ${isHeader ? 'right-2 top-2' : 'right-0.5 top-0.5'} flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {mounted && panel && createPortal(panel, document.body)}
    </>
  );
}
