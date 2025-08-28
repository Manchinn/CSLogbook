const { ImportantDeadline } = require('../models');
const logger = require('../utils/logger');

// Helper: ตรวจว่ามีการเปลี่ยนวัน deadline หรือไม่เพื่อ reset flag การแจ้งเตือน
function handleDateChange(deadlineInstance, newData) {
  if (!newData.date) return {};
  if (deadlineInstance.date && deadlineInstance.date.toString() === newData.date.toString()) return {};
  return { notified: false, criticalNotified: false }; // รีเซ็ตเมื่อเปลี่ยนวันที่
}

// ดึงกำหนดการสำคัญทั้งหมด (สามารถกรองด้วยปีการศึกษา/ภาคเรียน)
exports.getAll = async (filter = {}) => {
  const where = {};
  if (filter.academicYear) where.academicYear = filter.academicYear;
  if (filter.semester) where.semester = filter.semester;
  return ImportantDeadline.findAll({ where, order: [['date', 'ASC']] });
};

// เพิ่มกำหนดการใหม่ (พร้อม validation + normalization + logging)
exports.create = async (data) => {
  const payload = {
    name: data.name?.trim(),
    date: data.date,
    relatedTo: data.relatedTo,
    academicYear: data.academicYear !== undefined ? String(data.academicYear).trim() : undefined,
    semester: data.semester,
    isGlobal: data.isGlobal !== undefined ? !!data.isGlobal : true,
    description: data.description ?? null,
    isCritical: !!data.isCritical,
    acceptingSubmissions: data.acceptingSubmissions !== undefined ? !!data.acceptingSubmissions : true,
    allowLate: data.allowLate !== undefined ? !!data.allowLate : true,
    lockAfterDeadline: data.lockAfterDeadline !== undefined ? !!data.lockAfterDeadline : false,
    gracePeriodMinutes: data.gracePeriodMinutes ?? null
  };

  // Validation พื้นฐาน
  if (!payload.name) throw new Error('ต้องระบุชื่อกำหนดการ (name)');
  if (!payload.date) throw new Error('ต้องระบุวันที่ (date)');
  if (!payload.relatedTo) throw new Error('ต้องระบุ relatedTo');
  if (!['internship','project','general'].includes(payload.relatedTo)) {
    throw new Error('ค่า relatedTo ไม่ถูกต้อง ต้องเป็น internship|project|general');
  }
  if (!payload.academicYear) throw new Error('ต้องระบุ academicYear');
  if (payload.semester === undefined || payload.semester === null) throw new Error('ต้องระบุ semester');

  try {
  const created = await ImportantDeadline.create(payload);
  logger.info('ImportantDeadline created', { id: created.id, name: created.name });
    return created;
  } catch (err) {
    logger.error('Create ImportantDeadline failed', { payload, error: err.message, stack: err.stack });
    throw err;
  }
};

// แก้ไขกำหนดการ
exports.update = async (id, data) => {
  const deadline = await ImportantDeadline.findByPk(id);
  if (!deadline) throw new Error('ไม่พบกำหนดการ');
  const resetFlags = handleDateChange(deadline, data);
  await deadline.update({ ...data, ...resetFlags });
  return deadline;
};

// ลบกำหนดการ
exports.remove = async (id) => {
  const deadline = await ImportantDeadline.findByPk(id);
  if (!deadline) throw new Error('ไม่พบกำหนดการ');
  await deadline.destroy();
}; 

// อัพเดตเฉพาะ policy เปิด/ปิดการรับเอกสาร
exports.updatePolicy = async (id, policy) => {
  const deadline = await ImportantDeadline.findByPk(id);
  if (!deadline) throw new Error('ไม่พบกำหนดการ');
  const allowFields = ['acceptingSubmissions','allowLate','lockAfterDeadline','gracePeriodMinutes'];
  const patch = {};
  for (const k of allowFields) {
    if (policy[k] !== undefined) patch[k] = policy[k];
  }
  await deadline.update(patch);
  return deadline;
};

// สถิติ submission ที่ผูกกับ deadline นี้ (Documents)
exports.getStats = async (id) => {
  const { Document } = require('../models');
  const total = await Document.count({ where: { importantDeadlineId: id } });
  const late = await Document.count({ where: { importantDeadlineId: id, isLate: true } });
  return { total, late, onTime: total - late };
};