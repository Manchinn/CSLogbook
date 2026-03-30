// controllers/reportController.js
// Controller บาง เรียก service แล้วคืน JSON
const reportService = require('../services/reportService');
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await reportService.getOverview({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getInternshipLogbookCompliance = async (req, res, next) => {
  try {
    const data = await reportService.getInternshipLogbookCompliance({ year: req.query.year, semester: req.query.semester });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getProjectStatusSummary = async (req, res, next) => {
  try {
    const data = await reportService.getProjectStatusSummary({ year: req.query.year, semester: req.query.semester });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAdvisorLoad = async (req, res, next) => {
  try {
    const data = await reportService.getAdvisorLoad({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// รายการปีการศึกษาที่มีข้อมูลฝึกงาน
exports.getInternshipAcademicYears = async (req, res, next) => {
  try {
    const data = await reportService.getInternshipAcademicYears();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// รายการปีการศึกษาที่มีข้อมูลโครงงาน
exports.getProjectAcademicYears = async (req, res, next) => {
  try {
    const data = await reportService.getProjectAcademicYears();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Enhanced: ดึงรายละเอียดอาจารย์คนหนึ่ง
exports.getAdvisorDetail = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const data = await reportService.getAdvisorDetail(teacherId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
 
 exports.getInternshipStudentSummary = async (req, res, next) => {
   try {
     const data = await reportService.getInternshipStudentSummary({ year: req.query.year, semester: req.query.semester });
     res.json({ success: true, data });
   } catch (err) {
     next(err);
   }
 };
 
 exports.getInternshipEvaluationSummary = async (req, res, next) => {
   try {
     const data = await reportService.getInternshipEvaluationSummary({ year: req.query.year, semester: req.query.semester });
     res.json({ success: true, data });
   } catch (err) {
     next(err);
   }
 };

// Document Pipeline Report — สถิติเอกสารแยกตามประเภท + สถานะ
exports.getDocumentPipeline = async (req, res, next) => {
  try {
    const data = await reportService.getDocumentPipeline({
      year: req.query.year,
      semester: req.query.semester,
      documentType: req.query.documentType
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Internship Supervisor Report — สถิติพี่เลี้ยงและบริษัทฝึกงาน
exports.getInternshipSupervisorReport = async (req, res, next) => {
  try {
    const data = await reportService.getInternshipSupervisorReport({
      year: req.query.year,
      semester: req.query.semester
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// รายชื่อนักศึกษาฝึกงานที่ลงทะเบียน (ลด payload จาก /students ทั้งหมด)
exports.getEnrolledInternshipStudents = async (req, res, next) => {
  try {
    const data = await reportService.getEnrolledInternshipStudents({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// === Excel Export Endpoints ===

exports.exportEnrolledStudents = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getEnrolledInternshipStudents({ year, semester });

    const STATUS_MAP = {
      not_started: 'ยังไม่เริ่ม',
      in_progress: 'อยู่ระหว่างฝึกงาน',
      completed: 'เสร็จสิ้น',
      withdrawn: 'ถอน',
    };

    const columns = [
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
      { header: 'ชื่อ-นามสกุล', key: 'fullName', width: 25 },
      { header: 'ชั้นปี', key: 'studentYear', width: 8 },
      { header: 'สถานะ', key: 'internshipStatus', width: 18 },
      { header: 'บริษัท', key: 'companyName', width: 30 },
      { header: 'ตำแหน่ง', key: 'internshipPosition', width: 25 },
      { header: 'พี่เลี้ยง', key: 'supervisorName', width: 20 },
      { header: 'อีเมลพี่เลี้ยง', key: 'supervisorEmail', width: 25 },
      { header: 'วันเริ่ม', key: 'startDate', width: 18 },
      { header: 'วันสิ้นสุด', key: 'endDate', width: 18 },
      { header: 'จำนวน Logbook', key: 'logCount', width: 14 },
      { header: 'ชั่วโมงรวม', key: 'totalHours', width: 12 },
      { header: 'Logbook พี่เลี้ยงอนุมัติ', key: 'logSupervisorApproved', width: 22 },
      { header: 'Logbook อ.อนุมัติ', key: 'logAdvisorApproved', width: 18 },
      { header: 'ประเมินแล้ว', key: 'evaluated', width: 12 },
      { header: 'คะแนนรวม', key: 'overallScore', width: 12 },
      { header: 'ผ่าน/ไม่ผ่าน', key: 'passFail', width: 12 },
      { header: 'ส่งสรุปผล', key: 'reflectionSubmitted', width: 12 },
      { header: 'ใบรับรอง', key: 'certificateStatus', width: 12 },
    ];

    const rows = data.map((s) => ({
      studentCode: s.studentCode || '-',
      fullName: s.fullName || '-',
      studentYear: s.studentYear || '-',
      internshipStatus: STATUS_MAP[s.internshipStatus] || s.internshipStatus || '-',
      companyName: s.companyName || '-',
      internshipPosition: s.internshipPosition || '-',
      supervisorName: s.supervisorName || '-',
      supervisorEmail: s.supervisorEmail || '-',
      startDate: formatThaiDate(s.startDate),
      endDate: formatThaiDate(s.endDate),
      logCount: s.logCount ?? 0,
      totalHours: s.totalHours ?? 0,
      logSupervisorApproved: s.logSupervisorApproved ?? 0,
      logAdvisorApproved: s.logAdvisorApproved ?? 0,
      evaluated: s.evaluated ? 'ใช่' : 'ไม่',
      overallScore: s.overallScore ?? '-',
      passFail: s.passFail || '-',
      reflectionSubmitted: s.reflectionSubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
      certificateStatus: s.certificateStatus || '-',
    }));

    await new ExcelExportBuilder('รายงานฝึกงาน')
      .addSheet('นักศึกษาฝึกงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportProjectReport = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getProjectStatusSummary({ year, semester });
    const projects = data.projects || data || [];

    const columns = [
      { header: 'ชื่อโครงงาน', key: 'projectTitle', width: 45 },
      { header: 'สถานะ', key: 'status', width: 18 },
      { header: 'นักศึกษา', key: 'members', width: 35 },
      { header: 'ที่ปรึกษา', key: 'advisorName', width: 25 },
    ];

    const rows = projects.map((p) => ({
      projectTitle: p.projectTitle || p.projectNameTh || '-',
      status: p.statusLabel || p.status || '-',
      members: (p.members || []).map(m => `${m.studentCode} ${m.name}`).join(', '),
      advisorName: p.advisorName || '-',
    }));

    await new ExcelExportBuilder('รายงานโครงงาน')
      .addSheet('โครงงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportDocumentPipeline = async (req, res, next) => {
  try {
    const { year, semester, documentType } = req.query;
    const data = await reportService.getDocumentPipeline({ year, semester, documentType });

    const STATUS_MAP = {
      pending: 'รอดำเนินการ',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      revising: 'แก้ไข',
    };

    const columns = [
      { header: 'ประเภท', key: 'documentType', width: 15 },
      { header: 'ชื่อเอกสาร', key: 'documentName', width: 30 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'จำนวน', key: 'count', width: 10 },
    ];

    const rows = [];
    (data.pipeline || []).forEach((doc) => {
      Object.entries(doc.statuses || {}).forEach(([status, count]) => {
        rows.push({
          documentType: doc.documentType === 'INTERNSHIP' ? 'ฝึกงาน' : 'โครงงาน',
          documentName: doc.documentName || '-',
          status: STATUS_MAP[status] || status,
          count,
        });
      });
    });

    await new ExcelExportBuilder('Document-Pipeline')
      .addSheet('Document Pipeline', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportSupervisorReport = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getInternshipSupervisorReport({ year, semester });

    const columns = [
      { header: 'บริษัท', key: 'companyName', width: 30 },
      { header: 'พี่เลี้ยง', key: 'supervisorName', width: 20 },
      { header: 'อีเมลพี่เลี้ยง', key: 'supervisorEmail', width: 25 },
      { header: 'จำนวน นศ.', key: 'studentCount', width: 12 },
      { header: 'Logbook ทั้งหมด', key: 'totalLogs', width: 15 },
      { header: 'พี่เลี้ยงอนุมัติ (%)', key: 'supervisorApprovalRate', width: 18 },
      { header: 'ประเมินครบ (%)', key: 'evaluationCompletionRate', width: 16 },
      { header: 'ประเมินแล้ว (คน)', key: 'evaluatedStudents', width: 16 },
    ];

    const rows = (data.supervisors || []).map((s) => ({
      companyName: s.companyName || '-',
      supervisorName: s.supervisorName || '-',
      supervisorEmail: s.supervisorEmail || '-',
      studentCount: s.studentCount ?? 0,
      totalLogs: s.totalLogs ?? 0,
      supervisorApprovalRate: s.supervisorApprovalRate ?? 0,
      evaluationCompletionRate: s.evaluationCompletionRate ?? 0,
      evaluatedStudents: s.evaluatedStudents ?? 0,
    }));

    await new ExcelExportBuilder('รายงานพี่เลี้ยง')
      .addSheet('พี่เลี้ยงฝึกงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};
