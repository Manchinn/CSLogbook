/**
 * ไฟล์ scheduler สำหรับตั้งเวลาการปรับปรุงสถานะสิทธิ์ของนักศึกษาอัตโนมัติ
 */

const cron = require('node-cron');
const { updateAllStudentsEligibility, updateStudentYears } = require('../eligibilityUpdater');
const logger = require('../../utils/logger');

// ตั้งเวลารันทุกวันเวลาเที่ยงคืน
const scheduleEligibilityUpdate = () => {
  // ตั้งค่าให้รันทุกวันเวลา 00:00 น. (เที่ยงคืน)
  cron.schedule('0 0 * * *', async () => {
    logger.info('เริ่มงานปรับปรุงสถานะสิทธิ์นักศึกษาอัตโนมัติ');
    
    try {
      // อัพเดตชั้นปีนักศึกษาก่อน
      const yearUpdateResult = await updateStudentYears();
      
      if (yearUpdateResult.success) {
        logger.info(`อัพเดตชั้นปีนักศึกษาสำเร็จ: ${yearUpdateResult.updatedCount} คน`);
      } else {
        logger.error(`เกิดข้อผิดพลาดในการอัพเดตชั้นปีนักศึกษา: ${yearUpdateResult.error}`);
      }
      
      // จากนั้นค่อยอัพเดตสถานะสิทธิ์
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
  
  logger.info('ตั้งค่า scheduler ปรับปรุงสถานะสิทธิ์นักศึกษาสำเร็จ (รันทุกวันเวลา 00:00 น.)');
  
  // เรียกใช้ฟังก์ชัน updateStudentYears ครั้งแรกเมื่อเริ่มต้นระบบ
  updateStudentYears()
    .then(result => {
      if (result.success) {
        logger.info(`อัพเดตชั้นปีนักศึกษาเริ่มต้นสำเร็จ: ${result.updatedCount} คน`);
      } else {
        logger.error(`เกิดข้อผิดพลาดในการอัพเดตชั้นปีนักศึกษาเริ่มต้น: ${result.error}`);
      }
    })
    .catch(err => {
      logger.error('เกิดข้อผิดพลาดในการอัพเดตชั้นปีนักศึกษาเริ่มต้น:', err);
    });
};

module.exports = {
  scheduleEligibilityUpdate
};