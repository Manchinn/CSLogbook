const notificationSettingsService = require('../services/notificationSettingsService');
const logger = require('../utils/logger');

/**
 * ดึงการตั้งค่าการแจ้งเตือนทั้งหมด
 */
exports.getAllNotificationSettings = async (req, res) => {
    try {
        logger.info('รับคำขอดึงการตั้งค่าการแจ้งเตือนทั้งหมด', {
            adminUserId: req.user?.userId || req.user?.id, // แก้ไขการเข้าถึง userId
            adminUsername: req.user?.username,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });

        const settings = await notificationSettingsService.getAllSettings();
        
        logger.info('ส่งการตั้งค่าการแจ้งเตือนกลับไปยัง client สำเร็จ', {
            settingsCount: Object.keys(settings).length,
            adminUserId: req.user?.userId || req.user?.id
        });

        res.json({
            success: true,
            data: settings,
            message: 'ดึงการตั้งค่าการแจ้งเตือนสำเร็จ'
        });
    } catch (error) {
        logger.error('Error fetching notification settings', { 
            error: error.message,
            stack: error.stack,
            adminUserId: req.user?.userId || req.user?.id,
            adminUsername: req.user?.username,
            ip: req.ip
        });

        // ส่งข้อผิดพลาดที่เข้าใจได้กลับไป
        let statusCode = 500;
        let errorMessage = 'เกิดข้อผิดพลาดในการดึงการตั้งค่าการแจ้งเตือน';

        if (error.message.includes('ไม่พบตาราง')) {
            statusCode = 503;
            errorMessage = 'ระบบยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
        } else if (error.message.includes('การเชื่อมต่อฐานข้อมูล')) {
            statusCode = 503;
            errorMessage = 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้';
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * เปิด/ปิดการแจ้งเตือนประเภทใดประเภทหนึ่ง
 */
exports.toggleNotification = async (req, res) => {
    try {
        const { type, enabled } = req.body;
        
        // แก้ไขการเข้าถึง adminUserId ให้ถูกต้อง
        const adminUserId = req.user?.userId || req.user?.id;

        // เพิ่ม debug log เพื่อตรวจสอบ user object
        logger.info('User object in toggleNotification:', {
            user: req.user,
            adminUserId,
            type,
            enabled,
            userKeys: Object.keys(req.user || {}) // ดู keys ทั้งหมดใน user object
        });
        
        // ตรวจสอบข้อมูลที่ส่งมา
        if (!type || typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ type และ enabled'
            });
        }

        // ตรวจสอบสิทธิ์ admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        // ตรวจสอบว่ามี adminUserId หรือไม่
        if (!adminUserId) {
            logger.warn('No adminUserId found in request:', {
                user: req.user,
                type,
                enabled
            });
            
            return res.status(400).json({
                success: false,
                message: 'ไม่พบข้อมูล admin user ID'
            });
        }

        logger.info(`รับคำขอ${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน`, {
            type,
            enabled,
            adminUserId,
            adminUsername: req.user?.username
        });

        const result = await notificationSettingsService.toggleNotification(type, enabled, adminUserId);
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        logger.error('Error toggling notification', { 
            error: error.message,
            stack: error.stack,
            adminUserId: req.user?.userId || req.user?.id,
            user: req.user
        });

        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าการแจ้งเตือน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * เปิดการแจ้งเตือนทั้งหมด
 */
exports.enableAllNotifications = async (req, res) => {
    try {
        const adminUserId = req.user?.userId || req.user?.id; // แก้ไขการเข้าถึง userId

        // ตรวจสอบสิทธิ์ admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        // ตรวจสอบว่ามี adminUserId หรือไม่
        if (!adminUserId) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบข้อมูล admin user ID'
            });
        }

        logger.info('รับคำขอเปิดการแจ้งเตือนทั้งหมด', { 
            adminUserId,
            adminUsername: req.user?.username 
        });

        const result = await notificationSettingsService.enableAllNotifications(adminUserId);
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        logger.error('Error enabling all notifications', { 
            error: error.message,
            stack: error.stack,
            adminUserId: req.user?.userId || req.user?.id
        });

        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือนทั้งหมด',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ปิดการแจ้งเตือนทั้งหมด
 */
exports.disableAllNotifications = async (req, res) => {
    try {
        const adminUserId = req.user?.userId || req.user?.id; // แก้ไขการเข้าถึง userId

        // ตรวจสอบสิทธิ์ admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์ในการแก้ไขการตั้งค่าการแจ้งเตือน'
            });
        }

        // ตรวจสอบว่ามี adminUserId หรือไม่
        if (!adminUserId) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบข้อมูล admin user ID'
            });
        }

        logger.info('รับคำขอปิดการแจ้งเตือนทั้งหมด', { 
            adminUserId,
            adminUsername: req.user?.username 
        });

        const result = await notificationSettingsService.disableAllNotifications(adminUserId);
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        logger.error('Error disabling all notifications', { 
            error: error.message,
            stack: error.stack,
            adminUserId: req.user?.userId || req.user?.id
        });

        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการปิดการแจ้งเตือนทั้งหมด',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};