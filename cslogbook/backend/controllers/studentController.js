const studentService = require("../services/studentService");
const logger = require("../utils/logger");

// ฟังก์ชันดึงข้อมูลนักศึกษาทั้งหมด
exports.getAllStudents = async (req, res, next) => {
  try {

    const filters = {
      search: req.query.search,
      status: req.query.status,
      academicYear: req.query.academicYear,
      semester: req.query.semester,
    };

    const students = await studentService.getAllStudents(filters);

    res.json({
      success: true,
      data: students,
      filters: {
        search: filters.search || null,
        status: filters.status || null,
        academicYear: filters.academicYear || null,
        semester: filters.semester || null,
      },
      message: "ดึงข้อมูลนักศึกษาสำเร็จ",
    });
  } catch (error) {
    logger.error("Error in getAllStudents:", error);
    next(error);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const data = await studentService.getStudentById(req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error("Error in getStudentById:", error);
    
    if (error.message === "ไม่พบข้อมูลนักศึกษา") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
};

// ฟังก์ชันอัพเดทข้อมูลนักศึกษา
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits, firstName, lastName } = req.body;

    const data = await studentService.updateStudent(id, {
      totalCredits,
      majorCredits,
      firstName,
      lastName,
    });

    res.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      data,
    });
  } catch (error) {
    logger.error("Error in updateStudent:", error);

    if (error.message.includes("ไม่พบข้อมูลนักศึกษา")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("หน่วยกิต") ||
      error.message.includes("กรุณา")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classroom, phoneNumber } = req.body;
    
    // ตรวจสอบสิทธิ์การเข้าถึง (ต้องเป็นเจ้าของข้อมูลหรือแอดมิน)
    const userId = req.user.id;
    const student = await studentService.getStudentByIdWithUserId(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }
    
    if (student.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัพเดทข้อมูลนี้'
      });
    }
    
    // เรียกใช้ service แทนการเข้าถึงโมเดลโดยตรง
    const updatedData = await studentService.updateContactInfo(studentId, {
      classroom,
      phoneNumber
    });
    
    return res.status(200).json({
      success: true,
      message: 'อัพเดทข้อมูลติดต่อเรียบร้อยแล้ว',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    
    if (error.message === 'ไม่พบข้อมูลนักศึกษา') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลติดต่อ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await studentService.deleteStudent(id);

    res.json({
      success: true,
      message: "ลบข้อมูลนักศึกษาเรียบร้อย",
      data,
    });
  } catch (error) {
    logger.error("Error in deleteStudent:", error);

    if (error.message === "ไม่พบข้อมูลนักศึกษา") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const {
      studentCode,
      firstName,
      lastName,
      totalCredits = 0,
      majorCredits = 0,
      email,
    } = req.body;

    const data = await studentService.addStudent({
      studentCode,
      firstName,
      lastName,
      totalCredits,
      majorCredits,
      email,
    });

    res.status(201).json({
      success: true,
      message: "เพิ่มข้อมูลนักศึกษาสำเร็จ",
      data,
    });
  } catch (error) {
    logger.error("Error in addStudent:", error);

    if (error.message.includes("ครบถ้วน")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        required: ["studentCode", "firstName", "lastName"],
      });
    }

    if (error.message.includes("มีในระบบแล้ว")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "ข้อมูลซ้ำในระบบ กรุณาตรวจสอบรหัสนักศึกษาหรืออีเมล",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
exports.getAllStudentStats = async (req, res) => {
  try {
    const stats = await studentService.getAllStudentStats();
    res.json(stats);
  } catch (error) {
    logger.error("Error in getAllStudentStats:", error);
    res.status(500).json({ 
      error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      success: false 
    });
  }
};

// เพิ่มฟังก์ชันสำหรับตรวจสอบสิทธิ์นักศึกษาโดยละเอียด
exports.checkStudentEligibility = async (req, res) => {
  try {
    logger.info('Request user info:', req.user);
    
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา (Missing studentId)',
        debug: { user: req.user }
      });
    }
    
    const data = await studentService.checkStudentEligibility(studentId);
    
    res.status(200).json({
      success: true,
      ...data
    });
    
  } catch (error) {
    logger.error('Error in checkStudentEligibility:', error);
    
    if (error.message === 'ไม่พบข้อมูลนักศึกษา') {
      return res.status(404).json({
        success: false,
        message: error.message,
        studentId: req.user?.studentId
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
      error: error.message
    });
  }
};
