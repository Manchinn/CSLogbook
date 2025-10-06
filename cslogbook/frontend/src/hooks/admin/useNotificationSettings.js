import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import notificationsService from '../../services/admin/notificationsService';

/**
 * Custom Hook สำหรับจัดการการตั้งค่าการแจ้งเตือนในส่วน Admin
 * รวมถึงการจัดการ state และ logic ทั้งหมดที่เกี่ยวข้อง
 */
export const useNotificationSettings = () => {
    // State สำหรับจัดการข้อมูลการตั้งค่าการแจ้งเตือน
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    // รายการประเภทการแจ้งเตือนที่รองรับ พร้อมข้อมูลสำหรับแสดงผล
    const notificationTypes = [
        {
            key: 'LOGIN',
            label: 'การเข้าสู่ระบบ',
            description: 'แจ้งเตือนเมื่อมีการเข้าสู่ระบบ',
            icon: '🔐',
            color: 'blue'
        },
        {
            key: 'DOCUMENT',
            label: 'เอกสาร',
            description: 'แจ้งเตือนเมื่อมีการอัปเดตเอกสาร',
            icon: '📄',
            color: 'green'
        },
        {
            key: 'LOGBOOK',
            label: 'บันทึกการฝึกงาน',
            description: 'แจ้งเตือนเมื่อมีการอัปเดต logbook',
            icon: '📝',
            color: 'orange'
        },
        {
            key: 'EVALUATION',
            label: 'การประเมิน',
            description: 'แจ้งเตือนเมื่อมีการประเมิน',
            icon: '⭐',
            color: 'gold'
        },
        {
            key: 'APPROVAL',
            label: 'การอนุมัติ',
            description: 'แจ้งเตือนเมื่อมีการอนุมัติ',
            icon: '✅',
            color: 'purple'
        }
    ];

    /**
     * ดึงการตั้งค่าการแจ้งเตือนทั้งหมดจาก API
     */
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 กำลังดึงการตั้งค่าการแจ้งเตือนจาก API...');
            
            const response = await notificationsService.getAllSettings();
            
            if (response.success) {
                setSettings(response.data || {});
                console.log('✅ ดึงการตั้งค่าการแจ้งเตือนสำเร็จ:', response.data);
            } else {
                throw new Error(response.message || 'ไม่สามารถดึงข้อมูลได้');
            }
        } catch (err) {
            const errorMessage = err.message || 'เกิดข้อผิดพลาดในการดึงการตั้งค่าการแจ้งเตือน';
            setError(errorMessage);
            message.error(errorMessage);
            console.error('❌ เกิดข้อผิดพลาดในการดึงการตั้งค่าการแจ้งเตือน:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * เปิด/ปิดการแจ้งเตือนประเภทใดประเภทหนึ่ง
     * @param {string} type - ประเภทการแจ้งเตือน
     * @param {boolean} enabled - เปิดใช้งานหรือไม่
     */
    const toggleNotification = useCallback(async (type, enabled) => {
        setUpdating(true);
        
        try {
            console.log(`🔄 กำลัง${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type}...`);
            
            const response = await notificationsService.toggleNotification(type, enabled);
            
            if (response.success) {
                // อัปเดต state ทันทีเพื่อให้ UI ตอบสนองเร็ว
                setSettings(prevSettings => ({
                    ...prevSettings,
                    [type]: {
                        ...prevSettings[type],
                        enabled
                    }
                }));
                
                message.success(
                    response.message || 
                    `${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type} เรียบร้อยแล้ว`
                );
                
                console.log(`✅ ${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type} สำเร็จ`);
                
                // Refresh ข้อมูลจาก server เพื่อให้แน่ใจว่าข้อมูลตรงกัน
                await fetchSettings();
            } else {
                throw new Error(response.message || 'ไม่สามารถอัปเดตการตั้งค่าได้');
            }
        } catch (err) {
            const errorMessage = err.message || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าการแจ้งเตือน';
            message.error(errorMessage);
            console.error(`❌ เกิดข้อผิดพลาดในการ${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน ${type}:`, err);
            
            // Refresh ข้อมูลจาก server ในกรณีเกิดข้อผิดพลาด
            await fetchSettings();
        } finally {
            setUpdating(false);
        }
    }, [fetchSettings]);

    /**
     * เปิดการแจ้งเตือนทั้งหมด
     */
    const enableAllNotifications = useCallback(async () => {
        setUpdating(true);
        
        try {
            console.log('🔄 กำลังเปิดการแจ้งเตือนทั้งหมด...');
            
            const response = await notificationsService.enableAllNotifications();
            
            if (response.success) {
                message.success(response.message || 'เปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว');
                console.log('✅ เปิดการแจ้งเตือนทั้งหมดสำเร็จ');
                await fetchSettings();
            } else {
                throw new Error(response.message || 'ไม่สามารถเปิดการแจ้งเตือนทั้งหมดได้');
            }
        } catch (err) {
            const errorMessage = err.message || 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือนทั้งหมด';
            message.error(errorMessage);
            console.error('❌ เกิดข้อผิดพลาดในการเปิดการแจ้งเตือนทั้งหมด:', err);
        } finally {
            setUpdating(false);
        }
    }, [fetchSettings]);

    /**
     * ปิดการแจ้งเตือนทั้งหมด
     */
    const disableAllNotifications = useCallback(async () => {
        setUpdating(true);
        
        try {
            console.log('🔄 กำลังปิดการแจ้งเตือนทั้งหมด...');
            
            const response = await notificationsService.disableAllNotifications();
            
            if (response.success) {
                message.success(response.message || 'ปิดการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว');
                console.log('✅ ปิดการแจ้งเตือนทั้งหมดสำเร็จ');
                await fetchSettings();
            } else {
                throw new Error(response.message || 'ไม่สามารถปิดการแจ้งเตือนทั้งหมดได้');
            }
        } catch (err) {
            const errorMessage = err.message || 'เกิดข้อผิดพลาดในการปิดการแจ้งเตือนทั้งหมด';
            message.error(errorMessage);
            console.error('❌ เกิดข้อผิดพลาดในการปิดการแจ้งเตือนทั้งหมด:', err);
        } finally {
            setUpdating(false);
        }
    }, [fetchSettings]);

    /**
     * ตรวจสอบว่าการแจ้งเตือนประเภทนั้นเปิดใช้งานหรือไม่
     * @param {string} type - ประเภทการแจ้งเตือน
     * @returns {boolean} - เปิดใช้งานหรือไม่
     */
    const isNotificationEnabled = useCallback((type) => {
        return settings[type]?.enabled || false;
    }, [settings]);

    /**
     * นับจำนวนการแจ้งเตือนที่เปิดใช้งาน
     * @returns {number} - จำนวนการแจ้งเตือนที่เปิดใช้งาน
     */
    const getEnabledCount = useCallback(() => {
        return Object.values(settings).filter(setting => setting?.enabled).length;
    }, [settings]);

    /**
     * ดึงข้อมูลการตั้งค่าของการแจ้งเตือนประเภทใดประเภทหนึ่ง
     * @param {string} type - ประเภทการแจ้งเตือน
     * @returns {Object} - ข้อมูลการตั้งค่า
     */
    const getNotificationSetting = useCallback((type) => {
        return settings[type] || { enabled: false };
    }, [settings]);

    /**
     * ดึงสถิติการตั้งค่าการแจ้งเตือน
     * @returns {Object} - สถิติการตั้งค่า
     */
    const getNotificationStats = useCallback(() => {
        const totalCount = notificationTypes.length;
        const enabledCount = getEnabledCount();
        const disabledCount = totalCount - enabledCount;
        const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

        return {
            total: totalCount,
            enabled: enabledCount,
            disabled: disabledCount,
            percentage,
            hasEnabled: enabledCount > 0,
            allEnabled: enabledCount === totalCount,
            allDisabled: enabledCount === 0
        };
    }, [notificationTypes.length, getEnabledCount]);

    /**
     * รีเซ็ตข้อผิดพลาด
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // โหลดข้อมูลครั้งแรกเมื่อ component mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // คำนวณค่าต่างๆ ที่ใช้บ่อย
    const stats = getNotificationStats();

    return {
        // State หลัก
        settings,
        loading,
        updating,
        error,
        notificationTypes,
        
        // Functions สำหรับการจัดการ
        fetchSettings,
        toggleNotification,
        enableAllNotifications,
        disableAllNotifications,
        clearError,
        
        // Helper functions
        isNotificationEnabled,
        getNotificationSetting,
        
        // Computed values
        enabledCount: stats.enabled,
        totalCount: stats.total,
        hasEnabled: stats.hasEnabled,
        allEnabled: stats.allEnabled,
        allDisabled: stats.allDisabled,
        percentage: stats.percentage,
        stats
    };
};

export default useNotificationSettings;