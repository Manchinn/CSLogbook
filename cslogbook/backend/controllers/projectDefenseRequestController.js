const projectDefenseRequestService = require('../services/projectDefenseRequestService');
const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

module.exports = {
  async getProject1Request(req, res) {
    try {
      const project = await projectDocumentService.getProjectById(req.params.id);
      if (req.user.role === 'student') {
        const isMember = project.members.some(member => member.studentId === req.user.studentId);
        if (!isMember) {
          return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        }
      }
      const record = await projectDefenseRequestService.getLatestProject1Request(req.params.id);
      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('getProject1Request error', { projectId: req.params.id, error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดึงข้อมูลคำขอสอบได้' });
    }
  },

  async submitProject1Request(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะหัวหน้าโครงงาน' });
      }
      const record = await projectDefenseRequestService.submitProject1Request(req.params.id, req.user.studentId, req.body || {});
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      logger.error('submitProject1Request error', { projectId: req.params.id, error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAdvisorQueue(req, res) {
    try {
      if (req.user.role !== 'teacher' || !req.user.teacherId) {
        return res.status(403).json({ success: false, message: 'เฉพาะอาจารย์ที่เกี่ยวข้องเท่านั้น' });
      }

      const statusQuery = req.query.status;
      const status = Array.isArray(statusQuery)
        ? statusQuery
        : (typeof statusQuery === 'string' && statusQuery.trim() ? statusQuery.trim().split(',') : undefined);

      const queue = await projectDefenseRequestService.getAdvisorApprovalQueue(req.user.teacherId, {
        status,
        withMetrics: true
      });

      return res.json({ success: true, data: queue });
    } catch (error) {
      logger.error('getAdvisorQueue error', { teacherId: req.user.teacherId, error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดึงรายการคำขอที่รออนุมัติได้' });
    }
  },

  async submitAdvisorDecision(req, res) {
    try {
      if (req.user.role !== 'teacher' || !req.user.teacherId) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการในคำขอนี้' });
      }

      const { decision, note } = req.body || {};
      const record = await projectDefenseRequestService.submitAdvisorDecision(
        req.params.id,
        req.user.teacherId,
        { decision, note }
      );

      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('submitAdvisorDecision error', {
        projectId: req.params.id,
        teacherId: req.user.teacherId,
        error: error.message
      });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถบันทึกการตัดสินใจได้' });
    }
  },

  async getStaffVerificationQueue(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
  const isScheduler = req.user.role === 'teacher' && Boolean(req.user.canExportProject1); // ให้สิทธิ์อาจารย์ผู้ดูแลการนัดสอบเข้าดูรายการเพื่อเตรียมส่งออก
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

      const queue = await projectDefenseRequestService.getStaffVerificationQueue({
        status,
        academicYear,
        semester,
        search,
        withMetrics: true
      });

      return res.json({ success: true, data: queue });
    } catch (error) {
      logger.error('getStaffVerificationQueue error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดึงคิวตรวจสอบได้' });
    }
  },

  async verifyProject1Request(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ตรวจสอบคำขอนี้' });
      }

      const { note } = req.body || {};
      const record = await projectDefenseRequestService.verifyProject1Request(
        req.params.id,
        { note },
        req.user
      );

      return res.json({ success: true, data: record });
    } catch (error) {
      logger.error('verifyProject1Request error', { projectId: req.params.id, error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถตรวจสอบคำขอได้' });
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
      const isScheduler = req.user.role === 'teacher' && Boolean(req.user.canExportProject1); // กรณีอาจารย์ได้รับมอบหมายจัดตารางสอบ
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
        search
      });

      const downloadName = filename || `kp02_staff_queue_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      const outputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      return res.send(outputBuffer);
    } catch (error) {
      logger.error('exportStaffVerificationList error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถส่งออกข้อมูลได้' });
    }
  }
};
