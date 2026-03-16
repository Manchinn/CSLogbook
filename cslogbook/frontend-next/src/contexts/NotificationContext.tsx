'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { NOTIFICATION_KEYS } from '@/hooks/useNotifications';

/**
 * NotificationContext จัดการ Socket.io connection เท่านั้น
 * ใช้ React Query เป็น single source of truth สำหรับ notification data + unread count
 * เมื่อ socket ได้รับ notification:new → invalidate queries → React Query refetch อัตโนมัติ
 */
interface NotificationContextType {
  /** Socket connected? */
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      socketInitialized.current = false;
      return;
    }

    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = connectSocket(token);

    // เมื่อได้รับ notification ใหม่ → invalidate React Query cache
    // React Query จะ refetch notification list + unread count อัตโนมัติ
    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    });

    // Re-fetch เมื่อ reconnect (กรณีพลาด notification ระหว่าง disconnect)
    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    });

    return () => {
      socket.off('notification:new');
      socket.off('connect');
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [isAuthenticated, token, queryClient]);

  return (
    <NotificationContext.Provider value={{ isConnected: socketInitialized.current }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
