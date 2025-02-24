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
    let studentClassYear = currentYear - studentYear + 1;
  
    // หากเดือนปัจจุบันน้อยกว่าเดือนที่ 5 ให้ลดชั้นปีลง 1
    if (currentMonth < 5) {
      studentClassYear -= 1;
    }
  
    return studentClassYear;
  };
  
  /**
   * ตรวจสอบสิทธิ์การฝึกงาน
   * @param {number} studentYear - ชั้นปีของนักศึกษา
   * @param {number} totalCredits - หน่วยกิตรวม
   * @returns {boolean} - มีสิทธิ์หรือไม่
   */
  export const isEligibleForInternship = (studentYear, totalCredits) => {
    if (studentYear === 1 && totalCredits <= 42) return false;
    if (studentYear === 2 && totalCredits <= 72) return false;
    if (studentYear === 3 && totalCredits <= 112) return false;
    return studentYear >= 3 && totalCredits >= 81;
  };
  
  /**
   * ตรวจสอบสิทธิ์การทำโปรเจค
   * @param {number} studentYear - ชั้นปีของนักศึกษา
   * @param {number} totalCredits - หน่วยกิตรวม
   * @param {number} majorCredits - หน่วยกิตภาควิชา
   * @returns {boolean} - มีสิทธิ์หรือไม่
   */
  export const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
    return studentYear >= 4 && totalCredits >= 95 && majorCredits >= 47;
  };