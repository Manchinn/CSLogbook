// Constants
export const THAI_YEAR_OFFSET = 543;
export const MAX_STUDY_YEARS = 8;
export const MIN_STUDENT_CODE_LENGTH = 13;
export const ACADEMIC_MONTH_THRESHOLD = 4;

/**
 * เปลี่ยนจาก INTERNSHIP_REQUIREMENTS และ PROJECT_REQUIREMENTS เป็น function ที่สามารถรับค่าจาก API ได้
 */
export const getInternshipRequirements = (requirements) => {
  // ถ้ามีค่าจาก backend ให้ใช้ค่าจาก backend
  if (requirements) {
    return {
      MIN_YEAR: requirements.minYear || 3,
      MIN_TOTAL_CREDITS: requirements.totalCredits || 81
    };
  }
  
  // ถ้าไม่มีค่าจาก backend ให้ใช้ค่า default
  return {
    MIN_YEAR: 3,
    MIN_TOTAL_CREDITS: 81
  };
};

export const getProjectRequirements = (requirements) => {
  // ถ้ามีค่าจาก backend ให้ใช้ค่าจาก backend
  if (requirements) {
    return {
      MIN_YEAR: requirements.minYear ,
      MIN_TOTAL_CREDITS: requirements.totalCredits,
      MIN_MAJOR_CREDITS: requirements.majorCredits 
    };
  }
  
  // ถ้าไม่มีค่าจาก backend ให้ใช้ค่า default
  return {
    MIN_YEAR: 4,
    MIN_TOTAL_CREDITS: 95,
    MIN_MAJOR_CREDITS: 59
  };
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
 * @param {number|object} studentYear - ชั้นปีของนักศึกษา (อาจเป็นตัวเลขหรือออบเจ็คที่มี year)
 * @param {number} totalCredits - หน่วยกิตรวม
 * @param {number} majorCredits - หน่วยกิตวิชาเอก (ไม่จำเป็นสำหรับการฝึกงาน)
 * @param {object} requirements - เงื่อนไขการฝึกงานจาก backend
 * @returns {object} - ผลการตรวจสอบสิทธิ์
 */
export const isEligibleForInternship = (studentYear, totalCredits, majorCredits, requirements = null) => {
  // รับค่าชั้นปีทั้งจากตัวเลขหรือจากออบเจ็ค
  const year = typeof studentYear === 'object' ? studentYear.year : studentYear;
  
  // ใช้ function getInternshipRequirements ที่สร้างขึ้น
  const REQUIREMENTS = getInternshipRequirements(requirements);
  
  if (year < REQUIREMENTS.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ ${REQUIREMENTS.MIN_YEAR} ขึ้นไป` 
    };
  }
  
  if (totalCredits < REQUIREMENTS.MIN_TOTAL_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย ${REQUIREMENTS.MIN_TOTAL_CREDITS} หน่วยกิต` 
    };
  }
  
  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการฝึกงาน' 
  };
};

/**
 * ตรวจสอบสิทธิ์การทำโปรเจค
 * @param {number|object} studentYear - ชั้นปีของนักศึกษา (อาจเป็นตัวเลขหรือออบเจ็คที่มี year)
 * @param {number} totalCredits - หน่วยกิตรวม
 * @param {number} majorCredits - หน่วยกิตวิชาเอก
 * @param {object} requirements - เงื่อนไขการทำโปรเจคจาก backend
 * @returns {object} - ผลการตรวจสอบสิทธิ์
 */
export const isEligibleForProject = (studentYear, totalCredits, majorCredits, requirements = null) => {
  // รับค่าชั้นปีทั้งจากตัวเลขหรือจากออบเจ็ค
  const year = typeof studentYear === 'object' ? studentYear.year : studentYear;
  
  // ใช้ function getProjectRequirements ที่สร้างขึ้น
  const REQUIREMENTS = getProjectRequirements(requirements);
  
  if (year < REQUIREMENTS.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ ${REQUIREMENTS.MIN_YEAR} ขึ้นไป` 
    };
  }
  
  if (totalCredits < REQUIREMENTS.MIN_TOTAL_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตรวมอย่างน้อย ${REQUIREMENTS.MIN_TOTAL_CREDITS} หน่วยกิต` 
    };
  }
  
  if (majorCredits < REQUIREMENTS.MIN_MAJOR_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตภาควิชาอย่างน้อย ${REQUIREMENTS.MIN_MAJOR_CREDITS} หน่วยกิต` 
    };
  }

  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการทำโปรเจค' 
  };
};
