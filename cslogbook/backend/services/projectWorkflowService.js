const { StudentWorkflowActivity, sequelize } = require('../models');
const logger = require('../utils/logger');

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
        // อัปเดตสถานะขั้นตอนปัจจุบัน
        await StudentWorkflowActivity.update(
          {
            status: 'completed',
            completedAt: new Date()
          },
          {
            where: {
              studentId,
              stepKey: currentStep
            },
            transaction: t
          }
        );

        // ตัวอย่างการ unlock Phase 2 (Thesis Phase)
        // ขั้นตอนถัดไป: SCOPE_REVISION_AFTER_PROJECT1 หรือ 30_DAY_REQUEST
        const nextSteps = ['SCOPE_REVISION_AFTER_PROJECT1', '30_DAY_REQUEST'];

        for (const stepKey of nextSteps) {
          await StudentWorkflowActivity.findOrCreate({
            where: { studentId, stepKey },
            defaults: {
              studentId,
              stepKey,
              status: 'available',
              availableAt: new Date()
            },
            transaction: t
          });
        }

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
