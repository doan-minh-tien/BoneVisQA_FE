import { http, getApiErrorMessage } from './client';
import type { AppNotificationItem } from './types';

function mapNotification(row: unknown, index: number): AppNotificationItem | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.notificationId ?? index);
  const type = String(item.type ?? item.notificationType ?? 'general');
  const title = String(item.title ?? item.message ?? 'Notification');
  if (!title) return null;
  return {
    id,
    type,
    title,
    message: item.message != null ? String(item.message) : undefined,
    route: item.route != null ? String(item.route) : undefined,
    createdAt: item.createdAt != null ? String(item.createdAt) : undefined,
    isRead: Boolean(item.isRead ?? false),
  };
}

export async function fetchNotifications(): Promise<AppNotificationItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/notifications');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list
      .map((entry, index) => mapNotification(entry, index))
      .filter((entry): entry is AppNotificationItem => entry !== null);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
