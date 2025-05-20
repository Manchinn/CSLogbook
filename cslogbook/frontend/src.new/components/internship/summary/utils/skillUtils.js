// filepath: c:\Users\chinn\CSLog\cslogbook\frontend\src\components\internship\summary\utils\skillUtils.js
/**
 * เลือกสีตามเปอร์เซ็นต์ของทักษะ
 * @param {number} percentage เปอร์เซ็นต์ของทักษะ
 * @returns {string} รหัสสีในรูปแบบ hex
 */
export function getSkillColor(percentage) {
  if (percentage >= 70) return '#52c41a'; // เขียว
  if (percentage >= 40) return '#1890ff'; // น้ำเงิน
  return '#faad14'; // เหลือง
}

/**
 * เลือกสีสำหรับแท็กทักษะ
 * @param {number} index ลำดับของทักษะ
 * @returns {string} รหัสสีที่คำนวณได้
 */
export function getTagColor(index) {
  // สีสำหรับ tag ทักษะต่างๆ
  const colors = [
    '#1890ff', '#52c41a', '#722ed1', '#eb2f96', '#faad14', 
    '#13c2c2', '#fa8c16', '#a0d911', '#fa541c', '#2f54eb'
  ];
  return colors[index % colors.length];
}

/**
 * คำนวณสถานะความสมบูรณ์ตามจำนวนชั่วโมง
 * @param {number} hours จำนวนชั่วโมงที่มี
 * @returns {Object} สถานะความสมบูรณ์
 */
export function calculateCompletionStatus(hours) {
  const targetHours = 240;
  const percentage = Math.min(Math.round((hours / targetHours) * 100), 100);
  
  let status = 'normal';
  if (percentage >= 100) {
    status = 'success';
  } else if (percentage >= 70) {
    status = 'active';
  } else if (percentage < 30) {
    status = 'exception';
  }
  
  return {
    percentage,
    status
  };
}
