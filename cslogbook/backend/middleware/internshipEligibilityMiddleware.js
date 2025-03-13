const { Student } = require('../models');

exports.checkInternshipEligibility = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.userId }
    });

    if (!student?.isEligibleInternship) {
      return res.status(403).json({
        success: false,
        message: 'นักศึกษายังไม่มีสิทธิ์ยื่นเอกสารฝึกงาน (หน่วยกิตไม่เพียงพอ)'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};