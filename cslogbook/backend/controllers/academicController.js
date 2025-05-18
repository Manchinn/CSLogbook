const { Academic, Curriculum, sequelize } = require("../models"); // Added Curriculum and sequelize

// ดึงข้อมูลการตั้งค่าปีการศึกษาปัจจุบัน
exports.getAcademicSettings = async (req, res) => {
  try {
    const settings = await Academic.findOne({ where: { isCurrent: true } }); // Find where isCurrent is true
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการตั้งค่าปัจจุบัน" });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

// อัปเดตข้อมูลการตั้งค่าปีการศึกษา
exports.updateAcademicSettings = async (req, res) => {
  const t = await sequelize.transaction(); // Start a transaction
  try {
    const { id } = req.params; // Get id from params
    const { activeCurriculumId, isCurrent, semesters, ...rest } = req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }

    // Validate activeCurriculumId if provided
    if (activeCurriculumId) {
      const curriculum = await Curriculum.findOne({
        where: { curriculumId: activeCurriculumId, active: true },
      });
      if (!curriculum) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "ไม่พบหลักสูตรที่ใช้งาน (active) หรือ ID หลักสูตรไม่ถูกต้อง",
        });
      }
    }

    // If isCurrent is being set to true, set all others to false
    if (isCurrent === true) {
      await Academic.update(
        { isCurrent: false },
        { where: { id: { [sequelize.Op.ne]: id } }, transaction: t } // Op.ne for not equal
      );
    }

    // Prepare update data
    const updatedData = { ...rest, activeCurriculumId, isCurrent }; // Include activeCurriculumId and isCurrent

    if (semesters) {
      if (semesters["1"] && semesters["1"].range !== undefined) { // Check for undefined explicitly
        updatedData.semester1Range = semesters["1"].range;
      }
      if (semesters["2"] && semesters["2"].range !== undefined) {
        updatedData.semester2Range = semesters["2"].range;
      }
      if (semesters["3"] && semesters["3"].range !== undefined) {
        updatedData.semester3Range = semesters["3"].range;
      }
    }


    const [updatedCount] = await Academic.update(updatedData, {
      where: { id },
      transaction: t,
    });

    if (updatedCount === 0) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการตั้งค่าที่จะอัปเดต" });
    }

    await t.commit(); // Commit the transaction
    res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    await t.rollback(); // Rollback on error
    console.error("Error updating academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
};

// สร้างข้อมูลการตั้งค่าปีการศึกษาใหม่
exports.createAcademicSettings = async (req, res) => {
  const t = await sequelize.transaction(); // Start a transaction
  try {
    const { activeCurriculumId, isCurrent, ...restOfBody } = req.body;

    // Validate activeCurriculumId if provided
    if (activeCurriculumId) {
      const curriculum = await Curriculum.findOne({
        where: { curriculumId: activeCurriculumId, active: true },
      });
      if (!curriculum) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "ไม่พบหลักสูตรที่ใช้งาน (active) หรือ ID หลักสูตรไม่ถูกต้อง",
        });
      }
    }

    // If isCurrent is true, set all other records to isCurrent = false
    if (isCurrent === true) {
      await Academic.update(
        { isCurrent: false },
        { where: {}, transaction: t } // Update all existing records
      );
    }

    const newSettings = await Academic.create(
      { ...restOfBody, activeCurriculumId, isCurrent: isCurrent === undefined ? false : isCurrent }, // Default isCurrent to false if not provided
      { transaction: t }
    );

    await t.commit(); // Commit the transaction
    res.status(201).json({ success: true, data: newSettings });
  } catch (error) {
    await t.rollback(); // Rollback on error
    console.error("Error creating academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
};

// ลบข้อมูลการตั้งค่าปีการศึกษา
exports.deleteAcademicSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Academic.destroy({ where: { id } });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }
    res.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error deleting academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
};
