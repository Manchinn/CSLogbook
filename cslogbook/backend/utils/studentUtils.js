const pool = require('../config/database');

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentID - รหัสนักศึกษา
 * @returns {object} - ชั้นปีของนักศึกษา
 */
const calculateStudentYear = (studentID) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() + 543; // แปลงเป็นปี พ.ศ. 2025+543=2568
  const currentMonth = currentDate.getMonth() + 1; // เดือนปัจจุบัน (1-12) 
  const studentYear = parseInt(studentID.substring(0, 2)) + 2500; // แปลงเป็นปี พ.ศ. 64+2500=2564
  let studentClassYear = currentYear - studentYear;

  // ตรวจสอบว่าชั้นปีไม่ติดลบหรือเป็น 0
  if (studentClassYear <= 0) {
    return { 
      error: true,
      message: 'ไม่สามารถเพิ่มรหัสนักศึกษานี้ได้: รหัสนักศึกษาไม่ถูกต้อง'
    };
  }

  // หากเดือนปัจจุบันมากกว่าเดือนที่ 4 ให้เพิ่มชั้นปีขึ้น 1
  if (currentMonth > 4) {
    studentClassYear += 1;
  }

  return {
    error: false,
    year: studentClassYear
  };
};

/**
 * ตรวจสอบสิทธิ์การฝึกงาน
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < 3) {
    return { 
      eligible: false, 
      message: 'ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ 3 ขึ้นไป' 
    };
  }
  if (totalCredits < 81) {
    return { 
      eligible: false, 
      message: 'ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย 81 หน่วยกิต' 
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
  // เช็คเงื่อนไขชั้นปี
  if (studentYear < 4) {
    return { 
      eligible: false, 
      message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องเป็นนักศึกษาชั้นปีที่ 4 ขึ้นไป' 
    };
  }
  
  // เช็คเงื่อนไขหน่วยกิตรวม
  if (totalCredits < 95) {
    return { 
      eligible: false, 
      message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตรวมอย่างน้อย 95 หน่วยกิต' 
    };
  }
  
  // เช็คเงื่อนไขหน่วยกิตภาควิชา
  if (majorCredits < 57) {
    return { 
      eligible: false, 
      message: 'ไม่ผ่านเงื่อนไขการทำโปรเจค: ต้องมีหน่วยกิตภาควิชาอย่างน้อย 57 หน่วยกิต' 
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
  isEligibleForProject
};