// agents/internshipLifecycleMonitor.js
/**
 * Internship Lifecycle Monitor (merged from internshipStatusMonitor + internshipWorkflowMonitor)
 *
 * รันทุกวันเวลา 02:00 น. ทำ 2 ขั้นตอน sequential:
 * Step 1: อัปเดต Student.internshipStatus ตาม startDate (pending_approval → in_progress)
 * Step 2: ตรวจ workflow → INTERNSHIP_SUMMARY_PENDING เมื่อใกล้สิ้นสุดหรือชั่วโมงครบ
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { Student, Document, InternshipDocument, User, StudentWorkflowActivity } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const workflowService = require('../services/workflowService');
const internshipLogbookService = require('../services/internshipLogbookService');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

class InternshipLifecycleMonitor {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.checkInProgress = false;
  }

  start() {
    if (this.task) {
      logger.warn('InternshipLifecycleMonitor: Agent is already running');
      return;
    }

    this.isRunning = true;

    this.task = cron.schedule('0 2 * * *', async () => {
      await this.runLifecycleCheck();
    }, {
      timezone: 'Asia/Bangkok'
    });

    logger.info('InternshipLifecycleMonitor: Agent started (runs daily at 02:00 AM)');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      logger.info('InternshipLifecycleMonitor: Agent stopped');
    }
  }

  /**
   * รัน lifecycle check ทั้ง 2 ขั้นตอน sequential
   */
  async runLifecycleCheck() {
    if (this.checkInProgress) {
      logger.warn('InternshipLifecycleMonitor: Previous check is still running, skipping...');
      return;
    }

    this.checkInProgress = true;
    logger.info('InternshipLifecycleMonitor: Starting lifecycle check...');

    try {
      // Step 1: อัปเดต internshipStatus ตาม startDate
      await this.checkAndUpdateStatuses();

      // Step 2: ตรวจ workflow → SUMMARY_PENDING (สำหรับนักศึกษาที่อยู่ IN_PROGRESS แล้ว)
      await this.checkAndUpdateWorkflows();

      logger.info('InternshipLifecycleMonitor: Lifecycle check completed');
    } catch (error) {
      logger.error('InternshipLifecycleMonitor: Fatal error:', error);
    } finally {
      this.checkInProgress = false;
    }
  }

  // ========== Step 1: Status Update (from internshipStatusMonitor) ==========

  async checkAndUpdateStatuses() {
    logger.info('InternshipLifecycleMonitor: Step 1 - Checking internship statuses...');

    try {
      const now = dayjs().tz('Asia/Bangkok');
      let updatedToInProgress = 0;
      let errorCount = 0;

      const students = await Student.findAll({
        where: {
          isEnrolledInternship: true,
          internshipStatus: { [Op.in]: ['pending_approval', 'in_progress'] }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId']
        }]
      });

      logger.info(`Step 1: Found ${students.length} students to check`);

      for (const student of students) {
        try {
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

          if (!cs05Doc?.internshipDocument) continue;

          const { startDate } = cs05Doc.internshipDocument;
          if (!startDate) continue;

          const startDateObj = dayjs(startDate).tz('Asia/Bangkok');
          let newStatus = null;

          if (now.isSameOrAfter(startDateObj, 'day')) {
            if (student.internshipStatus !== 'completed' && student.internshipStatus !== 'in_progress') {
              newStatus = 'in_progress';
            }
          } else {
            if (student.internshipStatus !== 'pending_approval' && student.internshipStatus !== 'in_progress') {
              newStatus = 'pending_approval';
            }
          }

          if (newStatus) {
            await student.update({ internshipStatus: newStatus });

            try {
              if (newStatus === 'in_progress') {
                await workflowService.updateStudentWorkflowActivity(
                  student.studentId, 'internship', 'INTERNSHIP_IN_PROGRESS',
                  'in_progress', 'in_progress',
                  { startedAt: startDateObj.toISOString(), autoUpdated: true, updatedBy: 'system' }
                );
                updatedToInProgress++;
                logger.info(`Step 1: Student ${student.studentId} → in_progress`);
              }
            } catch (workflowError) {
              logger.warn(`Step 1: Workflow update error for student ${student.studentId}:`, workflowError.message);
            }
          }
        } catch (error) {
          errorCount++;
          logger.error(`Step 1: Error for student ${student.studentId}:`, error);
        }
      }

      logger.info(`Step 1 completed: ${updatedToInProgress} updated to in_progress, ${errorCount} errors`);
    } catch (error) {
      logger.error('Step 1: Fatal error:', error);
    }
  }

  // ========== Step 2: Workflow Update (from internshipWorkflowMonitor) ==========

  async checkAndUpdateWorkflows() {
    logger.info('InternshipLifecycleMonitor: Step 2 - Checking workflow transitions...');

    try {
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

      logger.info(`Step 2: Found ${activities.length} students in IN_PROGRESS`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const activity of activities) {
        try {
          const internship = await InternshipDocument.findOne({
            include: [{
              model: Document,
              as: 'document',
              where: { userId: activity.student.userId },
              attributes: ['documentId', 'userId']
            }],
            where: {
              [Op.or]: [
                { endDate: { [Op.gte]: dayjs().subtract(30, 'day').toDate() } },
                { endDate: null }
              ]
            },
            order: [['created_at', 'DESC']]
          });

          if (!internship) {
            logger.debug(`Step 2: No active internship for student ${activity.studentId}`);
            continue;
          }

          const updated = await internshipLogbookService.checkAndUpdateSummaryPending(internship.internshipId);

          if (updated) {
            updatedCount++;
            logger.info(`Step 2: Student ${activity.studentId} → SUMMARY_PENDING`);
          }
        } catch (error) {
          errorCount++;
          logger.error(`Step 2: Error for student ${activity.studentId}:`, error);
        }
      }

      logger.info(`Step 2 completed: ${updatedCount} updated, ${errorCount} errors`);
    } catch (error) {
      logger.error('Step 2: Fatal error:', error);
    }
  }

  async runNow() {
    logger.info('InternshipLifecycleMonitor: Running check immediately...');
    await this.runLifecycleCheck();
  }
}

module.exports = new InternshipLifecycleMonitor();
