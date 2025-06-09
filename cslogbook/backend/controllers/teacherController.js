const teacherService = require('../services/teacherService');
const logger = require('../utils/logger');

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
    const data = await teacherService.getTeacherById(req.params.id);

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
      contactExtension
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
      contactExtension
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
    const { firstName, lastName, email, contactExtension } = req.body;

    const result = await teacherService.updateTeacher(id, {
      firstName,
      lastName,
      email,
      contactExtension
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