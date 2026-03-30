// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');
const logger = require('../utils/logger');
const { stringify } = require('node:querystring');
const { ExcelExportBuilder } = require('../utils/excelExportBuilder');

// helper: flatten project -> member rows (หนึ่งสมาชิกต่อหนึ่งแถว)
// คอลัมน์: หัวข้อ, รหัสนักศึกษา, ชื่อ-นามสกุล, หมายเหตุ
// กรองเฉพาะโครงงานที่พร้อม Export (readyForExport = true)
function flattenProjects(projects){
  const rows = [];
  for (const p of projects) {
    // ตรวจสอบว่าโครงงานพร้อม Export หรือไม่
    if (!p.readiness?.readyForExport) {
      continue; // ข้ามโครงงานที่ไม่พร้อม
    }

    if(!p.members || p.members.length === 0){
      continue; // ข้ามโครงงานที่ไม่มีสมาชิก
    }
    
    p.members.forEach(m => {
      rows.push({
        titleTh: p.titleTh || '',
        studentCode: m.studentCode || '',
        studentName: m.name || '',
        remark: m.remark || ''
      });
    });
  }
  return rows;
}

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
    const { data } = await topicExamService.getTopicOverview(req.query);

    const pending = data.filter(
      (p) => p.readiness?.readyForExport && !p.examResult && p.members?.length > 0
    );
    pending.sort((a, b) => (a.titleTh || '').localeCompare(b.titleTh || '', 'th-TH'));

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
    const { data } = await topicExamService.getTopicOverview(req.query);

    const withResults = data.filter((p) => p.examResult && p.members?.length > 0);
    withResults.sort((a, b) => (a.titleTh || '').localeCompare(b.titleTh || '', 'th-TH'));

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
