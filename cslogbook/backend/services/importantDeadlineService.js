const { ImportantDeadline } = require('../models');

// ดึงกำหนดการสำคัญทั้งหมด (สามารถกรองด้วยปีการศึกษา/ภาคเรียน)
exports.getAll = async (filter = {}) => {
  const where = {};
  if (filter.academicYear) where.academicYear = filter.academicYear;
  if (filter.semester) where.semester = filter.semester;
  return ImportantDeadline.findAll({ where, order: [['date', 'ASC']] });
};

// เพิ่มกำหนดการใหม่
exports.create = async (data) => {
  // validate data ตาม schema
  return ImportantDeadline.create(data);
};

// แก้ไขกำหนดการ
exports.update = async (id, data) => {
  const deadline = await ImportantDeadline.findByPk(id);
  if (!deadline) throw new Error('ไม่พบกำหนดการ');
  await deadline.update(data);
  return deadline;
};

// ลบกำหนดการ
exports.remove = async (id) => {
  const deadline = await ImportantDeadline.findByPk(id);
  if (!deadline) throw new Error('ไม่พบกำหนดการ');
  await deadline.destroy();
}; 