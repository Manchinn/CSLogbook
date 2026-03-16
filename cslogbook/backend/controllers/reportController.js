// controllers/reportController.js
// Controller บาง เรียก service แล้วคืน JSON
const reportService = require('../services/reportService');
const { jsonToCsv } = require('../utils/csvExport');

/** Helper: ส่ง CSV response พร้อม BOM */
function sendCsvResponse(res, rows, columns, filename, options) {
  const csv = jsonToCsv(rows, columns, options);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send('\uFEFF' + csv);
}

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
    if (req.query.format === 'csv') {
      const rows = [];
      data.pipeline.forEach(doc => {
        Object.entries(doc.statuses).forEach(([status, count]) => {
          rows.push({ documentType: doc.documentType, documentName: doc.documentName, status, count });
        });
      });
      return sendCsvResponse(res, rows, ['documentType', 'documentName', 'status', 'count'], 'document-pipeline.csv');
    }
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
    if (req.query.format === 'csv') {
      return sendCsvResponse(res, data.supervisors, [
        'companyName', 'supervisorName', 'supervisorEmail', 'studentCount',
        'totalLogs', 'supervisorApprovalRate', 'advisorApprovalRate',
        'evaluationCompletionRate', 'evaluatedStudents'
      ], 'internship-supervisors.csv');
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// รายชื่อนักศึกษาฝึกงานที่ลงทะเบียน (ลด payload จาก /students ทั้งหมด)
exports.getEnrolledInternshipStudents = async (req, res, next) => {
  try {
    const data = await reportService.getEnrolledInternshipStudents({ year: req.query.year });
    if (req.query.format === 'csv') {
      return sendCsvResponse(res, data, [
        'studentCode', 'fullName', 'internshipStatus', 'studentYear',
        'companyName', 'internshipPosition', 'supervisorName', 'startDate', 'endDate'
      ], 'enrolled-internship-students.csv', {
        headers: {
          studentCode: 'รหัสนักศึกษา', fullName: 'ชื่อ-นามสกุล', internshipStatus: 'สถานะ',
          studentYear: 'ชั้นปี', companyName: 'บริษัท', internshipPosition: 'ตำแหน่ง',
          supervisorName: 'พี่เลี้ยง', startDate: 'วันเริ่ม', endDate: 'วันสิ้นสุด'
        }
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
