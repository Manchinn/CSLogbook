/**
 * Deadline Enforcement Middleware
 * 
 * ตรวจสอบ deadline ก่อนอนุญาตให้นักศึกษาดำเนินการยื่นเอกสาร
 * ใช้ ProjectWorkflowState + ImportantDeadline เพื่อตรวจสอบว่า:
 * - ยังอยู่ในช่วงเวลายื่นหรือไม่
 * - เลย deadline หรือไม่ (พิจารณา grace period)
 * - ควร lock หรือ warning
 */

const { ProjectWorkflowState, ProjectDocument, ImportantDeadline } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getWorkflowTypeFromPhase, getDeadlineMappingForPhase } = require('../constants/workflowDeadlineMapping');
const { 
  checkDeadlineStatus, 
  handleDeadlineCheckResult,
  buildDeadlineOrderClause,
  findDeadlineWithFallback 
} = require('../utils/deadlineChecker');

/**
 * ตรวจสอบ deadline ก่อนอนุญาตให้ดำเนินการ
 * @param {string} actionType - 'SUBMISSION' (default), 'ANNOUNCEMENT', etc.
 * @returns {Function} Express middleware
 */
const checkDeadlineBeforeSubmission = (actionType = 'SUBMISSION') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'ไม่พบรหัสโครงงาน'
        });
      }

      // ดึง workflow state
      const state = await ProjectWorkflowState.findOne({
        where: { projectId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: ['academicYear', 'semester', 'projectNameTh']
        }]
      });

      if (!state || !state.project) {
        return res.status(404).json({
          success: false,
          error: 'ไม่พบข้อมูลโครงงาน'
        });
      }

      // หา deadline ที่เกี่ยวข้องกับ phase ปัจจุบัน
      const phase = state.currentPhase;
      const relatedTo = getWorkflowTypeFromPhase(phase);

      if (!relatedTo) {
        // ไม่อยู่ใน phase ที่ต้องตรวจสอบ deadline
        logger.debug(`No deadline enforcement for phase: ${phase}`);
        return next();
      }

      // ดึง deadline mapping สำหรับ phase นี้
      const deadlineMapping = getDeadlineMappingForPhase(relatedTo, phase);

      if (!deadlineMapping) {
        logger.debug(`No deadline mapping for ${relatedTo}:${phase}`);
        return next();
      }

      // ดึง deadline จากฐานข้อมูล แบบ Hybrid (ลอง mapping ก่อน แล้ว fallback เป็นชื่อ)
      const deadline = await findDeadlineWithFallback({
        workflowType: relatedTo,
        documentSubtype: deadlineMapping.documentSubtype,
        deadlineName: deadlineMapping.deadlineName,
        relatedTo,
        academicYear: state.project.academicYear,
        semester: state.project.semester,
        deadlineType: actionType
      });

      if (!deadline) {
        // ไม่มี deadline กำหนด - อนุญาตให้ดำเนินการ
        logger.debug(`No deadline found for ${relatedTo}:${phase}:${actionType}`);
        return next();
      }

      // ใช้ shared utility function ตรวจสอบ deadline
      const checkResult = checkDeadlineStatus(deadline, {
        type: 'project',
        projectId,
        phase,
        relatedTo,
        userId: req.user?.userId
      });

      // จัดการผลการตรวจสอบ
      return handleDeadlineCheckResult(checkResult, req, res, next);
    } catch (error) {
      logger.error('Error in checkDeadlineBeforeSubmission:', error);
      return res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการตรวจสอบ deadline',
        message: error.message
      });
    }
  };
};

/**
 * ตรวจสอบว่านักศึกษามีสิทธิ์ยื่นเอกสารในช่วงเวลาที่กำหนดหรือไม่
 * (Alternative - ไม่ block แต่เพิ่ม warning flag)
 */
const warnIfPastDeadline = (actionType = 'SUBMISSION') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId;
      
      if (!projectId) {
        return next();
      }

      const state = await ProjectWorkflowState.findOne({
        where: { projectId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: ['academicYear', 'semester']
        }]
      });

      if (!state || !state.project) {
        return next();
      }

      const phase = state.currentPhase;
      const relatedTo = getWorkflowTypeFromPhase(phase);

      if (!relatedTo) {
        return next();
      }

      const deadline = await ImportantDeadline.findOne({
        where: {
          relatedTo,
          academicYear: state.project.academicYear,
          semester: state.project.semester,
          deadlineType: actionType,
          isPublished: true
        },
        order: [['deadlineAt', 'DESC']]
      });

      if (deadline) {
        // ใช้ shared utility function แต่จับเฉพาะ metadata
        const checkResult = checkDeadlineStatus(deadline, {
          type: 'project_warning',
          projectId: req.params.id || req.params.projectId,
          phase: state.currentPhase,
          userId: req.user?.userId
        });

        if (checkResult.isLate && checkResult.metadata.deadlineInfo) {
          req.isPastDeadline = true;
          req.deadlineWarning = checkResult.metadata.deadlineInfo;
        }
      }

      next();
    } catch (error) {
      logger.error('Error in warnIfPastDeadline:', error);
      // Don't block - just skip warning
      next();
    }
  };
};

module.exports = {
  checkDeadlineBeforeSubmission,
  warnIfPastDeadline
};
