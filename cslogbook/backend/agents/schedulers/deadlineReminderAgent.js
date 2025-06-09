/**
 * Deadline Reminder Agent
 * ตรวจสอบกำหนดส่งเอกสารที่ใกล้ถึงและส่งการแจ้งเตือนให้นักศึกษา
 */

const { Op } = require('sequelize');
const { ImportantDeadline } = require('../../models');
const { Student } = require('../../models');
const notificationService = require('../helpers/notificationService');
const agentConfig = require('../config');
const logger = require('../../utils/logger');

class DeadlineReminderAgent {
  constructor() {
    this.config = agentConfig.thresholds;
    this.isRunning = false;
  }

  /**
   * เริ่มการทำงานของ agent โดยตั้งเวลาทำงานเป็นระยะ
   */
  start() {
    if (this.isRunning) {
      logger.warn('DeadlineReminderAgent: Agent is already running');
      return;
    }

    logger.info('DeadlineReminderAgent: Starting deadline reminder agent');
    this.isRunning = true;
    
    // ตั้งเวลาให้ทำงานเป็นระยะๆ
    this.interval = setInterval(() => {
      this.checkDeadlines().catch(err => {
        logger.error('DeadlineReminderAgent: Error in deadline check:', err);
      });
    }, agentConfig.scheduleIntervals.deadlineAlert);

    // ทำงานครั้งแรกทันที
    this.checkDeadlines().catch(err => {
      logger.error('DeadlineReminderAgent: Error in initial deadline check:', err);
    });
  }

  /**
   * หยุดการทำงานของ agent
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.isRunning = false;
    logger.info('DeadlineReminderAgent: Stopped deadline reminder agent');
  }

  /**
   * ตรวจสอบกำหนดส่งเอกสารที่ใกล้จะถึง
   */
  async checkDeadlines() {
    logger.debug('DeadlineReminderAgent: Checking upcoming deadlines');

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + this.config.deadlineWarningDays);
    
    const criticalDate = new Date();
    criticalDate.setDate(now.getDate() + this.config.criticalDeadlineWarningDays);

    try {
      // ค้นหากำหนดส่งที่ใกล้จะถึง
      const upcomingDeadlines = await ImportantDeadline.findAll({
        where: {
          deadline_date: {
            [Op.between]: [now, warningDate]
          },
          notified: false
        }
      });

      // ค้นหากำหนดส่งที่ใกล้มากและสำคัญ
      const criticalDeadlines = await ImportantDeadline.findAll({
        where: {
          deadline_date: {
            [Op.between]: [now, criticalDate]
          },
          is_critical: true,
          critical_notified: false
        }
      });

      // ส่งการแจ้งเตือนสำหรับกำหนดส่งที่ใกล้จะถึง
      for (const deadline of upcomingDeadlines) {
        await this.sendDeadlineNotification(deadline, false);
        // อัพเดตสถานะการแจ้งเตือน
        await deadline.update({ notified: true });
      }

      // ส่งการแจ้งเตือนสำคัญสำหรับกำหนดส่งที่ใกล้มาก
      for (const deadline of criticalDeadlines) {
        await this.sendDeadlineNotification(deadline, true);
        // อัพเดตสถานะการแจ้งเตือน
        await deadline.update({ critical_notified: true });
      }

      logger.info(`DeadlineReminderAgent: Processed ${upcomingDeadlines.length} regular deadlines and ${criticalDeadlines.length} critical deadlines`);
    } catch (error) {
      logger.error('DeadlineReminderAgent: Error checking deadlines:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนเกี่ยวกับกำหนดส่ง
   * @param {Object} deadline ข้อมูลกำหนดส่ง
   * @param {Boolean} isCritical เป็นการแจ้งเตือนสำคัญหรือไม่
   */
  async sendDeadlineNotification(deadline, isCritical) {
    try {
      // สำหรับตัวอย่างนี้ เราจะดึงรายการนักศึกษาที่เกี่ยวข้องกับกำหนดส่งนี้
      // ในระบบจริงอาจมีการกรองนักศึกษาตามชั้นปี สาขา หรือสถานะการฝึกงาน
      const students = await Student.findAll({
        where: {
          active: true,
          // เงื่อนไขเพิ่มเติมตามความต้องการ
        }
      });

      // สร้างเนื้อหาการแจ้งเตือน
      const title = isCritical 
        ? `⚠️ การแจ้งเตือนด่วน: ${deadline.title}` 
        : `เตือนกำหนดส่ง: ${deadline.title}`;
      
      const daysLeft = Math.ceil((deadline.deadline_date - new Date()) / (1000 * 60 * 60 * 24));
      
      const message = isCritical
        ? `คุณมีกำหนดส่ง ${deadline.title} ที่ต้องดำเนินการภายใน ${daysLeft} วัน (${deadline.deadline_date.toLocaleDateString()})\nรายละเอียด: ${deadline.description}\nโปรดดำเนินการโดยเร็วที่สุด!`
        : `เรียนแจ้งว่ามีกำหนดส่ง ${deadline.title} อีก ${daysLeft} วันข้างหน้า (${deadline.deadline_date.toLocaleDateString()})\nรายละเอียด: ${deadline.description}`;

      // ส่งการแจ้งเตือนถึงนักศึกษาทุกคน
      for (const student of students) {
        await notificationService.sendNotification({
          userId: student.id,
          userType: 'student',
          title,
          message,
          priority: isCritical ? 'high' : 'medium',
          relatedTo: {
            type: 'deadline',
            id: deadline.id
          },
          sendEmail: agentConfig.notifications.emailEnabled
        });
      }

      logger.info(`DeadlineReminderAgent: Sent ${isCritical ? 'CRITICAL' : 'regular'} notification for deadline "${deadline.title}" to ${students.length} students`);
    } catch (error) {
      logger.error(`DeadlineReminderAgent: Error sending deadline notification:`, error);
    }
  }
}

module.exports = new DeadlineReminderAgent();