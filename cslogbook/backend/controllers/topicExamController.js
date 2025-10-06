// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');
const logger = require('../utils/logger');
const { stringify } = require('node:querystring');

// helper: flatten project -> member rows (หนึ่งสมาชิกต่อหนึ่งแถว)
// คอลัมน์: หัวข้อ, รหัสนักศึกษา, ชื่อ-นามสกุล, ผลการสอบ, อาจารย์ที่ปรึกษา, เหตุผล(ไม่ผ่าน)
function flattenProjects(projects){
  const rows = [];
  for (const p of projects) {
    const examResult = p.examResult === 'passed' ? 'ผ่าน' : (p.examResult === 'failed' ? 'ไม่ผ่าน' : '');
    const advisorDisplay = (p.examResult === 'passed')
      ? [p.advisor?.name || '', p.coAdvisor?.name || ''].filter(Boolean).join('/')
      : ''; // แสดงเฉพาะตอนผ่าน
    const failedReason = p.examResult === 'failed' ? (p.examFailReason || '') : '';

    if(!p.members || p.members.length === 0){
      rows.push({
        titleTh: p.titleTh || '',
        studentCode: '',
        studentName: '',
        examResult,
        advisorDisplay,
        failedReason
      });
      continue;
    }
    p.members.forEach(m => rows.push({
      titleTh: p.titleTh || '',
      studentCode: m.studentCode || '',
      studentName: m.name || '',
      examResult,
      advisorDisplay,
      failedReason
    }));
  }
  return rows;
}

exports.getOverview = async (req, res, next) => {
  try {
    const { data, meta } = await topicExamService.getTopicOverview(req.query);
    res.json({ success: true, count: data.length, data, meta });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/topic-exam/export (XLSX only)
exports.exportOverview = async (req,res,next)=>{
  try {
    const { data } = await topicExamService.getTopicOverview(req.query);
    const rawRows = flattenProjects(data);
    // จัดเรียงตามผลการสอบ: ผ่าน -> ไม่ผ่าน -> ว่าง
    const rank = { 'ผ่าน': 0, 'ไม่ผ่าน': 1, '': 2 };
    rawRows.sort((a,b)=>{
      const ra = rank[a.examResult] ?? 3;
      const rb = rank[b.examResult] ?? 3;
      if (ra !== rb) return ra - rb;
      // รองเรียงตามหัวข้อเพื่อความสม่ำเสมอ (ไม่บังคับ)
      return (a.titleTh || '').localeCompare(b.titleTh || '', 'th-TH');
    });
    // สร้างลำดับใหม่หลัง sort
    const rows = rawRows.map((r, idx) => ({ order: idx + 1, ...r }));
    const filenameBase = `Topic_exam_overview_${Date.now()}`;
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Overview');
    ws.columns = [
      { header: 'ลำดับ', key: 'order', width: 8 },
      { header: 'หัวข้อ', key: 'titleTh', width: 50 },
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 18 },
      { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 28 },
      { header: 'ผลการสอบ', key: 'examResult', width: 14 },
      { header: 'อาจารย์ที่ปรึกษา', key: 'advisorDisplay', width: 40 },
      { header: 'เหตุผล(ไม่ผ่าน)', key: 'failedReason', width: 50 }
    ];
    rows.forEach(r=> ws.addRow(r));
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filenameBase}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error(`[TopicExam] export error: ${err.message}`);
    next(err);
  }
};
