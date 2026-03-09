const dayjs = require('dayjs');
const { sequelize } = require('../config/database');

/**
 * คำนวณวันทำงานในช่วงที่กำหนด (ไม่รวมวันเสาร์-อาทิตย์)
 * @param {string} startDate - วันเริ่มต้น (YYYY-MM-DD)
 * @param {string} endDate - วันสิ้นสุด (YYYY-MM-DD)
 * @returns {Promise<string[]>} - รายการวันที่ทำงาน (YYYY-MM-DD)
 */
exports.calculateWorkdays = async (startDate, endDate) => {
  try {
    const workdays = [];
    let currentDate = dayjs(startDate);
    const lastDate = dayjs(endDate);
    
    while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
      const formattedDate = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.day(); // 0 = อาทิตย์, 6 = เสาร์
      
      // ข้ามเฉพาะวันเสาร์-อาทิตย์
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workdays.push(formattedDate);
      }
      
      currentDate = currentDate.add(1, 'day');
    }
    
    return workdays;
  } catch (error) {
    console.error('Error calculating workdays:', error);
    throw error;
  }
};

/**
 * คำนวณจำนวนชั่วโมงทำงาน
 * @param {string} timeIn - เวลาเข้างาน (HH:mm)
 * @param {string} timeOut - เวลาออกงาน (HH:mm)
 * @returns {number} จำนวนชั่วโมงทำงาน
 */
/**
 * จัดรูปแบบวันที่เป็นภาษาไทย เช่น "1 มกราคม พ.ศ. 2568"
 * @param {Date|string} date - วันที่
 * @returns {string}
 */
exports.formatThaiDate = (date) => {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} พ.ศ. ${year}`;
};

exports.calculateWorkHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;
  
  const [inHour, inMinute] = timeIn.split(':').map(Number);
  const [outHour, outMinute] = timeOut.split(':').map(Number);
  
  let hours = outHour - inHour;
  let minutes = outMinute - inMinute;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  // คำนวณชั่วโมงรวม
  const totalHours = hours + (minutes / 60);
  return parseFloat(totalHours.toFixed(1));
};