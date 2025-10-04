import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// เปิดใช้งาน plugins
dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

// ตั้งค่า locale เป็นไทย
dayjs.locale('th');

/**
 * อาร์เรย์ชื่อเดือนภาษาไทย
 */
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * อาร์เรย์ชื่อเดือนภาษาไทยแบบย่อ
 */
export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * อาร์เรย์ชื่อวันภาษาไทย
 */
export const THAI_DAYS = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'
];

/**
 * อาร์เรย์ชื่อวันภาษาไทยแบบย่อ
 */
export const THAI_DAYS_SHORT = [
  'อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'
];

/**
 * แปลงวันที่เป็นรูปแบบไทย พ.ศ.
 * @param {string|Date|dayjs} date - วันที่ที่ต้องการแปลง
 * @param {string} format - รูปแบบที่ต้องการ
 * @returns {string} - วันที่ในรูปแบบไทย
 */
export const formatThaiDate = (date, format = 'DD MMMM BBBB') => {
  if (!date) return '';
  
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) {
      console.warn('Invalid date provided to formatThaiDate:', date);
      return '';
    }

    // แปลงเป็นปี พ.ศ.
    const buddhistYear = dayjsDate.year() + 543;
    const month = dayjsDate.month();
    const day = dayjsDate.date();
    const dayOfWeek = dayjsDate.day();

    // จัดการรูปแบบต่างๆ
    switch (format.toLowerCase()) {
      case 'dd mmmm bbbb':
      case 'full':
        return `${day} ${THAI_MONTHS[month]} ${buddhistYear}`;
      
      case 'dd mmm bbbb':
      case 'short':
        return `${day} ${THAI_MONTHS_SHORT[month]} ${buddhistYear}`;
      
      case 'dd/mm/bbbb':
      case 'numeric':
        return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${buddhistYear}`;
      
      case 'dddd dd mmmm bbbb':
      case 'fulldate':
        return `วัน${THAI_DAYS[dayOfWeek]}ที่ ${day} ${THAI_MONTHS[month]} พ.ศ. ${buddhistYear}`;
      
      case 'mmmm bbbb':
      case 'monthyear':
        return `${THAI_MONTHS[month]} ${buddhistYear}`;
      
      case 'bbbb':
      case 'year':
        return `พ.ศ. ${buddhistYear}`;
      
      default:
        // ใช้ dayjs format แล้วแทนที่ปี
        return dayjsDate.format(format).replace(dayjsDate.year().toString(), buddhistYear.toString());
    }
  } catch (error) {
    console.error('Error formatting Thai date:', error, date);
    return '';
  }
};

/**
 * แปลงวันที่เป็นรูปแบบสำหรับเอกสารทางการ
 * @param {string|Date|dayjs} date - วันที่ที่ต้องการแปลง
 * @returns {string} - วันที่ในรูปแบบเอกสารทางการ
 */
export const formatOfficialDate = (date) => {
  if (!date) return '';
  
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return '';

    const buddhistYear = dayjsDate.year() + 543;
    const month = dayjsDate.month();
    const day = dayjsDate.date();

    return `${day} ${THAI_MONTHS[month]} พ.ศ. ${buddhistYear}`;
  } catch (error) {
    console.error('Error formatting official date:', error);
    return '';
  }
};

/**
 * คำนวณระยะเวลาระหว่างวันที่
 * @param {string|Date|dayjs} startDate - วันที่เริ่มต้น
 * @param {string|Date|dayjs} endDate - วันที่สิ้นสุด
 * @param {string} unit - หน่วยที่ต้องการ (days, months, years)
 * @returns {number} - จำนวนวัน/เดือน/ปี
 */
export const calculateDateDiff = (startDate, endDate, unit = 'days') => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (!start.isValid() || !end.isValid()) return 0;
    
    return end.diff(start, unit);
  } catch (error) {
    console.error('Error calculating date difference:', error);
    return 0;
  }
};

/**
 * คำนวณระยะเวลาฝึกงาน (รวมวันเริ่มต้น)
 * @param {string|Date|dayjs} startDate - วันที่เริ่มฝึกงาน
 * @param {string|Date|dayjs} endDate - วันที่สิ้นสุดฝึกงาน
 * @returns {number} - จำนวนวันฝึกงาน
 */
export const calculateInternshipDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (!start.isValid() || !end.isValid()) return 0;
    
    // รวมวันเริ่มต้นด้วย
    return end.diff(start, 'days') + 1;
  } catch (error) {
    console.error('Error calculating internship days:', error);
    return 0;
  }
};

/**
 * ตรวจสอบว่าวันที่อยู่ในอนาคตหรือไม่
 * @param {string|Date|dayjs} date - วันที่ที่ต้องการตรวจสอบ
 * @returns {boolean} - true ถ้าอยู่ในอนาคต
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  
  try {
    const inputDate = dayjs(date);
    const today = dayjs();
    
    return inputDate.isAfter(today, 'day');
  } catch (error) {
    console.error('Error checking future date:', error);
    return false;
  }
};

/**
 * ตรวจสอบว่าวันที่อยู่ในอดีตหรือไม่
 * @param {string|Date|dayjs} date - วันที่ที่ต้องการตรวจสอบ
 * @returns {boolean} - true ถ้าอยู่ในอดีต
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  try {
    const inputDate = dayjs(date);
    const today = dayjs();
    
    return inputDate.isBefore(today, 'day');
  } catch (error) {
    console.error('Error checking past date:', error);
    return false;
  }
};

/**
 * แปลงวันที่จากรูปแบบ String เป็น Date Object
 * @param {string} dateString - วันที่ในรูปแบบ string
 * @param {string} format - รูปแบบของ input
 * @returns {Date|null} - Date object หรือ null ถ้าไม่ถูกต้อง
 */
export const parseThaiDate = (dateString, format = 'DD/MM/YYYY') => {
  if (!dateString) return null;
  
  try {
    const parsed = dayjs(dateString, format);
    return parsed.isValid() ? parsed.toDate() : null;
  } catch (error) {
    console.error('Error parsing Thai date:', error);
    return null;
  }
};

/**
 * สร้างข้อความแสดงระยะเวลา เช่น "3 เดือน (90 วัน)"
 * @param {string|Date|dayjs} startDate - วันที่เริ่มต้น
 * @param {string|Date|dayjs} endDate - วันที่สิ้นสุด
 * @returns {string} - ข้อความแสดงระยะเวลา
 */
export const formatDurationText = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  try {
    const days = calculateInternshipDays(startDate, endDate);
    const months = Math.round(days / 30);
    
    if (days === 0) return '0 วัน';
    if (days < 30) return `${days} วัน`;
    if (days < 365) return `${months} เดือน (${days} วัน)`;
    
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const remainingMonths = Math.round(remainingDays / 30);
    
    return `${years} ปี ${remainingMonths} เดือน (${days} วัน)`;
  } catch (error) {
    console.error('Error formatting duration text:', error);
    return '';
  }
};

/**
 * รับวันที่ปัจจุบันในรูปแบบไทย
 * @param {string} format - รูปแบบที่ต้องการ
 * @returns {string} - วันที่ปัจจุบันในรูปแบบไทย
 */
export const getCurrentThaiDate = (format = 'DD MMMM BBBB') => {
  return formatThaiDate(new Date(), format);
};

/**
 * แปลงปี ค.ศ. เป็น พ.ศ.
 * @param {number} christianYear - ปี ค.ศ.
 * @returns {number} - ปี พ.ศ.
 */
export const toBuddhistYear = (christianYear) => {
  return christianYear + 543;
};

/**
 * แปลงปี พ.ศ. เป็น ค.ศ.
 * @param {number} buddhistYear - ปี พ.ศ.
 * @returns {number} - ปี ค.ศ.
 */
export const toChristianYear = (buddhistYear) => {
  return buddhistYear - 543;
};

/**
 * ตรวจสอบว่าวันที่อยู่ในช่วงหรือไม่
 * @param {string|Date|dayjs} date - วันที่ที่ต้องการตรวจสอบ
 * @param {string|Date|dayjs} startDate - วันที่เริ่มต้น
 * @param {string|Date|dayjs} endDate - วันที่สิ้นสุด
 * @returns {boolean} - true ถ้าอยู่ในช่วง
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate || !endDate) return false;
  
  try {
    const checkDate = dayjs(date);
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    return checkDate.isBetween(start, end, 'day', '[]'); // รวมวันเริ่มต้นและสิ้นสุด
  } catch (error) {
    console.error('Error checking date range:', error);
    return false;
  }
};

/**
 * สร้าง array ของวันที่ในช่วงที่กำหนด
 * @param {string|Date|dayjs} startDate - วันที่เริ่มต้น
 * @param {string|Date|dayjs} endDate - วันที่สิ้นสุด
 * @returns {Array} - array ของวันที่
 */
export const getDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  try {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const dates = [];
    
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.toDate());
      current = current.add(1, 'day');
    }
    
    return dates;
  } catch (error) {
    console.error('Error getting date range:', error);
    return [];
  }
};

// Export default สำหรับการใช้งานทั่วไป
const dateUtils = {
  formatThaiDate,
  formatOfficialDate,
  calculateDateDiff,
  calculateInternshipDays,
  isFutureDate,
  isPastDate,
  parseThaiDate,
  formatDurationText,
  getCurrentThaiDate,
  toBuddhistYear,
  toChristianYear,
  isDateInRange,
  getDateRange,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  THAI_DAYS,
  THAI_DAYS_SHORT
};

export default dateUtils;