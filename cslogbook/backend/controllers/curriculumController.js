const { Curriculum, Academic, sequelize } = require("../models"); // Added Academic and sequelize

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
  const t = await sequelize.transaction();
  try {
    const {
      code,
      name,
      short_name,
      start_year,
      end_year,
      active, // active status from request
      max_credits,
      total_credits,
      major_credits,
      internship_base_credits,
      project_base_credits,
      project_major_base_credits,
    } = req.body;

    // If this new curriculum is set to active, deactivate others
    if (active === true) {
      await Curriculum.update(
        { active: false },
        { where: { active: true }, transaction: t }
      );
    }

    const newCurriculum = await Curriculum.create(
      {
        code,
        name,
        shortName: short_name,
        startYear: start_year,
        endYear: end_year,
        active: active === undefined ? false : active, // Default to false if not provided
        maxCredits: max_credits,
        totalCredits: total_credits,
        majorCredits: major_credits,
        internshipBaseCredits: internship_base_credits, // Corrected to camelCase
        projectBaseCredits: project_base_credits, // Corrected to camelCase
        projectMajorBaseCredits: project_major_base_credits, // Corrected to camelCase
      },
      { transaction: t }
    );

    // If this new curriculum is active, update current academic settings
    if (newCurriculum.active) {
      await Academic.update(
        { activeCurriculumId: newCurriculum.curriculumId },
        { where: { isCurrent: true }, transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ success: true, data: newCurriculum });
  } catch (error) {
    await t.rollback();
    console.error("Error creating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating curriculum" });
  }
};

exports.updateCurriculum = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      code,
      name,
      short_name,
      start_year,
      end_year,
      active, // active status from request
      max_credits,
      total_credits,
      major_credits,
      internship_base_credits,
      project_base_credits,
      project_major_base_credits,
    } = req.body;

    const curriculumToUpdate = await Curriculum.findByPk(id, { transaction: t });
    if (!curriculumToUpdate) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Curriculum not found" });
    }

    // If this curriculum is being set to active, deactivate others
    if (active === true && curriculumToUpdate.active === false) {
      await Curriculum.update(
        { active: false },
        { where: { curriculumId: { [sequelize.Op.ne]: id }, active: true }, transaction: t } // Op.ne for not equal
      );
    }

    const updatedCurriculumData = {
      code,
      name,
      shortName: short_name,
      startYear: start_year,
      endYear: end_year,
      active: active === undefined ? curriculumToUpdate.active : active, // Preserve original if not provided
      maxCredits: max_credits,
      totalCredits: total_credits,
      majorCredits: major_credits,
      internshipBaseCredits: internship_base_credits, // Corrected to camelCase
      projectBaseCredits: project_base_credits, // Corrected to camelCase
      projectMajorBaseCredits: project_major_base_credits, // Corrected to camelCase
    };

    await curriculumToUpdate.update(updatedCurriculumData, { transaction: t });

    // If this curriculum is now active, update current academic settings
    if (curriculumToUpdate.active) {
      await Academic.update(
        { activeCurriculumId: curriculumToUpdate.curriculumId },
        { where: { isCurrent: true }, transaction: t }
      );
    } else {
      // If this curriculum was deactivated and was the active one in academic settings
      const currentAcademicSettings = await Academic.findOne({ where: { isCurrent: true } });
      if (currentAcademicSettings && currentAcademicSettings.activeCurriculumId === curriculumToUpdate.curriculumId) {
        // Set activeCurriculumId to null if the deactivated curriculum was the active one
        // Or, ideally, find another active curriculum. For now, setting to null.
        await Academic.update(
            { activeCurriculumId: null },
            { where: { isCurrent: true }, transaction: t }
        );
      }
    }

    await t.commit();
    // Fetch the updated record to return the latest state including associations if any
    const result = await Curriculum.findByPk(id);
    res.json({ success: true, data: result });

  } catch (error) {
    await t.rollback();
    console.error("Error updating curriculum:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating curriculum" });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Curriculum.destroy({ where: { curriculumId: id } });
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
      order: [["startYear", "DESC"]],
    });

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
    console.error("Error fetching active curriculum:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร",
    });
  }
};
