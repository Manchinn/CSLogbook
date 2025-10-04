const projectSystemTestService = require('../services/projectSystemTestService');
const logger = require('../utils/logger');

const buildResponse = (res, promise) => {
  return promise
    .then((data) => res.json({ success: true, data }))
    .catch((error) => {
      logger.error('projectSystemTestController error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดำเนินการได้' });
    });
};

module.exports = {
  getLatestRequest(req, res) {
    const projectId = req.params.id;
    return buildResponse(res, projectSystemTestService.getLatest(projectId, req.user));
  },

  submitRequest(req, res) {
    const projectId = req.params.id;
    const payload = {
      testStartDate: req.body?.testStartDate,
      testPeriodStart: req.body?.testPeriodStart,
      testPeriodEnd: req.body?.testPeriodEnd,
      testDueDate: req.body?.testDueDate,
      studentNote: req.body?.studentNote
    };
    const fileMeta = req.file || null;
    return buildResponse(res, projectSystemTestService.submitRequest(projectId, req.user, payload, fileMeta));
  },

  submitAdvisorDecision(req, res) {
    const projectId = req.params.id;
    const payload = {
      decision: req.body?.decision,
      note: req.body?.note
    };
    return buildResponse(res, projectSystemTestService.submitAdvisorDecision(projectId, req.user, payload));
  },

  submitStaffDecision(req, res) {
    const projectId = req.params.id;
    const payload = {
      decision: req.body?.decision,
      note: req.body?.note
    };
    return buildResponse(res, projectSystemTestService.submitStaffDecision(projectId, req.user, payload));
  },

  uploadEvidence(req, res) {
    const projectId = req.params.id;
    const fileMeta = req.file || null;
    return buildResponse(res, projectSystemTestService.uploadEvidence(projectId, req.user, fileMeta));
  },

  advisorQueue(req, res) {
    if (req.user.role !== 'teacher' || !req.user.teacherId) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้' });
    }
    return buildResponse(res, projectSystemTestService.advisorQueue(req.user.teacherId));
  },

  staffQueue(req, res) {
    const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role === 'admin' || req.user.teacherType === 'support' || req.user.canExportProject1);
    if (!isStaff) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้' });
    }
    const status = req.query?.status;
    return buildResponse(res, projectSystemTestService.staffQueue({ status }));
  }
};
