const teacherService = require('../services/teacherService');
const logger = require('../utils/logger');

// ดึงรายการอาจารย์ (advisors list) สำหรับนักศึกษาเลือกเป็นที่ปรึกษา
// เปิดเฉพาะข้อมูลจำเป็น ลด payload
exports.getAdvisorList = async (req, res) => {
  try {
    // เพิ่ม filter เฉพาะ teacherType = academic (ถ้ามี field นี้ในระบบ)
    const teachers = await teacherService.getAllTeachers({ onlyAcademic: true });
    const data = teachers.map(t => ({
      teacherId: t.teacherId,
      teacherCode: t.teacherCode,
      firstName: t.firstName,
      lastName: t.lastName,
      position: t.position || null,
      teacherType: t.teacherType || null
    }));
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getAdvisorList:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงรายชื่ออาจารย์ที่ปรึกษาได้' });
  }
};

exports.getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await teacherService.getAllTeachers();

    res.json({
      success: true,
      data: teachers,
      message: 'ดึงข้อมูลอาจารย์สำเร็จ'
    });
  } catch (error) {
    logger.error('Error in getAllTeachers:', error);
    next(error);
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    // รองรับการเรียกด้วย 'me' เพื่อดึงข้อมูลจาก userId ของ token
    if (id === 'me') {
      const data = await teacherService.getTeacherByUserId(req.user.userId);
      return res.json({ success: true, data });
    }

    // หากผู้เรียกเป็นอาจารย์ ให้ใช้ userId จาก token เป็นหลัก
    if (req.user?.role === 'teacher') {
      const data = await teacherService.getTeacherByUserId(req.user.userId);
      return res.json({ success: true, data });
    }

    const data = await teacherService.getTeacherById(id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getTeacherById:', error);
    
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

// สำหรับดึงข้อมูลอาจารย์ของผู้ใช้ที่ล็อกอินอยู่
exports.getMyTeacherProfile = async (req, res) => {
  try {
    const data = await teacherService.getTeacherByUserId(req.user.userId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getMyTeacherProfile:', error);
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

exports.getTeacherByUserId = async (req, res) => {
  try {
    const data = await teacherService.getTeacherByUserId(req.params.userId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getTeacherByUserId:', error);
    
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

exports.addTeacher = async (req, res) => {
  try {
    const {
      teacherCode,
      firstName,
      lastName,
      email,
      contactExtension,
      position // รับตำแหน่งจาก body
    } = req.body;

    if (!teacherCode || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        required: ['teacherCode', 'firstName', 'lastName']
      });
    }

    const result = await teacherService.addTeacher({
      teacherCode,
      firstName,
      lastName,
      email,
      contactExtension,
      position // ส่งตำแหน่งไป service
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลอาจารย์สำเร็จ',
      data: result
    });

  } catch (error) {
    logger.error('Error in addTeacher:', error);

    if (error.message === 'รหัสอาจารย์นี้มีในระบบแล้ว') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('ข้อมูลซ้ำในระบบ')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, contactExtension, position } = req.body;

    const result = await teacherService.updateTeacher(id, {
      firstName,
      lastName,
      email,
      contactExtension,
      position // ส่งตำแหน่งไป service
    });

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ',
      data: result
    });

  } catch (error) {
    logger.error('Error in updateTeacher:', error);
    
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('ข้อมูลไม่ถูกต้อง')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await teacherService.deleteTeacher(id);

    res.json({
      success: true,
      message: 'ลบข้อมูลอาจารย์เรียบร้อย',
      data: result
    });

  } catch (error) {
    logger.error('Error in deleteTeacher:', error);
    
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAdvisees = async (req, res) => {
  try {
    const { id } = req.params;

    const advisees = await teacherService.getAdvisees(id);

    res.json({
      success: true,
      data: advisees,
      message: 'ดึงข้อมูลนักศึกษาในที่ปรึกษาสำเร็จ'
    });

  } catch (error) {
    logger.error('Error in getAdvisees:', error);
    
    if (error.message === 'ไม่พบข้อมูลอาจารย์') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษาในที่ปรึกษา',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ฟังก์ชันสำหรับอาจารย์สายวิชาการ (Academic)
exports.getAcademicDashboard = async (req, res) => {
  try {
    // TODO: เพิ่มลอจิกสำหรับ dashboard ของอาจารย์สายวิชาการ
    res.json({
      success: true,
      message: 'Dashboard สำหรับอาจารย์สายวิชาการ',
      data: {
        pendingEvaluations: 0,
        activeStudents: 0,
        recentActivities: []
      }
    });
  } catch (error) {
    logger.error('Error in getAcademicDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล dashboard'
    });
  }
};

exports.submitEvaluation = async (req, res) => {
  try {
    const { studentId, evaluationData } = req.body;
    
    // TODO: เพิ่มลอจิกสำหรับการส่งการประเมินผล
    res.json({
      success: true,
      message: 'ส่งการประเมินผลสำเร็จ',
      data: { studentId, evaluationData }
    });
  } catch (error) {
    logger.error('Error in submitEvaluation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งการประเมินผล'
    });
  }
};

// ฟังก์ชันสำหรับเจ้าหน้าที่ภาควิชา (Support)
exports.getSupportDashboard = async (req, res) => {
  try {
    // TODO: เพิ่มลอจิกสำหรับ dashboard ของเจ้าหน้าที่ภาควิชา
    res.json({
      success: true,
      message: 'Dashboard สำหรับเจ้าหน้าที่ภาควิชา',
      data: {
        totalStudents: 0,
        totalTeachers: 0,
        pendingApprovals: 0,
        systemStats: {}
      }
    });
  } catch (error) {
    logger.error('Error in getSupportDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล dashboard'
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    
    // TODO: เพิ่มลอจิกสำหรับการสร้างประกาศ
    res.json({
      success: true,
      message: 'สร้างประกาศสำเร็จ',
      data: { title, content, targetAudience }
    });
  } catch (error) {
    logger.error('Error in createAnnouncement:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างประกาศ'
    });
  }
};

// ฟังก์ชันที่ทั้งสองประเภทเข้าถึงได้
exports.getDocuments = async (req, res) => {
  try {
    // TODO: เพิ่มลอจิกสำหรับการดึงเอกสาร
    res.json({
      success: true,
      message: 'ดึงข้อมูลเอกสารสำเร็จ',
      data: {
        documents: [],
        totalCount: 0
      }
    });
  } catch (error) {
    logger.error('Error in getDocuments:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร'
    });
  }
};