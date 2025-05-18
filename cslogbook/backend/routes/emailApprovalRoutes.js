'use strict';

const express = require('express');
const router = express.Router();
const emailApprovalController = require('../controllers/logbooks/emailApprovalController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    authenticateToken,
    checkRole,
  } = require("../middleware/authMiddleware");

// Routes สำหรับนักศึกษาส่งคำขออนุมัติ (ต้องล็อกอินเป็นนักศึกษา)
router.post('/request/:studentId', authenticateToken,checkRole(['student']), emailApprovalController.sendApprovalRequest);
router.get('/history/:studentId', authenticateToken,checkRole(['student']), emailApprovalController.getApprovalHistory);

// Routes สำหรับการอนุมัติ/ปฏิเสธผ่านอีเมล (ไม่ต้อง auth เพราะใช้ token แทน)
router.get('/approve/:token', emailApprovalController.approveTimeSheetViaEmail);
router.post('/approve/:token', emailApprovalController.approveTimeSheetViaEmail);

router.get('/reject/:token', emailApprovalController.rejectTimeSheetViaEmail);
router.post('/reject/:token', emailApprovalController.rejectTimeSheetViaEmail);

module.exports = router;