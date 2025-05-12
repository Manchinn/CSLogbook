import dayjs from 'dayjs';

/**
 * คำนวณจำนวนวันระหว่างสองวันที่
 * @param {string} startDate วันที่เริ่มต้น
 * @param {string} endDate วันที่สิ้นสุด
 * @returns {string|number} จำนวนวันที่คำนวณได้ หรือ '-' หากไม่มีข้อมูล
 */
export function calcDateDiff(startDate, endDate) {
  if (!startDate || !endDate) return '-';
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
}

/**
 * แปลงชื่อวันเป็นภาษาไทย
 * @param {Date|string} date วันที่ต้องการแปลงชื่อวัน
 * @returns {string} ชื่อวันภาษาไทย
 */
export function getThaiDayName(date) {
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const day = dayjs(date).day();
  return `วัน${thaiDays[day]}`;
}

/**
 * สร้างช่วงวันที่ในรูปแบบที่กำหนด
 * @param {Date|string} startDate วันที่เริ่มต้น
 * @param {Date|string} endDate วันที่สิ้นสุด
 * @param {string} format รูปแบบการแสดงวันที่
 * @returns {string} ช่วงวันที่ในรูปแบบที่กำหนด
 */
export function formatDateRange(startDate, endDate, format = 'D/M/YYYY') {
  if (!startDate || !endDate) return '-';
  return `${dayjs(startDate).format(format)} - ${dayjs(endDate).format(format)}`;
}
