/**
 * ไฟล์สำหรับปรับปรุงสถานะสิทธิ์ของนักศึกษาอัตโนมัติ
 * ใช้ในการอัปเดตค่า isEligibleInternship และ isEligibleProject ในตาราง students
 * โดยใช้เกณฑ์จากการตั้งค่าในระบบ (ตาราง academics และ curriculums)
 */

const { Student, sequelize } = require('../models');
const logger = require('../utils/logger');

// ฟังก์ชันปรับปรุงสถานะสิทธิ์อัตโนมัติสำหรับนักศึกษาทั้งหมด
async function updateAllStudentsEligibility() {
  try {
    logger.info('เริ่มการปรับปรุงสถานะสิทธิ์อัตโนมัติ');
    
    const students = await Student.findAll();
    let updatedCount = 0;
    
    for (const student of students) {
      // ตรวจสอบสิทธิ์การฝึกงาน
      const internshipCheck = await student.checkInternshipEligibility();
      
      // ตรวจสอบสิทธิ์โครงงาน
      const projectCheck = await student.checkProjectEligibility();
      
      // ตรวจสอบว่าต้องอัปเดตหรือไม่
      if (student.isEligibleInternship !== internshipCheck.eligible || 
          student.isEligibleProject !== projectCheck.eligible) {
        
        // อัปเดตสถานะในฐานข้อมูล
        await student.update({
          isEligibleInternship: internshipCheck.eligible,
          isEligibleProject: projectCheck.eligible
        });
        
        logger.info(`อัปเดตสถานะสิทธิ์นักศึกษา ${student.studentCode}: ฝึกงาน=${internshipCheck.eligible}, โครงงาน=${projectCheck.eligible}`);
        updatedCount++;
      }
    }
    
    logger.info(`ปรับปรุงสถานะสิทธิ์สำเร็จ ${updatedCount} คน จากทั้งหมด ${students.length} คน`);
    return {
      success: true,
      updated: updatedCount,
      total: students.length
    };
    
  } catch (error) {
    logger.error('Error updating student eligibilities:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ฟังก์ชันตรวจสอบสิทธิ์ของนักศึกษารายบุคคล
async function updateStudentEligibility(studentCode) {
  try {
    logger.info(`ตรวจสอบสิทธิ์นักศึกษา ${studentCode}`);
    
    const student = await Student.findOne({ where: { studentCode } });
    
    if (!student) {
      return {
        success: false,
        message: `ไม่พบนักศึกษารหัส ${studentCode}`
      };
    }
    
    // ตรวจสอบสิทธิ์การฝึกงาน
    const internshipCheck = await student.checkInternshipEligibility();
    
    // ตรวจสอบสิทธิ์โครงงาน
    const projectCheck = await student.checkProjectEligibility();
    
    // อัปเดตสถานะในฐานข้อมูล
    await student.update({
      isEligibleInternship: internshipCheck.eligible,
      isEligibleProject: projectCheck.eligible
    });
    
    return {
      success: true,
      studentCode,
      internship: {
        eligible: internshipCheck.eligible,
        reason: internshipCheck.reason || null
      },
      project: {
        eligible: projectCheck.eligible,
        reason: projectCheck.reason || null
      }
    };
    
  } catch (error) {
    logger.error(`Error updating eligibility for student ${studentCode}:`, error);
    return {
      success: false,
      studentCode,
      error: error.message
    };
  }
}

module.exports = {
  updateAllStudentsEligibility,
  updateStudentEligibility
};