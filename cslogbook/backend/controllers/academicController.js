const { Academic } = require("../models");

// ดึงข้อมูลการตั้งค่าปีการศึกษา
exports.getAcademicSettings = async (req, res) => {
  try {
    const settings = await Academic.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการตั้งค่า" });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

/* exports.getCurriculumMappings = async (req, res) => {
  try {
    const mappings = await Curriculum.findAll(); // สมมติว่ามี Model ชื่อ CurriculumMapping
    res.json({ success: true, data: mappings });
  } catch (error) {
    console.error("Error fetching curriculum mappings:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching curriculum mappings" });
  }
}; */

// อัปเดตข้อมูลการตั้งค่าปีการศึกษา
exports.updateAcademicSettings = async (req, res) => {
  try {
    const { id, semesters, ...rest } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }

    // แปลงข้อมูล semesters เป็นฟิลด์ที่ตรงกับ Model
    const updatedData = {
      ...rest,
      semester1Range: semesters?.["1"]?.range || null,
      semester2Range: semesters?.["2"]?.range || null,
      semester3Range: semesters?.["3"]?.range || null,
    };

    const updated = await Academic.update(updatedData, { where: { id } });
    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการตั้งค่า" });
    }

    res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating academic settings:", error);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
};

// สร้างข้อมูลการตั้งค่าปีการศึกษาใหม่
exports.createAcademicSettings = async (req, res) => {
  try {
    const newSettings = await Academic.create(req.body);
    res.json({ success: true, data: newSettings });
  } catch (error) {
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
