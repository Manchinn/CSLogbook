'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotificationList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import type { NotificationItem } from '@/lib/services/notificationService';
import styles from './NotificationBell.module.css';

const TYPE_ICONS: Record<string, string> = {
  DOCUMENT: '📄',
  APPROVAL: '✅',
  LOGBOOK: '📝',
  EVALUATION: '📋',
  MEETING: '🤝',
};

/** แสดงเวลาแบบ relative เป็นภาษาไทย */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH');
}

export default function NotificationBell() {
  const router = useRouter();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: listData, isLoading } = useNotificationList(token, 20);
  const { data: countData } = useUnreadCount(token);
  const markAsRead = useMarkAsRead(token);
  const markAllAsRead = useMarkAllAsRead(token);

  const unreadCount = countData?.data?.unreadCount ?? 0;
  const notifications: NotificationItem[] = listData?.data?.notifications || [];

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markAsRead.mutate(item.notificationId);
      }
      setOpen(false);
      router.push(item.metadata?.targetUrl || '/dashboard');
    },
    [markAsRead, router]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  return (
    <div className={styles.bellWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen(!open)}
        aria-label="การแจ้งเตือน"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h4 className={styles.dropdownTitle}>การแจ้งเตือน</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.readAllButton}
                onClick={handleMarkAllAsRead}
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <div className={styles.notificationList}>
            {isLoading ? (
              <div className={styles.emptyState}>กำลังโหลด...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>ไม่มีการแจ้งเตือน</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.notificationId}
                  className={`${styles.notificationItem} ${!item.isRead ? styles.unread : ''}`}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleItemClick(item);
                  }}
                >
                  <span className={!item.isRead ? styles.unreadDot : styles.readDot} />
                  <span className={styles.notificationIcon}>
                    {TYPE_ICONS[item.type] || '🔔'}
                  </span>
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationTitle}>{item.title}</p>
                    <span className={styles.notificationTime}>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
