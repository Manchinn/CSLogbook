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
  const warningDate = new Date(now.getTime() + this.config.deadlineWarningDays * 86400000);
  const criticalDate = new Date(now.getTime() + this.config.criticalDeadlineWarningDays * 86400000);

    try {
      // ค้นหากำหนดส่งที่ใกล้จะถึง
      const upcomingDeadlines = await ImportantDeadline.findAll({
        where: {
          [Op.or]: [
            { deadline_at: { [Op.between]: [now, warningDate] } },
            { [Op.and]: [ { deadline_at: { [Op.is]: null } }, { date: { [Op.between]: [now, warningDate] } } ] }
          ],
          notified: false
        }
      });

      // ค้นหากำหนดส่งที่ใกล้มากและสำคัญ
      const criticalDeadlines = await ImportantDeadline.findAll({
        where: {
          [Op.or]: [
            { deadline_at: { [Op.between]: [now, criticalDate] } },
            { [Op.and]: [ { deadline_at: { [Op.is]: null } }, { date: { [Op.between]: [now, criticalDate] } } ] }
          ],
          isCritical: true,
          criticalNotified: false
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
  await deadline.update({ criticalNotified: true });
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
        // ลบ active: true เพราะ Student model ไม่มี field active
        // เงื่อนไขเพิ่มเติมตามความต้องการ
      });

      // สร้างเนื้อหาการแจ้งเตือน
      const title = isCritical 
        ? `⚠️ การแจ้งเตือนด่วน: ${deadline.name}` 
        : `เตือนกำหนดส่ง: ${deadline.name}`;

      // date เป็น DATEONLY -> แปลงเป็น Date (ตีความเป็น UTC หรือ local ตาม environment) 
  const baseDate = deadline.deadlineAt ? new Date(deadline.deadlineAt) : (deadline.date ? new Date(`${deadline.date}T23:59:59Z`) : null);
  if (!baseDate) return;
  const diffMs = baseDate - new Date();
  if (diffMs < 0) return; // เลยแล้วไม่แจ้งใน agent นี้
  const daysLeft = Math.floor(diffMs / 86400000);
  const hoursLeft = Math.floor((diffMs % 86400000) / 3600000);

      let timePart = '';
      try { timePart = baseDate.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }); } catch(e) {}
      const remainStr = daysLeft >= 1 ? `${daysLeft} วัน` : `${hoursLeft} ชั่วโมง`;
      const message = isCritical
        ? `คุณมีกำหนดส่ง ${deadline.name} ภายใน ${remainStr} (${timePart})\nรายละเอียด: ${deadline.description || '-'}\nโปรดดำเนินการโดยเร็วที่สุด!`
        : `แจ้งเตือนกำหนดส่ง ${deadline.name} เหลือ ${remainStr} (${timePart})\nรายละเอียด: ${deadline.description || '-'}`;

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

  logger.info(`DeadlineReminderAgent: Sent ${isCritical ? 'CRITICAL' : 'regular'} notification for deadline "${deadline.name}" to ${students.length} students`);
    } catch (error) {
      logger.error(`DeadlineReminderAgent: Error sending deadline notification:`, error);
    }
  }
}

module.exports = new DeadlineReminderAgent();