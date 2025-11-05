/**
 * Internship Deadline Enforcement Middleware
 * 
 * ตรวจสอบ deadline สำหรับการยื่นเอกสารฝึกงาน (Internship-specific)
 * แตกต่างจาก checkDeadlineBeforeSubmission ที่ออกแบบมาสำหรับ Project workflows
 * 
 * Middleware นี้ไม่ต้องการ projectId แต่จะตรวจสอบจาก:
 * - Academic year/semester ปัจจุบัน
 * - relatedTo = 'internship'
 * - documentSubtype (เช่น CS05, acceptance_letter, report)
 */

const { ImportantDeadline, Student } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getCurrentAcademicYear, getCurrentSemester } = require('../utils/studentUtils');
const { 
  checkDeadlineStatus, 
  handleDeadlineCheckResult
} = require('../utils/deadlineChecker');

/**
 * ตรวจสอบ deadline สำหรับการยื่นเอกสารฝึกงาน
 * @param {string} documentSubtype - ประเภทเอกสาร เช่น 'CS05', 'acceptance_letter', 'report'
 * @param {string} actionType - 'SUBMISSION', 'ANNOUNCEMENT', etc.
 * @returns {Function} Express middleware
 */
const checkInternshipDeadline = (documentSubtype, actionType = 'SUBMISSION') => {
  return async (req, res, next) => {
    try {
      // ดึงข้อมูล academic year/semester ของนักศึกษา
      let academicYear, semester;

      // ถ้ามี student object ใน req (จาก checkInternshipEligibility middleware)
      if (req.student) {
        // ใช้ข้อมูลจากการลงทะเบียนฝึกงานของนักศึกษา (ถ้ามี)
        const { InternshipDocument, Document } = require('../models');
        
        // หา CS05 document ของนักศึกษาล่าสุด
        const cs05Document = await Document.findOne({
          where: {
            userId: req.student.userId,
            documentName: 'CS05'
          },
          order: [['created_at', 'DESC']]
        });

        // ถ้าเจอ CS05 แล้ว ให้หา InternshipDocument ที่เชื่อมกับมัน
        if (cs05Document) {
          const internshipDoc = await InternshipDocument.findOne({
            where: {
              documentId: cs05Document.documentId
            }
          });

          if (internshipDoc) {
            academicYear = internshipDoc.academicYear;
            semester = internshipDoc.semester;
          }
        }
      }

      // ถ้าไม่มีข้อมูลจากการลงทะเบียน ใช้ academic year/semester ปัจจุบัน
      if (!academicYear || !semester) {
        academicYear = await getCurrentAcademicYear();
        semester = await getCurrentSemester();
      }

      logger.debug(`checkInternshipDeadline: Checking for ${documentSubtype}/${actionType}`, {
        academicYear,
        semester,
        userId: req.user?.userId
      });

      // ดึง deadline จากฐานข้อมูล ผ่าน DeadlineWorkflowMapping
      const { DeadlineWorkflowMapping } = require('../models');
      
      // ค้นหา mapping ที่ตรงกับ documentSubtype
      const mapping = await DeadlineWorkflowMapping.findOne({
        where: {
          workflowType: 'internship',
          documentSubtype,
          active: true
        },
        include: [{
          model: ImportantDeadline,
          as: 'deadline',
          where: {
            relatedTo: 'internship',
            academicYear,
            semester,
            deadlineType: actionType,
            isPublished: true
          },
          required: true
        }]
      });

      const deadline = mapping ? mapping.deadline : null;

      if (!deadline) {
        // ไม่มี deadline กำหนด - อนุญาตให้ดำเนินการ
        logger.debug(`checkInternshipDeadline: No deadline found for ${documentSubtype}`, {
          academicYear,
          semester
        });
        return next();
      }

      // ใช้ shared utility function ตรวจสอบ deadline
      const checkResult = checkDeadlineStatus(deadline, {
        type: 'internship',
        documentSubtype,
        userId: req.user?.userId
      });

      // จัดการผลการตรวจสอบ
      return handleDeadlineCheckResult(checkResult, req, res, next);
    } catch (error) {
      logger.error('checkInternshipDeadline: Error', {
        error: error.message,
        stack: error.stack,
        documentSubtype,
        userId: req.user?.userId
      });

      // ในกรณีเกิด error ไม่ควร block การทำงาน เพื่อไม่ให้กระทบผู้ใช้
      // แต่ควร log ไว้เพื่อตรวจสอบ
      logger.error('checkInternshipDeadline: Allowing submission due to error (fail-open)');
      next();
    }
  };
};

/**
 * ตรวจสอบว่ายังอยู่ในช่วงเวลายื่นเอกสารหรือไม่ (soft check - ไม่ block)
 * เพิ่ม warning flag แต่ไม่ปฏิเสธ request
 */
const warnIfPastInternshipDeadline = (documentSubtype, actionType = 'SUBMISSION') => {
  return async (req, res, next) => {
    try {
      const academicYear = await getCurrentAcademicYear();
      const semester = await getCurrentSemester();
      const { DeadlineWorkflowMapping } = require('../models');

      // ค้นหา deadline ผ่าน DeadlineWorkflowMapping
      const mapping = await DeadlineWorkflowMapping.findOne({
        where: {
          workflowType: 'internship',
          documentSubtype,
          active: true
        },
        include: [{
          model: ImportantDeadline,
          as: 'deadline',
          where: {
            relatedTo: 'internship',
            academicYear,
            semester,
            deadlineType: actionType,
            isPublished: true
          },
          required: true
        }]
      });

      const deadline = mapping ? mapping.deadline : null;

      if (deadline) {
        // ใช้ shared utility function แต่จับเฉพาะ metadata
        const checkResult = checkDeadlineStatus(deadline, {
          type: 'internship_warning',
          documentSubtype,
          userId: req.user?.userId
        });

        if (checkResult.isLate && checkResult.metadata.deadlineInfo) {
          req.isPastDeadline = true;
          req.deadlineWarning = checkResult.metadata.deadlineInfo;
        }
      }

      next();
    } catch (error) {
      logger.error('warnIfPastInternshipDeadline: Error', error);
      // Don't block - just skip warning
      next();
    }
  };
};

module.exports = {
  checkInternshipDeadline,
  warnIfPastInternshipDeadline
};
