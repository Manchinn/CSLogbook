/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentID - รหัสนักศึกษา
 * @returns {number} - ชั้นปีของนักศึกษา
 */
export const calculateStudentYear = (studentID) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
  const currentMonth = currentDate.getMonth() + 1; // เดือนปัจจุบัน (1-12)
  const studentYear = parseInt(studentID.substring(0, 2)) + 2500; // สมมติว่ารหัสนักศึกษาเป็นปี พ.ศ.
  let studentClassYear = currentYear - studentYear; //2568 - 2564 = 4 + 1

  // หากเดือนปัจจุบันมากกว่าเดือนที่ 4 ให้เพิ่มชั้นปีขึ้น 1
  if (currentMonth > 4) {
    studentClassYear += 1;
  } // 5 - 1 = 4 

  return studentClassYear;
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