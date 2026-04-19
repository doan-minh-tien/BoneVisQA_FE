'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HubConnectionState, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { toast } from 'sonner';
import { getPublicApiOrigin } from '@/lib/api/client';
import type { DocumentIngestionStatusDto, NotificationDto } from '@/lib/api/types';
import { useAuth } from '@/lib/useAuth';
import { notificationTargetToAppPath } from '@/lib/notification-app-path';

function mapReceivePayload(raw: unknown): NotificationDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.Id ?? '').trim();
  if (!id) return null;
  const routeRaw = r.route ?? r.Route;
  const route = routeRaw != null && String(routeRaw).trim() ? String(routeRaw).trim() : undefined;
  const targetRaw =
    r.targetUrl != null
      ? String(r.targetUrl)
      : r.TargetUrl != null
        ? String(r.TargetUrl)
        : undefined;

  return {
    id,
    title: String(r.title ?? r.Title ?? 'Notification'),
    message: String(r.message ?? r.Message ?? ''),
    type: String(r.type ?? r.Type ?? 'general'),
    ...(route ? { route } : {}),
    ...(targetRaw?.trim() ? { targetUrl: targetRaw.trim() } : {}),
    isRead: Boolean(r.isRead ?? r.IsRead ?? false),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? new Date().toISOString()),
  };
}

function mapDocumentIngestionPayload(raw: unknown): DocumentIngestionStatusDto | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const documentId = String(r.documentId ?? r.DocumentId ?? '').trim();
  if (!documentId) return null;

  const num = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const parsed = Number(v);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  return {
    documentId,
    status:
      r.status != null
        ? String(r.status)
        : r.Status != null
          ? String(r.Status)
          : undefined,
    totalPages: num(r.totalPages ?? r.TotalPages),
    totalChunks: num(r.totalChunks ?? r.TotalChunks),
    currentPageIndexing: num(r.currentPageIndexing ?? r.CurrentPageIndexing),
    progressPercentage: num(r.progressPercentage ?? r.ProgressPercentage),
    operation:
      r.operation != null
        ? String(r.operation)
        : r.currentOperation != null
          ? String(r.currentOperation)
          : r.Operation != null
            ? String(r.Operation)
            : undefined,
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

      const typeLc = n.type.trim().toLowerCase();
      let openLabel = 'Open';
      if (typeLc === 'visual_qa_review_request') {
        openLabel = 'Open triage';
      } else if (typeLc === 'visual_qa_lecturer_reply' || (typeLc.includes('visual_qa') && typeLc.includes('lecturer'))) {
        openLabel = 'Open chat';
      } else if (typeLc.includes('visual_qa')) {
        openLabel = 'Open';
      }

      const navRaw = (n.route?.trim() || n.targetUrl?.trim()) ?? '';
      toast.info(n.title, {
        description: n.message || undefined,
        action: navRaw
          ? {
              label: openLabel,
              onClick: () => router.push(notificationTargetToAppPath(navRaw)),
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
      return;
    }

    const base = getPublicApiOrigin();
    if (!base) {
      return;
    }

    const hubUrl = `${base}/hubs/notifications`;
    let aborted = false;
    const connectingTimer = window.setTimeout(() => {
      if (!aborted) setConnectionStatus('connecting');
    }, 0);

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => Promise.resolve(localStorage.getItem('token') ?? ''),
      })
      .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', onNotification);
    connection.on('DocumentIndexingProgressUpdated', (payload) => {
      const normalized = mapDocumentIngestionPayload(payload);
      if (!normalized) return;
      const event = new CustomEvent<DocumentIngestionStatusDto>('DocumentIndexingProgressUpdated', {
        detail: normalized,
      });
      window.dispatchEvent(event);
    });

    connection.onreconnecting(() => {
      setConnectionStatus(mapHubState(connection.state));
    });
    connection.onreconnected(() => {
      setConnectionStatus(mapHubState(connection.state));
    });
    connection.onclose(() => {
      setConnectionStatus(mapHubState(connection.state));
    });

    const startConnection = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
        if (!aborted) {
          setConnectionStatus(mapHubState(connection.state));
        }
      } catch (error) {
        if (aborted) return;
        console.warn('SignalR start failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    void startConnection();

    return () => {
      aborted = true;
      window.clearTimeout(connectingTimer);
      connection.off('ReceiveNotification');
      connection.off('DocumentIndexingProgressUpdated');
      void connection.stop();
    };
  }, [user, onNotification]);

  return {
    connectionStatus,
    /** Notifications received in real time from the hub (merged client-side with REST in UI). */
    notifications,
  };
}
