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
    const { Student, User } = require('../models');
    // ฟังก์ชันคำนวณชั้นปีแบบ dynamic จากรหัสนักศึกษา (สองหลักแรกเป็นปี พ.ศ. - 2500)
    // yearParam (พ.ศ.) มาจาก query ?year= ถ้าไม่มีก็ใช้ปีปัจจุบัน (พ.ศ.)
    const buddhistYear = () => new Date().getFullYear() + 543;
    const selectedYear = parseInt(req.query.year, 10) || buddhistYear();
    const calcStudentYear = (studentCode) => {
      if (!studentCode || studentCode.length < 2) return null;
      const yy = parseInt(studentCode.substring(0,2),10); // สมมติ 64 หมายถึง 2564
      if (isNaN(yy)) return null;
      const admissionYear = 2500 + yy; // แปลงเป็นปี พ.ศ.
      const year = selectedYear - admissionYear + 1; // ชั้นปี = ปีปัจจุบัน - ปีที่เข้า + 1
      return year < 1 ? 1 : (year > 8 ? 8 : year); // clamp 1..8
    };
    const rows = await Student.findAll({
      where: { is_enrolled_internship: true },
      // ไม่อ้างอิง student_year แล้ว เพราะไม่มีคอลัมน์ใน DB
      attributes: ['studentId','studentCode','internshipStatus','advisor_id','is_enrolled_internship'],
      include: [{ model: User, as: 'user', attributes: ['firstName','lastName'] }],
      order: [['studentCode','ASC']]
    });
    // map รวมชื่อให้ frontend ใช้ง่าย
    const mapped = rows.map(r => ({
      studentId: r.studentId,
      studentCode: r.studentCode,
      internshipStatus: r.internshipStatus,
      advisorId: r.advisor_id,
      isEnrolledInternship: r.is_enrolled_internship,
      studentYear: calcStudentYear(r.studentCode), // คำนวณสด
      firstName: r.user?.firstName || '',
      lastName: r.user?.lastName || ''
    }));
    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
};
