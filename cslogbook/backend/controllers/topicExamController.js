// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');
const logger = require('../utils/logger');
const { stringify } = require('node:querystring');

// helper: flatten project -> member rows (ซ้ำโครงหัวข้อเหมือนตาราง UI)
function flattenProjects(projects){
  const rows = [];
  for (const p of projects){
    // Logic เดียวกับ frontend: bilingual / csb => โครงการสองภาษา (CSB) มิฉะนั้นโครงงานภาคปกติ
    const trackLower = (p.track || '').toLowerCase();
    const remark = (trackLower.includes('bilingual') || trackLower.includes('csb')) ? 'โครงการสองภาษา (CSB)' : 'โครงงานภาคปกติ';
    if(!p.members || p.members.length===0){
      rows.push({ titleTh: p.titleTh, studentCode: '', studentName: '', remark });
      continue;
    }
    p.members.forEach(m=>{
      rows.push({
        titleTh: p.titleTh,
        studentCode: m.studentCode || '',
        studentName: m.name || '',
        remark
      });
    });
  }
  return rows;
}

exports.getOverview = async (req, res, next) => {
  try {
    const data = await topicExamService.getTopicOverview(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/topic-exam/export?format=csv|xlsx (default csv)
exports.exportOverview = async (req,res,next)=>{
  const format = (req.query.format||'csv').toLowerCase();
  try {
    const data = await topicExamService.getTopicOverview(req.query);
    const rows = flattenProjects(data);
    const filenameBase = `topic_exam_overview_${Date.now()}`;
    if (format==='xlsx') {
      // Lazy require exceljs เพื่อไม่ block ถ้าไม่ใช้ฟีเจอร์นี้
      const ExcelJS = require('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Overview');
      ws.columns = [
        { header: 'หัวข้อ', key: 'titleTh', width: 50 },
        { header: 'รหัสนักศึกษา', key: 'studentCode', width: 18 },
        { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 28 },
        { header: 'หมายเหตุ', key: 'remark', width: 18 }
      ];
      rows.forEach(r=> ws.addRow(r));
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filenameBase}.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    } else {
      // CSV
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filenameBase}.csv`);
      // UTF-8 BOM เพื่อให้ Excel เปิดภาษาไทยไม่เพี้ยน
      res.write('\uFEFF');
      res.write('หัวข้อ,รหัสนักศึกษา,ชื่อ-นามสกุล,หมายเหตุ\n');
      for (const r of rows){
        const esc = v => '"' + (v||'').replace(/"/g,'""') + '"';
        res.write([esc(r.titleTh), esc(r.studentCode), esc(r.studentName), esc(r.remark)].join(',')+'\n');
      }
      res.end();
    }
  } catch (err) {
    logger.error(`[TopicExam] export error: ${err.message}`);
    next(err);
  }
};
