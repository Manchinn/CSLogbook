/**
 * Notification Service สำหรับ Agent
 * บริการจัดการการแจ้งเตือนแบบต่างๆ สำหรับใช้โดย Agent
 */

const { Notification } = require('../../models');
const logger = require('../../utils/logger');
//const emailService = require('../../utils/emailService');
const agentConfig = require('../config');

/**
 * Service จัดการการแจ้งเตือน
 */
class NotificationService {
  /**
   * สร้างและบันทึกการแจ้งเตือนใหม่ในฐานข้อมูล
   * @param {Object} options ตัวเลือกสำหรับการสร้างการแจ้งเตือน
   * @param {string} options.userId ID ของผู้ใช้
   * @param {string} options.userType ประเภทของผู้ใช้ (student, teacher, admin)
   * @param {string} options.title หัวข้อของการแจ้งเตือน
   * @param {string} options.message เนื้อหาของการแจ้งเตือน
   * @param {string} [options.priority='medium'] ความสำคัญของการแจ้งเตือน (low, medium, high)
   * @param {Object} [options.relatedTo] ข้อมูลที่เกี่ยวข้อง (เช่น { type: 'deadline', id: 123 })
   * @param {boolean} [options.sendEmail=false] ส่งอีเมลแจ้งเตือนหรือไม่
   * @returns {Promise<Object>} การแจ้งเตือนที่สร้างขึ้น
   */
  async sendNotification(options) {
    try {
      const {
        userId,
        userType,
        title,
        message,
        priority = 'medium',
        relatedTo = null,
        sendEmail = false
      } = options;

      // ตรวจสอบข้อมูลจำเป็น
      if (!userId || !userType || !title || !message) {
        throw new Error('Missing required notification fields');
      }

      // สร้างการแจ้งเตือนในฐานข้อมูล
      const notification = await Notification.create({
        user_id: userId,
        user_type: userType,
        title,
        message,
        priority,
        related_to: relatedTo ? JSON.stringify(relatedTo) : null,
        is_read: false,
        created_at: new Date()
      });

      logger.debug(`NotificationService: Created notification #${notification.id} for ${userType} #${userId}`);

      // ส่งอีเมลถ้าตั้งค่าไว้
      if (sendEmail && agentConfig.notifications.emailEnabled) {
        await this._sendEmailNotification(userType, userId, title, message, priority);
      }

      // ในอนาคตอาจมีการส่งการแจ้งเตือนผ่าน Push Notification หรือ SMS ตามการตั้งค่า

      return notification;
    } catch (error) {
      logger.error('NotificationService: Error sending notification:', error);
      throw error;
    }
  }

  /**
   * ส่งการแจ้งเตือนทางอีเมล
   * @private
   */
  async _sendEmailNotification(userType, userId, title, message, priority) {
    try {
      let recipient;

      // ดึงข้อมูลอีเมลของผู้ใช้จากฐานข้อมูล
      if (userType === 'student') {
        const { Student } = require('../../models');
        const student = await Student.findByPk(userId);
        recipient = student?.email;
      } else if (userType === 'teacher') {
        const { Teacher } = require('../../models');
        const teacher = await Teacher.findByPk(userId);
        recipient = teacher?.email;
      } else if (userType === 'admin') {
        const { Admin } = require('../../models');
        const admin = await Admin.findByPk(userId);
        recipient = admin?.email;
      }

      if (!recipient) {
        logger.warn(`NotificationService: Could not find email for ${userType} #${userId}`);
        return;
      }

      // สร้าง template สำหรับอีเมล
      const emailSubject = `[CSLogbook] ${priority === 'high' ? '⚠️ ' : ''}${title}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: ${priority === 'high' ? '#cc0000' : '#2c3e50'};">${title}</h2>
          <div style="margin: 20px 0; padding: 15px; background-color: ${priority === 'high' ? '#fff8f8' : '#f8f9fa'}; border-left: 4px solid ${priority === 'high' ? '#cc0000' : '#2c3e50'}; border-radius: 3px;">
            <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #666; font-size: 0.9em;">ข้อความนี้ถูกส่งโดยอัตโนมัติจากระบบ CSLogbook กรุณาอย่าตอบกลับ</p>
        </div>
      `;

      // ส่งอีเมล
      await emailService.sendMail({
        to: recipient,
        subject: emailSubject,
        html: emailBody
      });

      logger.debug(`NotificationService: Sent email notification to ${recipient}`);
    } catch (error) {
      logger.error('NotificationService: Error sending email notification:', error);
    }
  }

  /**
   * เรียกดูการแจ้งเตือนที่ยังไม่ได้อ่านของผู้ใช้
   * @param {string} userId ID ของผู้ใช้
   * @param {string} userType ประเภทของผู้ใช้
   * @returns {Promise<Array>} รายการการแจ้งเตือนที่ยังไม่ได้อ่าน
   */
  async getUnreadNotifications(userId, userType) {
    try {
      const unreadNotifications = await Notification.findAll({
        where: {
          user_id: userId,
          user_type: userType,
          is_read: false
        },
        order: [['created_at', 'DESC']]
      });

      return unreadNotifications;
    } catch (error) {
      logger.error('NotificationService: Error getting unread notifications:', error);
      throw error;
    }
  }

  /**
   * ทำเครื่องหมายว่าการแจ้งเตือนได้อ่านแล้ว
   * @param {number} notificationId ID ของการแจ้งเตือน
   * @returns {Promise<Object>} การแจ้งเตือนที่อัพเดทแล้ว
   */
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error(`Notification #${notificationId} not found`);
      }

      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      logger.error('NotificationService: Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();