const { Student } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware สำหรับตรวจสอบสิทธิ์การเข้าถึงระบบโครงงานพิเศษ
 * 
 * Logic การตรวจสอบ:
 * 1. ตรวจสอบว่าผู้ใช้เป็นนักศึกษา (มี userId ที่เชื่อมโยงกับ Student)
 * 2. ตรวจสอบ flag isEligibleProject (legacy check)
 * 3. ถ้า isEligibleProject = false, เรียก checkProjectEligibility() เพื่อ dynamic check
 * 4. dynamic check จะพิจารณาจาก:
 *    - หน่วยกิตรวม (totalCredits >= projectBaseCredits)
 *    - หน่วยกิตเฉพาะสาขา (majorCredits >= projectMajorBaseCredits)
 *    - ข้อกำหนดพิเศษ เช่น ต้องผ่านฝึกงานก่อน (requireInternshipBeforeProject)
 *    - มีโครงงานที่ยังดำเนินการอยู่หรือไม่ (override case)
 * 
 * การ override:
 * - ถ้านักศึกษามีโครงงานที่ status เป็น draft, advisor_assigned, in_progress, completed
 *   จะถือว่ามีสิทธิ์เข้าถึงระบบต่อไป (เพื่อให้สามารถทำงานในโครงงานที่มีอยู่ได้)
 * - ถ้าสอบ thesis ผ่านแล้ว แต่ยัง archived ก็ให้เข้าได้ (เพื่อ finalize ข้อมูล)
 * 
 * ข้อมูลที่เพิ่มเข้า req:
 * - req.student: ข้อมูลนักศึกษาที่ผ่านการตรวจสอบแล้ว
 * 
 * HTTP Status:
 * - 403 Forbidden: ไม่มีสิทธิ์เข้าถึง (ไม่ผ่านเกณฑ์)
 * - 500 Internal Server Error: เกิดข้อผิดพลาดในการตรวจสอบ
 */
exports.checkProjectEligibility = async (req, res, next) => {
  try {
    // หา Student record จาก userId
    const student = await Student.findOne({
      where: { userId: req.user.userId }
    });

    if (!student) {
      logger.warn(`checkProjectEligibility: Student not found for userId ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา กรุณาติดต่อผู้ดูแลระบบ'
      });
    }

    // ตัวแปรสำหรับเก็บสถานะการตรวจสอบ
    let hasAccess = false;
    let denyReason = 'นักศึกษายังไม่มีสิทธิ์เข้าถึงระบบโครงงานพิเศษ';

    // ขั้นตอนที่ 1: ตรวจสอบ flag isEligibleProject (legacy)
    if (student.isEligibleProject === true) {
      hasAccess = true;
      logger.debug(`checkProjectEligibility: Student ${student.studentCode} passed via isEligibleProject flag`);
    }

    // ขั้นตอนที่ 2: ถ้ายังไม่ผ่าน ลอง dynamic check
    if (!hasAccess && typeof student.checkProjectEligibility === 'function') {
      try {
        const eligibilityCheck = await student.checkProjectEligibility();
        
        // checkProjectEligibility() คืนค่า object:
        // {
        //   eligible: boolean,           // ผ่านเกณฑ์หน่วยกิตหรือไม่
        //   canAccessFeature: boolean,   // สามารถเข้าใช้ระบบได้หรือไม่ (รวม override cases)
        //   canRegister: boolean,        // สามารถลงทะเบียนได้หรือไม่ (ตามช่วงเวลา)
        //   reason: string               // เหตุผลที่ไม่ผ่าน (ถ้ามี)
        // }
        
        if (eligibilityCheck.canAccessFeature || eligibilityCheck.eligible) {
          hasAccess = true;
          logger.debug(`checkProjectEligibility: Student ${student.studentCode} passed via dynamic check`, {
            canAccessFeature: eligibilityCheck.canAccessFeature,
            eligible: eligibilityCheck.eligible
          });
        } else {
          denyReason = eligibilityCheck.reason || denyReason;
          logger.info(`checkProjectEligibility: Student ${student.studentCode} denied`, {
            reason: denyReason,
            totalCredits: student.totalCredits,
            majorCredits: student.majorCredits
          });
        }
      } catch (error) {
        // ถ้า dynamic check ล้มเหลว ให้ fallback ไปใช้ flag เดิม
        logger.error(`checkProjectEligibility: Error in dynamic check for student ${student.studentCode}`, {
          error: error.message
        });
        
        // ถ้า flag เป็น true ให้ผ่าน ไม่งั้นปฏิเสธ
        if (student.isEligibleProject === true) {
          hasAccess = true;
        }
      }
    }

    // ขั้นตอนที่ 3: ตัดสินใจสุดท้าย
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: denyReason,
        code: 'PROJECT_ACCESS_DENIED',
        details: {
          studentCode: student.studentCode,
          isEligibleProject: student.isEligibleProject,
          totalCredits: student.totalCredits,
          majorCredits: student.majorCredits
        }
      });
    }

    // ผ่านการตรวจสอบ - เพิ่ม student object เข้า req
    req.student = student;
    logger.debug(`checkProjectEligibility: Access granted for student ${student.studentCode}`);
    next();

  } catch (error) {
    logger.error('checkProjectEligibility: Unexpected error', {
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

/**
 * Middleware สำหรับตรวจสอบว่านักศึกษาเป็นสมาชิกของโครงงาน
 * ใช้ร่วมกับ checkProjectEligibility
 * 
 * การใช้งาน:
 * router.get('/:id', authenticateToken, checkRole(['student']), checkProjectEligibility, checkProjectMember, controller.getProject);
 * 
 * ข้อมูลที่ต้องมีใน req:
 * - req.params.id: projectId
 * - req.student: ข้อมูลนักศึกษา (มาจาก checkProjectEligibility)
 */
exports.checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const studentId = req.student?.studentId || req.user?.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    const { ProjectMember } = require('../models');
    
    const membership = await ProjectMember.findOne({
      where: {
        projectId: projectId,
        studentId: studentId
      }
    });

    if (!membership) {
      logger.warn(`checkProjectMember: Student ${studentId} is not a member of project ${projectId}`);
      return res.status(403).json({
        success: false,
        message: 'คุณไม่ใช่สมาชิกของโครงงานนี้',
        code: 'NOT_PROJECT_MEMBER'
      });
    }

    // เพิ่มข้อมูล membership เข้า req
    req.projectMembership = membership;
    next();

  } catch (error) {
    logger.error('checkProjectMember: Error', {
      error: error.message,
      projectId: req.params.id,
      studentId: req.student?.studentId
    });
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
      code: 'MEMBERSHIP_CHECK_ERROR'
    });
  }
};
