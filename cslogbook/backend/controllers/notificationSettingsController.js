const notificationSettingsService = require('../services/notificationSettingsService');
const logger = require('../utils/logger');

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด
exports.getAllNotificationSettings = async (req, res) => {
    try {
        const settings = await notificationSettingsService.getAllSettings(false);
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Error fetching notification settings', { error });
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าการแจ้งเตือน'
        });
    }
};

// เปิด/ปิดการแจ้งเตือน
exports.toggleNotification = async (req, res) => {
    try {
        const { type, enabled } = req.body;
        
        if (!type || enabled === undefined) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุประเภทและสถานะการแจ้งเตือนให้ครบถ้วน'
            });
        }

        // ตรวจสอบว่า type ถูกต้อง
        const validTypes = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
        if (!validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'ประเภทการแจ้งเตือนไม่ถูกต้อง'
            });
        }

        // ตรวจสอบสิทธิ์ admin
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        await notificationSettingsService.updateNotificationSetting(type, enabled, req.user.id);

        return res.status(200).json({
            success: true,
            message: `${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type} เรียบร้อยแล้ว`,
            data: { type, enabled }
        });
    } catch (error) {
        logger.error('Error toggling notification', { error, type: req.body.type });
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการตั้งค่าการแจ้งเตือน'
        });
    }
};

// เปิดการแจ้งเตือนทั้งหมด
exports.enableAllNotifications = async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        await notificationSettingsService.enableAllNotifications(req.user.id);

        return res.status(200).json({
            success: true,
            message: 'เปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว'
        });
    } catch (error) {
        logger.error('Error enabling all notifications', { error });
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือนทั้งหมด'
        });
    }
};

// ปิดการแจ้งเตือนทั้งหมด
exports.disableAllNotifications = async (req, res) => {
    try {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'คุณไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        await notificationSettingsService.disableAllNotifications(req.user.id);

        return res.status(200).json({
            success: true,
            message: 'ปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว'
        });
    } catch (error) {
        logger.error('Error disabling all notifications', { error });
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการปิดการแจ้งเตือนทั้งหมด'
        });
    }
};