/**
 * Deadline Override Service (Phase 1)
 *
 * Per-student override สำหรับ ImportantDeadline:
 *   - extendedUntil : ขยาย effective deadline เฉพาะรายบุคคล
 *   - bypassLock    : ข้าม lockAfterDeadline (ยังคำนวณ late แต่ไม่บล็อก)
 *
 * Phase 1 ทำเฉพาะ infrastructure (resolve / grant / revoke) ยังไม่มี HTTP endpoint
 * — ใช้จาก wrapper `checkDeadlineStatusForStudent` ใน utils/deadlineChecker เท่านั้น
 *
 * ออกแบบให้ "ปลอดภัยเมื่อยังไม่มีข้อมูล": ถ้าไม่มีแถว override ก็ pass-through ของเดิม
 */

const dayjs = require('dayjs');
const logger = require('../utils/logger');

/**
 * รับ deadline (Sequelize instance หรือ plain) + override → คืน plain object ที่มี
 * fields ที่ใช้ใน checkDeadlineStatus / computeSubmissionStatus โดย apply override
 * - extendedUntil > base+grace → ใช้แทน + grace = 0 (officer cutoff = hard)
 * - bypassLock → lockAfterDeadline=false, allowLate=true
 * เมื่อไม่มี override → คืน plain copy ปกติ (ไม่ mutate ของเดิม)
 */
function applyOverrideToDeadline(deadline, override) {
  if (!deadline) return deadline;
  const base = {
    id: deadline.id,
    name: deadline.name,
    deadlineAt: deadline.deadlineAt,
    gracePeriodMinutes: deadline.gracePeriodMinutes,
    windowStartAt: deadline.windowStartAt,
    windowEndAt: deadline.windowEndAt,
    lockAfterDeadline: deadline.lockAfterDeadline,
    allowLate: deadline.allowLate,
    relatedTo: deadline.relatedTo
  };
  if (!override) return base;

  if (override.extendedUntil) {
    const original = dayjs(base.deadlineAt);
    const baseGrace = base.gracePeriodMinutes
      ? original.add(base.gracePeriodMinutes, 'minute')
      : original;
    const extended = dayjs(override.extendedUntil);
    if (extended.isAfter(baseGrace)) {
      base.deadlineAt = override.extendedUntil;
      base.gracePeriodMinutes = 0;
    }
  }
  if (override.bypassLock) {
    base.lockAfterDeadline = false;
    base.allowLate = true;
  }
  return base;
}

/**
 * เขียน audit log ไปที่ system_logs (table มีอยู่แล้ว, action_type เป็น STRING — ไม่ต้องแก้ schema)
 * ไม่ throw เมื่อ log ล้มเหลว (audit failure ไม่ควรล้ม transaction หลัก)
 */
async function writeAuditLog({ actionType, userId, payload }) {
  try {
    const { SystemLog } = require('../models');
    if (!SystemLog) return;
    await SystemLog.create({
      actionType,
      actionDescription: JSON.stringify(payload || {}),
      userId: userId || null
    });
  } catch (err) {
    logger.warn('writeAuditLog: failed to persist audit row', {
      actionType,
      error: err.message
    });
  }
}

/**
 * @typedef {Object} ResolvedOverride
 * @property {number} studentDeadlineStatusId
 * @property {number} studentId
 * @property {number} importantDeadlineId
 * @property {Date|null} extendedUntil
 * @property {boolean} bypassLock
 * @property {number|null} grantedBy
 * @property {Date} grantedAt
 * @property {string|null} reason
 */

/**
 * คืน active override (ที่ grant แล้ว ยังไม่ revoke และมีอย่างน้อยหนึ่งใน extendedUntil/bypassLock)
 * หรือ null ถ้าไม่มี
 *
 * @param {{ studentId?: number, userId?: number, deadlineId: number }} params
 * @returns {Promise<ResolvedOverride|null>}
 */
async function resolveOverride({ studentId, userId, deadlineId } = {}) {
  if (!deadlineId) return null;

  const { StudentDeadlineStatus, Student } = require('../models');
  if (!StudentDeadlineStatus) return null;

  let resolvedStudentId = studentId;
  if (!resolvedStudentId && userId && Student) {
    try {
      const s = await Student.findOne({
        where: { userId },
        attributes: ['studentId']
      });
      resolvedStudentId = s ? s.get('studentId') : null;
    } catch (err) {
      logger.warn('resolveOverride: failed to look up Student by userId', {
        userId,
        error: err.message
      });
      return null;
    }
  }
  if (!resolvedStudentId) return null;

  let row;
  try {
    row = await StudentDeadlineStatus.findOne({
      where: {
        studentId: resolvedStudentId,
        importantDeadlineId: deadlineId
      }
    });
  } catch (err) {
    // ตาราง/คอลัมน์อาจยังไม่ migrate — fail-open (treat as no override)
    logger.warn('resolveOverride: query failed, treating as no override', {
      studentId: resolvedStudentId,
      deadlineId,
      error: err.message
    });
    return null;
  }

  if (!row) return null;
  if (!row.get('grantedAt')) return null;
  if (row.get('revokedAt')) return null;

  const extendedUntil = row.get('extendedUntil');
  const bypassLock = row.get('bypassLock');
  if (!extendedUntil && !bypassLock) return null;

  return {
    studentDeadlineStatusId: row.get('studentDeadlineStatusId'),
    studentId: row.get('studentId'),
    importantDeadlineId: row.get('importantDeadlineId'),
    extendedUntil: extendedUntil || null,
    bypassLock: Boolean(bypassLock),
    grantedBy: row.get('grantedBy'),
    grantedAt: row.get('grantedAt'),
    reason: row.get('reason')
  };
}

/**
 * อนุมัติ override ให้นักศึกษา 1 ราย
 * - ถ้ายังไม่มีแถว → สร้างใหม่ (status='pending')
 * - ถ้ามีอยู่แล้ว → update เฉพาะ override fields, reset revoked_at
 *
 * @param {Object} params
 * @param {number} params.studentId
 * @param {number} params.deadlineId
 * @param {Date|null} [params.extendedUntil]
 * @param {boolean}  [params.bypassLock]
 * @param {number}   params.grantedBy        userId ของผู้อนุมัติ
 * @param {string|null} [params.reason]
 */
async function grantOverride({
  studentId,
  deadlineId,
  extendedUntil = null,
  bypassLock = false,
  grantedBy,
  reason = null
} = {}) {
  if (!studentId) throw new Error('grantOverride: studentId is required');
  if (!deadlineId) throw new Error('grantOverride: deadlineId is required');
  if (!grantedBy) throw new Error('grantOverride: grantedBy is required');
  if (!extendedUntil && !bypassLock) {
    throw new Error('grantOverride: must provide extendedUntil or bypassLock');
  }

  const { StudentDeadlineStatus } = require('../models');

  const [row] = await StudentDeadlineStatus.findOrCreate({
    where: {
      studentId,
      importantDeadlineId: deadlineId
    },
    defaults: {
      studentId,
      importantDeadlineId: deadlineId,
      status: 'pending'
    }
  });

  await row.update({
    extendedUntil,
    bypassLock: Boolean(bypassLock),
    grantedBy,
    grantedAt: new Date(),
    revokedAt: null,
    reason
  });

  const id = row.get('studentDeadlineStatusId');
  logger.info('Deadline override granted', {
    studentDeadlineStatusId: id,
    studentId,
    deadlineId,
    extendedUntil,
    bypassLock: Boolean(bypassLock),
    grantedBy
  });

  await writeAuditLog({
    actionType: 'DEADLINE_OVERRIDE_GRANTED',
    userId: grantedBy,
    payload: {
      studentDeadlineStatusId: id,
      studentId,
      deadlineId,
      extendedUntil,
      bypassLock: Boolean(bypassLock),
      reason
    }
  });

  return row;
}

/**
 * ยกเลิก override (set revoked_at = now). คืน null ถ้าไม่มี override อยู่
 *
 * @param {Object} params
 * @param {number} params.studentId
 * @param {number} params.deadlineId
 * @param {number} params.revokedBy
 * @param {string|null} [params.reason]
 */
async function revokeOverride({ studentId, deadlineId, revokedBy, reason = null } = {}) {
  if (!studentId || !deadlineId) {
    throw new Error('revokeOverride: studentId and deadlineId are required');
  }
  if (!revokedBy) throw new Error('revokeOverride: revokedBy is required');

  const { StudentDeadlineStatus } = require('../models');
  const row = await StudentDeadlineStatus.findOne({
    where: { studentId, importantDeadlineId: deadlineId }
  });

  if (!row) return null;
  if (!row.get('grantedAt')) return null;
  if (row.get('revokedAt')) return row;

  const newReason = reason
    ? (row.get('reason') ? `${row.get('reason')} | revoked: ${reason}` : `revoked: ${reason}`)
    : row.get('reason');

  await row.update({
    revokedAt: new Date(),
    reason: newReason
  });

  const id = row.get('studentDeadlineStatusId');
  logger.info('Deadline override revoked', {
    studentDeadlineStatusId: id,
    studentId,
    deadlineId,
    revokedBy
  });

  await writeAuditLog({
    actionType: 'DEADLINE_OVERRIDE_REVOKED',
    userId: revokedBy,
    payload: {
      studentDeadlineStatusId: id,
      studentId,
      deadlineId,
      reason
    }
  });

  return row;
}

/**
 * คืนรายการ override ทั้งหมดของ deadline (สำหรับ Officer UI)
 * @param {number} deadlineId
 * @returns {Promise<Array>}
 */
async function listOverridesByDeadline(deadlineId) {
  if (!deadlineId) return [];
  const { StudentDeadlineStatus, Student, User } = require('../models');
  if (!StudentDeadlineStatus) return [];

  const include = [];
  if (Student) {
    const studentInclude = {
      model: Student,
      as: 'student',
      attributes: ['studentId', 'studentCode', 'userId'],
      required: false
    };
    // ชื่อ-นามสกุลอยู่ที่ตาราง users — chain ผ่าน Student.user (ถ้ามี association)
    if (User && Student.associations && Student.associations.user) {
      studentInclude.include = [{
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName'],
        required: false
      }];
    }
    include.push(studentInclude);
  }
  if (User) {
    include.push({
      model: User,
      as: 'grantedByUser',
      attributes: ['userId', 'firstName', 'lastName'],
      required: false
    });
  }

  const rows = await StudentDeadlineStatus.findAll({
    where: { importantDeadlineId: deadlineId },
    include,
    order: [['granted_at', 'DESC']]
  });

  return rows
    .filter((r) => r.get('grantedAt'))
    .map((r) => {
      const studentRow = r.get('student');
      let studentPayload = null;
      if (studentRow) {
        const userRow = studentRow.get ? studentRow.get('user') : studentRow.user;
        studentPayload = {
          studentId: studentRow.get ? studentRow.get('studentId') : studentRow.studentId,
          studentCode: studentRow.get ? studentRow.get('studentCode') : studentRow.studentCode,
          firstName: userRow ? (userRow.get ? userRow.get('firstName') : userRow.firstName) : null,
          lastName: userRow ? (userRow.get ? userRow.get('lastName') : userRow.lastName) : null
        };
      }
      return {
      studentDeadlineStatusId: r.get('studentDeadlineStatusId'),
      studentId: r.get('studentId'),
      student: studentPayload,
      importantDeadlineId: r.get('importantDeadlineId'),
      extendedUntil: r.get('extendedUntil'),
      bypassLock: r.get('bypassLock'),
      grantedBy: r.get('grantedBy'),
      grantedByUser: r.get('grantedByUser') || null,
      grantedAt: r.get('grantedAt'),
      revokedAt: r.get('revokedAt'),
      reason: r.get('reason'),
      isActive: Boolean(r.get('grantedAt')) && !r.get('revokedAt')
        && (Boolean(r.get('extendedUntil')) || Boolean(r.get('bypassLock')))
      };
    });
}

module.exports = {
  resolveOverride,
  grantOverride,
  revokeOverride,
  listOverridesByDeadline,
  applyOverrideToDeadline
};
