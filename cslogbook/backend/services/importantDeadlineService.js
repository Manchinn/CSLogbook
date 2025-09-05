const { ImportantDeadline } = require('../models');
const { Op } = require('sequelize');
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
  if (filter.academicYear) {
    const yearNum = parseInt(filter.academicYear, 10);
    if (!isNaN(yearNum)) {
      // สร้างชุดปีทั้งรูปแบบ ค.ศ. และ พ.ศ. เพื่อความยืดหยุ่น (ทนต่อข้อมูลปะปน)
      const adYear = yearNum >= 2500 ? yearNum - 543 : yearNum; // ค.ศ.
      const beYear = yearNum >= 2500 ? yearNum : yearNum + 543; // พ.ศ.
      where.academicYear = { [Op.in]: [String(adYear), String(beYear)] };
    }
  }
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

// แปลงช่วงเวลา (start/end) จาก local date+time -> UTC
function buildWindowFromLocal(startDate, startTime, endDate, endTime, timezone) {
  if (!startDate || !endDate) return {};
  const start = buildDeadlineAtFromLocal(startDate, startTime || '00:00:00', timezone);
  const end = buildDeadlineAtFromLocal(endDate, endTime || '23:59:59', timezone);
  if (end < start) throw new Error('windowEndAt ต้องอยู่หลัง windowStartAt');
  return { windowStartAt: start, windowEndAt: end };
}

// เพิ่มกำหนดการใหม่ (พร้อม validation + normalization + logging) รองรับ deadlineDate + deadlineTime
exports.create = async (data) => {
  // priority: deadlineDate + deadlineTime > deadlineAt > date
  const deadlineDate = data.deadlineDate || data.date; // date legacy (single point)
  const deadlineTime = data.deadlineTime; // HH:mm หรือ HH:mm:ss
  // ฟิลด์ช่วงเวลา (window) สามารถใช้เดี่ยวๆ ได้ (ถ้าไม่ระบุ deadline เดี่ยว)
  const windowStartDate = data.windowStartDate;
  const windowStartTime = data.windowStartTime;
  const windowEndDate = data.windowEndDate;
  const windowEndTime = data.windowEndTime;

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
  // ฟิลด์ใหม่
  if (data.deadlineType) payload.deadlineType = data.deadlineType;
  if (data.isPublished !== undefined) payload.isPublished = !!data.isPublished;
  if (data.publishAt) payload.publishAt = new Date(data.publishAt);
  if (data.visibilityScope) payload.visibilityScope = data.visibilityScope;
  // relatedWorkflow ถูก merge เข้า relatedTo แล้ว (migration 20250829120000) ไม่รับอีกต่อไป
  if (data.allDay !== undefined) payload.allDay = !!data.allDay;

  // Validation พื้นฐาน
  if (!payload.name) throw new Error('ต้องระบุชื่อกำหนดการ (name)');
  if (!deadlineDate && !payload.deadlineAt && !(windowStartDate && windowEndDate)) {
    throw new Error('ต้องระบุ deadlineDate หรือ windowStartDate+windowEndDate');
  }
  if (deadlineTime && !deadlineDate) throw new Error('ระบุเวลา (deadlineTime) ได้ก็ต่อเมื่อมี deadlineDate');
  if (!payload.relatedTo) throw new Error('ต้องระบุ relatedTo');
  if (!['internship','project','project1','project2','general'].includes(payload.relatedTo)) {
    throw new Error('ค่า relatedTo ไม่ถูกต้อง ต้องเป็น internship|project|project1|project2|general');
  }
  // validate ฟิลด์ใหม่เบื้องต้น
  if (payload.deadlineType && !['SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE'].includes(payload.deadlineType)) {
    throw new Error('deadlineType ไม่ถูกต้อง');
  }
  if (payload.visibilityScope && !['ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM'].includes(payload.visibilityScope)) {
    throw new Error('visibilityScope ไม่ถูกต้อง');
  }
  if (!payload.academicYear) throw new Error('ต้องระบุ academicYear');
  if (payload.semester === undefined || payload.semester === null) throw new Error('ต้องระบุ semester');

  try {
    if (deadlineDate) {
      payload.deadlineAt = buildDeadlineAtFromLocal(deadlineDate, deadlineTime, payload.timezone);
    }
    // window มาก่อนจะใช้เป็น default deadlineAt (จุดสิ้นสุด) ถ้าไม่ระบุ deadline เดี่ยว
    if (windowStartDate && windowEndDate) {
      Object.assign(payload, buildWindowFromLocal(windowStartDate, windowStartTime, windowEndDate, windowEndTime, payload.timezone));
      if (!payload.deadlineAt) {
        // ใช้ปลายช่วงเป็น deadline หลัก (windowEndAt)
        payload.deadlineAt = payload.windowEndAt;
        payload.date = windowEndDate; // sync legacy date เพื่อให้ order [['date']] ยังทำงาน
      }
      if (payload.allDay === undefined) payload.allDay = false;
    }
    if (!payload.deadlineAt) {
      throw new Error('ไม่สามารถคำนวณ deadlineAt ได้');
    }
    // กฎตามประเภท: ถ้าไม่ใช่ SUBMISSION ให้ปิด acceptingSubmissions
    if (payload.deadlineType && payload.deadlineType !== 'SUBMISSION') {
      payload.acceptingSubmissions = false;
      // ประเภท ANNOUNCEMENT / MANUAL / MILESTONE ไม่ควร allowLate/lock
      if (payload.deadlineType === 'ANNOUNCEMENT' || payload.deadlineType === 'MANUAL' || payload.deadlineType === 'MILESTONE') {
        payload.allowLate = false;
        payload.lockAfterDeadline = false;
        payload.gracePeriodMinutes = null;
      }
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
  const windowStartDate = incoming.windowStartDate;
  const windowStartTime = incoming.windowStartTime;
  const windowEndDate = incoming.windowEndDate;
  const windowEndTime = incoming.windowEndTime;
  if (incoming.allDay !== undefined) incoming.allDay = !!incoming.allDay;

  if (incoming.deadlineAt) {
    incoming.deadlineAt = new Date(incoming.deadlineAt);
  }
  if (incoming.publishAt) incoming.publishAt = new Date(incoming.publishAt);

  // ฟิลด์ใหม่ validate
  if (incoming.deadlineType && !['SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE'].includes(incoming.deadlineType)) {
    throw new Error('deadlineType ไม่ถูกต้อง');
  }
  if (incoming.visibilityScope && !['ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM'].includes(incoming.visibilityScope)) {
    throw new Error('visibilityScope ไม่ถูกต้อง');
  }
  if (incoming.relatedTo && !['internship','project','project1','project2','general'].includes(incoming.relatedTo)) {
    throw new Error('relatedTo ไม่ถูกต้อง');
  }
  // relatedWorkflow validation ไม่จำเป็นแล้วหลัง merge

  if (deadlineDate) {
    const tz = incoming.timezone || deadline.timezone || 'Asia/Bangkok';
    incoming.deadlineAt = buildDeadlineAtFromLocal(deadlineDate, deadlineTime, tz);
    incoming.date = deadlineDate;
  } else if (!incoming.deadlineAt && incoming.date && !deadline.deadlineAt) {
    const local = new Date(`${incoming.date}T23:59:59+07:00`);
    incoming.deadlineAt = new Date(local.toISOString());
  }
  if (windowStartDate && windowEndDate) {
    Object.assign(incoming, buildWindowFromLocal(windowStartDate, windowStartTime, windowEndDate, windowEndTime, incoming.timezone || deadline.timezone || 'Asia/Bangkok'));
    if (!incoming.deadlineAt) {
      incoming.deadlineAt = incoming.windowEndAt; // ตั้งค่า deadline หลักเป็นปลายช่วง
      incoming.date = windowEndDate; // sync legacy
    }
  }

  const resetFlags = handleDateChange(deadline, incoming);

  // กฎเมื่อเปลี่ยนประเภท: ถ้าเปลี่ยนเป็น non-SUBMISSION ต้อง disable policy ที่เกี่ยวข้อง
  if (incoming.deadlineType && incoming.deadlineType !== 'SUBMISSION') {
    incoming.acceptingSubmissions = false;
    incoming.allowLate = false;
    incoming.lockAfterDeadline = false;
    incoming.gracePeriodMinutes = null;
  }

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