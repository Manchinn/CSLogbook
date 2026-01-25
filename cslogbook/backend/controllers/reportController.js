// controllers/reportController.js
// Controller บาง เรียก service แล้วคืน JSON
const reportService = require('../services/reportService');

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
    const data = await reportService.getProjectStatusSummary({ year: req.query.year });
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

// รายชื่อนักศึกษาฝึกงานที่ลงทะเบียน (ลด payload จาก /students ทั้งหมด)
exports.getEnrolledInternshipStudents = async (req, res, next) => {
  try {
    const data = await reportService.getEnrolledInternshipStudents({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
