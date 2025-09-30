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

  async scheduleProject1Defense(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role !== 'teacher' || req.user.teacherType === 'support');
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์นัดหมายการสอบโครงงานพิเศษ 1' });
      }

      const { scheduledAt, location, note } = req.body || {};
      const record = await projectDefenseRequestService.scheduleProject1Defense(
        req.params.id,
        { scheduledAt, location, note },
        req.user
      );
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      logger.error('scheduleProject1Defense error', { projectId: req.params.id, error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
