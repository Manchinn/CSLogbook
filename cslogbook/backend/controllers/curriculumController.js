const curriculumService = require('../services/curriculumService');
const logger = require('../utils/logger');

exports.getCurriculums = async (req, res) => {
  try {
    const curriculums = await curriculumService.getAllCurriculums();
    res.json({ success: true, data: curriculums });
  } catch (error) {
    logger.error("Error fetching curriculums:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร" });
  }
};

exports.createCurriculum = async (req, res) => {
  try {
    const newCurriculum = await curriculumService.createCurriculum(req.body);
    
    res.status(201).json({ success: true, data: newCurriculum });
  } catch (error) {
    logger.error("Error creating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้างหลักสูตร" });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedCurriculum = await curriculumService.updateCurriculum(id, req.body);
    
    if (!updatedCurriculum) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลหลักสูตรที่ต้องการแก้ไข" });
    }
    
    res.json({ success: true, data: updatedCurriculum });
  } catch (error) {
    logger.error("Error updating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการอัปเดตหลักสูตร" });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await curriculumService.deleteCurriculum(id);
    
    if (deleted) {
      res.json({ success: true, message: "ลบหลักสูตรสำเร็จ" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "ไม่พบหลักสูตรที่ต้องการลบ" });
    }
  } catch (error) {
    logger.error("Error deleting curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการลบหลักสูตร" });
  }
};

exports.getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await curriculumService.getCurriculumById(id);
    
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลหลักสูตร" });
    }
    
    res.json({ success: true, data: curriculum });
  } catch (error) {
    logger.error("Error fetching curriculum by ID:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร" });
  }
};

// เพิ่มฟังก์ชันเพื่อดึงหลักสูตรที่ใช้งานอยู่

/**
 * ดึงหลักสูตรที่ใช้งานอยู่ในปัจจุบัน
 */
exports.getActiveCurriculum = async (req, res) => {
  try {
    const activeCurriculum = await curriculumService.getActiveCurriculum();

    if (!activeCurriculum) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบหลักสูตรที่ใช้งานอยู่",
      });
    }

    return res.json({
      success: true,
      data: {
        id: activeCurriculum.curriculumId,
        code: activeCurriculum.code,
        name: activeCurriculum.name,
        internshipBaseCredits: activeCurriculum.internshipBaseCredits,
        projectBaseCredits: activeCurriculum.projectBaseCredits,
        projectMajorBaseCredits: activeCurriculum.projectMajorBaseCredits,
      },
    });
  } catch (error) {
    logger.error("Error fetching active curriculum:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร",
    });
  }
};
