'use strict';

const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await notificationService.getNotifications(userId, { limit, offset });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้'
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);

    return res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถนับการแจ้งเตือนได้'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'notification ID ไม่ถูกต้อง'
      });
    }

    const updated = await notificationService.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแจ้งเตือน'
      });
    }

    return res.json({
      success: true,
      message: 'อ่านแจ้งเตือนแล้ว'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตการแจ้งเตือนได้'
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      message: `อ่านแจ้งเตือนทั้งหมด ${count} รายการ`,
      data: { updatedCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตการแจ้งเตือนได้'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
