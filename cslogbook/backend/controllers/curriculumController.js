const { Curriculum } = require("../models");

exports.getCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.findAll();
    res.json({ success: true, data: curriculums });
  } catch (error) {
    console.error("Error fetching curriculums:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching curriculums" });
  }
};

exports.createCurriculum = async (req, res) => {
  try {
    const {
      code,
      name,
      short_name,
      start_year,
      end_year,
      active,
      max_credits,
      total_credits,
      major_credits,
      internship_base_credits,
      project_base_credits,
      project_major_base_credits,
    } = req.body;

    // แปลงข้อมูลจาก snake_case เป็น camelCase
    const newCurriculum = await Curriculum.create({
      code,
      name,
      shortName: short_name,
      startYear: start_year,
      endYear: end_year,
      active,
      maxCredits: max_credits,
      totalCredits: total_credits,
      majorCredits: major_credits,
      internship_base_credits,
      project_base_credits,
      project_major_base_credits,
    });

    res.json({ success: true, data: newCurriculum });
  } catch (error) {
    console.error("Error creating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating curriculum" });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      short_name,
      start_year,
      end_year,
      active,
      max_credits,
      total_credits,
      major_credits,
      internship_base_credits, // รับมาเป็น snake_case
      project_base_credits, // รับมาเป็น snake_case
      project_major_base_credits, // รับมาเป็น snake_case
    } = req.body;

    // แปลงข้อมูลจาก snake_case เป็น camelCase
    const updatedCurriculum = await Curriculum.update(
      {
        code,
        name,
        shortName: short_name,
        startYear: start_year,
        endYear: end_year,
        active,
        maxCredits: max_credits,
        totalCredits: total_credits,
        majorCredits: major_credits,
        internshipBaseCredits: internship_base_credits, // บันทึกเป็น camelCase
        projectBaseCredits: project_base_credits, // บันทึกเป็น camelCase
        projectMajorBaseCredits: project_major_base_credits, // บันทึกเป็น camelCase
      },
      { where: { curriculumId: id } }
    );

    res.json({ success: true, data: updatedCurriculum });
  } catch (error) {
    console.error("Error updating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating curriculum" });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Curriculum.destroy({ where: { curriculum_id: id } });
    if (deleted) {
      res.json({ success: true, message: "ลบหลักสูตรสำเร็จ" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "ไม่พบหลักสูตรที่ต้องการลบ" });
    }
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการลบหลักสูตร" });
  }
};

exports.getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findByPk(id);
    if (!curriculum) {
      return res
        .status(404)
        .json({ success: false, message: "Curriculum not found" });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) {
    console.error("Error fetching curriculum by ID:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching curriculum by ID" });
  }
};

// เพิ่มฟังก์ชันเพื่อดึงหลักสูตรที่ใช้งานอยู่

/**
 * ดึงหลักสูตรที่ใช้งานอยู่ในปัจจุบัน
 */
exports.getActiveCurriculum = async (req, res) => {
  try {
    // ดึงหลักสูตรที่ active = true ล่าสุด
    const activeCurriculum = await Curriculum.findOne({
      where: { active: true },
      order: [['startYear', 'DESC']]
    });

    if (!activeCurriculum) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบหลักสูตรที่ใช้งานอยู่',
      });
    }

    return res.json({
      success: true,
      data: {
        id: activeCurriculum.curriculumId,
        code: activeCurriculum.code,
        name: activeCurriculum.name,
        internshipBaseCredits: activeCurriculum.internshipBaseCredits || 81,
        projectBaseCredits: activeCurriculum.projectBaseCredits || 95,
        projectMajorBaseCredits: activeCurriculum.projectMajorBaseCredits || 47,
      },
    });
  } catch (error) {
    console.error('Error fetching active curriculum:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร',
    });
  }
};
