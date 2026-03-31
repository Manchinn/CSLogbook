/**
 * meetingService.js — Thin facade re-exporting all meeting sub-modules.
 *
 * ไฟล์นี้เป็น backward-compatible wrapper เพื่อให้ controller ที่ require('./meetingService')
 * ยังใช้งานได้เหมือนเดิมโดยไม่ต้องเปลี่ยน import path
 *
 * Implementation ถูกแยกไปอยู่ใน:
 *   ./meeting/meetingSerializer.js     — serialize helpers + notification
 *   ./meeting/meetingCoreService.js    — CRUD meetings + access control
 *   ./meeting/meetingLogService.js     — CRUD meeting logs
 *   ./meeting/meetingApprovalService.js — log approval + teacher approval queue
 */

const core = require('./meeting/meetingCoreService');
const log = require('./meeting/meetingLogService');
const approval = require('./meeting/meetingApprovalService');
const serializer = require('./meeting/meetingSerializer');

module.exports = {
  ...core,
  ...log,
  ...approval,
  ...serializer
};
