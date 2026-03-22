const teacherService = require('../services/teacherService');
const meetingService = require('../services/meetingService');
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

exports.addTeacher = async (req, res) => {
  try {
    const {
      teacherCode,
      firstName,
      lastName,
      email,
      contactExtension,
      position, // รับตำแหน่งจาก body
      canAccessTopicExam,
      canExportProject1
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
      position, // ส่งตำแหน่งไป service
      canAccessTopicExam,
      canExportProject1
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
    const { firstName, lastName, email, contactExtension, position, teacherType, canAccessTopicExam, canExportProject1 } = req.body;

    const result = await teacherService.updateTeacher(id, {
      firstName,
      lastName,
      email,
      contactExtension,
      position,
      teacherType,
      canAccessTopicExam,
      canExportProject1
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

// ดึงข้อมูล dashboard สำหรับอาจารย์สายวิชาการ
exports.getAcademicDashboard = async (req, res) => {
  try {
    const data = await teacherService.getAcademicDashboardOverview(req.user.userId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getAcademicDashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล dashboard'
    });
  }
};

// ดึงคิวบันทึกการพบที่รออาจารย์อนุมัติ
exports.getMeetingApprovalQueue = async (req, res) => {
  try {
    const result = await meetingService.listTeacherMeetingApprovals(req.user, req.query || {});
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in getMeetingApprovalQueue:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงคิวอนุมัติบันทึกการพบ'
    });
  }
};

