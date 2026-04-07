const projectSystemTestService = require('../services/projectSystemTestService');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditLog');
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');

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

  async submitStaffDecision(req, res) {
    const projectId = req.params.id;
    const payload = {
      decision: req.body?.decision,
      note: req.body?.note
    };
    try {
      const data = await projectSystemTestService.submitStaffDecision(projectId, req.user, payload);
      logAction('DECIDE_SYSTEM_TEST', `เจ้าหน้าที่ ${payload.decision} คำขอทดสอบระบบ projectId=${projectId}`, { userId: req.user.userId });
      return res.json({ success: true, data });
    } catch (error) {
      logger.error('projectSystemTestController error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดำเนินการได้' });
    }
  },

  uploadEvidence(req, res) {
    const projectId = req.params.id;
    const fileMeta = req.file || null;
    const evidenceDriveLink = req.body?.evidenceDriveLink || null;
    return buildResponse(res, projectSystemTestService.uploadEvidence(projectId, req.user, fileMeta, { evidenceDriveLink }));
  },

  advisorQueue(req, res) {
    if (req.user.role !== 'teacher' || !req.user.teacherId) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้' });
    }
    const { status } = req.query;
    return buildResponse(res, projectSystemTestService.advisorQueue(req.user.teacherId, { status }));
  },

  async staffQueue(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role === 'admin' || req.user.teacherType === 'support' || req.user.canExportProject1);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้' });
      }
      const { status, search, academicYear, semester, limit, offset } = req.query;

      const result = await projectSystemTestService.staffQueue({
        status,
        search,
        academicYear,
        semester,
        limit,
        offset
      });

      // รองรับทั้งแบบใหม่ (มี data, total) และแบบเดิม (array)
      const dataList = result.data || result;
      const total = result.total !== undefined ? result.total : (Array.isArray(dataList) ? dataList.length : 0);

      return res.json({
        success: true,
        data: dataList,
        total: total
      });
    } catch (error) {
      logger.error('projectSystemTestController error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message || 'ไม่สามารถดำเนินการได้' });
    }
  },

  async exportStaffQueue(req, res) {
    try {
      const isStaff = ['admin', 'teacher'].includes(req.user.role) && (req.user.role === 'admin' || req.user.teacherType === 'support' || req.user.canExportProject1);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ส่งออกข้อมูล' });
      }

      const { status, search, academicYear, semester } = req.query;
      const result = await projectSystemTestService.staffQueue({ status, search, academicYear, semester });
      const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];

      const columns = [
        { header: 'ลำดับ', key: 'order', width: 8 },
        { header: 'ชื่อโครงงาน', key: 'name', width: 45 },
        { header: 'ผู้ยื่นคำขอ', key: 'submitter', width: 30 },
        { header: 'ช่วงทดสอบ', key: 'testPeriod', width: 30 },
        { header: 'สถานะ', key: 'status', width: 20 },
        { header: 'วันที่ยื่น', key: 'submittedAt', width: 20 },
      ];

      const statusLabel = {
        pending_advisor: 'รออาจารย์ที่ปรึกษา',
        pending_staff: 'รอเจ้าหน้าที่',
        staff_approved: 'อนุมัติแล้ว',
        evidence_submitted: 'ส่งหลักฐานแล้ว',
        rejected: 'ปฏิเสธ',
      };

      const dataRows = rows.map((row, idx) => {
        const project = row.projectSnapshot || {};
        const submitter = row.submittedBy || {};
        const start = row.testStartDate || row.testPeriodStart || '';
        const end = row.testDueDate || row.testPeriodEnd || '';
        return {
          order: idx + 1,
          name: project.projectNameTh || '-',
          submitter: submitter.name ? `${submitter.studentCode || ''} ${submitter.name}`.trim() : '-',
          testPeriod: (start || end) ? `${formatThaiDate(start)} - ${formatThaiDate(end)}` : '-',
          status: statusLabel[row.status] || row.status || '-',
          submittedAt: formatThaiDate(row.submittedAt),
        };
      });

      await new ExcelExportBuilder('คิวทดสอบระบบ')
        .addSheet('คิวทดสอบระบบ', columns, dataRows)
        .sendResponse(res);
    } catch (error) {
      logger.error('exportStaffQueue error', { error: error.message });
      if (!res.headersSent) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'ไม่สามารถส่งออกได้' });
      }
    }
  }
};
