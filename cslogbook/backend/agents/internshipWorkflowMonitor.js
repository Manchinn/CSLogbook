// agents/internshipWorkflowMonitor.js
/**
 * Agent สำหรับตรวจสอบและอัปเดต workflow ของนักศึกษาฝึกงาน
 * - ตรวจสอบรายวันว่ามีการฝึกงานใดใกล้สิ้นสุดหรือชั่วโมงครบแล้ว
 * - Auto-update workflow เป็น INTERNSHIP_SUMMARY_PENDING
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { Internship, Student, StudentWorkflowActivity } = require('../models');
const internshipLogbookService = require('../services/internshipLogbookService');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

class InternshipWorkflowMonitor {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.checkInProgress = false; // ใช้สำหรับป้องกัน concurrent check
  }

  /**
   * เริ่มต้น agent
   */
  start() {
    if (this.task) {
      logger.warn('InternshipWorkflowMonitor: Agent is already running');
      return;
    }

    // ตั้งสถานะว่ากำลังทำงาน
    this.isRunning = true;

    // ทำงานทุกวันเวลา 02:00 น.
    this.task = cron.schedule('0 2 * * *', async () => {
      await this.checkInternshipWorkflows();
    }, {
      timezone: 'Asia/Bangkok'
    });

    logger.info('InternshipWorkflowMonitor: Agent started (runs daily at 02:00 AM)');
  }

  /**
   * หยุด agent
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      logger.info('InternshipWorkflowMonitor: Agent stopped');
    }
  }

  /**
   * ตรวจสอบ workflow ของการฝึกงานทั้งหมดที่กำลังดำเนินการ
   */
  async checkInternshipWorkflows() {
    if (this.checkInProgress) {
      logger.warn('InternshipWorkflowMonitor: Previous check is still running, skipping...');
      return;
    }

    this.checkInProgress = true;
    logger.info('InternshipWorkflowMonitor: Starting workflow check...');

    try {
      // ค้นหานักศึกษาที่อยู่ในขั้นตอน IN_PROGRESS
      const activities = await StudentWorkflowActivity.findAll({
        where: {
          workflowType: 'internship',
          currentStepKey: 'INTERNSHIP_IN_PROGRESS',
          overallWorkflowStatus: 'in_progress'
        },
        include: [{
          model: Student,
          as: 'student',
          required: true
        }]
      });

      logger.info(`InternshipWorkflowMonitor: Found ${activities.length} students in IN_PROGRESS status`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const activity of activities) {
        try {
          // หา internship ของนักศึกษา
          const internship = await Internship.findOne({
            where: {
              studentId: activity.studentId,
              // ค้นหาการฝึกงานที่ active (ไม่ยกเลิก)
              [Op.or]: [
                { endDate: { [Op.gte]: dayjs().subtract(30, 'day').toDate() } }, // endDate ยังไม่ผ่านไปนานเกิน 30 วัน
                { endDate: null } // หรือยังไม่มี endDate
              ]
            },
            order: [['created_at', 'DESC']]
          });

          if (!internship) {
            logger.debug(`No active internship found for student ${activity.studentId}`);
            continue;
          }

          // ตรวจสอบและอัปเดต workflow
          const updated = await internshipLogbookService.checkAndUpdateSummaryPending(internship.internshipId);
          
          if (updated) {
            updatedCount++;
            logger.info(`Updated workflow for student ${activity.studentId} (internship ${internship.internshipId})`);
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error checking workflow for student ${activity.studentId}:`, error);
        }
      }

      logger.info(`InternshipWorkflowMonitor: Check completed - Updated: ${updatedCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error('InternshipWorkflowMonitor: Error in checkInternshipWorkflows:', error);
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * ทดสอบการทำงาน (เรียกทันที)
   */
  async runNow() {
    logger.info('InternshipWorkflowMonitor: Running check immediately...');
    await this.checkInternshipWorkflows();
  }
}

module.exports = new InternshipWorkflowMonitor();
