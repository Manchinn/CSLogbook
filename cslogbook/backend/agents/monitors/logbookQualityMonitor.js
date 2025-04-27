/**
 * Logbook Quality Monitor Agent
 * ตรวจสอบคุณภาพของบันทึกประจำวันและให้ข้อเสนอแนะแก่นักศึกษา
 */

const { Op } = require('sequelize');
const { InternshipLogbook, InternshipLogbookRevision, Student } = require('../../models');
const logbookAnalyzer = require('../helpers/logbookAnalyzer');
const notificationService = require('../helpers/notificationService');
const agentConfig = require('../config');
const logger = require('../../utils/logger');

class LogbookQualityMonitor {
  constructor() {
    this.isRunning = false;
    this.lastChecked = new Map(); // เก็บประวัติการตรวจล่าสุดสำหรับแต่ละนักศึกษา
  }

  /**
   * เริ่มการตรวจสอบคุณภาพบันทึกประจำวัน
   */
  start() {
    if (this.isRunning) {
      logger.warn('LogbookQualityMonitor: Agent is already running');
      return;
    }

    logger.info('LogbookQualityMonitor: Starting logbook quality monitoring');
    this.isRunning = true;
    
    // ตั้งเวลาทำงานทุกวันในเวลาดึก (ไม่รบกวนเวลาทำงานปกติ)
    this.interval = setInterval(() => {
      this.checkLogbookQuality().catch(err => {
        logger.error('LogbookQualityMonitor: Error checking logbook quality:', err);
      });
    }, agentConfig.scheduleIntervals.documentReminder); // ใช้ช่วงเวลาเดียวกับ documentReminder (ทุก 24 ชั่วโมง)
    
    // ทำงานครั้งแรกหลังจากเริ่มต้น 5 นาที
    setTimeout(() => {
      this.checkLogbookQuality().catch(err => {
        logger.error('LogbookQualityMonitor: Error in initial logbook check:', err);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * หยุดการทำงานของ agent
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.isRunning = false;
    logger.info('LogbookQualityMonitor: Stopped logbook quality monitoring');
  }

  /**
   * ตรวจสอบคุณภาพของบันทึกประจำวันที่เพิ่งส่งเข้ามาในระบบ
   */
  async checkLogbookQuality() {
    logger.debug('LogbookQualityMonitor: Checking logbook quality');
    
    try {
      // ค้นหาบันทึกประจำวันที่ถูกส่งเข้ามาในช่วง 24 ชั่วโมงที่ผ่านมา
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentLogbooks = await InternshipLogbook.findAll({
        where: {
          created_at: {
            [Op.gte]: yesterday
          }
        },
        include: [
          {
            model: Student,
            as: 'student'
          },
          {
            model: InternshipLogbookRevision,
            as: 'latest_revision',
            limit: 1,
            order: [['revision_number', 'DESC']]
          }
        ]
      });
      
      logger.info(`LogbookQualityMonitor: Found ${recentLogbooks.length} recently submitted logbooks`);
      
      let poorQualityCount = 0;
      let goodQualityCount = 0;
      
      // วิเคราะห์แต่ละบันทึก
      for (const logbook of recentLogbooks) {
        // ข้ามถ้าไม่มีข้อมูลหรือข้อมูล revision ล่าสุด
        if (!logbook.latest_revision || !logbook.latest_revision.content) {
          continue;
        }
        
        const studentId = logbook.student?.id;
        if (!studentId) continue;
        
        // ตรวจสอบว่าเพิ่งตรวจไปหรือยัง (ป้องกันการส่งการแจ้งเตือนซ้ำ)
        const lastCheckedTime = this.lastChecked.get(studentId);
        const currentTime = new Date();
        
        if (lastCheckedTime && ((currentTime - lastCheckedTime) < 24 * 60 * 60 * 1000)) {
          // ข้ามถ้าเพิ่งตรวจบันทึกของนักศึกษาคนนี้ไปภายใน 24 ชั่วโมง
          continue;
        }
        
        // วิเคราะห์เนื้อหาบันทึกด้วย logbookAnalyzer
        const analysis = logbookAnalyzer.analyzeContent(logbook.latest_revision.content);
        
        // บันทึกเวลาตรวจล่าสุด
        this.lastChecked.set(studentId, currentTime);
        
        // ส่งการแจ้งเตือนตามคุณภาพของบันทึก
        if (analysis.quality === 'poor') {
          await this.sendQualityFeedback(logbook, analysis, true);
          poorQualityCount++;
        } else if (['good', 'excellent'].includes(analysis.quality)) {
          await this.sendQualityFeedback(logbook, analysis, false);
          goodQualityCount++;
        }
      }
      
      logger.info(`LogbookQualityMonitor: Sent feedback for ${poorQualityCount} poor quality and ${goodQualityCount} good quality logbooks`);
      
    } catch (error) {
      logger.error('LogbookQualityMonitor: Error checking logbook quality:', error);
    }
  }

  /**
   * ส่งข้อเสนอแนะเกี่ยวกับคุณภาพบันทึกไปยังนักศึกษา
   * @param {Object} logbook ข้อมูลบันทึก
   * @param {Object} analysis ผลการวิเคราะห์บันทึก
   * @param {boolean} isPoor เป็นบันทึกคุณภาพต่ำหรือไม่
   */
  async sendQualityFeedback(logbook, analysis, isPoor) {
    try {
      if (!logbook.student) return;
      
      const studentId = logbook.student.id;
      const logDate = new Date(logbook.log_date).toLocaleDateString('th-TH');
      const title = isPoor
        ? `🔔 คำแนะนำสำหรับการปรับปรุงบันทึกประจำวันที่ ${logDate}`
        : `👍 การประเมินบันทึกประจำวันที่ ${logDate}`;
      
      let message = isPoor
        ? `เรียน ${logbook.student.name || 'นักศึกษา'}\n\n` +
          `ระบบได้ตรวจสอบบันทึกประจำวัน วันที่ ${logDate} ของคุณแล้ว ` +
          `และพบว่าคุณควรปรับปรุงคุณภาพของบันทึกเพื่อให้อาจารย์สามารถติดตามความก้าวหน้าได้ดียิ่งขึ้น\n\n` +
          `คำแนะนำสำหรับการปรับปรุง:\n`
        : `เรียน ${logbook.student.name || 'นักศึกษา'}\n\n` +
          `ระบบได้ตรวจสอบบันทึกประจำวัน วันที่ ${logDate} ของคุณแล้ว ` +
          `และพบว่าบันทึกของคุณมีคุณภาพ${analysis.quality === 'excellent' ? 'ดีมาก' : 'ดี'}\n\n` +
          `ข้อเสนอแนะเพิ่มเติม:\n`;
      
      // เพิ่มคำแนะนำ
      analysis.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
      
      if (isPoor) {
        message += `\nบันทึกของคุณมีจำนวนคำทั้งหมด ${analysis.wordCount} คำ ` +
                  `คุณสามารถปรับปรุงบันทึกนี้ได้โดยการแก้ไขรีวิชันล่าสุด`;
      } else {
        message += `\nบันทึกของคุณมีจำนวนคำทั้งหมด ${analysis.wordCount} คำ `;
        if (analysis.keywords.length > 0) {
          message += `และมีคำสำคัญที่แสดงถึงการทำงานของคุณ เช่น ${analysis.keywords.slice(0, 5).join(', ')}`;
        }
      }
      
      // ส่งการแจ้งเตือนไปยังนักศึกษา
      await notificationService.sendNotification({
        userId: studentId,
        userType: 'student',
        title,
        message,
        priority: isPoor ? 'medium' : 'low',
        relatedTo: {
          type: 'logbook',
          id: logbook.id
        },
        sendEmail: false // ไม่ส่งอีเมลเพื่อไม่ให้รบกวนนักศึกษามากเกินไป
      });
      
      logger.debug(`LogbookQualityMonitor: Sent ${isPoor ? 'improvement' : 'positive'} feedback to student #${studentId} for logbook #${logbook.id}`);
    } catch (error) {
      logger.error('LogbookQualityMonitor: Error sending quality feedback:', error);
    }
  }
}

module.exports = new LogbookQualityMonitor();