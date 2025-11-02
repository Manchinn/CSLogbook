const { Student } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware สำหรับตรวจสอบสิทธิ์การเข้าถึงระบบฝึกงาน
 * 
 * Logic การตรวจสอบ:
 * 1. ตรวจสอบว่าผู้ใช้เป็นนักศึกษา (มี userId ที่เชื่อมโยงกับ Student)
 * 2. ตรวจสอบ flag isEligibleInternship (legacy check)
 * 3. ถ้า isEligibleInternship = false, เรียก checkInternshipEligibility() เพื่อ dynamic check
 * 4. dynamic check จะพิจารณาจาก:
 *    - ชั้นปี (yearLevel >= 3)
 *    - หน่วยกิตรวม (totalCredits >= internshipBaseCredits) - **บังคับ**
 *    - หน่วยกิตวิชาเอก (majorCredits >= internshipMajorBaseCredits) - **ตรวจถ้า curriculum กำหนดไว้**
 * 
 * หมายเหตุ: 
 * - หน่วยกิตรวม (internshipBaseCredits) เป็นเกณฑ์บังคับ
 * - หน่วยกิตวิชาเอก (internshipMajorBaseCredits) เป็นเกณฑ์เสริม (optional)
 *   จะตรวจสอบก็ต่อเมื่อหลักสูตรกำหนดค่าไว้ (ไม่ใช่ null/undefined)
 * 
 * ข้อมูลที่เพิ่มเข้า req:
 * - req.student: ข้อมูลนักศึกษาที่ผ่านการตรวจสอบแล้ว
 * 
 * HTTP Status:
 * - 403 Forbidden: ไม่มีสิทธิ์เข้าถึง (ไม่ผ่านเกณฑ์)
 * - 500 Internal Server Error: เกิดข้อผิดพลาดในการตรวจสอบ
 */
exports.checkInternshipEligibility = async (req, res, next) => {
  try {
    // หา Student record จาก userId
    const student = await Student.findOne({
      where: { userId: req.user.userId }
    });

    if (!student) {
      logger.warn(`checkInternshipEligibility: Student not found for userId ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา กรุณาติดต่อผู้ดูแลระบบ'
      });
    }

    // ตัวแปรสำหรับเก็บสถานะการตรวจสอบ
    let hasAccess = false;
    let denyReason = 'นักศึกษายังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน';

    // ขั้นตอนที่ 1: ตรวจสอบ flag isEligibleInternship (legacy)
    if (student.isEligibleInternship === true) {
      hasAccess = true;
      logger.debug(`checkInternshipEligibility: Student ${student.studentCode} passed via isEligibleInternship flag`);
    }

    // ขั้นตอนที่ 2: ถ้ายังไม่ผ่าน ลอง dynamic check
    if (!hasAccess && typeof student.checkInternshipEligibility === 'function') {
      try {
        const eligibilityCheck = await student.checkInternshipEligibility();
        
        // checkInternshipEligibility() คืนค่า object:
        // {
        //   eligible: boolean,           // ผ่านเกณฑ์หรือไม่
        //   canAccessFeature: boolean,   // สามารถเข้าใช้ระบบได้หรือไม่
        //   canRegister: boolean,        // สามารถลงทะเบียนได้หรือไม่
        //   reason: string               // เหตุผลที่ไม่ผ่าน (ถ้ามี)
        // }
        
        if (eligibilityCheck.eligible || eligibilityCheck.canAccessFeature) {
          hasAccess = true;
          logger.debug(`checkInternshipEligibility: Student ${student.studentCode} passed via dynamic check`, {
            eligible: eligibilityCheck.eligible
          });
        } else {
          denyReason = eligibilityCheck.reason || denyReason;
          logger.info(`checkInternshipEligibility: Student ${student.studentCode} denied`, {
            reason: denyReason,
            totalCredits: student.totalCredits,
            majorCredits: student.majorCredits
          });
        }
      } catch (error) {
        // ถ้า dynamic check ล้มเหลว ให้ fallback ไปใช้ flag เดิม
        logger.error(`checkInternshipEligibility: Error in dynamic check for student ${student.studentCode}`, {
          error: error.message
        });
        
        // ถ้า flag เป็น true ให้ผ่าน ไม่งั้นปฏิเสธ
        if (student.isEligibleInternship === true) {
          hasAccess = true;
        }
      }
    }

    // ขั้นตอนที่ 3: ตัดสินใจสุดท้าย
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: denyReason,
        code: 'INTERNSHIP_ACCESS_DENIED',
        details: {
          studentCode: student.studentCode,
          isEligibleInternship: student.isEligibleInternship,
          totalCredits: student.totalCredits,
          majorCredits: student.majorCredits
        }
      });
    }

    // ผ่านการตรวจสอบ - เพิ่ม student object เข้า req
    req.student = student;
    logger.debug(`checkInternshipEligibility: Access granted for student ${student.studentCode}`);
    next();

  } catch (error) {
    logger.error('checkInternshipEligibility: Unexpected error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
      code: 'ELIGIBILITY_CHECK_ERROR'
    });
  }
};