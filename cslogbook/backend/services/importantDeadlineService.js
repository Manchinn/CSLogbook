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

// Helper: ปรับรูปแบบเวลาให้เป็น HH:mm:ss (เพิ่ม :00 ถ้าขาดวินาที)
function normalizeTimeString(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length === 2) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}:00`;
  if (parts.length === 3) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}:${parts[2].padStart(2,'0')}`;
  return null; // รูปแบบไม่ถูกต้อง
}

// แปลง date + time (local) เป็น Date UTC
function buildDeadlineAtFromLocal(dateStr, timeStr, timezone) {
  if (!dateStr) return undefined;
  const time = normalizeTimeString(timeStr) || '23:59:59';
  // ตอนนี้รองรับเฉพาะ Asia/Bangkok (+07:00)
  if (timezone && timezone !== 'Asia/Bangkok') {
    throw new Error('ยังไม่รองรับ timezone อื่น นอกจาก Asia/Bangkok');
  }
  const localIso = `${dateStr}T${time}+07:00`;
  const d = new Date(localIso);
  if (isNaN(d.getTime())) throw new Error('รูปแบบวันที่หรือเวลาไม่ถูกต้อง');
  return new Date(d.toISOString()); // UTC
}

// เพิ่มกำหนดการใหม่ (พร้อม validation + normalization + logging) รองรับ deadlineDate + deadlineTime
exports.create = async (data) => {
  // priority: deadlineDate + deadlineTime > deadlineAt > date
  const deadlineDate = data.deadlineDate || data.date; // date legacy
  const deadlineTime = data.deadlineTime; // HH:mm หรือ HH:mm:ss

  const payload = {
    name: data.name?.trim(),
    date: deadlineDate, // เก็บ legacy
    deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : undefined,
    relatedTo: data.relatedTo,
    academicYear: data.academicYear !== undefined ? String(data.academicYear).trim() : undefined,
    semester: data.semester,
    isGlobal: data.isGlobal !== undefined ? !!data.isGlobal : true,
    description: data.description ?? null,
    isCritical: !!data.isCritical,
    acceptingSubmissions: data.acceptingSubmissions !== undefined ? !!data.acceptingSubmissions : true,
    allowLate: data.allowLate !== undefined ? !!data.allowLate : true,
    lockAfterDeadline: data.lockAfterDeadline !== undefined ? !!data.lockAfterDeadline : false,
    gracePeriodMinutes: data.gracePeriodMinutes ?? null,
    timezone: data.timezone || 'Asia/Bangkok'
  };

  // Validation พื้นฐาน
  if (!payload.name) throw new Error('ต้องระบุชื่อกำหนดการ (name)');
  if (!deadlineDate && !payload.deadlineAt) throw new Error('ต้องระบุ deadlineDate หรือ deadlineAt');
  if (deadlineTime && !deadlineDate) throw new Error('ระบุเวลา (deadlineTime) ได้ก็ต่อเมื่อมี deadlineDate');
  if (!payload.relatedTo) throw new Error('ต้องระบุ relatedTo');
  if (!['internship','project','general'].includes(payload.relatedTo)) {
    throw new Error('ค่า relatedTo ไม่ถูกต้อง ต้องเป็น internship|project|general');
  }
  if (!payload.academicYear) throw new Error('ต้องระบุ academicYear');
  if (payload.semester === undefined || payload.semester === null) throw new Error('ต้องระบุ semester');

  try {
    if (deadlineDate) {
      // ถ้าให้ local date/time ให้ override deadlineAt (priority สูงสุด)
      payload.deadlineAt = buildDeadlineAtFromLocal(deadlineDate, deadlineTime, payload.timezone);
    } else if (!payload.deadlineAt) {
      throw new Error('ไม่สามารถคำนวณ deadlineAt ได้');
    }
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
  const incoming = { ...data };
  const deadlineDate = incoming.deadlineDate || incoming.date; // รองรับชื่อใหม่
  const deadlineTime = incoming.deadlineTime;

  if (incoming.deadlineAt) {
    incoming.deadlineAt = new Date(incoming.deadlineAt);
  }

  if (deadlineDate) {
    // ถ้ามีการส่ง deadlineDate เข้ามา ให้คำนวณ deadlineAt ใหม่ (override)
    const tz = incoming.timezone || deadline.timezone || 'Asia/Bangkok';
    incoming.deadlineAt = buildDeadlineAtFromLocal(deadlineDate, deadlineTime, tz);
    incoming.date = deadlineDate; // sync legacy
  } else if (!incoming.deadlineAt && incoming.date && !deadline.deadlineAt) {
    // กรณี legacy: ให้ date แต่ไม่ได้ให้ deadlineAt และยังไม่มีใน row
    const local = new Date(`${incoming.date}T23:59:59+07:00`);
    incoming.deadlineAt = new Date(local.toISOString());
  }

  const resetFlags = handleDateChange(deadline, incoming);
  await deadline.update({ ...incoming, ...resetFlags });
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