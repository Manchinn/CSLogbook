// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');
const { EXAM_RESULT_FILTER } = topicExamService;

// sort config shared by both export endpoints
const EXPORT_SORT = { sortBy: 'titleTh', order: 'asc' };
const logger = require('../utils/logger');
const { stringify } = require('node:querystring');
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');


exports.getOverview = async (req, res, next) => {
  try {
    const { data, total, meta } = await topicExamService.getTopicOverview(req.query);
    res.json({ 
      success: true, 
      count: data.length, // จำนวนรายการที่ส่งกลับมา (current page)
      total: total || data.length, // จำนวนรายการทั้งหมด (สำหรับ pagination)
      data, 
      meta 
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/topic-exam/export-list (XLSX)
// Export รายชื่อสอบ — เฉพาะโครงงาน readyForExport + รอบันทึกผล (examResult = null)
// ใช้ก่อนสอบ เพื่อจัดห้องสอบ
exports.exportExamList = async (req, res, next) => {
  try {
    logger.info(`[TopicExam] export-list request user=${req.user?.userId}`);
    const { data } = await topicExamService.getTopicOverview({
      ...req.query,
      ...EXPORT_SORT,
      examResultFilter: EXAM_RESULT_FILTER.PENDING,
    });

    // readyForExport is computed from multiple fields — cannot be pushed to DB level
    const pending = data.filter(
      (p) => p.readiness?.readyForExport && p.members?.length > 0
    );

    const rows = [];
    pending.forEach((p) => {
      p.members.forEach((m, idx) => {
        rows.push({
          order: rows.length + 1,
          titleTh: idx === 0 ? (p.titleTh || '-') : '',
          studentCode: m.studentCode || '-',
          studentName: m.name || '-',
          classroom: m.classroom || '-',
          advisor: idx === 0 ? (p.advisor?.name || '-') : '',
        });
      });
    });

    const columns = [
      { header: 'ลำดับ', key: 'order', width: 8 },
      { header: 'หัวข้อโครงงาน', key: 'titleTh', width: 50 },
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 18 },
      { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 30 },
      { header: 'ห้องเรียน', key: 'classroom', width: 12 },
      { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 30 },
    ];

    await new ExcelExportBuilder('รายชื่อสอบหัวข้อโครงงาน')
      .addSheet('รายชื่อสอบ', columns, rows)
      .sendResponse(res);
  } catch (err) {
    logger.error(`[TopicExam] export-list error: ${err.message}`);
    next(err);
  }
};

// GET /api/projects/topic-exam/export-results (XLSX)
// Export ผลสอบ — เฉพาะโครงงานที่บันทึกผลแล้ว (examResult != null)
// ใช้หลังสอบ เพื่อประกาศผล
exports.exportExamResults = async (req, res, next) => {
  try {
    logger.info(`[TopicExam] export-results request user=${req.user?.userId}`);
    const { data } = await topicExamService.getTopicOverview({
      ...req.query,
      ...EXPORT_SORT,
      examResultFilter: EXAM_RESULT_FILTER.WITH_RESULTS,
    });

    const withResults = data.filter((p) => p.members?.length > 0);

    const RESULT_LABEL = { passed: 'ผ่าน', failed: 'ไม่ผ่าน' };

    const rows = [];
    withResults.forEach((p) => {
      p.members.forEach((m, idx) => {
        rows.push({
          order: rows.length + 1,
          titleTh: idx === 0 ? (p.titleTh || '-') : '',
          studentCode: m.studentCode || '-',
          studentName: m.name || '-',
          examResult: idx === 0 ? (RESULT_LABEL[p.examResult] || p.examResult) : '',
          failReason: idx === 0 ? (p.examFailReason || '-') : '',
          recordedAt: idx === 0 ? formatThaiDate(p.examResultAt) : '',
        });
      });
    });

    const columns = [
      { header: 'ลำดับ', key: 'order', width: 8 },
      { header: 'หัวข้อโครงงาน', key: 'titleTh', width: 50 },
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 18 },
      { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 30 },
      { header: 'ผลสอบ', key: 'examResult', width: 12 },
      { header: 'เหตุผล', key: 'failReason', width: 40 },
      { header: 'วันที่บันทึก', key: 'recordedAt', width: 20 },
    ];

    await new ExcelExportBuilder('ผลสอบหัวข้อโครงงาน')
      .addSheet('ผลสอบ', columns, rows)
      .sendResponse(res);
  } catch (err) {
    logger.error(`[TopicExam] export-results error: ${err.message}`);
    next(err);
  }
};
