import dayjs from '../../../../utils/dayjs'; // ใช้ dayjs ที่มี plugin buddhistEra

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
 * สร้างช่วงวันที่ในรูปแบบที่กำหนด (แปลงเป็น พ.ศ.)
 * @param {Date|string} startDate วันที่เริ่มต้น
 * @param {Date|string} endDate วันที่สิ้นสุด
 * @param {string} format รูปแบบการแสดงวันที่ (ใช้ BBBB สำหรับปี พ.ศ.)
 * @returns {string} ช่วงวันที่ในรูปแบบที่กำหนด (พ.ศ.)
 */
export function formatDateRange(startDate, endDate, format = 'D/M/BBBB') {
  if (!startDate || !endDate) return '-';
  
  // ใช้ BBBB สำหรับแสดงปี พ.ศ. โดยตรงจาก dayjs plugin buddhistEra
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  // ถ้า format มี YYYY ให้เปลี่ยนเป็น BBBB
  const buddhistFormat = format.replace(/YYYY/g, 'BBBB');
  
  const formatStart = start.format(buddhistFormat);
  const formatEnd = end.format(buddhistFormat);
  
  return `${formatStart} - ${formatEnd}`;
}
