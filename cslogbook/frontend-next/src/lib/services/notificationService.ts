import { apiFetch } from '@/lib/api/client';

export interface NotificationItem {
  notificationId: number;
  type: 'DOCUMENT' | 'APPROVAL' | 'LOGBOOK' | 'EVALUATION' | 'MEETING';
  title: string;
  message: string | null;
  metadata: {
    documentId?: number;
    documentName?: string;
    action?: string;
    targetUrl?: string;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export async function getNotifications(
  token: string,
  params?: { limit?: number; offset?: number }
) {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));
  const query = search.toString();
  const path = `/notifications${query ? `?${query}` : ''}`;
  return apiFetch<NotificationsResponse>(path, { method: 'GET', token });
}

export async function getUnreadCount(token: string) {
  return apiFetch<UnreadCountResponse>('/notifications/unread-count', {
    method: 'GET',
    token,
  });
}

export async function markNotificationAsRead(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PUT',
    token,
  });
}

export async function markAllNotificationsAsRead(token: string) {
  return apiFetch<{ success: boolean }>('/notifications/read-all', {
    method: 'PUT',
    token,
  });
}
