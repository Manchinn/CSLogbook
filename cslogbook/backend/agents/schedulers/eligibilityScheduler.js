/**
 * ไฟล์ scheduler สำหรับตั้งเวลาการปรับปรุงสถานะสิทธิ์ของนักศึกษาอัตโนมัติ
 */

const cron = require('node-cron');
const { updateAllStudentsEligibility } = require('../eligibilityUpdater');
const logger = require('../../utils/logger');

// ตั้งเวลารันทุกเดือนตามตัวจัดการภาคการศึกษา
const scheduleEligibilityUpdate = () => {
  // ตั้งค่าให้รันวันที่ 1 ของทุกเดือนเวลา 00:00 น. (เที่ยงคืน)
  cron.schedule('0 0 1 * *', async () => {
    logger.info('เริ่มงานปรับปรุงสถานะสิทธิ์นักศึกษาอัตโนมัติ (รายเดือน)');
    
    try {
      // อัพเดตสถานะสิทธิ์นักศึกษา
      const result = await updateAllStudentsEligibility();
      
      if (result.success) {
        logger.info(`ปรับปรุงสถานะสิทธิ์สำเร็จ: ${result.updated}/${result.total} คน`);
      } else {
        logger.error(`เกิดข้อผิดพลาดในการปรับปรุงสถานะสิทธิ์: ${result.error}`);
      }
    } catch (error) {
      logger.error(`เกิดข้อผิดพลาดในการรันงานปรับปรุงสถานะสิทธิ์: ${error.message}`);
      console.error('Error in eligibility update job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok' // ตั้งเป็นเวลาประเทศไทย
  });
  
  logger.info('ตั้งค่า scheduler ปรับปรุงสถานะสิทธิ์นักศึกษาสำเร็จ (รันทุกเดือนวันที่ 1 เวลา 00:00 น.)');
};

module.exports = {
  scheduleEligibilityUpdate
};