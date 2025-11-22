// agents/internshipStatusMonitor.js
/**
 * Agent สำหรับตรวจสอบและอัปเดตสถานะการฝึกงานของนักศึกษาตาม startDate และ endDate
 * - ตรวจสอบรายวันว่ามีการฝึกงานใดถึง startDate แล้วหรือสิ้นสุดแล้ว
 * - Auto-update Student.internshipStatus เป็น 'in_progress' หรือ 'completed'
 * - รันทุกวันเวลา 02:00 น. (พร้อมกับ InternshipWorkflowMonitor)
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { Student, Document, InternshipDocument, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const workflowService = require('../services/workflowService');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

class InternshipStatusMonitor {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.checkInProgress = false;
  }

  /**
   * เริ่มต้น agent
   */
  start() {
    if (this.task) {
      logger.warn('InternshipStatusMonitor: Agent is already running');
      return;
    }

    this.isRunning = true;

    // ทำงานทุกวันเวลา 02:00 น. (พร้อมกับ InternshipWorkflowMonitor)
    this.task = cron.schedule('0 2 * * *', async () => {
      await this.checkAndUpdateInternshipStatuses();
    }, {
      timezone: 'Asia/Bangkok'
    });

    logger.info('InternshipStatusMonitor: Agent started (runs daily at 02:00 AM)');
  }

  /**
   * หยุด agent
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      logger.info('InternshipStatusMonitor: Agent stopped');
    }
  }

  /**
   * ตรวจสอบและอัพเดทสถานะการฝึกงานของนักศึกษาทั้งหมด
   */
  async checkAndUpdateInternshipStatuses() {
    if (this.checkInProgress) {
      logger.warn('InternshipStatusMonitor: Previous check is still running, skipping...');
      return;
    }

    this.checkInProgress = true;
    logger.info('InternshipStatusMonitor: Starting status check...');

    try {
      const now = dayjs().tz('Asia/Bangkok');
      let updatedToInProgress = 0;
      let errorCount = 0;

      // ✅ ดึงนักศึกษาทั้งหมดที่มีการฝึกงานและสถานะเป็น 'pending_approval' หรือ 'in_progress'
      // ⚠️ ไม่รวม 'completed' เพราะจะถูกอัพเดทเมื่ออนุมัติหนังสือรับรองแล้ว
      const students = await Student.findAll({
        where: {
          isEnrolledInternship: true,
          internshipStatus: {
            [Op.in]: ['pending_approval', 'in_progress']
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId']
        }]
      });

      logger.info(`InternshipStatusMonitor: Found ${students.length} students to check`);

      for (const student of students) {
        try {
          // ดึงข้อมูล CS05 ที่อนุมัติแล้วเพื่อหา startDate และ endDate
          const cs05Doc = await Document.findOne({
            where: {
              userId: student.userId,
              documentName: 'CS05',
              status: 'approved'
            },
            include: [{
              model: InternshipDocument,
              as: 'internshipDocument',
              attributes: ['startDate', 'endDate'],
              required: true
            }],
            order: [['created_at', 'DESC']]
          });

          if (!cs05Doc?.internshipDocument) {
            continue; // ข้ามถ้าไม่มีข้อมูลการฝึกงาน
          }

          const { startDate, endDate } = cs05Doc.internshipDocument;
          if (!startDate) {
            continue; // ข้ามถ้าไม่มี startDate
          }

          const startDateObj = dayjs(startDate).tz('Asia/Bangkok');
          const endDateObj = endDate ? dayjs(endDate).tz('Asia/Bangkok') : null;

          let newStatus = null;

          // ✅ Priority 1: เช็คว่า startDate ถึงแล้วหรือยัง (in_progress)
          // ⚠️ ไม่เปลี่ยนเป็น 'completed' เมื่อถึง endDate เพราะต้องผ่านขั้นตอน:
          // 1. ส่งแบบประเมินการฝึกงาน
          // 2. ยื่นคำร้องขอหนังสือรับรอง
          // 3. อนุมัติหนังสือรับรอง
          // 4. ดาวน์โหลดหนังสือรับรอง
          // → ถึงจะเป็น 'completed' (อัพเดทที่ approveCertificateRequest ใน documentService.js)
          if (now.isSameOrAfter(startDateObj, 'day')) {
            // ไม่ว่าจะถึง endDate หรือยังไม่ถึง → ยังคงเป็น in_progress
            // จะเปลี่ยนเป็น 'completed' เมื่ออนุมัติหนังสือรับรองแล้วเท่านั้น
            if (student.internshipStatus !== 'completed' && student.internshipStatus !== 'in_progress') {
              newStatus = 'in_progress';
            }
          }
          // ✅ Priority 3: ยังไม่ถึง startDate (pending_approval)
          else {
            if (student.internshipStatus !== 'pending_approval') {
              newStatus = 'pending_approval';
            }
          }

          // อัพเดทสถานะถ้ามีการเปลี่ยนแปลง
          if (newStatus) {
            await student.update({ internshipStatus: newStatus });
            
            // ✅ อัพเดท workflow เมื่อสถานะเปลี่ยน
            try {
              if (newStatus === 'in_progress') {
                await workflowService.updateStudentWorkflowActivity(
                  student.studentId,
                  'internship',
                  'INTERNSHIP_IN_PROGRESS',
                  'in_progress',
                  'in_progress',
                  {
                    startedAt: startDateObj.toISOString(),
                    autoUpdated: true,
                    updatedBy: 'system'
                  }
                );
                updatedToInProgress++;
                logger.info(`Updated student ${student.studentId} (${student.studentCode}) to in_progress - internship started`);
              // ⚠️ ไม่เปลี่ยนเป็น 'completed' ใน agent นี้
              // 'completed' จะถูกอัพเดทที่:
              // 1. approveCertificateRequest (documentService.js)
              // 2. getCertificateStatus เมื่อ certificateStatus === "ready" (internshipManagementService.js)
              } else if (newStatus === 'pending_approval') {
                logger.info(`Updated student ${student.studentId} (${student.studentCode}) to pending_approval - waiting for start date`);
              }
            } catch (workflowError) {
              logger.warn(`Error updating workflow for student ${student.studentId}:`, workflowError.message);
              // ไม่ throw error เพื่อไม่ให้กระทบการอัพเดทสถานะ
            }
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error checking status for student ${student.studentId}:`, error);
        }
      }

      logger.info(`InternshipStatusMonitor: Check completed - Updated to in_progress: ${updatedToInProgress}, Errors: ${errorCount}`);
      logger.info(`Note: 'completed' status is only updated when certificate is approved (not by this agent)`);
    } catch (error) {
      logger.error('InternshipStatusMonitor: Error in checkAndUpdateInternshipStatuses:', error);
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * ทดสอบการทำงาน (เรียกทันที)
   */
  async runNow() {
    logger.info('InternshipStatusMonitor: Running check immediately...');
    await this.checkAndUpdateInternshipStatuses();
  }
}

module.exports = new InternshipStatusMonitor();

