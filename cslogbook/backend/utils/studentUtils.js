// ค่าคงที่สำหรับการคำนวณ
const CONSTANTS = {
  THAI_YEAR_OFFSET: 543,
  MAX_STUDY_YEARS: 8,
  MIN_STUDENT_CODE_LENGTH: 13,
  ACADEMIC_MONTH_THRESHOLD: 4,
  INTERNSHIP: {
    MIN_YEAR: 3,
    MIN_CREDITS: 81
  },
  PROJECT: {
    MIN_YEAR: 4,
    MIN_TOTAL_CREDITS: 95,
    MIN_MAJOR_CREDITS: 57
  },
  ACADEMIC_TERMS: {
    FIRST: {
      START_MONTH: 7,  // กรกฎาคม
      END_MONTH: 11    // พฤศจิกายน
    },
    SECOND: {
      START_MONTH: 11, // พฤศจิกายน
      END_MONTH: 3     // มีนาคม
    },
    SUMMER: {
      START_MONTH: 4,  // เมษายน
      END_MONTH: 6     // มิถุนายน
    }
  },
  STUDENT_STATUS: {
    NORMAL: {
      code: 'NORMAL',
      label: 'กำลังศึกษา',
      maxYear: 4,
      color: 'green'
    },
    EXTENDED: {
      code: 'EXTENDED',
      label: 'นักศึกษาตกค้าง',
      maxYear: 8,
      color: 'warning'
    },
    RETIRED: {
      code: 'RETIRED',
      label: 'พ้นสภาพ',
      color: 'error'
    }
  }
};

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentID - รหัสนักศึกษา
 * @returns {object} - ผลการคำนวณชั้นปี
 */
const calculateStudentYear = (studentCode) => {
  if (!studentCode) {
    return { 
      error: true,
      message: 'รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบข้อมูล'
    };
  }

  try {
    const studentCodeStr = String(studentCode);
    
    if (studentCode.length !== CONSTANTS.MIN_STUDENT_CODE_LENGTH) {
      return { 
        error: true,
        message: `รหัสนักศึกษาต้องมี ${CONSTANTS.MIN_STUDENT_CODE_LENGTH} หลัก`
      };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() + CONSTANTS.THAI_YEAR_OFFSET;
    const currentMonth = currentDate.getMonth() + 1;
    const studentYear = parseInt(studentCodeStr.substring(0, 2)) + 2500;
    let studentClassYear = currentYear - studentYear;

    if (currentMonth > CONSTANTS.ACADEMIC_MONTH_THRESHOLD) {
      studentClassYear += 1;
    }

    if (studentClassYear > CONSTANTS.MAX_STUDY_YEARS) {
      return {
        error: true,
        message: `เกินระยะเวลาการศึกษาสูงสุด ${CONSTANTS.MAX_STUDY_YEARS} ปี`
      };
    }

    const status = calculateStudentStatus(studentClassYear);

    return {
      error: false,
      year: studentClassYear,
      status: status.code,
      statusLabel: status.label,
      statusColor: status.color,
      isExtended: studentClassYear > CONSTANTS.STUDENT_STATUS.NORMAL.maxYear
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
 * คำนวณสถานะนักศึกษา
 * @param {number} yearLevel - ชั้นปีของนักศึกษา
 * @returns {object} - สถานะนักศึกษา
 */
const calculateStudentStatus = (yearLevel) => {
  if (yearLevel <= CONSTANTS.STUDENT_STATUS.NORMAL.maxYear) {
    return CONSTANTS.STUDENT_STATUS.NORMAL;
  } else if (yearLevel <= CONSTANTS.STUDENT_STATUS.EXTENDED.maxYear) {
    return CONSTANTS.STUDENT_STATUS.EXTENDED;
  }
  return CONSTANTS.STUDENT_STATUS.RETIRED;
};

/**
 * คำนวณปีการศึกษาปัจจุบัน
 * @returns {number} ปีการศึกษาในรูปแบบ พ.ศ.
 */
const getCurrentAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() + CONSTANTS.THAI_YEAR_OFFSET;
  const currentMonth = currentDate.getMonth() + 1;
  
  // หลัง มีนาคม ถึงก่อน กรกฎาคม = เตรียมขึ้นปีการศึกษาใหม่
  if (currentMonth > CONSTANTS.ACADEMIC_TERMS.SECOND.END_MONTH && 
      currentMonth < CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH) {
    return currentYear;
  }
  
  return currentMonth >= CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH ? 
    currentYear : currentYear - 1;
};

/**
 * คำนวณภาคเรียนปัจจุบัน
 * @returns {number} ภาคเรียน (1, 2, หรือ 3)
 */
const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1;

  // ภาคเรียนที่ 1: กรกฎาคม - พฤศจิกายน
  if (currentMonth >= CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH && 
      currentMonth <= CONSTANTS.ACADEMIC_TERMS.FIRST.END_MONTH) {
    return 1;
  }
  
  // ภาคเรียนที่ 2: พฤศจิกายน - มีนาคม
  if (currentMonth >= CONSTANTS.ACADEMIC_TERMS.SECOND.START_MONTH || 
      currentMonth <= CONSTANTS.ACADEMIC_TERMS.SECOND.END_MONTH) {
    return 2;
  }
  
  // ภาคฤดูร้อน: เมษายน - มิถุนายน
  return 3;
};

/**
 * ตรวจสอบสิทธิ์การฝึกงาน
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < CONSTANTS.INTERNSHIP.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ ${CONSTANTS.INTERNSHIP.MIN_YEAR} ขึ้นไป`
    };
  }
  
  if (totalCredits < CONSTANTS.INTERNSHIP.MIN_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย ${CONSTANTS.INTERNSHIP.MIN_CREDITS} หน่วยกิต`
    };
  }
  
  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการฝึกงาน'
  };
};

/**
 * ตรวจสอบสิทธิ์การทำโปรเจค
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @param {number} majorCredits - หน่วยกิตภาควิชา
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
  if (studentYear < CONSTANTS.PROJECT.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ ${CONSTANTS.PROJECT.MIN_YEAR} ขึ้นไป`
    };
  }
  
  if (totalCredits < CONSTANTS.PROJECT.MIN_TOTAL_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตรวมอย่างน้อย ${CONSTANTS.PROJECT.MIN_TOTAL_CREDITS} หน่วยกิต`
    };
  }
  
  if (majorCredits < CONSTANTS.PROJECT.MIN_MAJOR_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตภาควิชาอย่างน้อย ${CONSTANTS.PROJECT.MIN_MAJOR_CREDITS} หน่วยกิต`
    };
  }

  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการทำโปรเจค'
  };
};

/**
 * คำนวณข้อมูลปีการศึกษาจากรหัสนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @param {number} currentAcademicYear - ปีการศึกษาปัจจุบัน
 * @returns {object} - ข้อมูลปีการศึกษา
 */
const calculateAcademicInfo = (studentCode, currentAcademicYear) => {
  const enrollYear = 2500 + parseInt(studentCode.substring(0, 2));
  const yearLevel = currentAcademicYear - enrollYear + 1;
  const semester = getCurrentSemester();
  
  return {
    enrollmentYear: enrollYear,
    currentAcademicYear,
    yearLevel,
    semester,
    academicYearThai: `${currentAcademicYear}/${semester}`,
    isCurrentStudent: yearLevel <= CONSTANTS.MAX_STUDY_YEARS
  };
};

/**
 * ตรวจสอบความถูกต้องของรหัสนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @returns {boolean} - ผลการตรวจสอบ
 */
const validateStudentCode = (studentCode) => {
  if (!studentCode || typeof studentCode !== 'string') {
    return false;
  }

  if (studentCode.length !== CONSTANTS.MIN_STUDENT_CODE_LENGTH) {
    return false;
  }

  const yearPart = parseInt(studentCode.substring(0, 2));
  return !isNaN(yearPart) && yearPart >= 0 && yearPart <= 99;
};

// ส่งออกฟังก์ชันและค่าคงที่แบบ CommonJS
module.exports = {
  CONSTANTS,
  calculateStudentYear,
  isEligibleForInternship,
  isEligibleForProject,
  getCurrentAcademicYear,
  getCurrentSemester,
  calculateStudentStatus,
  calculateAcademicInfo,
  validateStudentCode
};