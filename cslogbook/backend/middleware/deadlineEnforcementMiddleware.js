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
      
      // Log สำหรับ debugging
      logger.debug('checkDeadlineBeforeSubmission: Request received', {
        projectId,
        params: req.params,
        url: req.url,
        method: req.method,
        actionType,
        userId: req.user?.userId,
        studentCode: req.student?.studentCode
      });
      
      if (!projectId) {
        logger.warn('checkDeadlineBeforeSubmission: Missing projectId', {
          params: req.params,
          url: req.url,
          method: req.method
        });
        return res.status(400).json({
          success: false,
          error: 'ไม่พบรหัสโครงงาน'
        });
      }

      // ตรวจสอบว่า projectId เป็นตัวเลขที่ valid
      const parsedProjectId = parseInt(projectId, 10);
      if (isNaN(parsedProjectId) || parsedProjectId <= 0) {
        logger.warn('checkDeadlineBeforeSubmission: Invalid projectId format', {
          projectId,
          parsedProjectId,
          params: req.params,
          url: req.url
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: `projectId ต้องเป็นตัวเลขที่ valid (ได้รับ: ${projectId})`
        });
      }

      // ตรวจสอบว่า project มีอยู่จริงก่อน
      const project = await ProjectDocument.findByPk(parsedProjectId, {
        attributes: ['projectId', 'academicYear', 'semester', 'projectNameTh']
      });

      if (!project) {
        logger.warn('checkDeadlineBeforeSubmission: Project not found', {
          projectId: parsedProjectId,
          originalProjectId: projectId,
          url: req.url,
          userId: req.user?.userId,
          studentCode: req.student?.studentCode
        });
        return res.status(404).json({
          success: false,
          error: 'ไม่พบข้อมูลโครงงาน',
          details: `ไม่พบโครงงาน ID: ${parsedProjectId}`
        });
      }

      // ดึง workflow state - ใช้ parsedProjectId ที่ validated แล้ว
      const state = await ProjectWorkflowState.findOne({
        where: { projectId: parsedProjectId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: ['academicYear', 'semester', 'projectNameTh']
        }]
      });

      // ถ้าไม่มี state แต่ project มีอยู่ แสดงว่า state ยังไม่ได้ sync
      if (!state) {
        logger.warn(`ProjectWorkflowState not found for projectId: ${parsedProjectId} - state may need to be synced`, {
          projectId: parsedProjectId,
          url: req.url,
          userId: req.user?.userId,
          studentCode: req.student?.studentCode
        });
        return res.status(500).json({
          success: false,
          error: 'สถานะโครงงานยังไม่ได้อัปเดต กรุณาติดต่อผู้ดูแลระบบ',
          code: 'WORKFLOW_STATE_MISSING',
          details: {
            projectId: parsedProjectId,
            message: 'ProjectWorkflowState ยังไม่ได้ถูกสร้างหรือ sync สำหรับโครงงานนี้'
          }
        });
      }

      if (!state.project) {
        logger.warn(`ProjectWorkflowState found but project association missing for projectId: ${parsedProjectId}`, {
          projectId: parsedProjectId,
          url: req.url,
          userId: req.user?.userId
        });
        return res.status(500).json({
          success: false,
          error: 'ข้อมูลโครงงานไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ',
          code: 'PROJECT_ASSOCIATION_MISSING'
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
        projectId: parsedProjectId,
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
