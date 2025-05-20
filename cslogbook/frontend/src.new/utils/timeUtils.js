import dayjs from './dayjs'; // Updated import path
import { DATE_FORMAT_SHORT } from './constants';

export const calculateWorkHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;
  
  // แปลงวิธีการคำนวณให้ตรงกับ backend
  const timeInParts = timeIn.split(':');
  const timeOutParts = timeOut.split(':');
  
  const timeInMinutes = parseInt(timeInParts[0]) * 60 + parseInt(timeInParts[1]);
  const timeOutMinutes = parseInt(timeOutParts[0]) * 60 + parseInt(timeOutParts[1]);
  
  // ปัดเป็นครึ่งชั่วโมง (เหมือนใน backend)
  return Math.round((timeOutMinutes - timeInMinutes) / 30) / 2;
};

export const getEntryStatus = (entry) => {
  if (!entry.timeIn) return "pending"; // ยังไม่ได้เข้างาน
  if (entry.timeIn && !entry.timeOut) return "incomplete"; // เข้างานแล้วแต่ยังไม่ออก
  if (!entry.workDescription || !entry.logTitle) return "incomplete"; // ข้อมูลไม่ครบ
  if (!entry.supervisorApproved || !entry.advisorApproved) return "submitted"; // รอการอนุมัติ
  return "approved"; // อนุมัติแล้ว
};

// เพิ่มฟังก์ชันใหม่
export const getCurrentThaiYear = () => {
  return dayjs().year() + 543;
};

export const formatThaiDate = (date, format = DATE_FORMAT_SHORT) => {
  return dayjs(date).format(format);
};
