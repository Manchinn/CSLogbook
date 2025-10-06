const { StudentWorkflowActivity, sequelize } = require('../models');
const logger = require('../utils/logger');
const workflowService = require('./workflowService');

/**
 * Service: ProjectWorkflowService
 * จัดการ workflow ของนักศึกษาสำหรับโครงงานพิเศษ
 */
class ProjectWorkflowService {
  /**
   * Unlock ขั้นตอนถัดไปหลังจากผ่านการสอบ PROJECT1
   */
  async unlockNextPhase(studentId, currentStep, transaction = null) {
    try {
      const t = transaction || await sequelize.transaction();

      try {
        const activity = await StudentWorkflowActivity.findOne({
          where: { studentId, workflowType: 'project1' },
          transaction: t
        });

        let overallStatus = 'in_progress';
        let payload = {};

        if (activity?.overallWorkflowStatus) {
          overallStatus = activity.overallWorkflowStatus;
        }

        if (activity?.dataPayload) {
          try {
            payload = JSON.parse(activity.dataPayload);
          } catch (parseError) {
            logger.warn('unlockNextPhase: parse dataPayload failed', {
              studentId,
              error: parseError.message
            });
          }
        }

        payload = {
          ...payload,
          autoUnlockedFrom: currentStep,
          autoUnlockedAt: new Date().toISOString()
        };

        await workflowService.updateStudentWorkflowActivity(
          studentId,
          'project1',
          currentStep,
          'completed',
          overallStatus,
          payload,
          { transaction: t }
        );

        if (!transaction) {
          await t.commit();
        }

        logger.info(`Unlocked Phase 2 for student ${studentId}`);
      } catch (error) {
        if (!transaction) {
          await t.rollback();
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error in unlockNextPhase:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่านักศึกษาสามารถเข้าถึงขั้นตอนได้หรือไม่
   */
  async canAccessStep(studentId, stepKey) {
    try {
      const activity = await StudentWorkflowActivity.findOne({
        where: { studentId, stepKey }
      });

      return activity && ['available', 'in_progress', 'completed'].includes(activity.status);
    } catch (error) {
      logger.error('Error in canAccessStep:', error);
      return false;
    }
  }

  /**
   * ดึงสถานะ workflow ของนักศึกษา
   */
  async getStudentWorkflowStatus(studentId) {
    try {
      const activities = await StudentWorkflowActivity.findAll({
        where: { studentId },
        order: [['availableAt', 'ASC']]
      });

      return activities;
    } catch (error) {
      logger.error('Error in getStudentWorkflowStatus:', error);
      throw error;
    }
  }
}

module.exports = new ProjectWorkflowService();
