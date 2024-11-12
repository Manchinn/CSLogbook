const mockStudentData = require('./mockStudentData');
const { getUniversityData } = require('./universityAPI');

// ตรวจสอบข้อมูลการล็อกอิน
function authenticateUser(username, password) {
  return mockStudentData.find(
    user => user.username === username && user.password === password
  ) || null;
}

// ตรวจสอบสิทธิ์
function checkEligibility(studentID) {
  const student = mockStudentData.find(user => user.studentID === studentID);
  return student ? {
    isEligibleForInternship: student.isEligibleForInternship,
    isEligibleForProject: student.isEligibleForProject
  } : null;
}

module.exports = { authenticateUser, checkEligibility };
