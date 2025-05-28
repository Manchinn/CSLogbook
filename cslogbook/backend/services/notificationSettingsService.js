const { NotificationSetting } = require('../models');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// สร้าง cache ด้วย TTL 5 นาที
const notificationCache = new NodeCache({ stdTTL: 300 });
const CACHE_KEY = 'notification_settings';

class NotificationSettingsService {
    /**
     * ดึงการตั้งค่าการแจ้งเตือนทั้งหมด
     * @param {boolean} useCache - ใช้ cache หรือไม่
     * @returns {Object} - การตั้งค่าการแจ้งเตือนในรูปแบบ object
     */
    async getAllSettings(useCache = true) {
        try {
            if (useCache) {
                const cachedSettings = notificationCache.get(CACHE_KEY);
                if (cachedSettings) {
                    return cachedSettings;
                }
            }

            const settings = await NotificationSetting.findAll({
                include: [{
                    association: 'adminUpdater',
                    attributes: ['admin_id', 'first_name', 'last_name']
                }]
            });
            
            // แปลงเป็น object ที่เข้าถึงง่าย
            const settingsObject = {};
            settings.forEach(setting => {
                settingsObject[setting.notification_type] = {
                    enabled: setting.is_enabled,
                    description: setting.description,
                    lastUpdated: setting.updated_at,
                    updatedBy: setting.adminUpdater ? 
                        `${setting.adminUpdater.first_name} ${setting.adminUpdater.last_name}` : null
                };
            });

            // เก็บใน cache
            notificationCache.set(CACHE_KEY, settingsObject);
            
            return settingsObject;
        } catch (error) {
            logger.error('Error getting notification settings', { error });
            throw new Error('ไม่สามารถดึงการตั้งค่าการแจ้งเตือนได้');
        }
    }

    /**
     * ตรวจสอบว่าการแจ้งเตือนประเภทนั้นเปิดใช้งานหรือไม่
     * @param {string} type - ประเภทการแจ้งเตือน (LOGIN, DOCUMENT, LOGBOOK, etc.)
     * @returns {boolean} - true ถ้าเปิดใช้งาน
     */
    async isNotificationEnabled(type) {
        try {
            // ลองดึงค่าจากฐานข้อมูลก่อน
            const setting = await NotificationSetting.findOne({
                where: { notification_type: type.toUpperCase() }
            });
            
            // ถ้ามีการตั้งค่าในฐานข้อมูล ใช้ค่านั้น
            if (setting) {
                return setting.is_enabled;
            }
            
            // ถ้าไม่มีในฐานข้อมูล ใช้ค่าจาก environment variable เป็น fallback
            const envValue = process.env[`EMAIL_${type.toUpperCase()}_ENABLED`];
            return envValue === 'true';
        } catch (error) {
            logger.error(`Error checking notification status: ${type}`, { error });
            // กรณีเกิด error ให้เช็คจาก environment variable เป็น fallback
            return process.env[`EMAIL_${type.toUpperCase()}_ENABLED`] === 'true';
        }
    }

    /**
     * อัปเดตการตั้งค่าการแจ้งเตือน
     * @param {string} type - ประเภทการแจ้งเตือน
     * @param {boolean} enabled - เปิดใช้งานหรือไม่
     * @param {number} adminId - ID ของ admin ที่อัปเดต
     * @returns {NotificationSetting} - การตั้งค่าที่อัปเดตแล้ว
     */
    async updateNotificationSetting(type, enabled, adminId) {
        try {
            const [setting, created] = await NotificationSetting.findOrCreate({
                where: { notification_type: type.toUpperCase() },
                defaults: {
                    notification_type: type.toUpperCase(),
                    is_enabled: enabled,
                    updated_by_admin: adminId,
                    description: this.getDefaultDescription(type.toUpperCase())
                }
            });

            if (!created) {
                await setting.update({
                    is_enabled: enabled,
                    updated_by_admin: adminId,
                    updated_at: new Date()
                });
            }

            // ล้าง cache
            notificationCache.del(CACHE_KEY);

            logger.info(`Notification setting updated: ${type.toUpperCase()} = ${enabled}`, {
                adminId,
                type: type.toUpperCase(),
                enabled
            });

            return setting;
        } catch (error) {
            logger.error(`Error updating notification setting: ${type}`, { error });
            throw new Error('ไม่สามารถอัปเดตการตั้งค่าการแจ้งเตือนได้');
        }
    }

    /**
     * ดึงคำอธิบายเริ่มต้นตามประเภทการแจ้งเตือน
     * @param {string} type - ประเภทการแจ้งเตือน
     * @returns {string} - คำอธิบาย
     */
    getDefaultDescription(type) {
        const descriptions = {
            'LOGIN': 'แจ้งเตือนเมื่อมีการเข้าสู่ระบบ',
            'DOCUMENT': 'แจ้งเตือนเมื่อมีการอัปเดตเอกสาร',
            'LOGBOOK': 'แจ้งเตือนเมื่อมีการอัปเดต logbook',
            'EVALUATION': 'แจ้งเตือนเมื่อมีการประเมิน',
            'APPROVAL': 'แจ้งเตือนเมื่อมีการอนุมัติ'
        };
        return descriptions[type] || 'การแจ้งเตือนทั่วไป';
    }

    /**
     * เปิดใช้งานการแจ้งเตือนทั้งหมด
     * @param {number} adminId - ID ของ admin
     */
    async enableAllNotifications(adminId) {
        try {
            const types = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
            
            for (const type of types) {
                await this.updateNotificationSetting(type, true, adminId);
            }

            logger.info('All notifications enabled', { adminId });
        } catch (error) {
            logger.error('Error enabling all notifications', { error });
            throw new Error('ไม่สามารถเปิดการแจ้งเตือนทั้งหมดได้');
        }
    }

    /**
     * ปิดการใช้งานการแจ้งเตือนทั้งหมด
     * @param {number} adminId - ID ของ admin
     */
    async disableAllNotifications(adminId) {
        try {
            const types = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
            
            for (const type of types) {
                await this.updateNotificationSetting(type, false, adminId);
            }

            logger.info('All notifications disabled', { adminId });
        } catch (error) {
            logger.error('Error disabling all notifications', { error });
            throw new Error('ไม่สามารถปิดการแจ้งเตือนทั้งหมดได้');
        }
    }
}

module.exports = new NotificationSettingsService();