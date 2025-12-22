const projectDefenseRequestService = require('../services/projectDefenseRequestService');
const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';
const DEFENSE_TYPE_THESIS = 'THESIS';
const ALLOWED_DEFENSE_TYPES = [DEFENSE_TYPE_PROJECT1, DEFENSE_TYPE_THESIS];

const normalizeDefenseType = (rawValue) => {
  if (rawValue === undefined || rawValue === null) return null;
  const normalized = String(rawValue).trim().toUpperCase();
  if (!normalized) return null;
  return ALLOWED_DEFENSE_TYPES.includes(normalized) ? normalized : null;
};

const resolveDefenseType = (req, fallback = DEFENSE_TYPE_PROJECT1) => {
  const raw = req?.query?.defenseType || req?.query?.type || req?.params?.defenseType || req?.body?.defenseType;
  const normalized = normalizeDefenseType(raw);
  if (raw && !normalized) {
    const error = new Error('ประเภทคำขอสอบไม่ถูกต้อง');
    error.statusCode = 400;
    throw error;
  }
  return normalized || fallback;
};

module.exports = {
  async getProject1Request(req, res) {
    try {
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const project = await projectDocumentService.getProjectById(req.params.id);
      if (req.user.role === 'student') {
        const isMember = project.members.some(member => member.studentId === req.user.studentId);
        if (!isMember) {
          return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        }
      }
      const record = defenseType === DEFENSE_TYPE_THESIS
        ? await projectDefenseRequestService.getLatestThesisRequest(req.params.id)
        : await projectDefenseRequestService.getLatestProject1Request(req.params.id);
      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('getProject1Request error', { projectId: req.params.id, error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถดึงข้อมูลคำขอสอบได้' });
    }
  },

  async submitProject1Request(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะหัวหน้าโครงงาน' });
      }
      
      const { id } = req.params;
      
      // NEW: Check workflow state for deadline enforcement
      const { ProjectWorkflowState, WorkflowStepDefinition } = require('../models');
      const workflowState = await ProjectWorkflowState.findOne({
        where: { project_id: id },
        include: [{
          model: WorkflowStepDefinition,
          as: 'stepDefinition',
          attributes: ['step_key', 'phase_variant', 'title', 'phase_key']
        }]
      });

      const variant = workflowState?.stepDefinition?.phase_variant;
      const phaseKey = workflowState?.stepDefinition?.phase_key;
      
      // Determine if this is defense or thesis based on phase
      const isThesisPhase = phaseKey?.includes('thesis') || phaseKey?.includes('final');
      
      if (variant === 'overdue') {
        const phaseName = isThesisPhase ? 'ปริญญานิพนธ์' : 'หัวข้อโครงงาน';
        logger.warn('Defense request blocked - overdue', { 
          projectId: id, 
          studentId: req.user.studentId,
          phase: phaseKey
        });
        return res.status(403).json({ 
          success: false, 
          message: `หมดเขตยื่นคำขอสอบ${phaseName}แล้ว กรุณาติดต่อเจ้าหน้าที่ภาควิชา`,
          code: 'DEADLINE_PASSED',
          deadlineInfo: {
            status: 'overdue',
            phase: phaseKey,
            currentState: workflowState?.stepDefinition?.title
          }
        });
      }

      const isLate = variant === 'late';
      
      if (isLate) {
        logger.info('Defense request - late submission', { 
          projectId: id, 
          studentId: req.user.studentId,
          phase: phaseKey
        });
      }
      
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const payload = { ...(req.body || {}) };
      delete payload.defenseType;

      const record = defenseType === DEFENSE_TYPE_THESIS
        ? await projectDefenseRequestService.submitThesisRequest(id, req.user.studentId, payload)
        : await projectDefenseRequestService.submitProject1Request(id, req.user.studentId, payload);
        
      return res.status(200).json({ 
        success: true, 
        data: record,
        isLateSubmission: isLate,
        submissionStatus: {
          variant: variant || 'on-time',
          message: isLate ? 'ยื่นคำขอหลังกำหนด - จะได้รับการพิจารณาพิเศษ' : null
        }
      });
    } catch (error) {
      logger.error('submitProject1Request error', { projectId: req.params.id, error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  },

  async getAdvisorQueue(req, res) {
    try {
      if (req.user.role !== 'teacher' || !req.user.teacherId) {
        return res.status(403).json({ success: false, message: 'เฉพาะอาจารย์ที่เกี่ยวข้องเท่านั้น' });
      }

      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const statusQuery = req.query.status;
      const status = Array.isArray(statusQuery)
        ? statusQuery
        : (typeof statusQuery === 'string' && statusQuery.trim() ? statusQuery.trim().split(',') : undefined);

      const queue = await projectDefenseRequestService.getAdvisorApprovalQueue(req.user.teacherId, {
        status,
        withMetrics: true,
        defenseType
      });

      return res.json({ success: true, data: queue });
    } catch (error) {
      logger.error('getAdvisorQueue error', { teacherId: req.user.teacherId, error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถดึงรายการคำขอที่รออนุมัติได้' });
    }
  },

  async submitAdvisorDecision(req, res) {
    try {
      if (req.user.role !== 'teacher' || !req.user.teacherId) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการในคำขอนี้' });
      }

      const { decision, note } = req.body || {};
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const record = await projectDefenseRequestService.submitAdvisorDecision(
        req.params.id,
        req.user.teacherId,
        { decision, note },
        { defenseType }
      );

      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('submitAdvisorDecision error', {
        projectId: req.params.id,
        teacherId: req.user.teacherId,
        error: error.message
      });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถบันทึกการตัดสินใจได้' });
    }
  },

  async getStaffVerificationQueue(req, res) {
    try {
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
      const schedulerFlag = defenseType === DEFENSE_TYPE_THESIS
        ? Boolean(req.user.canExportThesis ?? req.user.canExportProject1)
        : Boolean(req.user.canExportProject1);
  const isScheduler = req.user.role === 'teacher' && schedulerFlag; // ให้สิทธิ์อาจารย์ผู้ดูแลการนัดสอบเข้าดูรายการเพื่อเตรียมส่งออก
      if (!isStaff && !isScheduler) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงคิวตรวจสอบ' });
      }

      const statusQuery = req.query.status;
      const status = Array.isArray(statusQuery)
        ? statusQuery
        : (typeof statusQuery === 'string' && statusQuery.trim() ? statusQuery.trim().split(',') : undefined);

      const academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
      const semester = req.query.semester ? Number(req.query.semester) : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;

      const result = await projectDefenseRequestService.getStaffVerificationQueue({
        status,
        academicYear,
        semester,
        search,
        withMetrics: true,
        defenseType,
        limit,
        offset
      });

      return res.json({ 
        success: true, 
        data: result.data || result, // รองรับทั้งแบบใหม่ (มี data, total) และแบบเดิม
        total: result.total || (Array.isArray(result.data) ? result.data.length : result.length || 0)
      });
    } catch (error) {
      logger.error('getStaffVerificationQueue error', { error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถดึงคิวตรวจสอบได้' });
    }
  },

  async verifyProject1Request(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ตรวจสอบคำขอนี้' });
      }

      const { note } = req.body || {};
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const payload = { note };
      const record = defenseType === DEFENSE_TYPE_THESIS
        ? await projectDefenseRequestService.verifyThesisRequest(req.params.id, payload, req.user)
        : await projectDefenseRequestService.verifyProject1Request(req.params.id, payload, req.user);

      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('verifyProject1Request error', { projectId: req.params.id, error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถตรวจสอบคำขอได้' });
    }
  },

  async scheduleProject1Defense(req, res) {
    const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
    if (!isStaff) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์นัดหมายการสอบโครงงานพิเศษ 1' });
    }

    const message = 'ระบบนัดสอบโครงงานพิเศษ 1 ถูกย้ายไปจัดการผ่านปฏิทินภาควิชาแล้ว โปรดอัปเดตข้อมูลผ่านระบบปฏิทินโดยตรง';
    logger.info('scheduleProject1Defense deprecated access', { projectId: req.params.id, userId: req.user.userId });
    return res.status(410).json({ success: false, message });
  },

  async exportStaffVerificationList(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
      const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
      const schedulerFlag = defenseType === DEFENSE_TYPE_THESIS
        ? Boolean(req.user.canExportThesis ?? req.user.canExportProject1)
        : Boolean(req.user.canExportProject1);
      const isScheduler = req.user.role === 'teacher' && schedulerFlag; // กรณีอาจารย์ได้รับมอบหมายจัดตารางสอบ
      if (!isStaff && !isScheduler) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ส่งออกข้อมูล' });
      }

      const statusQuery = req.query.status;
      const status = Array.isArray(statusQuery)
        ? statusQuery
        : (typeof statusQuery === 'string' && statusQuery.trim() ? statusQuery.trim().split(',') : undefined);

      const academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
      const semester = req.query.semester ? Number(req.query.semester) : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const { buffer, filename } = await projectDefenseRequestService.exportStaffVerificationList({
        status,
        academicYear,
        semester,
        search,
        defenseType
      });

  const downloadName = filename || `รายชื่อสอบโครงงานพิเศษ1_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      const outputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      return res.send(outputBuffer);
    } catch (error) {
      logger.error('exportStaffVerificationList error', { error: error.message });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message || 'ไม่สามารถส่งออกข้อมูลได้' });
    }
  }
};
