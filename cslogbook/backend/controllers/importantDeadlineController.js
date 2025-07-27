const importantDeadlineService = require('../services/importantDeadlineService');

// ดึงกำหนดการสำคัญทั้งหมด (สามารถกรองด้วยปีการศึกษา/ภาคเรียน)
exports.getAll = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    const deadlines = await importantDeadlineService.getAll({ academicYear, semester });
    res.json({ success: true, data: deadlines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// เพิ่มกำหนดการใหม่
exports.create = async (req, res) => {
  try {
    const deadline = await importantDeadlineService.create(req.body);
    res.status(201).json({ success: true, data: deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// แก้ไขกำหนดการ
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const deadline = await importantDeadlineService.update(id, req.body);
    res.json({ success: true, data: deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ลบกำหนดการ
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await importantDeadlineService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 