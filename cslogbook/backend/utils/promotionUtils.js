const { CONSTANTS } = require('./studentUtils');
const { Student, User } = require('../models');
const { Op } = require('sequelize');

/**
 * เลื่อนชั้นปีนักศึกษาทั้งหมด
 */
const promoteAllStudents = async () => {
  const results = {
    promoted: 0,
    graduated: 0,
    errors: []
  };

  try {
    const students = await Student.findAll({
      include: [{
        model: User,
        attributes: ['username', 'email']
      }]
    });

    for (const student of students) {
      try {
        const currentYear = parseInt(student.studentCode.substring(0, 2));
        const academicYear = parseInt(student.academicYear);
        const yearDiff = academicYear - (currentYear + 2500);
        
        if (yearDiff >= CONSTANTS.MAX_STUDY_YEARS) {
          student.status = 'graduated';
          results.graduated++;
        } else {
          await student.update({
            semester: 1,
            academicYear: academicYear + 1,
            isEligibleInternship: checkInternshipEligibility(yearDiff + 1, student.totalCredits),
            isEligibleProject: checkProjectEligibility(yearDiff + 1, student.totalCredits, student.majorCredits)
          });
          results.promoted++;
        }
      } catch (error) {
        results.errors.push({
          studentCode: student.studentCode,
          error: error.message
        });
      }
    }

    return results;

  } catch (error) {
    throw new Error(`การเลื่อนชั้นปีล้มเหลว: ${error.message}`);
  }
};

// Helper functions
const checkInternshipEligibility = (studentYear, totalCredits) => {
  return studentYear >= CONSTANTS.INTERNSHIP.MIN_YEAR && 
         totalCredits >= CONSTANTS.INTERNSHIP.MIN_CREDITS;
};

const checkProjectEligibility = (studentYear, totalCredits, majorCredits) => {
  return studentYear >= CONSTANTS.PROJECT.MIN_YEAR && 
         totalCredits >= CONSTANTS.PROJECT.MIN_TOTAL_CREDITS &&
         majorCredits >= CONSTANTS.PROJECT.MIN_MAJOR_CREDITS;
};

module.exports = {
  promoteAllStudents
};