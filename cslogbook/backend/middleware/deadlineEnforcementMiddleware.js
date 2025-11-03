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
const dayjs = require('dayjs');
const logger = require('../utils/logger');
const { getWorkflowTypeFromPhase, getDeadlineMappingForPhase } = require('../constants/workflowDeadlineMapping');

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

      // ดึง deadline จากฐานข้อมูล
      const deadline = await ImportantDeadline.findOne({
        where: {
          relatedTo,
          academicYear: state.project.academicYear,
          semester: state.project.semester,
          deadlineType: actionType,
          isPublished: true,
          // Optional: กรอง documentSubtype ถ้ามี
          ...(deadlineMapping.documentSubtype && {
            [Op.or]: [
              { documentSubtype: deadlineMapping.documentSubtype },
              { documentSubtype: null } // รวม general deadlines
            ]
          })
        },
        order: [['deadlineAt', 'DESC']] // เอา deadline ล่าสุด
      });

      if (!deadline) {
        // ไม่มี deadline กำหนด - อนุญาตให้ดำเนินการ
        logger.debug(`No deadline found for ${relatedTo}:${phase}:${actionType}`);
        return next();
      }

      const now = dayjs();
      let effectiveDeadline = dayjs(deadline.deadlineAt);

      // เพิ่ม grace period
      if (deadline.gracePeriodMinutes) {
        effectiveDeadline = effectiveDeadline.add(deadline.gracePeriodMinutes, 'minute');
      }

      // ตรวจสอบว่าเลย deadline หรือไม่
      if (now.isAfter(effectiveDeadline)) {
        if (deadline.lockAfterDeadline) {
          // ล็อก - ไม่อนุญาตให้ดำเนินการ
          logger.warn(`Submission blocked for project ${projectId}: Deadline ${deadline.name} has passed`, {
            projectId,
            phase,
            deadlineName: deadline.name,
            deadlineAt: deadline.deadlineAt,
            effectiveDeadline: effectiveDeadline.toISOString()
          });

          return res.status(403).json({
            success: false,
            error: 'หมดเวลายื่นเอกสารแล้ว',
            message: `หมดเวลายื่น "${deadline.name}" แล้ว (${effectiveDeadline.format('DD/MM/YYYY HH:mm')})`,
            details: {
              deadlineName: deadline.name,
              deadlineAt: deadline.deadlineAt,
              effectiveDeadline: effectiveDeadline.toISOString(),
              gracePeriodMinutes: deadline.gracePeriodMinutes,
              allowLate: deadline.allowLate,
              lockAfterDeadline: deadline.lockAfterDeadline
            }
          });
        } else if (!deadline.allowLate) {
          // เตือนแต่ยังให้ผ่าน
          const minutesLate = now.diff(effectiveDeadline, 'minute');
          
          logger.info(`Late submission for project ${projectId}: ${minutesLate} minutes late`, {
            projectId,
            phase,
            deadlineName: deadline.name
          });

          req.isLateSubmission = true;
          req.deadlineInfo = {
            name: deadline.name,
            deadlineAt: deadline.deadlineAt,
            effectiveDeadline: effectiveDeadline.toISOString(),
            minutesLate
          };
        }
      }

      // ตรวจสอบ submission window (ถ้ามี)
      if (deadline.windowStartAt) {
        const windowStart = dayjs(deadline.windowStartAt);
        if (now.isBefore(windowStart)) {
          logger.warn(`Submission too early for project ${projectId}: Window not open yet`, {
            projectId,
            windowStartAt: deadline.windowStartAt
          });

          return res.status(403).json({
            success: false,
            error: 'ยังไม่ถึงเวลาเปิดให้ยื่นเอกสาร',
            message: `เปิดให้ยื่นเอกสารตั้งแต่วันที่ ${windowStart.format('DD/MM/YYYY HH:mm')}`,
            details: {
              windowStartAt: deadline.windowStartAt,
              deadlineName: deadline.name
            }
          });
        }
      }

      if (deadline.windowEndAt) {
        const windowEnd = dayjs(deadline.windowEndAt);
        if (now.isAfter(windowEnd)) {
          logger.warn(`Submission window closed for project ${projectId}`, {
            projectId,
            windowEndAt: deadline.windowEndAt
          });

          return res.status(403).json({
            success: false,
            error: 'หมดช่วงเวลายื่นเอกสารแล้ว',
            message: `ช่วงเวลายื่นเอกสารสิ้นสุดเมื่อ ${windowEnd.format('DD/MM/YYYY HH:mm')}`,
            details: {
              windowEndAt: deadline.windowEndAt,
              deadlineName: deadline.name
            }
          });
        }
      }

      // ผ่านการตรวจสอบทั้งหมด - อนุญาตให้ดำเนินการ
      req.deadlineChecked = true;
      req.applicableDeadline = {
        id: deadline.id,
        name: deadline.name,
        deadlineAt: deadline.deadlineAt,
        effectiveDeadline: effectiveDeadline.toISOString()
      };

      logger.debug(`Deadline check passed for project ${projectId}`, {
        projectId,
        phase,
        deadlineName: deadline.name
      });

      next();
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
        const now = dayjs();
        let effectiveDeadline = dayjs(deadline.deadlineAt);

        if (deadline.gracePeriodMinutes) {
          effectiveDeadline = effectiveDeadline.add(deadline.gracePeriodMinutes, 'minute');
        }

        if (now.isAfter(effectiveDeadline)) {
          req.isPastDeadline = true;
          req.deadlineWarning = {
            name: deadline.name,
            deadlineAt: deadline.deadlineAt,
            minutesLate: now.diff(effectiveDeadline, 'minute')
          };
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
