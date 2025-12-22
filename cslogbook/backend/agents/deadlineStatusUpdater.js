// agents/deadlineStatusUpdater.js
/**
 * Deadline Status Updater Agent
 * 
 * Automatically updates project workflow states based on deadline timestamps:
 * - Job 1: Check deadline_at (soft deadline) → move PENDING → LATE_SUBMISSION
 * - Job 2: Check end_date (hard deadline) → move PENDING/LATE → OVERDUE
 * 
 * Runs daily at midnight (Bangkok timezone)
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');

const { ImportantDeadline, ProjectWorkflowState, WorkflowStepDefinition } = require('../models');
const { getStateMappingForDeadline } = require('../constants/deadlineStateMapping');
const logger = require('../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

class DeadlineStatusUpdater {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.checkInProgress = false;
  }

  /**
   * Start the agent (cron scheduler)
   */
  start() {
    if (this.task) {
      logger.warn('DeadlineStatusUpdater: Agent is already running');
      return;
    }

    this.isRunning = true;

    // Run daily at midnight Bangkok time
    this.task = cron.schedule('0 0 * * *', async () => {
      await this.checkAndUpdateStatuses();
    }, {
      timezone: 'Asia/Bangkok'
    });

    logger.info('DeadlineStatusUpdater: Agent started (runs daily at 00:00 AM Bangkok time)');
  }

  /**
   * Stop the agent
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      logger.info('DeadlineStatusUpdater: Agent stopped');
    }
  }

  /**
   * Main check and update logic
   */
  async checkAndUpdateStatuses() {
    if (this.checkInProgress) {
      logger.warn('DeadlineStatusUpdater: Previous check still running, skipping...');
      return;
    }

    this.checkInProgress = true;
    logger.info('DeadlineStatusUpdater: Starting status check...');

    try {
      const now = dayjs().tz('Asia/Bangkok');
      
      // Job 1: Process soft deadlines (deadline_at)
      await this.processDeadlineAt(now);
      
      // Job 2: Process hard deadlines (end_date / windowEndAt)
      await this.processEndDate(now);

      logger.info('DeadlineStatusUpdater: Status check completed successfully');
    } catch (error) {
      logger.error('DeadlineStatusUpdater: Error in checkAndUpdateStatuses:', error);
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Job 1: Check soft deadlines (deadline_at)
   * Move projects from PENDING_STUDENT_SUBMISSION → PENDING_LATE_SUBMISSION
   */
  async processDeadlineAt(now) {
    logger.info('DeadlineStatusUpdater: Processing soft deadlines (deadline_at)...');
    
    let transitionedCount = 0;
    let errorCount = 0;

    try {
      // Find deadlines that just passed (within last 24 hours)
      const passedDeadlines = await ImportantDeadline.findAll({
        where: {
          deadlineAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] }
        }
      });

      logger.info(`Found ${passedDeadlines.length} deadlines that recently passed`);

      for (const deadline of passedDeadlines) {
        try {
          // Get state mapping for this deadline
          const mapping = getStateMappingForDeadline(deadline.relatedTo, deadline.name);
          
          if (!mapping) {
            logger.warn(`No state mapping found for deadline: ${deadline.name}`);
            continue;
          }

          // Find pending step definition
          const pendingStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.pendingState
            }
          });

          if (!pendingStep) {
            logger.warn(`Pending step not found: ${mapping.pendingState}`);
            continue;
          }

          // Find late step definition
          const lateStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.lateState
            }
          });

          if (!lateStep) {
            logger.warn(`Late step not found: ${mapping.lateState}`);
            continue;
          }

          // Find projects stuck in pending state
          const projectsToUpdate = await ProjectWorkflowState.findAll({
            where: {
              workflow_step_id: pendingStep.stepId
            },
            include: [{
              model: require('../models').ProjectDocument,
              as: 'project',
              where: {
                status: { [Op.notIn]: ['completed', 'cancelled', 'archived'] }
              }
            }]
          });

          logger.info(`Found ${projectsToUpdate.length} projects to transition to late state`);

          // Transition each project to late state
          for (const projectState of projectsToUpdate) {
            try {
              await projectState.update({
                workflow_step_id: lateStep.stepId,
                updated_at: new Date()
              });

              transitionedCount++;
              logger.info(`Transitioned project ${projectState.project_id} to late state: ${mapping.lateState}`);
            } catch (updateError) {
              errorCount++;
              logger.error(`Error transitioning project ${projectState.project_id}:`, updateError);
            }
          }
        } catch (deadlineError) {
          errorCount++;
          logger.error(`Error processing deadline ${deadline.id}:`, deadlineError);
        }
      }

      logger.info(`Soft deadline processing complete - Transitioned: ${transitionedCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error('Error in processDeadlineAt:', error);
    }
  }

  /**
   * Job 2: Check hard deadlines (end_date)
   * Move projects from PENDING/LATE → OVERDUE
   */
  async processEndDate(now) {
    logger.info('DeadlineStatusUpdater: Processing hard deadlines (end_date)...');
    
    let transitionedCount = 0;
    let errorCount = 0;

    try {
      // Find deadlines whose end_date just passed
      const closedDeadlines = await ImportantDeadline.findAll({
        where: {
          windowEndAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] }
        }
      });

      logger.info(`Found ${closedDeadlines.length} deadlines that recently closed`);

      for (const deadline of closedDeadlines) {
        try {
          const mapping = getStateMappingForDeadline(deadline.relatedTo, deadline.name);
          
          if (!mapping) {
            logger.warn(`No state mapping found for deadline: ${deadline.name}`);
            continue;
          }

          // Find overdue step definition
          const overdueStep = await WorkflowStepDefinition.findOne({
            where: {
              workflow_type: deadline.relatedTo,
              step_key: mapping.overdueState
            }
          });

          if (!overdueStep) {
            logger.warn(`Overdue step not found: ${mapping.overdueState}`);
            continue;
          }

          // Find pending and late step definitions
          const pendingStep = await WorkflowStepDefinition.findOne({
            where: { workflow_type: deadline.relatedTo, step_key: mapping.pendingState }
          });

          const lateStep = await WorkflowStepDefinition.findOne({
            where: { workflow_type: deadline.relatedTo, step_key: mapping.lateState }
          });

          const stepsToCheck = [pendingStep?.stepId, lateStep?.stepId].filter(Boolean);

          if (stepsToCheck.length === 0) {
            logger.warn(`No steps to check for deadline: ${deadline.name}`);
            continue;
          }

          // Find projects in pending OR late state
          const projectsToUpdate = await ProjectWorkflowState.findAll({
            where: {
              workflow_step_id: { [Op.in]: stepsToCheck }
            },
            include: [{
              model: require('../models').ProjectDocument,
              as: 'project',
              where: {
                status: { [Op.notIn]: ['completed', 'cancelled', 'archived'] }
              }
            }]
          });

          logger.info(`Found ${projectsToUpdate.length} projects to mark as overdue`);

          // Transition to overdue
          for (const projectState of projectsToUpdate) {
            try {
              await projectState.update({
                workflow_step_id: overdueStep.stepId,
                updated_at: new Date()
              });

              transitionedCount++;
              logger.info(`Marked project ${projectState.project_id} as overdue: ${mapping.overdueState}`);
            } catch (updateError) {
              errorCount++;
              logger.error(`Error marking project ${projectState.project_id} as overdue:`, updateError);
            }
          }
        } catch (deadlineError) {
          errorCount++;
          logger.error(`Error processing deadline ${deadline.id}:`, deadlineError);
        }
      }

      logger.info(`Hard deadline processing complete - Transitioned: ${transitionedCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error('Error in processEndDate:', error);
    }
  }

  /**
   * Manual trigger (for testing)
   */
  async runNow() {
    logger.info('DeadlineStatusUpdater: Running check immediately (manual trigger)...');
    await this.checkAndUpdateStatuses();
  }
}

module.exports = new DeadlineStatusUpdater();
