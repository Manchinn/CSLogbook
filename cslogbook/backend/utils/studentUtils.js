/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentID - รหัสนักศึกษา
 * @returns {number} - ชั้นปีของนักศึกษา
 */
const calculateStudentYear = (studentID) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() + 543; // แปลงเป็นปี พ.ศ. 2568
    const currentMonth = currentDate.getMonth() + 1; // เดือนปัจจุบัน (1-12) 64 = 2564
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
  const isEligibleForInternship = (studentYear, totalCredits) => {
    if (studentYear === 1 && totalCredits <= 42) {
        console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: ชั้นปี 1 และหน่วยกิตรวม <= 42');
        return false;
      }
      if (studentYear === 2 && totalCredits <= 72) {
        console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: ชั้นปี 2 และหน่วยกิตรวม <= 72');
        return false;
      }
      if (studentYear === 3 && totalCredits <= 112) {
        console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: ชั้นปี 3 และหน่วยกิตรวม <= 112');
        return false;
      }
      if (studentYear >= 3 && totalCredits >= 81) {
        return true;
      }
      console.log('ไม่ผ่านเงื่อนไขการฝึกงาน: ชั้นปี >= 3 และหน่วยกิตรวม >= 81');
      return false;
  };
  
  /**
   * ตรวจสอบสิทธิ์การทำโปรเจค
   * @param {number} studentYear - ชั้นปีของนักศึกษา
   * @param {number} totalCredits - หน่วยกิตรวม
   * @param {number} majorCredits - หน่วยกิตภาควิชา
   * @returns {boolean} - มีสิทธิ์หรือไม่
   */
  const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
    if (totalCredits < 95) {
        console.log('ไม่ผ่านเงื่อนไขการทำโปรเจค: หน่วยกิตรวม < 95');
        return false;
      }
      if (studentYear >= 4 && totalCredits >= 95 && majorCredits >= 47) {
        return true;
      }
      console.log('ไม่ผ่านเงื่อนไขการทำโปรเจค: ชั้นปี < 4, หน่วยกิตรวม < 95 และหน่วยกิตภาควิชา < 47');
      return false;
  };
  
  module.exports = {
    calculateStudentYear,
    isEligibleForInternship,
    isEligibleForProject
  };