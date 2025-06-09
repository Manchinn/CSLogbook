const express = require('express');
const router = express.Router();
const notificationSettingsController = require('../controllers/notificationSettingsController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.get('/', 
    authenticateToken, 
    checkRole(['admin']), 
    notificationSettingsController.getAllNotificationSettings
);

// เปิด/ปิดการแจ้งเตือน (เฉพาะ admin)
router.put('/toggle', 
    authenticateToken, 
    checkRole(['admin']), 
    notificationSettingsController.toggleNotification
);

// เปิดการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.put('/enable-all', 
    authenticateToken, 
    checkRole(['admin']), 
    notificationSettingsController.enableAllNotifications
);

// ปิดการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.put('/disable-all', 
    authenticateToken, 
    checkRole(['admin']), 
    notificationSettingsController.disableAllNotifications
);

module.exports = router;