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
 * สร้างช่วงวันที่ในรูปแบบที่กำหนด (แปลงเป็น พ.ศ.)
 * @param {Date|string} startDate วันที่เริ่มต้น
 * @param {Date|string} endDate วันที่สิ้นสุด
 * @param {string} format รูปแบบการแสดงวันที่
 * @returns {string} ช่วงวันที่ในรูปแบบที่กำหนด (พ.ศ.)
 */
export function formatDateRange(startDate, endDate, format = 'D/M/YYYY') {
  if (!startDate || !endDate) return '-';
  
  // แปลงปี ค.ศ. เป็น พ.ศ. โดยการ +543
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  // แยกส่วนของ format เพื่อแปลงปีเป็น พ.ศ.
  const formatStart = start.format(format);
  const formatEnd = end.format(format);
  
  // แปลงปี ค.ศ. เป็น พ.ศ. (เพิ่ม 543)
  const buddhistStart = formatStart.replace(/\b(\d{4})\b/g, (match) => parseInt(match) + 543);
  const buddhistEnd = formatEnd.replace(/\b(\d{4})\b/g, (match) => parseInt(match) + 543);
  
  return `${buddhistStart} - ${buddhistEnd}`;
}
