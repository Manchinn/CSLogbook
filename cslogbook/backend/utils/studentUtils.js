const pool = require('../config/database');

// เพิ่ม constants สำหรับค่าคงที่
const THAI_YEAR_OFFSET = 543;
const MAX_STUDY_YEARS = 8;
const MIN_STUDENT_CODE_LENGTH = 13;
const ACADEMIC_MONTH_THRESHOLD = 4;

// เกณฑ์การฝึกงานและโปรเจค
const INTERNSHIP_REQUIREMENTS = {
  MIN_YEAR: 3,
  MIN_CREDITS: 81
};

const PROJECT_REQUIREMENTS = {
  MIN_YEAR: 4,
  MIN_TOTAL_CREDITS: 95,
  MIN_MAJOR_CREDITS: 57
};

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} student_code - รหัสนักศึกษา
 * @returns {object} - ชั้นปีของนักศึกษา
 */
const calculateStudentYear = (student_code) => {
  if (!student_code) {
    return { 
      error: true,
      message: 'รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบข้อมูล'
    };
  }

  try {
    const studentCodeStr = String(student_code);
    
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

// แก้ไขฟังก์ชันตรวจสอบสิทธิ์การฝึกงาน
const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < INTERNSHIP_REQUIREMENTS.MIN_YEAR) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ ${INTERNSHIP_REQUIREMENTS.MIN_YEAR} ขึ้นไป` 
    };
  }
  
  if (totalCredits < INTERNSHIP_REQUIREMENTS.MIN_CREDITS) {
    return { 
      eligible: false, 
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย ${INTERNSHIP_REQUIREMENTS.MIN_CREDITS} หน่วยกิต` 
    };
  }
  
  return { 
    eligible: true, 
    message: 'ผ่านเงื่อนไขการฝึกงาน' 
  };
};

// แก้ไขฟังก์ชันตรวจสอบสิทธิ์การทำโปรเจค
const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
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

const updateStudentData = async () => {
  try {
    // ดึงข้อมูลนักศึกษาจากตาราง users ที่ยังไม่มีในตาราง student_data
    const [students] = await pool.execute(`
      SELECT u.studentID, u.firstName, u.lastName, u.email
      FROM users u
      LEFT JOIN student_data sd ON u.studentID = sd.studentID
      WHERE sd.studentID IS NULL AND u.role = 'student'
    `);

    if (students.length === 0) {
      console.log('No new students to update.');
      return;
    }

    for (const student of students) {
      const studentYearResult = calculateStudentYear(student.studentID);
      if (studentYearResult.error) {
        console.log(studentYearResult.message);
        continue;
      }
      const studentYear = studentYearResult.year;
      const totalCredits = 0; // 
      const majorCredits = 0; // 

      const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits);
      const eligibleForProject = isEligibleForProject(studentYear, totalCredits, majorCredits);

      await pool.execute(`
        INSERT INTO student_data (studentID, firstName, lastName, email, totalCredits, majorCredits, isEligibleForInternship, isEligibleForProject)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [student.studentID, student.firstName, student.lastName, student.email, totalCredits, majorCredits, eligibleForInternship.eligible, eligibleForProject.eligible]);

      console.log(`Updated student data for ${student.studentID}`);
    }

    console.log('Student data update completed.');
  } catch (error) {
    console.error('Error updating student data:', error.message);
  }
};

module.exports = {
  updateStudentData,
  calculateStudentYear,
  isEligibleForInternship,
  isEligibleForProject,
  THAI_YEAR_OFFSET,
  MAX_STUDY_YEARS,
  MIN_STUDENT_CODE_LENGTH,
  ACADEMIC_MONTH_THRESHOLD,
  INTERNSHIP_REQUIREMENTS,
  PROJECT_REQUIREMENTS
};