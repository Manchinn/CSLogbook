const express = require('express');
const router = express.Router();
const notificationSettingsController = require('../controllers/notificationSettingsController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.get('/', 
    authenticateToken, 
    checkRole(['admin', 'teacher']), 
    checkTeacherType(['support']),
    notificationSettingsController.getAllNotificationSettings
);

// เปิด/ปิดการแจ้งเตือน (admin และ teacher support)
router.put('/toggle', 
    authenticateToken, 
    checkRole(['admin', 'teacher']), 
    checkTeacherType(['support']),
    notificationSettingsController.toggleNotification
);

// เปิดการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.put('/enable-all', 
    authenticateToken, 
    checkRole(['admin', 'teacher']), 
    checkTeacherType(['support']),
    notificationSettingsController.enableAllNotifications
);

// ปิดการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.put('/disable-all', 
    authenticateToken, 
    checkRole(['admin', 'teacher']), 
    checkTeacherType(['support']),
    notificationSettingsController.disableAllNotifications
);

module.exports = router;