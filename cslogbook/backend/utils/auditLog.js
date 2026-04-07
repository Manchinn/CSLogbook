/**
 * Audit Log Utility — บันทึก actions ลง SystemLog table
 * ใช้ fire-and-forget (.catch) เพื่อไม่ block business logic
 */

const { SystemLog } = require('../models');
const logger = require('./logger');

/**
 * บันทึก action ลง SystemLog
 * @param {string} actionType - ประเภท (LOGIN, APPROVE_CS05, REJECT_DEFENSE, RECORD_EXAM_RESULT, etc.)
 * @param {string} description - รายละเอียด (Thai)
 * @param {Object} options
 * @param {number} [options.userId] - ผู้ทำ action
 * @param {string} [options.ipAddress] - IP address
 */
function logAction(actionType, description, { userId = null, ipAddress = null } = {}) {
  SystemLog.create({
    actionType,
    actionDescription: description,
    userId,
    ipAddress
  }).catch(err => logger.warn(`[AuditLog] write failed (${actionType}):`, err.message));
}

module.exports = { logAction };
