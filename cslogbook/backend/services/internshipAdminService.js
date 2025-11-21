const { 
  User, 
  Student, 
  Document, 
  InternshipDocument, 
  InternshipLogbook,
  StudentWorkflowActivity,
  sequelize 
} = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const workflowService = require('./workflowService');
const { calculateStudentYear } = require('../utils/studentUtils');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Service สำหรับจัดการข้อมูลการฝึกงานโดยเจ้าหน้าที่ภาควิชา
 */
class InternshipAdminService {
  /**
   * ดึงรายการนักศึกษาทั้งหมดพร้อมข้อมูลการฝึกงาน
   * @param {Object} filters - { academicYear, semester, status, search }
   * @returns {Promise<Array>} รายการนักศึกษาพร้อมข้อมูลการฝึกงาน
   */
  async getAllInternshipStudents(filters = {}) {
    try {
      const { academicYear, semester, status, search } = filters;

      // Build where conditions
      const userWhere = { role: 'student' };
      const studentWhere = { isEnrolledInternship: true };
      const documentWhere = { documentName: 'CS05' };
      const internshipWhere = {};

      // Search filter
      if (search && search.trim()) {
        const likeValue = `%${search.trim()}%`;
        userWhere[Op.or] = [
          { firstName: { [Op.like]: likeValue } },
          { lastName: { [Op.like]: likeValue } }
        ];
        studentWhere[Op.or] = [
          { studentCode: { [Op.like]: likeValue } }
        ];
      }

      // Status filter
      if (status) {
        studentWhere.internshipStatus = status;
      }

      // Academic year and semester filter
      if (academicYear) {
        internshipWhere.academicYear = parseInt(academicYear);
      }
      if (semester) {
        internshipWhere.semester = parseInt(semester);
      }

      const students = await User.findAll({
        where: userWhere,
        attributes: ['userId', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: Student,
            as: 'student',
            required: true,
            where: studentWhere,
            attributes: [
              'studentId',
              'studentCode',
              'totalCredits',
              'majorCredits',
              'classroom',
              'phoneNumber',
              'internshipStatus',
              'isEnrolledInternship',
              'isEligibleInternship'
            ]
          },
          {
            model: Document,
            as: 'documents',
            required: false,
            where: documentWhere,
            include: [
              {
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                where: Object.keys(internshipWhere).length > 0 ? internshipWhere : undefined,
                attributes: [
                  'internshipId',
                  'companyName',
                  'companyAddress',
                  'internshipPosition',
                  'supervisorName',
                  'startDate',
                  'endDate',
                  ['academic_year', 'academicYear'],
                  'semester'
                ]
              }
            ],
            attributes: ['documentId', 'documentName', 'status', ['created_at', 'createdAt']]
          }
        ],
        order: [
          [{ model: Student, as: 'student' }, 'studentCode', 'ASC']
        ]
      });

      // Format data
      const formattedData = students.map(user => {
        const student = user.student;
        const cs05Docs = user.documents.filter(d => d.documentName === 'CS05');
        const latestCS05 = cs05Docs.length > 0 ? cs05Docs[0] : null;
        const internshipDoc = latestCS05?.internshipDocument;

        // Calculate student year from studentCode using utility function
        const studentYearResult = calculateStudentYear(student.studentCode);
        const studentYear = studentYearResult.error ? null : studentYearResult.year;

        return {
          userId: user.userId,
          studentId: student.studentId,
          studentCode: student.studentCode,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phoneNumber: student.phoneNumber,
          classroom: student.classroom,
          studentYear,
          totalCredits: student.totalCredits,
          majorCredits: student.majorCredits,
          internshipStatus: student.internshipStatus,
          isEligibleInternship: student.isEligibleInternship,
          // Internship document info
          hasInternshipDoc: !!latestCS05,
          documentId: latestCS05?.documentId || null,
          documentStatus: latestCS05?.status || null,
          internshipId: internshipDoc?.internshipId || null,
          companyName: internshipDoc?.companyName || null,
          internshipPosition: internshipDoc?.internshipPosition || null,
          supervisorName: internshipDoc?.supervisorName || null,
          startDate: internshipDoc?.startDate || null,
          endDate: internshipDoc?.endDate || null,
          academicYear: internshipDoc?.academicYear || null,
          semester: internshipDoc?.semester || null,
          createdAt: latestCS05?.createdAt || null
        };
      });

      logger.info(`[InternshipAdminService] Retrieved ${formattedData.length} students with filters:`, filters);
      return formattedData;

    } catch (error) {
      logger.error('[InternshipAdminService] Error in getAllInternshipStudents:', error);
      throw error;
    }
  }

  /**
   * อัพเดทข้อมูลการฝึกงานของนักศึกษา
   * @param {number} internshipId - ID ของการฝึกงาน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัพเดท
   * @param {number} adminId - ID ของ admin ที่ทำการอัพเดท
   * @returns {Promise<Object>} ข้อมูลที่อัพเดทแล้ว
   */
  async updateInternshipData(internshipId, updateData, adminId) {
    const transaction = await sequelize.transaction();
    
    try {
      // ตรวจสอบว่ามีข้อมูลการฝึกงานอยู่จริง
      const internship = await InternshipDocument.findByPk(internshipId, {
        include: [
          {
            model: Document,
            as: 'document',
            include: [
              {
                model: User,
                as: 'owner',
                include: [
                  {
                    model: Student,
                    as: 'student'
                  }
                ]
              }
            ]
          }
        ],
        transaction
      });

      if (!internship) {
        throw new Error('ไม่พบข้อมูลการฝึกงาน');
      }

      const student = internship.document.owner.student;

      // อัพเดทข้อมูล internship document
      const allowedFields = [
        'companyName',
        'companyAddress',
        'internshipPosition',
        'contactPersonName',
        'contactPersonPosition',
        'supervisorName',
        'supervisorPosition',
        'supervisorPhone',
        'supervisorEmail',
        'startDate',
        'endDate'
      ];

      const dataToUpdate = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          dataToUpdate[field] = updateData[field];
        }
      });

      if (Object.keys(dataToUpdate).length > 0) {
        await internship.update(dataToUpdate, { transaction });
        logger.info(`[InternshipAdminService] Updated internship ${internshipId} by admin ${adminId}`);
      }

      // อัพเดทสถานะการฝึกงานของนักศึกษาถ้ามีการส่งมา
      if (updateData.internshipStatus && updateData.internshipStatus !== student.internshipStatus) {
        await Student.update(
          { internshipStatus: updateData.internshipStatus },
          { where: { studentId: student.studentId }, transaction }
        );

        // อัพเดท workflow
        let stepKey, stepStatus, overallStatus;
        switch (updateData.internshipStatus) {
          case 'not_started':
            stepKey = 'INTERNSHIP_ELIGIBILITY_CHECK';
            stepStatus = 'pending';
            overallStatus = 'not_started';
            break;
          case 'pending_approval':
            stepKey = 'INTERNSHIP_CS05_APPROVAL_PENDING';
            stepStatus = 'pending';
            overallStatus = 'in_progress';
            break;
          case 'in_progress':
            stepKey = 'INTERNSHIP_IN_PROGRESS';
            stepStatus = 'in_progress';
            overallStatus = 'in_progress';
            break;
          case 'completed':
            stepKey = 'INTERNSHIP_COMPLETED';
            stepStatus = 'completed';
            overallStatus = 'completed';
            break;
          default:
            stepKey = null;
        }

        if (stepKey) {
          await workflowService.updateStudentWorkflowActivity(
            student.studentId,
            'internship',
            stepKey,
            stepStatus,
            overallStatus,
            { 
              updatedBy: adminId,
              updatedAt: dayjs().tz('Asia/Bangkok').toISOString(),
              reason: 'Manual update by admin'
            },
            { transaction }
          );
        }

        logger.info(`[InternshipAdminService] Updated student ${student.studentId} internship status to ${updateData.internshipStatus}`);
      }

      await transaction.commit();

      // ดึงข้อมูลที่อัพเดทแล้วกลับมา
      const updatedInternship = await InternshipDocument.findByPk(internshipId, {
        include: [
          {
            model: Document,
            as: 'document',
            include: [
              {
                model: User,
                as: 'owner',
                include: [
                  {
                    model: Student,
                    as: 'student'
                  }
                ]
              }
            ]
          }
        ]
      });

      return this._formatInternshipData(updatedInternship);

    } catch (error) {
      await transaction.rollback();
      logger.error('[InternshipAdminService] Error in updateInternshipData:', error);
      throw error;
    }
  }

  /**
   * ยกเลิกการฝึกงานของนักศึกษา
   * @param {number} internshipId - ID ของการฝึกงาน
   * @param {number} adminId - ID ของ admin ที่ทำการยกเลิก
   * @param {string} reason - เหตุผลในการยกเลิก
   * @returns {Promise<Object>} ผลลัพธ์การยกเลิก
   */
  async cancelInternship(internshipId, adminId, reason) {
    const transaction = await sequelize.transaction();
    
    try {
      // ตรวจสอบข้อมูลการฝึกงาน
      const internship = await InternshipDocument.findByPk(internshipId, {
        include: [
          {
            model: Document,
            as: 'document',
            include: [
              {
                model: User,
                as: 'owner',
                include: [
                  {
                    model: Student,
                    as: 'student'
                  }
                ]
              }
            ]
          }
        ],
        transaction
      });

      if (!internship) {
        throw new Error('ไม่พบข้อมูลการฝึกงาน');
      }

      const document = internship.document;
      const student = document.owner.student;
      const userId = document.userId;

      // 1. ✅ ยกเลิก CS05 ทั้งหมดของนักศึกษาคนนี้ (เพื่อให้นักศึกษาสามารถส่งคำร้องใหม่ได้)
      const cs05Documents = await Document.findAll({
        where: {
          userId: userId,
          documentName: 'CS05',
          status: {
            [Op.ne]: 'cancelled' // ไม่รวมเอกสารที่ยกเลิกไปแล้ว
          }
        },
        transaction
      });

      if (cs05Documents.length > 0) {
        await Document.update(
          {
            status: 'cancelled',
            rejectionReason: reason || 'ยกเลิกโดยเจ้าหน้าที่ภาควิชา (ยกเลิกการฝึกงาน)'
          },
          {
            where: {
              documentId: {
                [Op.in]: cs05Documents.map(doc => doc.documentId)
              }
            },
            transaction
          }
        );
        logger.info(`[InternshipAdminService] Cancelled ${cs05Documents.length} CS05 document(s) for student ${student.studentId}`);
      }

      // 2. ✅ ยกเลิกหนังสือตอบรับ (Acceptance Letter) ทั้งหมดของนักศึกษาคนนี้เป็น cancelled (เพื่อให้นักศึกษาสามารถส่งใหม่ได้)
      const acceptanceLetters = await Document.findAll({
        where: {
          userId: userId,
          documentType: 'INTERNSHIP',
          documentName: 'ACCEPTANCE_LETTER',
          // ไม่บังคับ category เพื่อให้ครอบคลุมทุกกรณี
          status: {
            [Op.ne]: 'cancelled' // ไม่รวมเอกสารที่ยกเลิกไปแล้ว
          }
        },
        transaction
      });

      if (acceptanceLetters.length > 0) {
        await Document.update(
          {
            status: 'cancelled',
            rejectionReason: reason || 'ยกเลิกโดยเจ้าหน้าที่ภาควิชา (ยกเลิกการฝึกงาน)'
          },
          {
            where: {
              documentId: {
                [Op.in]: acceptanceLetters.map(doc => doc.documentId)
              }
            },
            transaction
          }
        );

        logger.info(`[InternshipAdminService] Cancelled ${acceptanceLetters.length} acceptance letter(s) for student ${student.studentId}`);
      } else {
        logger.info(`[InternshipAdminService] No acceptance letters to cancel for student ${student.studentId}`);
      }

      // ✅ สรุปการยกเลิก
      const cs05Count = cs05Documents.length;
      const acceptanceCount = acceptanceLetters.length;
      logger.info(`[InternshipAdminService] Cancellation summary for student ${student.studentId}: CS05=${cs05Count}, Acceptance=${acceptanceCount}`);

      // รีเซ็ตสถานะการฝึกงานของนักศึกษา
      await Student.update(
        { 
          internshipStatus: 'not_started',
          isEnrolledInternship: false
        },
        { where: { studentId: student.studentId }, transaction }
      );

      // อัพเดท workflow เป็น cancelled
      await workflowService.updateStudentWorkflowActivity(
        student.studentId,
        'internship',
        'INTERNSHIP_CANCELLED',
        'cancelled',
        'cancelled',
        { 
          cancelledBy: adminId,
          cancelledAt: dayjs().tz('Asia/Bangkok').toISOString(),
          reason: reason || 'ยกเลิกโดยเจ้าหน้าที่ภาควิชา',
          previousInternshipId: internshipId
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`[InternshipAdminService] Cancelled internship ${internshipId} for student ${student.studentId} by admin ${adminId}`);

      return {
        success: true,
        internshipId,
        studentId: student.studentId,
        studentCode: student.studentCode,
        message: 'ยกเลิกการฝึกงานสำเร็จ'
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('[InternshipAdminService] Error in cancelInternship:', error);
      throw error;
    }
  }

  /**
   * Format internship data for response
   * @private
   */
  _formatInternshipData(internship) {
    const student = internship.document.owner.student;
    const user = internship.document.owner;

    return {
      internshipId: internship.internshipId,
      documentId: internship.documentId,
      studentId: student.studentId,
      studentCode: student.studentCode,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      companyName: internship.companyName,
      internshipPosition: internship.internshipPosition,
      supervisorName: internship.supervisorName,
      startDate: internship.startDate,
      endDate: internship.endDate,
      internshipStatus: student.internshipStatus,
      documentStatus: internship.document.status
    };
  }
}

module.exports = new InternshipAdminService();

