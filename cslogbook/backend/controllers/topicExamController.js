// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');
const logger = require('../utils/logger');
const { stringify } = require('node:querystring');

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

// GET /api/projects/topic-exam/export (XLSX only)
// Export เฉพาะโครงงานที่มีข้อมูลครบถ้วน (หัวข้อ, รหัสนักศึกษา, ชื่อ-นามสกุล, ห้องเรียน)
exports.exportOverview = async (req,res,next)=>{
  try {
    const { data } = await topicExamService.getTopicOverview(req.query);
    const rawRows = flattenProjects(data);
    
    // จัดเรียงตามหัวข้อโครงงาน
    rawRows.sort((a,b)=>{
      return (a.titleTh || '').localeCompare(b.titleTh || '', 'th-TH');
    });
    
    // สร้างลำดับใหม่หลัง sort
    const rows = rawRows.map((r, idx) => ({ order: idx + 1, ...r }));
    
    const filenameBase = `รายชื่อหัวข้อโครงงานพิเศษ_${Date.now()}`;
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('รายชื่อหัวข้อโครงงานพิเศษ');
    
    // คอลัมน์ตามที่ต้องการ: หัวข้อ, รหัสนักศึกษา, ชื่อ-นามสกุล, หมายเหตุ
    ws.columns = [
      { header: 'ลำดับ', key: 'order', width: 8 },
      { header: 'หัวข้อโครงงาน', key: 'titleTh', width: 50 },
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 18 },
      { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 30 },
      { header: 'หมายเหตุ', key: 'remark', width: 40 }
    ];
    
    rows.forEach(r=> ws.addRow(r));
    
    // จัดรูปแบบ header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filenameBase)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error(`[TopicExam] export error: ${err.message}`);
    next(err);
  }
};
