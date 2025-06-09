'use strict';

const express = require('express');
const router = express.Router();
const emailApprovalController = require('../controllers/logbooks/emailApprovalController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    authenticateToken,
    checkRole,
  } = require("../middleware/authMiddleware");

// Routes สำหรับดึงข้อมูลการอนุมัติ
router.get('/details/:token', emailApprovalController.getApprovalDetails);

// Routes สำหรับนักศึกษาส่งคำขออนุมัติ (ต้องล็อกอินเป็นนักศึกษา)
router.post('/request/:studentId', authenticateToken, checkRole(['student']), emailApprovalController.sendApprovalRequest);

// ===============================
// Routes สำหรับ Email Links (HTML responses) - สำหรับคลิกจากอีเมล
// ===============================
router.get('/email/approve/:token', emailApprovalController.approveTimeSheetViaEmail);
router.post('/email/approve/:token', emailApprovalController.approveTimeSheetViaEmail);
router.get('/email/reject/:token', emailApprovalController.rejectTimeSheetViaEmail);
router.post('/email/reject/:token', emailApprovalController.rejectTimeSheetViaEmail);

// ===============================
// Routes สำหรับ Web Component (JSON responses) - สำหรับ TimesheetApproval component
// ===============================
router.post('/web/approve/:token', emailApprovalController.approveTimesheetViaWeb);
router.post('/web/reject/:token', emailApprovalController.rejectTimesheetViaWeb);

module.exports = router;