/**
 * Project Deadline Monitor Agent
 * 
 * ตรวจสอบโครงงานที่เลย deadline และอัปเดต workflow state + isOverdue flag อัตโนมัติ
 * รันเป็น scheduled job (cron) เพื่อรักษา data consistency
 * 
 * ENHANCED: รวม logic จาก deadlineStatusUpdater - ทำทั้งหมด:
 * - ตรวจสอบ ImportantDeadline (deadline_at และ end_date)
 * - เปลี่ยน workflow state → LATE/OVERDUE
 * - อัพเดท isOverdue flag
 * - ส่งการแจ้งเตือน
 */

const cron = require('node-cron');
const { ProjectWorkflowState, ProjectDocument, WorkflowStepDefinition, ImportantDeadline, DeadlineWorkflowMapping } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const logger = require('../utils/logger');
const projectWorkflowStateService = require('../services/projectWorkflowStateService');
const { getStateMappingForDeadline } = require('../constants/deadlineStateMapping');
const { getActiveAcademicYearFilter } = require('../utils/academicYearHelper');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

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
      stateTransitions: 0, // NEW: track workflow transitions
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
   * ENHANCED: รวม logic การเปลี่ยน workflow state
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
        stateTransitions: 0, // NEW: track state transitions
        errors: 0
      };

      const now = dayjs().tz('Asia/Bangkok');

      // ========== STEP 1: Process ImportantDeadline state transitions ==========
      logger.info('ProjectDeadlineMonitor: Step 1 - Processing deadline-based state transitions...');
      await this.processDeadlineStateTransitions(now);

      // ========== STEP 2: Update isOverdue flags (existing logic) ==========
      logger.info('ProjectDeadlineMonitor: Step 2 - Updating isOverdue flags...');
      await this.updateOverdueFlags();

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
   * NEW METHOD: Process deadline-based workflow state transitions
   * Logic from deadlineStatusUpdater.js
   */
  async processDeadlineStateTransitions(now) {
    try {
      // ดึง filter ปีการศึกษาที่ active
      const yearFilter = await getActiveAcademicYearFilter();
      if (!yearFilter) {
        logger.warn('ProjectDeadlineMonitor: No active academic year, skipping deadline transitions');
        return;
      }

      // Job 1: Check soft deadlines (deadline_at)
      await this.processDeadlineAt(now, yearFilter);

      // Job 2: Check hard deadlines (end_date)
      await this.processEndDate(now, yearFilter);
    } catch (error) {
      logger.error('Error in processDeadlineStateTransitions:', error);
    }
  }

  /**
   * Job 1: Check soft deadline (deadline_at) → move PENDING → LATE_SUBMISSION
   */
  async processDeadlineAt(now, yearFilter) {
    try {
      // Find deadlines that have passed (no lower bound — idempotent via pending state check)
      const passedDeadlines = await ImportantDeadline.findAll({
        where: {
          deadlineAt: { [Op.lte]: now.toDate() },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        },
        include: [{
          model: DeadlineWorkflowMapping,
          as: 'deadlineWorkflowMappings',
          required: false,
          attributes: ['documentSubtype']
        }]
      });

      logger.info(`Found ${passedDeadlines.length} deadlines that have passed (soft)`);

      for (const deadline of passedDeadlines) {
        try {
          const documentSubtype = deadline.deadlineWorkflowMappings?.[0]?.documentSubtype || null;
          const mapping = getStateMappingForDeadline(deadline.relatedTo, deadline.name, documentSubtype);
          if (!mapping) continue;

          // Find pending step
          const pendingStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.pendingState
            }
          });

          if (!pendingStep) continue;

          // Find late step
          const lateStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.lateState
            }
          });

          if (!lateStep) continue;

          // Find projects in pending state
          const projectsToUpdate = await ProjectWorkflowState.findAll({
            where: {
              workflow_step_id: pendingStep.stepId
            },
            include: [{
              model: ProjectDocument,
              as: 'project',
              where: {
                status: { [Op.notIn]: ['completed', 'cancelled', 'archived'] }
              }
            }]
          });

          // Transition to late state
          for (const projectState of projectsToUpdate) {
            try {
              await projectState.update({
                workflow_step_id: lateStep.stepId,
                isOverdue: false, // Late but not overdue yet
                updated_at: new Date()
              });

              this.statistics.stateTransitions++;
              logger.info(`Transitioned project ${projectState.projectId} to late: ${mapping.lateState}`);
            } catch (updateError) {
              this.statistics.errors++;
              logger.error(`Error transitioning project ${projectState.projectId}:`, updateError);
            }
          }
        } catch (deadlineError) {
          this.statistics.errors++;
          logger.error(`Error processing deadline ${deadline.id}:`, deadlineError);
        }
      }
    } catch (error) {
      logger.error('Error in processDeadlineAt:', error);
    }
  }

  /**
   * Job 2: Check hard deadline (end_date) → move PENDING/LATE → OVERDUE
   */
  async processEndDate(now, yearFilter) {
    try {
      // Find deadlines whose end_date has passed (no lower bound — idempotent via state check)
      const closedDeadlines = await ImportantDeadline.findAll({
        where: {
          windowEndAt: { [Op.lte]: now.toDate() },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        },
        include: [{
          model: DeadlineWorkflowMapping,
          as: 'deadlineWorkflowMappings',
          required: false,
          attributes: ['documentSubtype']
        }]
      });

      logger.info(`Found ${closedDeadlines.length} deadlines that have closed (hard)`);

      for (const deadline of closedDeadlines) {
        try {
          const documentSubtype = deadline.deadlineWorkflowMappings?.[0]?.documentSubtype || null;
          const mapping = getStateMappingForDeadline(deadline.relatedTo, deadline.name, documentSubtype);
          if (!mapping) continue;

          // Find overdue step
          const overdueStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.overdueState
            }
          });

          if (!overdueStep) continue;

          // Find pending and late steps
          const pendingStep = await WorkflowStepDefinition.findOne({
            where: { workflow_type: deadline.relatedTo, step_key: mapping.pendingState }
          });

          const lateStep = await WorkflowStepDefinition.findOne({
            where: { workflow_type: deadline.relatedTo, step_key: mapping.lateState }
          });

          const stepsToCheck = [pendingStep?.stepId, lateStep?.stepId].filter(Boolean);

          if (stepsToCheck.length === 0) continue;

          // Find projects in pending OR late state
          const projectsToUpdate = await ProjectWorkflowState.findAll({
            where: {
              workflow_step_id: { [Op.in]: stepsToCheck }
            },
            include: [{
              model: ProjectDocument,
              as: 'project',
              where: {
                status: { [Op.notIn]: ['completed', 'cancelled', 'archived'] }
              }
            }]
          });

          // Transition to overdue
          for (const projectState of projectsToUpdate) {
            try {
              await projectState.update({
                workflow_step_id: overdueStep.stepId,
                isOverdue: true, // Set flag for UI
                updated_at: new Date()
              });

              this.statistics.stateTransitions++;
              logger.warn(`Marked project ${projectState.projectId} as OVERDUE: ${mapping.overdueState}`);

              await this.notifyOverdue(projectState, [deadline]);
            } catch (updateError) {
              this.statistics.errors++;
              logger.error(`Error marking project ${projectState.projectId} as overdue:`, updateError);
            }
          }
        } catch (deadlineError) {
          this.statistics.errors++;
          logger.error(`Error processing deadline ${deadline.id}:`, deadlineError);
        }
      }
    } catch (error) {
      logger.error('Error in processEndDate:', error);
    }
  }

  /**
   * Update isOverdue flags (existing logic, now Step 2)
   */
  async updateOverdueFlags() {
    try {
      // ดึงโครงงานที่ยัง active
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

      logger.info(`ProjectDeadlineMonitor: Found ${activeStates.length} active projects for flag update`);

      // ตรวจสอบแต่ละโครงงาน
      for (const state of activeStates) {
        this.statistics.totalChecked++;

        try {
          const wasOverdue = state.isOverdue;
          
          // ตรวจสอบ overdue
          const result = await projectWorkflowStateService.checkOverdue(state.projectId);

          // Update flag if changed
          if (result.isOverdue !== wasOverdue) {
            await state.update({ isOverdue: result.isOverdue });
          }

          // นับสถิติ (Step 1 commit แล้ว → wasOverdue จะเป็น true หาก Step 1 จัดการไปแล้ว ไม่ double-count)
          if (result.isOverdue && !wasOverdue) {
            this.statistics.newlyOverdue++;
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
    } catch (error) {
      logger.error('Error in updateOverdueFlags:', error);
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
