const express = require('express');
const router = express.Router();
const notificationSettingsController = require('../controllers/notificationSettingsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.get('/', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    notificationSettingsController.getAllNotificationSettings
);

// เปิด/ปิดการแจ้งเตือน (เฉพาะ admin)
router.put('/toggle', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    notificationSettingsController.toggleNotification
);

// เปิดการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.put('/enable-all', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    notificationSettingsController.enableAllNotifications
);

// ปิดการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.put('/disable-all', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    notificationSettingsController.disableAllNotifications
);

module.exports = router;