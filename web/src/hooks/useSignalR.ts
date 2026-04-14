'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HubConnectionState, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { toast } from 'sonner';
import { getPublicApiOrigin } from '@/lib/api/client';
import type { NotificationDto } from '@/lib/api/types';
import { useAuth } from '@/lib/useAuth';

function mapReceivePayload(raw: unknown): NotificationDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.Id ?? '').trim();
  if (!id) return null;
  return {
    id,
    title: String(r.title ?? r.Title ?? 'Notification'),
    message: String(r.message ?? r.Message ?? ''),
    type: String(r.type ?? r.Type ?? 'general'),
    targetUrl:
      r.targetUrl != null
        ? String(r.targetUrl)
        : r.TargetUrl != null
          ? String(r.TargetUrl)
          : undefined,
    isRead: Boolean(r.isRead ?? r.IsRead ?? false),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? new Date().toISOString()),
  };
}

export type SignalRConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

function mapHubState(state: HubConnectionState): SignalRConnectionStatus {
  switch (state) {
    case HubConnectionState.Connected:
      return 'connected';
    case HubConnectionState.Connecting:
    case HubConnectionState.Reconnecting:
      return 'reconnecting';
    default:
      return 'disconnected';
  }
}

/**
 * SignalR hub at `{API_BASE_URL}/hubs/notifications`.
 * JWT is supplied via `accessTokenFactory` (negotiate + WebSocket upgrade).
 */
export function useSignalR() {
  const { user } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<SignalRConnectionStatus>('disconnected');
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  const onNotification = useCallback(
    (payload: unknown) => {
      const n = mapReceivePayload(payload);
      if (!n) return;

      setNotifications((prev) => {
        const idx = prev.findIndex((x) => x.id === n.id);
        if (idx === -1) return [n, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...n };
        return next;
      });

      toast.info(n.title, {
        description: n.message || undefined,
        action: n.targetUrl
          ? {
              label: 'Open',
              onClick: () => router.push(n.targetUrl!),
            }
          : undefined,
      });
    },
    [router],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!user || !token) {
      setConnectionStatus('disconnected');
      return;
    }

    const base = getPublicApiOrigin();
    if (!base) {
      setConnectionStatus('disconnected');
      return;
    }

    const hubUrl = `${base}/hubs/notifications`;
    setConnectionStatus('connecting');

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => Promise.resolve(localStorage.getItem('token') ?? ''),
      })
      .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', onNotification);

    connection.onreconnecting(() => {
      setConnectionStatus(mapHubState(connection.state));
    });
    connection.onreconnected(() => {
      setConnectionStatus(mapHubState(connection.state));
    });
    connection.onclose(() => {
      setConnectionStatus(mapHubState(connection.state));
    });

    void connection
      .start()
      .then(() => {
        setConnectionStatus(mapHubState(connection.state));
      })
      .catch(() => {
        setConnectionStatus('disconnected');
      });

    return () => {
      connection.off('ReceiveNotification');
      void connection.stop();
      setConnectionStatus('disconnected');
    };
  }, [user, onNotification]);

  return {
    connectionStatus,
    /** Notifications received in real time from the hub (merged client-side with REST in UI). */
    notifications,
  };
}
