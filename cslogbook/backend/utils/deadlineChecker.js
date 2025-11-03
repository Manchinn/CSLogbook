/**
 * Shared Deadline Checking Utilities
 * 
 * Utility functions สำหรับตรวจสอบ deadline ที่ใช้ร่วมกันระหว่าง:
 * - Project deadline enforcement
 * - Internship deadline enforcement
 * - อื่นๆ ในอนาคต
 */

const dayjs = require('dayjs');
const logger = require('./logger');

/**
 * ตรวจสอบว่าเลย deadline หรือไม่ และควรทำอย่างไร
 * @param {Object} deadline - ImportantDeadline record
 * @param {Object} context - บริบทสำหรับ logging { type, id, userId }
 * @returns {Object} { allowed, isLate, response, metadata }
 */
function checkDeadlineStatus(deadline, context = {}) {
  if (!deadline) {
    return {
      allowed: true,
      isLate: false,
      response: null,
      metadata: { reason: 'no_deadline_defined' }
    };
  }

  const now = dayjs();
  let effectiveDeadline = dayjs(deadline.deadlineAt);

  // เพิ่ม grace period (ถ้ามี)
  if (deadline.gracePeriodMinutes) {
    effectiveDeadline = effectiveDeadline.add(deadline.gracePeriodMinutes, 'minute');
  }

  // ตรวจสอบ submission window - ยังไม่เปิด
  if (deadline.windowStartAt) {
    const windowStart = dayjs(deadline.windowStartAt);
    if (now.isBefore(windowStart)) {
      logger.warn(`Deadline: Submission too early`, {
        ...context,
        windowStartAt: deadline.windowStartAt,
        deadlineName: deadline.name
      });

      return {
        allowed: false,
        isLate: false,
        response: {
          status: 403,
          body: {
            success: false,
            error: 'ยังไม่ถึงเวลาเปิดให้ยื่นเอกสาร',
            message: `เปิดให้ยื่นเอกสารตั้งแต่วันที่ ${windowStart.format('DD/MM/YYYY HH:mm')}`,
            code: 'WINDOW_NOT_OPEN',
            details: {
              windowStartAt: deadline.windowStartAt,
              deadlineName: deadline.name
            }
          }
        },
        metadata: { reason: 'window_not_open', windowStartAt: deadline.windowStartAt }
      };
    }
  }

  // ตรวจสอบ submission window - ปิดแล้ว
  if (deadline.windowEndAt) {
    const windowEnd = dayjs(deadline.windowEndAt);
    if (now.isAfter(windowEnd)) {
      logger.warn(`Deadline: Submission window closed`, {
        ...context,
        windowEndAt: deadline.windowEndAt,
        deadlineName: deadline.name
      });

      return {
        allowed: false,
        isLate: true,
        response: {
          status: 403,
          body: {
            success: false,
            error: 'หมดช่วงเวลายื่นเอกสารแล้ว',
            message: `ช่วงเวลายื่นเอกสารสิ้นสุดเมื่อ ${windowEnd.format('DD/MM/YYYY HH:mm')}`,
            code: 'WINDOW_CLOSED',
            details: {
              windowEndAt: deadline.windowEndAt,
              deadlineName: deadline.name
            }
          }
        },
        metadata: { reason: 'window_closed', windowEndAt: deadline.windowEndAt }
      };
    }
  }

  // ตรวจสอบว่าเลย deadline หรือไม่
  if (now.isAfter(effectiveDeadline)) {
    const minutesLate = now.diff(effectiveDeadline, 'minute');

    if (deadline.lockAfterDeadline) {
      // ล็อก - ไม่อนุญาตให้ดำเนินการ
      logger.warn(`Deadline: Submission blocked - deadline passed`, {
        ...context,
        deadlineName: deadline.name,
        deadlineAt: deadline.deadlineAt,
        effectiveDeadline: effectiveDeadline.toISOString(),
        minutesLate
      });

      return {
        allowed: false,
        isLate: true,
        response: {
          status: 403,
          body: {
            success: false,
            error: 'หมดเวลายื่นเอกสารแล้ว',
            message: `หมดเวลายื่น "${deadline.name}" แล้ว (${effectiveDeadline.format('DD/MM/YYYY HH:mm')})`,
            code: 'DEADLINE_PASSED',
            details: {
              deadlineName: deadline.name,
              deadlineAt: deadline.deadlineAt,
              effectiveDeadline: effectiveDeadline.toISOString(),
              gracePeriodMinutes: deadline.gracePeriodMinutes,
              allowLate: deadline.allowLate,
              lockAfterDeadline: deadline.lockAfterDeadline,
              minutesLate
            }
          }
        },
        metadata: { 
          reason: 'deadline_passed_locked',
          minutesLate,
          effectiveDeadline: effectiveDeadline.toISOString()
        }
      };
    } else if (!deadline.allowLate) {
      // เตือนแต่ยังให้ผ่าน (soft warning)
      logger.info(`Deadline: Late submission allowed`, {
        ...context,
        deadlineName: deadline.name,
        minutesLate
      });

      return {
        allowed: true,
        isLate: true,
        response: null,
        metadata: {
          reason: 'late_but_allowed',
          minutesLate,
          deadlineInfo: {
            name: deadline.name,
            deadlineAt: deadline.deadlineAt,
            effectiveDeadline: effectiveDeadline.toISOString(),
            minutesLate
          }
        }
      };
    }
  }

  // ผ่านการตรวจสอบทั้งหมด - ไม่สาย
  logger.debug(`Deadline: Check passed - on time`, {
    ...context,
    deadlineName: deadline.name
  });

  return {
    allowed: true,
    isLate: false,
    response: null,
    metadata: {
      reason: 'on_time',
      applicableDeadline: {
        id: deadline.id,
        name: deadline.name,
        deadlineAt: deadline.deadlineAt,
        effectiveDeadline: effectiveDeadline.toISOString(),
        documentSubtype: deadline.documentSubtype
      }
    }
  };
}

/**
 * สร้าง Express middleware response จากผลการตรวจสอบ deadline
 * @param {Object} checkResult - ผลจาก checkDeadlineStatus()
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
function handleDeadlineCheckResult(checkResult, req, res, next) {
  if (!checkResult.allowed) {
    // Block request
    return res.status(checkResult.response.status).json(checkResult.response.body);
  }

  // เพิ่ม metadata เข้า request object
  req.deadlineChecked = true;

  if (checkResult.isLate && checkResult.metadata.deadlineInfo) {
    req.isLateSubmission = true;
    req.deadlineInfo = checkResult.metadata.deadlineInfo;
  }

  if (checkResult.metadata.applicableDeadline) {
    req.applicableDeadline = checkResult.metadata.applicableDeadline;
  }

  next();
}

/**
 * สร้าง Sequelize order clause สำหรับการค้นหา deadline
 * ให้ความสำคัญกับ deadline ที่ระบุ documentSubtype เฉพาะก่อน
 * @param {string} documentSubtype - ประเภทเอกสาร
 * @returns {Array} Sequelize order array
 */
function buildDeadlineOrderClause(documentSubtype) {
  const sequelize = require('sequelize');
  return [
    // ให้ความสำคัญกับ deadline ที่ระบุ documentSubtype เฉพาะก่อน
    [sequelize.literal(`CASE WHEN documentSubtype = '${documentSubtype}' THEN 0 ELSE 1 END`), 'ASC'],
    ['deadlineAt', 'DESC']
  ];
}

module.exports = {
  checkDeadlineStatus,
  handleDeadlineCheckResult,
  buildDeadlineOrderClause
};
