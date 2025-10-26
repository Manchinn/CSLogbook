/**
 * Buddhist Era Locale for Ant Design DatePicker
 * Locale สำหรับ DatePicker ที่รองรับพุทธศักราช
 */

import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import thTH from 'antd/locale/th_TH';

// ตั้งค่า dayjs
dayjs.extend(buddhistEra);
dayjs.locale('th');

/**
 * Custom locale สำหรับ DatePicker ที่รองรับพุทธศักราช
 */
const buddhistLocale = {
  ...thTH,
  DatePicker: {
    ...thTH.DatePicker,
    lang: {
      ...thTH.DatePicker.lang,
      // ปรับแต่งรูปแบบวันที่ให้ใช้พุทธศักราช
      dateFormat: 'DD/MM/BBBB',
      dateTimeFormat: 'DD/MM/BBBB HH:mm:ss',
      monthFormat: 'MMMM',
      yearFormat: 'BBBB',
      
      // ข้อความต่างๆ
      today: 'วันนี้',
      now: 'ตอนนี้',
      backToToday: 'กลับไปยังวันนี้',
      ok: 'ตกลง',
      clear: 'ลบล้าง',
      week: 'สัปดาห์',
      month: 'เดือน',
      year: 'ปี',
      timeSelect: 'เลือกเวลา',
      dateSelect: 'เลือกวัน',
      monthSelect: 'เลือกเดือน',
      yearSelect: 'เลือกปี',
      decadeSelect: 'เลือกทศวรรษ',
      
      // Navigation
      previousMonth: 'เดือนก่อนหน้า (PageUp)',
      nextMonth: 'เดือนถัดไป (PageDown)',
      previousYear: 'ปีก่อนหน้า (Control + left)',
      nextYear: 'ปีถัดไป (Control + right)',
      previousDecade: 'ทศวรรษก่อนหน้า',
      nextDecade: 'ทศวรรษถัดไป',
      previousCentury: 'ศตวรรษก่อนหน้า',
      nextCentury: 'ศตวรรษถัดไป',
      
      // Placeholders
      placeholder: 'เลือกวันที่',
      yearPlaceholder: 'เลือกปี',
      quarterPlaceholder: 'เลือกไตรมาส',
      monthPlaceholder: 'เลือกเดือน',
      weekPlaceholder: 'เลือกสัปดาห์',
      rangePlaceholder: ['วันเริ่มต้น', 'วันสิ้นสุด'],
      rangeYearPlaceholder: ['ปีเริ่มต้น', 'ปีสิ้นสุด'],
      rangeMonthPlaceholder: ['เดือนเริ่มต้น', 'เดือนสิ้นสุด'],
      rangeWeekPlaceholder: ['สัปดาห์เริ่มต้น', 'สัปดาห์สิ้นสุด'],
      
      // รายชื่อเดือนภาษาไทย
      monthNames: [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ],
      
      // รายชื่อเดือนแบบสั้น
      monthNamesShort: [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ],
      
      // รายชื่อวันภาษาไทย
      dayNames: [
        'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 
        'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
      ],
      
      // รายชื่อวันแบบสั้น
      dayNamesShort: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
      
      // รายชื่อวันแบบสั้นมาก
      dayNamesMin: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    }
  },
  
  // Calendar locale
  Calendar: {
    ...thTH.Calendar,
    lang: {
      ...thTH.Calendar.lang,
      dateFormat: 'DD/MM/BBBB',
      dateTimeFormat: 'DD/MM/BBBB HH:mm:ss',
      monthFormat: 'MMMM',
      yearFormat: 'BBBB'
    }
  }
};

/**
 * ฟังก์ชันสำหรับแปลงวันที่เป็นพุทธศักราช
 * @param {dayjs.Dayjs} date - วันที่
 * @returns {string} - วันที่ในรูปแบบพุทธศักราช
 */
export const formatBuddhistDate = (date, format = 'DD/MM/BBBB') => {
  if (!date) return '';
  
  try {
    return dayjs(date).format(format);
  } catch (error) {
    console.error('Error formatting Buddhist date:', error);
    return '';
  }
};

/**
 * ฟังก์ชันสำหรับแปลงวันที่และเวลาเป็นพุทธศักราช
 * @param {dayjs.Dayjs} date - วันที่และเวลา
 * @returns {string} - วันที่และเวลาในรูปแบบพุทธศักราช
 */
export const formatBuddhistDateTime = (date) => {
  return formatBuddhistDate(date, 'DD/MM/BBBB HH:mm');
};

/**
 * ฟังก์ชันสำหรับสร้าง dayjs object ที่รองรับพุทธศักราช
 * @param {any} date - วันที่
 * @returns {dayjs.Dayjs} - dayjs object
 */
export const createBuddhistDayjs = (date) => {
  const dayjsDate = dayjs(date);
  dayjsDate.locale('th');
  return dayjsDate;
};

export default buddhistLocale;