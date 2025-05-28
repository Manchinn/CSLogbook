const { NotificationSetting, User, sequelize } = require('../models');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// สร้าง cache ด้วย TTL 5 นาที
const notificationCache = new NodeCache({ stdTTL: 300 });
const CACHE_KEY = 'notification_settings';

class NotificationSettingsService {
    /**
     * ตรวจสอบว่าตารางและโมเดลพร้อมใช้งานหรือไม่
     */
    async validateDatabase() {
        try {
            // ตรวจสอบการเชื่อมต่อ
            await sequelize.authenticate();
            
            // ตรวจสอบ Model พร้อมใช้งานหรือไม่
            if (!NotificationSetting) {
                throw new Error('NotificationSetting Model ไม่พร้อมใช้งาน');
            }
            
            if (!User) {
                throw new Error('User Model ไม่พร้อมใช้งาน');
            }
            
            logger.info('ตรวจสอบฐานข้อมูลและ Models สำเร็จ');
            return true;
        } catch (error) {
            logger.error('Database validation failed', { error: error.message });
            throw new Error(`ปัญหาการเชื่อมต่อฐานข้อมูล: ${error.message}`);
        }
    }

    /**
     * สร้างข้อมูลเริ่มต้นในตาราง notification_settings โดยใช้ Sequelize Model
     */
    async initializeDefaultSettings() {
        try {
            const defaultSettings = [
                { 
                    notificationType: 'LOGIN', 
                    description: 'การแจ้งเตือนเมื่อมีการเข้าสู่ระบบ',
                    isEnabled: false
                },
                { 
                    notificationType: 'DOCUMENT', 
                    description: 'การแจ้งเตือนเมื่อมีการอัปโหลดหรืออัปเดตเอกสาร',
                    isEnabled: false
                },
                { 
                    notificationType: 'LOGBOOK', 
                    description: 'การแจ้งเตือนเมื่อมีการส่ง logbook ใหม่',
                    isEnabled: false
                },
                { 
                    notificationType: 'EVALUATION', 
                    description: 'การแจ้งเตือนเมื่อมีการประเมินผล',
                    isEnabled: false
                },
                { 
                    notificationType: 'APPROVAL', 
                    description: 'การแจ้งเตือนเมื่อมีการอนุมัติเอกสาร',
                    isEnabled: false
                }
            ];

            // ใช้ bulkCreate พร้อม ignoreDuplicates สำหรับสร้างข้อมูลเริ่มต้น
            await NotificationSetting.bulkCreate(defaultSettings, {
                ignoreDuplicates: true // ข้ามการสร้างหากมีข้อมูลซ้ำ
            });

            logger.info('ข้อมูลเริ่มต้นสำหรับ notification settings ถูกสร้างแล้ว');
            return true;
        } catch (error) {
            logger.error('Error initializing default settings', { error: error.message });
            throw new Error(`ไม่สามารถสร้างข้อมูลเริ่มต้นได้: ${error.message}`);
        }
    }

    /**
     * ดึงการตั้งค่าการแจ้งเตือนทั้งหมดโดยใช้ Sequelize Model
     */
    async getAllSettingsWithModel() {
        try {
            logger.info('ดึงการตั้งค่าการแจ้งเตือนด้วย Sequelize Model');

            // ใช้ Sequelize Model พร้อม include สำหรับ JOIN กับ User
            const settings = await NotificationSetting.findAll({
                include: [{
                    model: User,
                    as: 'updatedByUser', // ใช้ alias จาก association
                    attributes: ['user_id', 'username', 'first_name', 'last_name'],
                    required: false, // LEFT JOIN
                    where: {
                        role: 'admin',
                        active_status: true
                    }
                }],
                order: [['notificationType', 'ASC']],
                attributes: [
                    'settingId',
                    'notificationType', 
                    'isEnabled', 
                    'description', 
                    'updatedByAdminId',
                    'created_at',
                    'updated_at'
                ]
            });

            // แปลงข้อมูลเป็น object แบบ key-value
            const settingsObject = {};
            
            settings.forEach(setting => {
                const key = setting.notificationType;
                const updatedByUser = setting.updatedByUser;

                settingsObject[key] = {
                    id: setting.settingId,
                    enabled: Boolean(setting.isEnabled),
                    description: setting.description,
                    lastUpdated: setting.updated_at,
                    createdAt: setting.created_at,
                    updatedByAdminId: setting.updatedByAdminId,
                    updatedBy: updatedByUser ? 
                        `${updatedByUser.first_name || ''} ${updatedByUser.last_name || ''}`.trim() || updatedByUser.username :
                        null,
                    updatedByUsername: updatedByUser ? updatedByUser.username : null
                };
            });

            logger.info('ดึงการตั้งค่าการแจ้งเตือนด้วย Sequelize Model สำเร็จ', { 
                count: Object.keys(settingsObject).length 
            });

            return settingsObject;
        } catch (error) {
            logger.error('Error getting notification settings with Sequelize Model', { 
                error: error.message,
                stack: error.stack
            });

            // หาก JOIN ไม่สำเร็จ ให้ลองดึงข้อมูลแบบไม่ JOIN
            logger.warn('ลองดึงข้อมูลแบบไม่ JOIN กับ User table');
            
            try {
                const simpleSettings = await NotificationSetting.findAll({
                    order: [['notificationType', 'ASC']],
                    attributes: [
                        'settingId',
                        'notificationType', 
                        'isEnabled', 
                        'description', 
                        'updatedByAdminId',
                        'created_at',
                        'updated_at'
                    ]
                });

                const settingsObject = {};
                
                for (const setting of simpleSettings) {
                    const key = setting.notificationType;
                    
                    // ดึงข้อมูล admin แยกต่างหาก หากมี
                    let updatedByUser = null;
                    if (setting.updatedByAdminId) {
                        try {
                            updatedByUser = await User.findOne({
                                where: { 
                                    user_id: setting.updatedByAdminId,
                                    role: 'admin',
                                    active_status: true
                                },
                                attributes: ['user_id', 'username', 'first_name', 'last_name']
                            });
                        } catch (userError) {
                            logger.warn(`ไม่สามารถดึงข้อมูล admin ${setting.updatedByAdminId}:`, userError.message);
                        }
                    }

                    settingsObject[key] = {
                        id: setting.settingId,
                        enabled: Boolean(setting.isEnabled),
                        description: setting.description,
                        lastUpdated: setting.updated_at,
                        createdAt: setting.created_at,
                        updatedByAdminId: setting.updatedByAdminId,
                        updatedBy: updatedByUser ? 
                            `${updatedByUser.first_name || ''} ${updatedByUser.last_name || ''}`.trim() || updatedByUser.username :
                            null,
                        updatedByUsername: updatedByUser ? updatedByUser.username : null
                    };
                }

                logger.info('ดึงข้อมูลแบบไม่ JOIN สำเร็จ', { count: Object.keys(settingsObject).length });
                return settingsObject;
            } catch (fallbackError) {
                logger.error('Error in fallback query', { error: fallbackError.message });
                throw new Error(`ไม่สามารถดึงการตั้งค่าการแจ้งเตือนได้: ${error.message}`);
            }
        }
    }

    /**
     * ดึงการตั้งค่าการแจ้งเตือนทั้งหมด
     * @param {boolean} useCache - ใช้ cache หรือไม่
     * @returns {Object} - การตั้งค่าการแจ้งเตือนในรูปแบบ object
     */
    async getAllSettings(useCache = true) {
        try {
            // ตรวจสอบ cache ก่อน
            if (useCache) {
                const cachedSettings = notificationCache.get(CACHE_KEY);
                if (cachedSettings) {
                    logger.info('ใช้ข้อมูลจาก cache สำหรับการตั้งค่าการแจ้งเตือน');
                    return cachedSettings;
                }
            }

            // ตรวจสอบฐานข้อมูลและ Models
            await this.validateDatabase();

            // สร้างข้อมูลเริ่มต้นหากจำเป็น
            await this.initializeDefaultSettings();

            // ดึงข้อมูลด้วย Sequelize Model
            const settingsObject = await this.getAllSettingsWithModel();

            // เก็บไว้ใน cache
            if (useCache) {
                notificationCache.set(CACHE_KEY, settingsObject);
                logger.info('บันทึกการตั้งค่าการแจ้งเตือนลง cache');
            }

            return settingsObject;
        } catch (error) {
            logger.error('Error in getAllSettings', { 
                error: error.message,
                stack: error.stack
            });
            throw error; // ส่งต่อ error เพื่อให้ controller จัดการ
        }
    }

    /**
     * ตรวจสอบว่าการแจ้งเตือนประเภทนั้นเปิดใช้งานหรือไม่
     * @param {string} type - ประเภทการแจ้งเตือน
     * @returns {boolean} - true ถ้าเปิดใช้งาน
     */
    async isNotificationEnabled(type) {
        try {
            // ใช้ Sequelize Model สำหรับการค้นหา
            const setting = await NotificationSetting.findOne({
                where: { 
                    notificationType: type.toUpperCase() 
                },
                attributes: ['isEnabled']
            });
            
            if (setting) {
                return Boolean(setting.isEnabled);
            }
            
            // ใช้ environment variable เป็น fallback
            const envValue = process.env[`EMAIL_${type.toUpperCase()}_ENABLED`];
            return envValue === 'true';
        } catch (error) {
            logger.error(`Error checking notification enabled status for ${type}`, { error: error.message });
            
            // fallback ไป environment variable
            const envValue = process.env[`EMAIL_${type.toUpperCase()}_ENABLED`];
            return envValue === 'true';
        }
    }

    /**
     * เปิด/ปิดการแจ้งเตือนประเภทใดประเภทหนึ่ง
     * @param {string} type - ประเภทการแจ้งเตือน
     * @param {boolean} enabled - เปิดใช้งานหรือไม่
     * @param {number} adminUserId - user_id ของ admin ที่ทำการอัปเดต
     * @returns {Object} - ผลลัพธ์การอัปเดต
     */
    async toggleNotification(type, enabled, adminUserId = null) {
        try {
            const notificationType = type.toUpperCase();
            
            // เพิ่ม debug log เพื่อตรวจสอบ adminUserId
            logger.info('toggleNotification called with:', {
                type: notificationType,
                enabled,
                adminUserId,
                adminUserIdType: typeof adminUserId
            });
            
            // ตรวจสอบว่า adminUserId เป็น admin จริงหรือไม่ (เฉพาะเมื่อมีค่า)
            if (adminUserId) {
                const adminUser = await User.findOne({
                    where: { 
                        user_id: adminUserId,
                        role: 'admin',
                        active_status: true
                    },
                    attributes: ['user_id', 'username', 'first_name', 'last_name']
                });
                
                if (!adminUser) {
                    logger.warn(`Admin user not found or inactive: ${adminUserId}`);
                    throw new Error('ผู้ใช้ไม่มีสิทธิ์ admin หรือไม่พบผู้ใช้');
                } else {
                    logger.info('Admin user validated:', {
                        adminUserId,
                        username: adminUser.username
                    });
                }
            } else {
                logger.warn('adminUserId is null or undefined - proceeding without admin tracking');
            }
            
            // ใช้ upsert สำหรับการสร้างหรืออัปเดตข้อมูล
            const [setting, created] = await NotificationSetting.upsert({
                notificationType: notificationType,
                isEnabled: enabled,
                description: `การแจ้งเตือน${notificationType}`,
                updatedByAdminId: adminUserId
            }, {
                where: { notificationType: notificationType },
                returning: true // ส่งคืนข้อมูลที่สร้างหรืออัปเดต
            });

            // ล้าง cache
            this.clearCache();

            const actionText = created ? 'สร้าง' : 'อัปเดต';
            logger.info(`${actionText}และ${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${notificationType} สำเร็จ`, {
                type: notificationType,
                enabled,
                adminUserId: adminUserId || 'system',
                created,
                settingId: setting.settingId
            });

            return {
                success: true,
                type: notificationType,
                enabled,
                created,
                settingId: setting.settingId,
                message: `${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${notificationType} เรียบร้อยแล้ว`
            };
        } catch (error) {
            logger.error(`Error toggling notification for ${type}`, { 
                error: error.message,
                adminUserId,
                type,
                enabled
            });
            throw new Error(`ไม่สามารถ${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type} ได้: ${error.message}`);
        }
    }

    /**
     * อัปเดตการตั้งค่าการแจ้งเตือนหลายรายการพร้อมกัน
     * @param {Array} settings - อาร์เรย์ของการตั้งค่า [{ type, enabled }, ...]
     * @param {number} adminUserId - user_id ของ admin ที่ทำการอัปเดต
     * @returns {Object} - ผลลัพธ์การอัปเดต
     */
    async bulkUpdateNotifications(settings, adminUserId = null) {
        // สร้าง transaction เพื่อให้แน่ใจว่าการอัปเดตทั้งหมดสำเร็จ
        const transaction = await sequelize.transaction();
        
        try {
            const results = [];
            
            for (const { type, enabled } of settings) {
                const notificationType = type.toUpperCase();
                
                const [setting, created] = await NotificationSetting.upsert({
                    notificationType: notificationType,
                    isEnabled: enabled,
                    description: `การแจ้งเตือน${notificationType}`,
                    updatedByAdminId: adminUserId
                }, {
                    where: { notificationType: notificationType },
                    transaction
                });

                results.push({
                    type: notificationType,
                    enabled,
                    created,
                    settingId: setting.settingId
                });
            }

            // Commit transaction
            await transaction.commit();

            // ล้าง cache
            this.clearCache();

            logger.info('Bulk update notifications สำเร็จ', {
                count: results.length,
                adminUserId,
                results
            });

            return {
                success: true,
                results,
                message: `อัปเดตการตั้งค่าการแจ้งเตือน ${results.length} รายการเรียบร้อยแล้ว`
            };
        } catch (error) {
            // Rollback transaction
            await transaction.rollback();
            
            logger.error('Error in bulk update notifications', { 
                error: error.message,
                adminUserId,
                settings
            });
            throw new Error(`ไม่สามารถอัปเดตการตั้งค่าการแจ้งเตือนแบบหลายรายการได้: ${error.message}`);
        }
    }

    /**
     * ล้าง cache การตั้งค่าการแจ้งเตือน
     */
    clearCache() {
        notificationCache.del(CACHE_KEY);
        logger.info('ล้าง cache การตั้งค่าการแจ้งเตือนแล้ว');
    }

    /**
     * เปิดการแจ้งเตือนทั้งหมด
     * @param {number} adminUserId - user_id ของ admin ที่ทำการอัปเดต
     * @returns {Object} - ผลลัพธ์การอัปเดต
     */
    async enableAllNotifications(adminUserId = null) {
        try {
            const notificationTypes = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
            
            // ใช้ bulkUpdateNotifications สำหรับประสิทธิภาพที่ดีขึ้น
            const settings = notificationTypes.map(type => ({ type, enabled: true }));
            const result = await this.bulkUpdateNotifications(settings, adminUserId);

            logger.info('เปิดการแจ้งเตือนทั้งหมดสำเร็จ', { 
                adminUserId, 
                count: result.results.length 
            });

            return {
                success: true,
                results: result.results,
                message: 'เปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว'
            };
        } catch (error) {
            logger.error('Error enabling all notifications', { error: error.message });
            throw new Error(`ไม่สามารถเปิดการแจ้งเตือนทั้งหมดได้: ${error.message}`);
        }
    }

    /**
     * ปิดการแจ้งเตือนทั้งหมด
     * @param {number} adminUserId - user_id ของ admin ที่ทำการอัปเดต
     * @returns {Object} - ผลลัพธ์การอัปเดต
     */
    async disableAllNotifications(adminUserId = null) {
        try {
            const notificationTypes = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
            
            // ใช้ bulkUpdateNotifications สำหรับประสิทธิภาพที่ดีขึ้น
            const settings = notificationTypes.map(type => ({ type, enabled: false }));
            const result = await this.bulkUpdateNotifications(settings, adminUserId);

            logger.info('ปิดการแจ้งเตือนทั้งหมดสำเร็จ', { 
                adminUserId, 
                count: result.results.length 
            });

            return {
                success: true,
                results: result.results,
                message: 'ปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว'
            };
        } catch (error) {
            logger.error('Error disabling all notifications', { error: error.message });
            throw new Error(`ไม่สามารถปิดการแจ้งเตือนทั้งหมดได้: ${error.message}`);
        }
    }

    /**
     * ดึงสถิติการใช้งานการแจ้งเตือน
     * @returns {Object} - สถิติการใช้งาน
     */
    async getNotificationStatistics() {
        try {
            // นับจำนวนการตั้งค่าที่เปิดใช้งาน
            const enabledCount = await NotificationSetting.count({
                where: { isEnabled: true }
            });

            // นับจำนวนการตั้งค่าทั้งหมด
            const totalCount = await NotificationSetting.count();

            // ดึงการตั้งค่าล่าสุด
            const latestUpdate = await NotificationSetting.findOne({
                order: [['updatedAt', 'DESC']],
                include: [{
                    model: User,
                    as: 'updatedByUser',
                    attributes: ['username', 'first_name', 'last_name'],
                    required: false
                }],
                attributes: ['notificationType', 'isEnabled', 'updatedAt']
            });

            return {
                enabledCount,
                disabledCount: totalCount - enabledCount,
                totalCount,
                latestUpdate: latestUpdate ? {
                    type: latestUpdate.notificationType,
                    enabled: latestUpdate.isEnabled,
                    updatedAt: latestUpdate.updatedAt,
                    updatedBy: latestUpdate.updatedByUser ? 
                        `${latestUpdate.updatedByUser.first_name || ''} ${latestUpdate.updatedByUser.last_name || ''}`.trim() || latestUpdate.updatedByUser.username :
                        null
                } : null
            };
        } catch (error) {
            logger.error('Error getting notification statistics', { error: error.message });
            throw new Error(`ไม่สามารถดึงสถิติการใช้งานการแจ้งเตือนได้: ${error.message}`);
        }
    }
}

module.exports = new NotificationSettingsService();