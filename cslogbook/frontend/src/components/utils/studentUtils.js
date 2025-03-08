// เพิ่ม constants สำหรับค่าคงที่
const THAI_YEAR_OFFSET = 543;
const MAX_STUDY_YEARS = 8;
const MIN_STUDENT_CODE_LENGTH = 13;
const ACADEMIC_MONTH_THRESHOLD = 4;

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @returns {object} - ผลการคำนวณชั้นปี
 */
export const calculateStudentYear = (studentCode) => {
  // ตรวจสอบ input
  if (!studentCode) {
    return {
      error: true,
      message: 'รหัสนักศึกษาไม่ถูกต้อง'
    };
  }

  try {
    const studentCodeStr = String(studentCode);
    
    // ตรวจสอบความยาวรหัสนักศึกษา
    if (studentCodeStr.length !== MIN_STUDENT_CODE_LENGTH) {
      return {
        error: true,
        message: `รหัสนักศึกษาต้องมี ${MIN_STUDENT_CODE_LENGTH} หลัก`
      };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() + THAI_YEAR_OFFSET;
    const currentMonth = currentDate.getMonth() + 1;
    const studentYear = parseInt(studentCodeStr.substring(0, 2)) + 2500;
    let studentClassYear = currentYear - studentYear;

    // ตรวจสอบความถูกต้องของปี
    if (studentClassYear < 0) {
      return {
        error: true,
        message: 'ปีการศึกษาไม่ถูกต้อง'
      };
    }

    // เพิ่มชั้นปีถ้าผ่านเดือนเมษายน
    if (currentMonth > ACADEMIC_MONTH_THRESHOLD) {
      studentClassYear += 1;
    }

    // ตรวจสอบชั้นปีสูงสุด
    if (studentClassYear > MAX_STUDY_YEARS) {
      return {
        error: true,
        message: `เกินระยะเวลาการศึกษาสูงสุด ${MAX_STUDY_YEARS} ปี`
      };
    }

    return {
      error: false,
      year: studentClassYear
    };
  } catch (error) {
    console.error('Error calculating student year:', error);
    return {
      error: true,
      message: 'เกิดข้อผิดพลาดในการคำนวณชั้นปี'
    };
  }
};

/**
 * ตรวจสอบสิทธิ์การฝึกงาน
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
export const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < 3) {
    console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ 3 ขึ้นไป');
    return { eligible: false, message: 'ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ 3 ขึ้นไป' };
  }
  if (totalCredits < 81) {
    console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: หน่วยกิตสะสม < 81');
    return { eligible: false, message: 'ไม่ผ่านเงื่อนไขการฝึกงาน: หน่วยกิตสะสม < 81' };
  }
  return { eligible: true, message: 'ผ่านเงื่อนไขการฝึกงาน' };
};

/**
 * ตรวจสอบสิทธิ์การทำโปรเจค
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @param {number} majorCredits - หน่วยกิตภาควิชา
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
export const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
  if (studentYear < 4) {
    console.log('ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ 4 ขึ้นไป');
    return { eligible: false, message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ 4 ขึ้นไป' };
  }
  if (totalCredits < 95) {
    console.log('ไม่ผ่านเงื่อนไขการทำโปรเจค: หน่วยกิตรวม < 95');
    return { eligible: false, message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: หน่วยกิตรวม < 95' };
  }
  if (majorCredits < 57) {
    console.log('ไม่ผ่านเงื่อนไขการทำโปรเจค: หน่วยกิตภาควิชา < 57');
    return { eligible: false, message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: หน่วยกิตภาควิชา < 57' };
  }
  return { eligible: true, message: 'ผ่านเงื่อนไขการทำโปรเจค' };
};