'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/notificationService';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (token: string) => [...NOTIFICATION_KEYS.all, 'list', token] as const,
  unreadCount: (token: string) => [...NOTIFICATION_KEYS.all, 'unread-count', token] as const,
};

export function useNotificationList(token: string | null, limit = 20) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(token ?? ''),
    queryFn: () => getNotifications(token!, { limit }),
    enabled: Boolean(token),
    retry: 1,
  });
}

export function useUnreadCount(token: string | null) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(token ?? ''),
    queryFn: () => getUnreadCount(token!),
    enabled: Boolean(token),
    retry: 1,
    refetchInterval: 1000 * 60, // fallback polling ทุก 1 นาที (หลักคือ socket)
  });
}

export function useMarkAsRead(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllAsRead(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
