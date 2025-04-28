/**
 * ไฟล์ scheduler สำหรับตั้งเวลาการปรับปรุงสถานะสิทธิ์ของนักศึกษาอัตโนมัติ
 */

const cron = require('node-cron');
const { updateAllStudentsEligibility } = require('../eligibilityUpdater');

// สร้าง logger สำหรับเก็บ log เฉพาะ
const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../../logs');

// ตรวจสอบว่ามีโฟลเดอร์ logs หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// สร้าง logger อย่างง่าย
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(logDir, 'eligibility.log'), logMessage);
  console.log(`[Eligibility Scheduler] ${message}`);
}

// ตั้งเวลารันทุกวันเวลาเที่ยงคืน
const scheduleEligibilityUpdate = () => {
  // ตั้งค่าให้รันทุกวันเวลา 00:00 น. (เที่ยงคืน)
  cron.schedule('0 0 * * *', async () => {
    logMessage('เริ่มงานปรับปรุงสถานะสิทธิ์นักศึกษาอัตโนมัติ');
    
    try {
      const result = await updateAllStudentsEligibility();
      
      if (result.success) {
        logMessage(`ปรับปรุงสถานะสิทธิ์สำเร็จ: ${result.updated}/${result.total} คน`);
      } else {
        logMessage(`เกิดข้อผิดพลาดในการปรับปรุงสถานะสิทธิ์: ${result.error}`);
      }
    } catch (error) {
      logMessage(`เกิดข้อผิดพลาดในการรันงานปรับปรุงสถานะสิทธิ์: ${error.message}`);
      console.error('Error in eligibility update job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok' // ตั้งเป็นเวลาประเทศไทย
  });
  
  logMessage('ตั้งค่า scheduler ปรับปรุงสถานะสิทธิ์นักศึกษาสำเร็จ (รันทุกวันเวลา 00:00 น.)');
};

module.exports = {
  scheduleEligibilityUpdate
};