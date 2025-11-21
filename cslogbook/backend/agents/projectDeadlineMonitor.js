/**
 * Project Deadline Monitor Agent
 * 
 * ตรวจสอบโครงงานที่เลย deadline และอัปเดต isOverdue flag อัตโนมัติ
 * รันเป็น scheduled job (cron) เพื่อรักษา data consistency
 */

const cron = require('node-cron');
const { ProjectWorkflowState, ProjectDocument } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const projectWorkflowStateService = require('../services/projectWorkflowStateService');

class ProjectDeadlineMonitor {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.checkInProgress = false; // ใช้สำหรับป้องกัน concurrent check
    this.lastRunTime = null;
    this.statistics = {
      totalChecked: 0,
      newlyOverdue: 0,
      stillOverdue: 0,
      noLongerOverdue: 0,
      errors: 0
    };
  }

  /**
   * เริ่มต้น agent
   * @param {string} cronSchedule - Cron expression (default: '0 * * * *' = ทุกชั่วโมง)
   */
  start(cronSchedule = '0 * * * *') {
    if (this.cronJob) {
      logger.warn('ProjectDeadlineMonitor is already running');
      return;
    }

    // ตั้งสถานะว่ากำลังทำงาน
    this.isRunning = true;

    // รอ startup
    setTimeout(() => {
      this.runCheck().catch(err => {
        logger.error('Initial deadline check failed:', err);
      });
    }, 5000); // 5 วินาทีหลัง start

    // ตั้ง cron job
    this.cronJob = cron.schedule(cronSchedule, async () => {
      await this.runCheck();
    }, {
      scheduled: true,
      timezone: 'Asia/Bangkok'
    });

    logger.info(`ProjectDeadlineMonitor started with schedule: ${cronSchedule}`);
  }

  /**
   * หยุด agent
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      logger.info('ProjectDeadlineMonitor stopped');
    }
  }

  /**
   * รันการตรวจสอบ deadline ทั้งหมด
   */
  async runCheck() {
    if (this.checkInProgress) {
      logger.warn('ProjectDeadlineMonitor: Check already in progress, skipping...');
      return;
    }

    this.checkInProgress = true;
    const startTime = Date.now();

    try {
      logger.info('ProjectDeadlineMonitor: Starting deadline check...');

      // Reset statistics
      this.statistics = {
        totalChecked: 0,
        newlyOverdue: 0,
        stillOverdue: 0,
        noLongerOverdue: 0,
        errors: 0
      };

      // ดึงโครงงานที่ยัง active (ไม่ใช่ COMPLETED หรือ ARCHIVED)
      const activeStates = await ProjectWorkflowState.findAll({
        where: {
          currentPhase: {
            [Op.notIn]: ['COMPLETED', 'ARCHIVED']
          }
        },
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: ['projectId', 'projectNameTh', 'academicYear', 'semester'],
          required: true
        }]
      });

      logger.info(`ProjectDeadlineMonitor: Found ${activeStates.length} active projects`);

      // ตรวจสอบแต่ละโครงงาน
      for (const state of activeStates) {
        this.statistics.totalChecked++;

        try {
          const wasOverdue = state.isOverdue;
          
          // ตรวจสอบ overdue
          const result = await projectWorkflowStateService.checkOverdue(state.projectId);

          // นับสถิติ
          if (result.isOverdue && !wasOverdue) {
            this.statistics.newlyOverdue++;
            
            // ส่งแจ้งเตือนสำหรับโครงงานที่เพิ่งเลย deadline
            await this.notifyOverdue(state, result.overdueDeadlines);
          } else if (result.isOverdue && wasOverdue) {
            this.statistics.stillOverdue++;
          } else if (!result.isOverdue && wasOverdue) {
            this.statistics.noLongerOverdue++;
          }

        } catch (error) {
          this.statistics.errors++;
          logger.error(`Error checking project ${state.projectId}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.lastRunTime = new Date();

      logger.info(`ProjectDeadlineMonitor: Check complete in ${duration}ms`, {
        ...this.statistics,
        duration
      });

    } catch (error) {
      logger.error('ProjectDeadlineMonitor: Fatal error during check:', error);
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * ส่งแจ้งเตือนเมื่อโครงงานเลย deadline
   * @param {Object} state - ProjectWorkflowState instance
   * @param {Array} overdueDeadlines - Array of overdue deadlines
   */
  async notifyOverdue(state, overdueDeadlines) {
    try {
      if (!state.project) {
        logger.warn(`Cannot notify overdue: No project data for state ${state.id}`);
        return;
      }

      logger.warn(`Project ${state.projectId} is now overdue`, {
        projectId: state.projectId,
        projectName: state.project.projectNameTh,
        phase: state.currentPhase,
        deadlines: overdueDeadlines.map(d => d.name)
      });

      // TODO: ส่ง email notification ถ้าเปิด feature และมี emailService
      // if (process.env.EMAIL_OVERDUE_NOTIFICATION_ENABLED === 'true') {
      //   const emailService = require('../services/emailService');
      //   ... implementation
      // }

    } catch (error) {
      logger.error(`Error sending overdue notification for project ${state.projectId}:`, error);
    }
  }

  /**
   * ดึงสถิติการรันล่าสุด
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      statistics: this.statistics
    };
  }

  /**
   * บังคับให้รันทันที (สำหรับ manual trigger)
   */
  async triggerCheck() {
    logger.info('ProjectDeadlineMonitor: Manual trigger requested');
    await this.runCheck();
  }
}

// Singleton instance
const instance = new ProjectDeadlineMonitor();

module.exports = instance;
