import { DOCUMENT_STATUS, STUDENT_STATUS } from './adminConstants';
import moment from 'moment-timezone';

// ฟังก์ชันแปลงสถานะเป็นข้อความภาษาไทย
export const translateStatus = (status) => {
  const statusMap = {
    [DOCUMENT_STATUS.PENDING]: 'รอการตรวจสอบ',
    [DOCUMENT_STATUS.APPROVED]: 'อนุมัติแล้ว',
    [DOCUMENT_STATUS.REJECTED]: 'ไม่อนุมัติ',
    [STUDENT_STATUS.ELIGIBLE_INTERNSHIP]: 'มีสิทธิ์ฝึกงาน',
    [STUDENT_STATUS.ELIGIBLE_PROJECT]: 'มีสิทธิ์ทำโครงงาน',
    [STUDENT_STATUS.IN_PROGRESS_INTERNSHIP]: 'กำลังฝึกงาน',
    [STUDENT_STATUS.IN_PROGRESS_PROJECT]: 'กำลังทำโครงงาน',
    [STUDENT_STATUS.COMPLETED_INTERNSHIP]: 'ฝึกงานเสร็จสิ้น',
    [STUDENT_STATUS.COMPLETED_PROJECT]: 'โครงงานเสร็จสิ้น'
  };
  
  return statusMap[status] || status;
};

// ฟังก์ชันจัดรูปแบบวันที่
export const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '-';
  return moment(date).format(format);
};

// ฟังก์ชันจัดรูปแบบชื่อเต็ม
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return '-';
  return `${firstName || ''} ${lastName || ''}`.trim();
};

// ฟังก์ชันกรองข้อมูลตามคีย์เวิร์ด
export const filterByKeyword = (items, keyword, fields) => {
  if (!keyword || keyword.trim() === '') return items;
  
  const lowercaseKeyword = keyword.toLowerCase();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowercaseKeyword);
    });
  });
};

// ฟังก์ชันแยกชื่อไฟล์จาก path
export const extractFilenameFromPath = (path) => {
  if (!path) return '';
  const pathParts = path.split('/');
  return pathParts[pathParts.length - 1];
};

// แปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
