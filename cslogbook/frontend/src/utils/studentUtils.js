// Constants
export const THAI_YEAR_OFFSET = 543;
export const MAX_STUDY_YEARS = 8;
export const MIN_STUDENT_CODE_LENGTH = 13;
export const ACADEMIC_MONTH_THRESHOLD = 4;

export const INTERNSHIP_REQUIREMENTS = {
  MIN_YEAR: 3,
  MIN_TOTAL_CREDITS: 81
};

export const PROJECT_REQUIREMENTS = {
  MIN_YEAR: 4,
  MIN_TOTAL_CREDITS: 95,
  MIN_MAJOR_CREDITS: 57
};

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @returns {object} - ผลการคำนวณชั้นปี
 */
export const calculateStudentYear = (studentCode) => {
  if (!studentCode) {
    return { 
      error: true,
      message: 'รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบข้อมูล'
    };
  }

  try {
    const studentCodeStr = String(studentCode);
    
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

    if (studentClassYear < 0) {
      return {
        error: true,
        message: 'ปีการศึกษาไม่ถูกต้อง'
      };
    }

    if (currentMonth > ACADEMIC_MONTH_THRESHOLD) {
      studentClassYear += 1;
    }

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
 */
export const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < INTERNSHIP_REQUIREMENTS.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ ${INTERNSHIP_REQUIREMENTS.MIN_YEAR} ขึ้นไป` 
    };
  }
  
  if (totalCredits < INTERNSHIP_REQUIREMENTS.MIN_TOTAL_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย ${INTERNSHIP_REQUIREMENTS.MIN_TOTAL_CREDITS} หน่วยกิต` 
    };
  }
  
  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการฝึกงาน' 
  };
};

/**
 * ตรวจสอบสิทธิ์การทำโปรเจค
 */
export const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
  if (studentYear < PROJECT_REQUIREMENTS.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ ${PROJECT_REQUIREMENTS.MIN_YEAR} ขึ้นไป` 
    };
  }
  
  if (totalCredits < PROJECT_REQUIREMENTS.MIN_TOTAL_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตรวมอย่างน้อย ${PROJECT_REQUIREMENTS.MIN_TOTAL_CREDITS} หน่วยกิต` 
    };
  }
  
  if (majorCredits < PROJECT_REQUIREMENTS.MIN_MAJOR_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตภาควิชาอย่างน้อย ${PROJECT_REQUIREMENTS.MIN_MAJOR_CREDITS} หน่วยกิต` 
    };
  }

  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการทำโปรเจค' 
  };
};