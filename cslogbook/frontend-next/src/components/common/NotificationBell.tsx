'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Popover } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotificationList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import type { NotificationItem } from '@/lib/services/notificationService';
import styles from './NotificationBell.module.css';

dayjs.extend(relativeTime);
dayjs.locale('th');

const TYPE_ICONS: Record<string, string> = {
  DOCUMENT: '📄',
  APPROVAL: '✅',
  LOGBOOK: '📝',
  EVALUATION: '📋',
  MEETING: '🤝',
};

export default function NotificationBell() {
  const router = useRouter();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: listData, isLoading } = useNotificationList(token, 20);
  const { data: countData } = useUnreadCount(token);
  const markAsRead = useMarkAsRead(token);
  const markAllAsRead = useMarkAllAsRead(token);

  // React Query เป็น single source of truth สำหรับ unread count
  const unreadCount = countData?.data?.unreadCount ?? 0;
  const notifications: NotificationItem[] = listData?.data?.notifications || [];

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markAsRead.mutate(item.notificationId);
      }
      if (item.metadata?.targetUrl) {
        setOpen(false);
        router.push(item.metadata.targetUrl);
      }
    },
    [markAsRead, router]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const dropdownContent = (
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
                  {dayjs(item.createdAt).fromNow()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      <button type="button" className={styles.bellButton}>
        <Badge count={unreadCount} size="small" offset={[2, -2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </button>
    </Popover>
  );
}
