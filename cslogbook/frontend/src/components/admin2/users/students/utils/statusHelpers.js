import { STUDENT_STATUS } from '../../../../../utils/adminConstants';

// รับค่าสถานะเป็นข้อความภาษาไทย
export const getStatusText = (status, student) => {
  // ถ้าไม่มี status หรือในกรณีที่ต้องการแสดงจาก boolean fields
  if (!status && student) {
    const statusTexts = [];

    if (student.isEligibleForProject) {
      statusTexts.push('มีสิทธิ์ทำโครงงานพิเศษ');
    }

    if (student.isEligibleForInternship) {
      statusTexts.push('มีสิทธิ์ฝึกงาน');
    }

    if (statusTexts.length === 0) {
      return 'ไม่มีสิทธิ์';
    }

    return statusTexts.join(', ');
  }

  switch (status) {
    case STUDENT_STATUS.ELIGIBLE_INTERNSHIP:
      return 'มีสิทธิ์ฝึกงาน';
    case STUDENT_STATUS.ELIGIBLE_PROJECT:
      return 'มีสิทธิ์ทำโครงงานพิเศษ';
    case STUDENT_STATUS.IN_PROGRESS_INTERNSHIP:
      return 'กำลังฝึกงาน';
    case STUDENT_STATUS.IN_PROGRESS_PROJECT:
      return 'กำลังทำโครงงาน';
    case STUDENT_STATUS.COMPLETED_INTERNSHIP:
      return 'ฝึกงานเสร็จสิ้น';
    case STUDENT_STATUS.COMPLETED_PROJECT:
      return 'โครงงานเสร็จสิ้น';
    default:
      return 'ไม่มีสิทธิ์';
  }
};

// ฟังก์ชันสร้าง tags จากสถานะนักศึกษา
export const getStatusTags = (student) => {
  const tags = [];

  // ตรวจสอบจาก boolean fields โดยตรง (ไม่ขึ้นกับ status)
  if (student.isEligibleForProject) {
    tags.push({ color: 'green', text: 'มีสิทธิ์ทำโครงงานพิเศษ' });
  }

  if (student.isEligibleForInternship) {
    tags.push({ color: 'blue', text: 'มีสิทธิ์ฝึกงาน' });
  }

  // ตรวจสอบสถานะการทำงานจาก status field (ถ้ามี)
  if (student.status) {
    switch (student.status) {
      case STUDENT_STATUS.IN_PROGRESS_INTERNSHIP:
        tags.push({ color: 'processing', text: 'กำลังฝึกงาน' });
        break;
      case STUDENT_STATUS.IN_PROGRESS_PROJECT:
        tags.push({ color: 'processing', text: 'กำลังทำโครงงาน' });
        break;
      case STUDENT_STATUS.COMPLETED_INTERNSHIP:
        tags.push({ color: 'success', text: 'ฝึกงานเสร็จสิ้น' });
        break;
      case STUDENT_STATUS.COMPLETED_PROJECT:
        tags.push({ color: 'success', text: 'โครงงานเสร็จสิ้น' });
        break;
    }
  }

  // ถ้าไม่มีสถานะใดๆ เลย
  if (tags.length === 0) {
    tags.push({ color: 'error', text: 'ไม่มีสิทธิ์' });
  }

  return tags;
};