/**
 * Document Status Monitor Agent
 * ตรวจสอบเอกสารที่ค้างการตรวจสอบเป็นเวลานานและแจ้งเตือนผู้เกี่ยวข้อง
 */

const { Op } = require('sequelize');
const { Document, DocumentLog, User } = require('../../models');
const notificationService = require('../helpers/notificationService');
const agentConfig = require('../config');
const logger = require('../../utils/logger');

class DocumentStatusMonitor {
  constructor() {
    this.config = agentConfig.thresholds;
    this.isRunning = false;
  }

  /**
   * เริ่มการตรวจสอบเอกสารที่ค้างการตรวจ
   */
  start() {
    if (this.isRunning) {
      logger.warn('DocumentStatusMonitor: Agent is already running');
      return;
    }

    logger.info('DocumentStatusMonitor: Starting document status monitoring');
    this.isRunning = true;
    
    // ตั้งเวลาทำงานเป็นระยะ
    this.interval = setInterval(() => {
      this.checkStuckDocuments().catch(err => {
        logger.error('DocumentStatusMonitor: Error checking documents:', err);
      });
    }, agentConfig.scheduleIntervals.statusMonitor);
    
    // ทำงานครั้งแรกทันที
    this.checkStuckDocuments().catch(err => {
      logger.error('DocumentStatusMonitor: Error in initial document check:', err);
    });
  }

  /**
   * หยุดการทำงานของ agent
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.isRunning = false;
    logger.info('DocumentStatusMonitor: Stopped document status monitoring');
  }

  /**
   * ตรวจสอบเอกสารที่ค้างการตรวจสอบเป็นเวลานาน
   */
  async checkStuckDocuments() {
    logger.debug('DocumentStatusMonitor: Checking for stuck documents');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.documentsStuckInReviewDays);
      
      // ค้นหาเอกสารที่ค้างการตรวจสอบนานเกินกำหนด
      const stuckDocuments = await Document.findAll({
        where: {
          status: 'pending_review',
          updated_at: {
            [Op.lte]: cutoffDate
          }
          // หมายเหตุ: ลบ notification_sent field เนื่องจากไม่มีในตาราง Document
        },
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }
        ]
      });
      
      logger.info(`DocumentStatusMonitor: Found ${stuckDocuments.length} documents pending review for more than ${this.config.documentsStuckInReviewDays} days`);
      
      // แจ้งเตือนผู้ตรวจแต่ละคนเกี่ยวกับเอกสารที่ค้าง
      const teacherMap = new Map();
      
      // จัดกลุ่มเอกสารตามผู้ตรวจ
      for (const doc of stuckDocuments) {
        if (!doc.reviewer) continue;
        
        if (!teacherMap.has(doc.reviewer.userId)) {
          teacherMap.set(doc.reviewer.userId, {
            teacher: doc.reviewer,
            documents: []
          });
        }
        
        teacherMap.get(doc.reviewer.userId).documents.push(doc);
      }
      
      // ส่งการแจ้งเตือนไปยังผู้ตรวจแต่ละคน
      for (const [teacherId, data] of teacherMap.entries()) {
        const { teacher, documents } = data;
        
        // สร้างข้อความแจ้งเตือนที่มีรายการเอกสารที่ค้าง
        const title = `⚠️ มีเอกสารที่รอการตรวจสอบเกิน ${this.config.documentsStuckInReviewDays} วัน`;
        let message = `เรียน ${teacher.firstName} ${teacher.lastName},\n\n`;
        message += `มีเอกสารที่รอการตรวจสอบจากท่านเกินกำหนดเวลา ${this.config.documentsStuckInReviewDays} วันจำนวน ${documents.length} รายการ ดังนี้:\n\n`;
        
        documents.forEach((doc, index) => {
          const daysOverdue = Math.floor((new Date() - new Date(doc.updated_at)) / (1000 * 60 * 60 * 24));
          message += `${index + 1}. เอกสาร: ${doc.title} (รหัส: ${doc.document_id})\n`;
          message += `   ส่งเมื่อ: ${new Date(doc.updated_at).toLocaleDateString()}\n`;
          message += `   ค้างมาแล้ว: ${daysOverdue} วัน\n\n`;
        });
        
        message += `กรุณาตรวจสอบเอกสารดังกล่าวโดยเร็ว เพื่อไม่ให้กระทบต่อกำหนดการของนักศึกษา\n`;
        message += `คุณสามารถเข้าไปตรวจสอบรายการเอกสารได้ที่หน้าตรวจสอบเอกสารในระบบ CSLogbook`;
        
        // ส่งการแจ้งเตือนไปยังผู้ตรวจ
        await notificationService.sendNotification({
          userId: teacherId,
          userType: 'teacher',
          title,
          message,
          priority: 'high',
          relatedTo: {
            type: 'documents',
            count: documents.length
          },
          sendEmail: true
        });
        
        logger.info(`DocumentStatusMonitor: Notified teacher #${teacherId} about ${documents.length} stuck documents`);
        
        // บันทึกการแจ้งเตือนลงใน DocumentLog แทนการอัปเดต notification_sent
        for (const doc of documents) {
          // เพิ่มบันทึกการแจ้งเตือนลงใน DocumentLog
          await DocumentLog.create({
            document_id: doc.documentId,
            action: 'notification_sent',
            description: `ระบบส่งการแจ้งเตือนถึงผู้ตรวจเนื่องจากเอกสารค้างการตรวจเกิน ${this.config.documentsStuckInReviewDays} วัน`,
            created_by: 'system',
            created_at: new Date()
          });
        }
      }
      
    } catch (error) {
      logger.error('DocumentStatusMonitor: Error checking stuck documents:', error);
    }
  }
}

module.exports = new DocumentStatusMonitor();