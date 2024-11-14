const { getUniversityData, authenticateUser } = require('./universityAPI');
const mockStudentData = require('./mockStudentData');

// ฟังก์ชันตรวจสอบสิทธิ์ใน mockStudentData
async function checkEligibility(studentID) {
  const student = mockStudentData.find(user => user.studentID === studentID);
  if (student) {
    return {
      isEligibleForInternship: student.isEligibleForInternship,
      isEligibleForProject: student.isEligibleForProject
    };
  }
  return null;
}

module.exports = { authenticateUser, checkEligibility };
