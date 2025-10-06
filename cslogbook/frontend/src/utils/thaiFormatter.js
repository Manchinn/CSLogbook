/**
 * Thai Formatter Utilities
 * ยูทิลิตี้สำหรับจัดรูปแบบข้อความภาษาไทย
 */

/**
 * ตัวเลขไทย
 */
export const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

/**
 * ตัวเลขบาห์ต
 */
export const THAI_BAHT_UNITS = [
  '', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน', 'สิบล้าน', 'ร้อยล้าน', 'พันล้าน'
];

/**
 * ตัวเลขหลักหน่วย
 */
export const THAI_DIGITS_TEXT = [
  'ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'
];

/**
 * แปลงตัวเลขอารบิกเป็นตัวเลขไทย
 * @param {string|number} number - ตัวเลขที่ต้องการแปลง
 * @returns {string} - ตัวเลขไทย
 */
export const toThaiDigits = (number) => {
  if (number === null || number === undefined) return '';
  
  try {
    return String(number).replace(/[0-9]/g, (digit) => THAI_DIGITS[parseInt(digit)]);
  } catch (error) {
    console.error('Error converting to Thai digits:', error);
    return String(number);
  }
};

/**
 * แปลงตัวเลขไทยเป็นตัวเลขอารบิก
 * @param {string} thaiNumber - ตัวเลขไทย
 * @returns {string} - ตัวเลขอารบิก
 */
export const fromThaiDigits = (thaiNumber) => {
  if (!thaiNumber) return '';
  
  try {
    let result = thaiNumber;
    THAI_DIGITS.forEach((thaiDigit, index) => {
      result = result.replace(new RegExp(thaiDigit, 'g'), index.toString());
    });
    return result;
  } catch (error) {
    console.error('Error converting from Thai digits:', error);
    return thaiNumber;
  }
};

/**
 * แปลงตัวเลขเป็นข้อความไทย (สำหรับจำนวนเงิน)
 * @param {number} number - ตัวเลขที่ต้องการแปลง
 * @returns {string} - ข้อความไทย
 */
export const numberToThaiText = (number) => {
  if (number === 0) return 'ศูนย์';
  if (number < 0) return 'ลบ' + numberToThaiText(-number);
  
  try {
    const numberStr = Math.floor(number).toString();
    const length = numberStr.length;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const digit = parseInt(numberStr[i]);
      const position = length - i - 1;
      
      if (digit === 0) continue;
      
      // จัดการกรณีพิเศษ
      if (position === 1 && digit === 1 && length > 1) {
        result += 'สิบ';
      } else if (position === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (position === 0 && digit === 1 && length > 1 && parseInt(numberStr[length - 2]) > 0) {
        result += 'เอ็ด';
      } else {
        result += THAI_DIGITS_TEXT[digit];
        if (position > 0) {
          result += THAI_BAHT_UNITS[position];
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error converting number to Thai text:', error);
    return String(number);
  }
};

/**
 * จัดรูปแบบเบอร์โทรศัพท์ไทย
 * @param {string} phoneNumber - เบอร์โทรศัพท์
 * @returns {string} - เบอร์โทรศัพท์ที่จัดรูปแบบแล้ว
 */
export const formatThaiPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  try {
    // ลบอักขระที่ไม่ใช่ตัวเลข
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // เบอร์มือถือ (08x-xxx-xxxx หรือ 06x-xxx-xxxx)
    if (cleanNumber.length === 10 && (cleanNumber.startsWith('08') || cleanNumber.startsWith('06'))) {
      return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    // เบอร์บ้าน (0x-xxx-xxxx)
    if (cleanNumber.length === 9 && cleanNumber.startsWith('0')) {
      return cleanNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    // เบอร์บ้าน (0xx-xxx-xxx)
    if (cleanNumber.length === 9 && cleanNumber.startsWith('0')) {
      return cleanNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    }
    
    return cleanNumber;
  } catch (error) {
    console.error('Error formatting Thai phone number:', error);
    return phoneNumber;
  }
};

/**
 * จัดรูปแบบรหัสนักศึกษา
 * @param {string} studentId - รหัสนักศึกษา
 * @returns {string} - รหัสนักศึกษาที่จัดรูปแบบแล้ว
 */
export const formatStudentId = (studentId) => {
  if (!studentId) return '';
  
  try {
    const cleanId = studentId.replace(/\D/g, '');
    
    return cleanId;
  } catch (error) {
    console.error('Error formatting student ID:', error);
    return studentId;
  }
};

/**
 * ตัดข้อความให้มีความยาวที่กำหนด
 * @param {string} text - ข้อความ
 * @param {number} length - ความยาวสูงสุด
 * @param {string} suffix - ข้อความต่อท้าย (เช่น ...)
 * @returns {string} - ข้อความที่ตัดแล้ว
 */
export const truncateText = (text, length = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length - suffix.length) + suffix;
};

/**
 * ทำความสะอาดข้อความ (แก้ไขเพื่อป้องกัน TypeError)
 * @param {any} input - ข้อมูลที่ต้องการทำความสะอาด
 * @returns {string} - ข้อความที่สะอาดแล้ว
 */
export const cleanText = (input) => {
  try {
    // ตรวจสอบว่า input เป็น null หรือ undefined
    if (input === null || input === undefined) {
      return '';
    }

    // ถ้า input เป็น string แล้ว
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[<>]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    // ถ้า input เป็น number
    if (typeof input === 'number') {
      return String(input);
    }

    // ถ้า input เป็น boolean
    if (typeof input === 'boolean') {
      return input ? 'true' : 'false';
    }

    // ถ้า input เป็น object หรือ array
    if (typeof input === 'object') {
      if (Array.isArray(input)) {
        return input.join(', ');
      }
      return JSON.stringify(input);
    }

    // สำหรับกรณีอื่นๆ แปลงเป็น string ก่อน
    return String(input).trim();

  } catch (error) {
    console.warn('cleanText error:', error, 'Input:', input, 'Type:', typeof input);
    return '';
  }
};

/**
 * เพิ่มช่องว่างให้กับข้อความภาษาไทย (เพื่อการแสดงผลที่ดีขึ้น)
 * @param {string} text - ข้อความภาษาไทย
 * @returns {string} - ข้อความที่เพิ่มช่องว่างแล้ว
 */
export const addThaiSpacing = (text) => {
  if (!text) return '';
  
  try {
    return text
      .replace(/([ก-๙])([a-zA-Z0-9])/g, '$1 $2') // เพิ่มช่องว่างระหว่างไทย-อังกฤษ/ตัวเลข
      .replace(/([a-zA-Z0-9])([ก-๙])/g, '$1 $2') // เพิ่มช่องว่างระหว่างอังกฤษ/ตัวเลข-ไทย
      .replace(/\s+/g, ' ') // ลบช่องว่างซ้ำ
      .trim();
  } catch (error) {
    console.error('Error adding Thai spacing:', error);
    return text;
  }
};

/**
 * จัดรูปแบบชื่อ-นามสกุล
 * @param {string} firstName - ชื่อ
 * @param {string} lastName - นามสกุล
 * @param {string} title - คำนำหน้า (นาง, นาย, น.ส.)
 * @returns {string} - ชื่อเต็มที่จัดรูปแบบแล้ว
 */
export const formatFullName = (firstName, lastName, title = '') => {
  if (!firstName && !lastName) return '';
  
  const cleanTitle = title ? cleanText(title).trim() : '';
  const cleanFirstName = firstName ? cleanText(firstName).trim() : '';
  const cleanLastName = lastName ? cleanText(lastName).trim() : '';
  
  const parts = [cleanTitle, cleanFirstName, cleanLastName].filter(part => part);
  return parts.join(' ');
};

/**
 * ตรวจสอบว่าเป็นข้อความภาษาไทยหรือไม่
 * @param {string} text - ข้อความ
 * @returns {boolean} - true ถ้าเป็นข้อความภาษาไทย
 */
export const isThaiText = (text) => {
  if (!text) return false;
  
  const thaiPattern = /[\u0E00-\u0E7F]/;
  return thaiPattern.test(text);
};

/**
 * จัดรูปแบบที่อยู่ไทย
 * @param {Object} address - ข้อมูลที่อยู่
 * @returns {string} - ที่อยู่ที่จัดรูปแบบแล้ว
 */
export const formatThaiAddress = (address) => {
  if (!address) return '';
  
  const {
    houseNumber = '',
    soi = '',
    road = '',
    subDistrict = '',
    district = '',
    province = '',
    postalCode = ''
  } = address;
  
  const parts = [];
  
  if (houseNumber) parts.push(`เลขที่ ${houseNumber}`);
  if (soi) parts.push(`ซอย ${soi}`);
  if (road) parts.push(`ถนน ${road}`);
  if (subDistrict) parts.push(`ตำบล${subDistrict}`);
  if (district) parts.push(`อำเภอ${district}`);
  if (province) parts.push(`จังหวัด${province}`);
  if (postalCode) parts.push(postalCode);
  
  return parts.join(' ');
};

/**
 * จัดรูปแบบจำนวนเงินเป็นบาท
 * @param {number} amount - จำนวนเงิน
 * @param {boolean} showUnit - แสดงหน่วย "บาท" หรือไม่
 * @returns {string} - จำนวนเงินที่จัดรูปแบบแล้ว
 */
export const formatCurrency = (amount, showUnit = true) => {
  if (amount === null || amount === undefined) return '';
  
  try {
    const formatter = new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const formatted = formatter.format(amount);
    return showUnit ? `${formatted} บาท` : formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return String(amount);
  }
};

/**
 * จัดรูปแบบเปอร์เซ็นต์
 * @param {number} value - ค่าเปอร์เซ็นต์ (0-1)
 * @param {number} decimals - จำนวนทศนิยม
 * @returns {string} - เปอร์เซ็นต์ที่จัดรูปแบบแล้ว
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  try {
    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return String(value);
  }
};

/**
 * สร้างข้อความสำหรับจำนวนหน่วยกิต
 * @param {number} credits - จำนวนหน่วยกิต
 * @returns {string} - ข้อความหน่วยกิต
 */
export const formatCredits = (credits) => {
  if (!credits || credits === 0) return '0 หน่วยกิต';
  
  return `${credits} หน่วยกิต`;
};

/**
 * จัดรูปแบบปีการศึกษา
 * @param {number} year - ปี ค.ศ.
 * @param {number} semester - เทอม (1 หรือ 2)
 * @returns {string} - ปีการศึกษาที่จัดรูปแบบแล้ว
 */
export const formatAcademicYear = (year, semester = null) => {
  if (!year) return '';
  
  const buddhistYear = year + 543;
  const nextBuddhistYear = buddhistYear + 1;
  
  if (semester) {
    return `ปีการศึกษา ${buddhistYear}/${nextBuddhistYear} เทอม ${semester}`;
  }
  
  return `ปีการศึกษา ${buddhistYear}/${nextBuddhistYear}`;
};

/**
 * จัดรูปแบบชั้นปี
 * @param {number} yearLevel - ชั้นปี
 * @returns {string} - ชั้นปีที่จัดรูปแบบแล้ว
 */
export const formatYearLevel = (yearLevel) => {
  if (!yearLevel) return '';
  
  const yearMap = {
    1: 'ปี 1',
    2: 'ปี 2', 
    3: 'ปี 3',
    4: 'ปี 4',
    5: 'ปี 5',
    6: 'ปี 6'
  };
  
  return yearMap[yearLevel] || `ปี ${yearLevel}`;
};

/**
 * จัดรูปแบบสถานะเอกสาร
 * @param {string} status - สถานะ
 * @returns {Object} - ข้อมูลสถานะที่จัดรูปแบบแล้ว
 */
export const formatDocumentStatus = (status) => {
  const statusMap = {
    pending: { text: 'รอการพิจารณา', color: 'orange', icon: '⏳' },
    approved: { text: 'อนุมัติแล้ว', color: 'green', icon: '✅' },
    rejected: { text: 'ไม่อนุมัติ', color: 'red', icon: '❌' },
    draft: { text: 'ร่าง', color: 'blue', icon: '📄' },
    submitted: { text: 'ส่งแล้ว', color: 'cyan', icon: '📤' },
    completed: { text: 'เสร็จสิ้น', color: 'green', icon: '🎉' }
  };
  
  return statusMap[status] || { text: status, color: 'default', icon: '❓' };
};

/**
 * ฟังก์ชันตรวจสอบและแปลงข้อมูลให้ปลอดภัย
 * @param {any} value - ข้อมูลที่ต้องการตรวจสอบ
 * @param {string} fallback - ค่าสำรองถ้าข้อมูลไม่ถูกต้อง
 * @returns {string} - ข้อมูลที่ปลอดภัย
 */
export const safeString = (value, fallback = '') => {
  try {
    if (value === null || value === undefined) {
      return fallback;
    }
    
    if (typeof value === 'string') {
      return value.trim();
    }
    
    return String(value).trim();
  } catch (error) {
    console.warn('safeString error:', error, 'Value:', value);
    return fallback;
  }
};

/**
 * ตรวจสอบว่าข้อมูลเป็น object ที่ใช้งานได้หรือไม่
 * @param {any} obj - object ที่ต้องการตรวจสอบ
 * @returns {boolean} - ผลการตรวจสอบ
 */
export const isValidObject = (obj) => {
  return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
};

/**
 * ตรวจสอบว่าข้อมูลเป็น array ที่ใช้งานได้หรือไม่
 * @param {any} arr - array ที่ต้องการตรวจสอบ
 * @returns {boolean} - ผลการตรวจสอบ
 */
export const isValidArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

// Export default สำหรับการใช้งานทั่วไป
const thaiFormatter = {
  toThaiDigits,
  fromThaiDigits,
  numberToThaiText,
  formatThaiPhoneNumber,
  formatStudentId,
  truncateText,
  cleanText,
  addThaiSpacing,
  formatFullName,
  isThaiText,
  formatThaiAddress,
  formatCurrency,
  formatPercentage,
  formatCredits,
  formatAcademicYear,
  formatYearLevel,
  formatDocumentStatus,
  THAI_DIGITS,
  THAI_BAHT_UNITS,
  THAI_DIGITS_TEXT
};

export default thaiFormatter;