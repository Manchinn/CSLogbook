const academicService = require('../services/academicService');
const logger = require('../utils/logger');

// ดึงข้อมูลการตั้งค่าปีการศึกษาปัจจุบัน
exports.getAcademicSettings = async (req, res) => {
  try {
    const settings = await academicService.getCurrentAcademicSettings();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการตั้งค่าปัจจุบัน" });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error("Error fetching academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

// อัปเดตข้อมูลการตั้งค่าปีการศึกษา
exports.updateAcademicSettings = async (req, res) => {
  try {
    // เปลี่ยนจาก req.params เป็น req.body
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ไม่พบ ID ของข้อมูลที่ต้องการอัปเดต" 
      });
    }

    const updated = await academicService.updateAcademicSettings(id, updateData);
    
    res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ", data: updated });
  } catch (error) {
    logger.error("Error updating academic settings:", error);
    
    const statusCode = error.message.includes("ไม่พบข้อมูล") ? 404 : 
                     error.message.includes("ไม่ถูกต้อง") ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      message: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" 
    });
  }
};

// สร้างข้อมูลการตั้งค่าปีการศึกษาใหม่
exports.createAcademicSettings = async (req, res) => {
  try {
    const newSettings = await academicService.createAcademicSettings(req.body);
    
    res.status(201).json({ success: true, data: newSettings });
  } catch (error) {
    logger.error("Error creating academic settings:", error);
    
    // ส่งข้อความข้อผิดพลาดที่ชัดเจนกลับไป
    const statusCode = error.message.includes("ไม่พบหลักสูตร") ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      message: error.message || "เกิดข้อผิดพลาดในการสร้างข้อมูล" 
    });
  }
};

// ลบข้อมูลการตั้งค่าปีการศึกษา
exports.deleteAcademicSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await academicService.deleteAcademicSettings(id);
    
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }
    
    res.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    logger.error("Error deleting academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
};

exports.listAcademicSchedules = async (req, res) => {
  try {
    const schedules = await academicService.listAcademicSchedules({
      status: req.query.status,
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    logger.error("Error listing academic schedules:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "ไม่สามารถดึงรายการปีการศึกษาได้" });
  }
};

exports.getAcademicScheduleById = async (req, res) => {
  try {
    const schedule = await academicService.getAcademicScheduleById(req.params.id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    logger.error("Error fetching academic schedule by ID:", error);
    const statusCode = error.message.includes("ไม่พบข้อมูล") ? 404 : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "ไม่สามารถดึงข้อมูลปีการศึกษาได้" });
  }
};

exports.createAcademicSchedule = async (req, res) => {
  try {
    const schedule = await academicService.createAcademicSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    logger.error("Error creating academic schedule:", error);
    const statusCode = error.message.includes("หลักสูตร") ? 400 : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้างปีการศึกษา" });
  }
};

exports.updateAcademicSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await academicService.updateAcademicSchedule(id, req.body);
    res.json({ success: true, data: schedule });
  } catch (error) {
    logger.error("Error updating academic schedule:", error);
    let statusCode = 500;
    if (error.message.includes("ไม่พบข้อมูล")) statusCode = 404;
    else if (error.message.includes("ไม่สามารถตั้งสถานะ active")) statusCode = 400;
    else if (error.message.includes("ID ไม่ถูกต้อง")) statusCode = 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

exports.activateAcademicSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await academicService.activateAcademicSchedule(id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    logger.error("Error activating academic schedule:", error);
    let statusCode = 500;
    if (error.message.includes("ไม่พบข้อมูล")) statusCode = 404;
    else if (error.message.includes("ID ไม่ถูกต้อง")) statusCode = 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
