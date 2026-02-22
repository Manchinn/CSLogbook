const express = require('express');
const router = express.Router();
const notificationSettingsController = require('../controllers/notificationSettingsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.get('/', 
    authenticateToken, 
    authorize('notificationSettings', 'manage'),
    notificationSettingsController.getAllNotificationSettings
);

// เปิด/ปิดการแจ้งเตือน (admin และ teacher support)
router.put('/toggle', 
    authenticateToken, 
    authorize('notificationSettings', 'manage'),
    notificationSettingsController.toggleNotification
);

// เปิดการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.put('/enable-all', 
    authenticateToken, 
    authorize('notificationSettings', 'manage'),
    notificationSettingsController.enableAllNotifications
);

// ปิดการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.put('/disable-all', 
    authenticateToken, 
    authorize('notificationSettings', 'manage'),
    notificationSettingsController.disableAllNotifications
);

module.exports = router;
