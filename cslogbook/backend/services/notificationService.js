'use strict';

const { Notification } = require('../models');
const notificationSettingsService = require('./notificationSettingsService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * เรียกครั้งเดียวใน server.js หลัง app.set('io', io)
   */
  init(io) {
    this.io = io;
    logger.info('NotificationService initialized with Socket.io');
  }

  /**
   * สร้าง notification + emit real-time
   * ตรวจ NotificationSetting ก่อนสร้าง
   */
  async createAndNotify(userId, { type, title, message, metadata }) {
    try {
      const isEnabled = await notificationSettingsService.isNotificationEnabled(type);
      if (!isEnabled) {
        return null;
      }

      const notification = await Notification.create({
        userId,
        type,
        title,
        message: message || null,
        metadata: metadata || null,
        isRead: false
      });

      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification:new', {
          notificationId: notification.notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          isRead: false,
          createdAt: notification.get('created_at')
        });
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', {
        userId, type, title, error: error.message
      });
      return null;
    }
  }

  /**
   * สร้าง notification ให้หลาย user (bulkCreate + emit per room)
   */
  async createAndNotifyMany(userIds, { type, title, message, metadata }) {
    try {
      const isEnabled = await notificationSettingsService.isNotificationEnabled(type);
      if (!isEnabled) return [];

      const uniqueIds = [...new Set(userIds)];
      const records = uniqueIds.map(userId => ({
        userId,
        type,
        title,
        message: message || null,
        metadata: metadata || null,
        isRead: false
      }));

      const notifications = await Notification.bulkCreate(records);

      if (this.io) {
        notifications.forEach(n => {
          this.io.to(`user_${n.userId}`).emit('notification:new', {
            notificationId: n.notificationId,
            type: n.type,
            title: n.title,
            message: n.message,
            metadata: n.metadata,
            isRead: false,
            createdAt: n.get('created_at')
          });
        });
      }

      return notifications;
    } catch (error) {
      logger.error('Failed to bulk create notifications:', { error: error.message });
      return [];
    }
  }

  /**
   * ดึง notifications ของ user (paginated, ล่าสุดก่อน)
   */
  async getNotifications(userId, { limit = 20, offset = 0 } = {}) {
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: Math.min(limit, 50),
      offset
    });

    // Normalize to camelCase (model uses underscored:true so toJSON emits created_at)
    const notifications = rows.map(r => ({
      notificationId: r.notificationId,
      type: r.type,
      title: r.title,
      message: r.message,
      metadata: r.metadata,
      isRead: r.isRead,
      createdAt: r.get('created_at'),
      updatedAt: r.get('updated_at')
    }));

    return {
      notifications,
      total: count,
      limit,
      offset
    };
  }

  /**
   * นับจำนวน unread
   */
  async getUnreadCount(userId) {
    return Notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Mark single notification as read (ตรวจ ownership)
   */
  async markAsRead(notificationId, userId) {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { notificationId, userId } }
    );
    return updated > 0;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    return updated;
  }
}

module.exports = new NotificationService();
