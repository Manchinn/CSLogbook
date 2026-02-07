const {
  Document,
  InternshipDocument,
  Student,
  User,
  InternshipLogbook,
  InternshipLogbookReflection,
} = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear,
  getCurrentSemester,
} = require("../utils/studentUtils");
const logger = require("../utils/logger");

/**
 * Service สำหรับจัดการการฝึกงาน
 * รวมฟังก์ชันทั้งหมดที่เกี่ยวกับการจัดการเอกสาร CS05, การประเมิน และข้อมูลการฝึกงาน
 */
class InternshipManagementService {
  // ============= Student Information Management =============

  /**
   * ดึงข้อมูลนักศึกษาและตรวจสอบสิทธิ์การฝึกงาน
   */
  async getStudentInfo(userId) {
    const student = await Student.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
    });

    if (!student) {
      throw new Error("ไม่พบข้อมูลนักศึกษา");
    }

    // คำนวณข้อมูลปีการศึกษาโดยใช้ utility functions
    const yearInfo = calculateStudentYear(student.studentCode);
    if (yearInfo.error) {
      throw new Error(yearInfo.error);
    }

    // ตรวจสอบสิทธิ์การฝึกงาน
    const eligibilityCheck = isEligibleForInternship(
      yearInfo.year,
      student.totalCredits
    );

    return {
      student: {
        studentId: student.studentCode,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        totalCredits: student.totalCredits,
        year: yearInfo.year,
        status: yearInfo.status,
        classroom: student.classroom,
        phoneNumber: student.phoneNumber,
        statusLabel: yearInfo.statusLabel,
        isEligible: eligibilityCheck.eligible,
        academicYear: await getCurrentAcademicYear(),
        department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        faculty: "คณะวิทยาศาสตร์ประยุกต์",
        university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
      },
      message: !eligibilityCheck.eligible
        ? eligibilityCheck.message
        : undefined,
    };
  }

  // ============= CS05 Document Management =============
  // NOTE: Methods moved to services/internship/document.service.js
  // This service now delegates to the new service for better organization

  /**
   * ดึงข้อมูล CS05 ปัจจุบันของนักศึกษา
   * @deprecated Use internshipDocumentService.getCurrentCS05 instead
   */
  async getCurrentCS05(userId) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.getCurrentCS05(userId);
  }

  /**
   * บันทึกคำร้องขอฝึกงาน (CS05)
   * @deprecated Use internshipDocumentService.submitCS05 instead
   */
  async submitCS05(userId, formData) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.submitCS05(userId, formData);
  }

  /**
   * บันทึกคำร้องขอฝึกงาน (CS05) พร้อม transcript
   * @deprecated Use internshipDocumentService.submitCS05WithTranscript instead
   */
  async submitCS05WithTranscript(userId, fileData, formData, deadlineInfo = {}) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.submitCS05WithTranscript(userId, fileData, formData, deadlineInfo);
  }

  /**
   * ดึงข้อมูล CS05 ตาม ID
   * @deprecated Use internshipDocumentService.getCS05ById instead
   */
  async getCS05ById(documentId, userId, userRole) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.getCS05ById(documentId, userId, userRole);
  }

  /**
   * บันทึกข้อมูลผู้ควบคุมงาน
   * @deprecated Use internshipDocumentService.submitCompanyInfo instead
   */
  async submitCompanyInfo(documentId, userId, supervisorData) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.submitCompanyInfo(documentId, userId, supervisorData);
  }

  /**
   * ดึงข้อมูลผู้ควบคุมงาน
   * @deprecated Use internshipDocumentService.getCompanyInfo instead
   */
  async getCompanyInfo(documentId, userId) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.getCompanyInfo(documentId, userId);
  }

  /**
   * ดึงรายการ CS05 ทั้งหมดของนักศึกษา
   * @deprecated Use internshipDocumentService.getCS05List instead
   */
  async getCS05List(userId) {
    const internshipDocumentService = require('./internship/document.service');
    return internshipDocumentService.getCS05List(userId);
  }

  // ============= Internship Summary Management =============

  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  async getInternshipSummary(userId) {
    logger.info(`[getInternshipSummary] Starting for userId: ${userId}`);

    // 🔍 Debug: ตรวจสอบข้อมูลพื้นฐานก่อน
    try {
      const userCheck = await User.findByPk(userId);
      if (!userCheck) {
        logger.error(`[getInternshipSummary] User not found in database for userId: ${userId}`);
        throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");
      }

      const studentCheck = await Student.findOne({ where: { userId } });
      if (!studentCheck) {
        logger.error(`[getInternshipSummary] Student record not found for userId: ${userId}`);
        throw new Error("ไม่พบข้อมูลนักศึกษา กรุณาติดต่อเจ้าหน้าที่เพื่อลงทะเบียน");
      }

      const cs05Check = await Document.findOne({
        where: { 
          userId, 
          documentName: "CS05" 
        }
      });
      
      if (!cs05Check) {
        logger.warn(`[getInternshipSummary] No CS05 found for userId: ${userId}`);
        throw new Error("ไม่พบแบบฟอร์ม คพ.05 กรุณายื่นคำร้องขอฝึกงานก่อน");
      }

      // ✅ อนุญาตเฉพาะ approved หรือ cancelled (เพื่อให้ดูข้อมูลที่ถูกยกเลิกได้)
      if (cs05Check.status !== "approved" && cs05Check.status !== "cancelled") {
        logger.warn(`[getInternshipSummary] CS05 status is '${cs05Check.status}' for userId: ${userId} - Access denied (only 'approved' or 'cancelled' allowed)`);
        throw new Error(`ไม่สามารถดูสรุปผลได้ เนื่องจากคำร้องขอฝึกงานยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${cs05Check.status})`);
      }

      // ✅ แจ้งเตือนถ้าเป็น cancelled
      if (cs05Check.status === "cancelled") {
        logger.info(`[getInternshipSummary] CS05 is cancelled for userId: ${userId} - Allowing access to view cancelled internship data`);
      }

      // ✅ ตรวจสอบสถานะ หนังสืบตอบรับฝึกงาน (ข้ามถ้า CS05 เป็น cancelled)
      let acceptanceCheck = null;
      let acceptanceStatusInfo = "skipped (CS05 cancelled)";
      
      if (cs05Check.status !== "cancelled") {
        acceptanceCheck = await Document.findOne({
          where: {
            userId,
            documentType: "INTERNSHIP",
            documentName: "ACCEPTANCE_LETTER",
            status: {
              [Op.ne]: "cancelled" // ไม่รวม cancelled
            }
          },
          order: [["created_at", "DESC"]],
        });

        if (!acceptanceCheck) {
          logger.warn(`[getInternshipSummary] No ACCEPTANCE_LETTER found for userId: ${userId}`);
          throw new Error("ไม่สามารถดูสรุปผลได้ เนื่องจากยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท");
        }

        if (acceptanceCheck.status !== "approved") {
          logger.warn(`[getInternshipSummary] ACCEPTANCE_LETTER status is '${acceptanceCheck.status}' for userId: ${userId} - Access denied`);
          throw new Error(`ไม่สามารถดูสรุปผลได้ เนื่องจากหนังสือตอบรับยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${acceptanceCheck.status})`);
        }
        
        acceptanceStatusInfo = acceptanceCheck.status;
      } else {
        // ✅ ถ้า CS05 เป็น cancelled ให้ข้ามการเช็ค Acceptance Letter
        logger.info(`[getInternshipSummary] CS05 is cancelled - Skipping ACCEPTANCE_LETTER check for userId: ${userId}`);
      }
      
      logger.info(`[getInternshipSummary] Pre-check passed for userId: ${userId}, studentId: ${studentCheck.studentId}, CS05 status: ${cs05Check.status}, Acceptance status: ${acceptanceStatusInfo}`);
    } catch (checkError) {
      logger.error(`[getInternshipSummary] Pre-check failed for userId ${userId}: ${checkError.message}`);
      throw checkError;
    }

    // ดึงข้อมูลครบถ้วนในครั้งเดียวด้วย Sequelize associations
    // เริ่มจาก User เพราะ Document associate กับ User โดยตรง
    const userWithInternship = await User.findOne({
      where: {
        userId, // ใช้ userId ตรงๆ
      },
      include: [
        {
          model: Student,
          as: "student",
          required: true,
          attributes: [
            "studentId",
            "studentCode",
            "totalCredits",
            "classroom",
            "phoneNumber",
          ],
        },
        {
          model: Document,
          as: "documents",
          where: {
            documentName: "CS05",
            status: ["approved", "supervisor_approved", "supervisor_evaluated", "cancelled"], // ✅ เพิ่ม cancelled เพื่อให้ดูข้อมูลที่ถูกยกเลิกได้
          },
          required: true,
          include: [
            {
              model: InternshipDocument,
              as: "internshipDocument",
              required: true,
              include: [
                {
                  model: InternshipLogbook,
                  as: "logbooks",
                  required: false,
                  where: {
                    student_id: sequelize.col("student.student_id"), // แก้ไขให้ตรงกับ alias "student" (ตัวพิมพ์เล็ก)
                  },
                  order: [["work_date", "ASC"]],
                },
              ],
            },
          ],
        },
      ],
      order: [[{ model: Document, as: "documents" }, "created_at", "DESC"]],
    });

    if (!userWithInternship) {
      logger.error(`[getInternshipSummary] Complex query returned null for userId: ${userId} - likely missing InternshipDocument`);
      throw new Error(
        "ไม่พบข้อมูลการฝึกงานที่สมบูรณ์ อาจเป็นเพราะข้อมูลบริษัท/วันที่ฝึกงานยังไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่"
      );
    }

    // ตรวจสอบว่ามีข้อมูลนักศึกษาหรือไม่
    if (!userWithInternship.student) {
      logger.warn(
        `[getInternshipSummary] No student data found for userId: ${userId}`
      );
      throw new Error("ไม่พบข้อมูลนักศึกษา");
    }

    // ดึงข้อมูล internship document ล่าสุด
    const latestDocument = userWithInternship.documents[0];
    const internshipDoc = latestDocument.internshipDocument;

    if (!internshipDoc) {
      logger.warn(`[getInternshipSummary] No internship document found`);
      throw new Error("ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ");
    }

    // ดึงข้อมูลบันทึกฝึกงาน (logbooks) ที่ได้จาก include
    const logbooks = internshipDoc.logbooks || [];
    logger.info(
      `[getInternshipSummary] Found ${logbooks.length} logbook entries`
    );

    // คำนวณสถิติต่างๆ
    const totalDays = logbooks.length;
    const totalHours = logbooks.reduce(
      (sum, log) => sum + parseFloat(log.workHours || 0),
      0
    );
    
    // ✅ แก้ไข Logic การ filter ให้รองรับทั้ง boolean และ integer
    const approvedDays = logbooks.filter(
      (log) => log.supervisorApproved === 1 || log.supervisorApproved === true
    ).length;
    
    const approvedHours = logbooks
      .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
      .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

    // ดึงข้อมูลสรุปทักษะและความรู้ (Reflection) ด้วย field name ที่ถูกต้อง
    let learningOutcomes = "";
    let reflectionData = null;

    try {
      logger.info(
        `[getInternshipSummary] Fetching reflection for student_id: ${userWithInternship.student.studentId}, internship_id: ${internshipDoc.internshipId}`
      );

      const reflectionEntry = await InternshipLogbookReflection.findOne({
        where: {
          student_id: userWithInternship.student.studentId, // ใช้ snake_case
          internship_id: internshipDoc.internshipId, // ใช้ snake_case
        },
        order: [["created_at", "DESC"]],
      });

      if (reflectionEntry) {
        logger.info(`[getInternshipSummary] Found reflection entry`);

        // รวมข้อมูล reflection หลายฟิลด์เป็น learning outcome
        const reflectionParts = [];

        if (reflectionEntry.learning_outcome) {
          reflectionParts.push(
            `ผลการเรียนรู้: ${reflectionEntry.learning_outcome}`
          );
        }

        if (reflectionEntry.key_learnings) {
          reflectionParts.push(
            `สิ่งที่ได้เรียนรู้: ${reflectionEntry.key_learnings}`
          );
        }

        if (reflectionEntry.future_application) {
          reflectionParts.push(
            `การนำไปใช้ในอนาคต: ${reflectionEntry.future_application}`
          );
        }

        if (reflectionEntry.improvements) {
          reflectionParts.push(`ข้อเสนอแนะ: ${reflectionEntry.improvements}`);
        }

        learningOutcomes = reflectionParts.join("\n\n");

        reflectionData = {
          learningOutcome: reflectionEntry.learning_outcome || "",
          keyLearnings: reflectionEntry.key_learnings || "",
          futureApplication: reflectionEntry.future_application || "",
          improvements: reflectionEntry.improvements || "",
        };
      } else {
        logger.info(`[getInternshipSummary] No reflection entry found`);
      }
    } catch (reflectionError) {
      logger.error(
        `[getInternshipSummary] Error fetching reflection for student_id ${userWithInternship.student.studentId}, internship_id ${internshipDoc.internshipId}:`,
        reflectionError
      );
    }

    // คำนวณข้อมูลชั้นปีโดยใช้ utility function
    const yearInfo = calculateStudentYear(
      userWithInternship.student.studentCode
    );

    // สร้างข้อมูลนักศึกษาสำหรับ PDF รวมข้อมูลชั้นปี
    const studentInfo = {
      studentId: userWithInternship.student.studentCode,
      fullName: `${userWithInternship.firstName} ${userWithInternship.lastName}`,
      firstName: userWithInternship.firstName,
      lastName: userWithInternship.lastName,
      email: userWithInternship.email,
      phoneNumber:
        userWithInternship.phoneNumber ||
        userWithInternship.student.phoneNumber,
      totalCredits: userWithInternship.student.totalCredits,
      classroom: userWithInternship.student.classroom,
      department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
      university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
      // เพิ่มข้อมูลชั้นปีที่คำนวณได้
      year: yearInfo.error ? 0 : yearInfo.year,
      yearLevel: yearInfo.error ? "ไม่ระบุ" : `${yearInfo.year}`,
      status: yearInfo.error ? "unknown" : yearInfo.status,
      statusLabel: yearInfo.error ? "ไม่ระบุสถานะ" : yearInfo.statusLabel,
      academicYear: await getCurrentAcademicYear(),
    };

    return {
      documentId: latestDocument.documentId,
      status: latestDocument.status,
      companyName: internshipDoc.companyName,
      companyAddress: internshipDoc.companyAddress,
      startDate: internshipDoc.startDate,
      endDate: internshipDoc.endDate,
      supervisorName: internshipDoc.supervisorName,
      supervisorPosition: internshipDoc.supervisorPosition,
      supervisorPhone: internshipDoc.supervisorPhone,
      supervisorEmail: internshipDoc.supervisorEmail,
      totalDays: totalDays,
      totalHours: totalHours,
      approvedDays: approvedDays,
      approvedHours: approvedHours,
      learningOutcome: learningOutcomes,
      reflectionData: reflectionData,
      studentInfo: studentInfo, // เพิ่มข้อมูลนักศึกษาสำหรับ PDF
    };
  }

  // ============= Evaluation Management =============
  // NOTE: Methods moved to services/internship/evaluation.service.js
  // This service now delegates to the new service for better organization

  /**
   * ตรวจสอบสถานะการแจ้งเตือนก่อนแสดงข้อมูลการประเมิน
   * @deprecated Use internshipEvaluationService.getEvaluationStatus instead
   */
  async getEvaluationStatus(userId) {
    const internshipEvaluationService = require('./internship/evaluation.service');
    return internshipEvaluationService.getEvaluationStatus(userId);
  }


  /**
   * ส่งแบบประเมินให้ผู้ควบคุมงาน - แก้ไขการค้นหาเอกสาร
   * @deprecated Use internshipEvaluationService.sendEvaluationForm instead
   */
  async sendEvaluationForm(documentId, userId) {
    const internshipEvaluationService = require('./internship/evaluation.service');
    return internshipEvaluationService.sendEvaluationForm(documentId, userId);
  }


  /**
   * ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินโดย Supervisor (แบบเดียวกับ getEvaluationStatus)
   * @deprecated Use internshipEvaluationService.getSupervisorEvaluationFormDetails instead
   */
  async getSupervisorEvaluationFormDetails(token) {
    const internshipEvaluationService = require('./internship/evaluation.service');
    return internshipEvaluationService.getSupervisorEvaluationFormDetails(token);
  }


  /**
   * ✅ ฟังก์ชันใหม่: ดึงข้อมูลนักศึกษาจาก userId (แบบง่าย)
   * @deprecated Use internshipEvaluationService.getStudentFromUserId instead
   */
  async getStudentFromUserId(userId) {
    const internshipEvaluationService = require('./internship/evaluation.service');
    return internshipEvaluationService.getStudentFromUserId(userId);
  }


  /**
   * บันทึกผลการประเมินโดย Supervisor
   * @deprecated Use internshipEvaluationService.submitSupervisorEvaluation instead
   */
  async submitSupervisorEvaluation(token, evaluationData) {
    const internshipEvaluationService = require('./internship/evaluation.service');
    return internshipEvaluationService.submitSupervisorEvaluation(token, evaluationData);
  }


  // ============= Referral Letter Management =============
  // NOTE: Methods moved to services/internship/referralLetter.service.js
  // This service now delegates to the new service for better organization

  /**
   * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา (แก้ไขให้ CS05 เป็น approved ตลอด)
   * @deprecated Use internshipReferralLetterService.getReferralLetterStatus instead
   */
  async getReferralLetterStatus(userId, cs05DocumentId) {
    const internshipReferralLetterService = require('./internship/referralLetter.service');
    return internshipReferralLetterService.getReferralLetterStatus(userId, cs05DocumentId);
  }


  /**
   * สร้าง PDF หนังสือส่งตัวนักศึกษา
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ข้อมูล PDF buffer และ metadata
   * @deprecated Use internshipReferralLetterService.generateReferralLetterPDF instead
   */
  async generateReferralLetterPDF(userId, documentId) {
    const internshipReferralLetterService = require('./internship/referralLetter.service');
    return internshipReferralLetterService.generateReferralLetterPDF(userId, documentId);
  }


  // ============= Acceptance Letter Management =============
  // NOTE: Methods moved to services/internship/acceptanceLetter.service.js
  // This service now delegates to the new service for better organization

  /**
   * อัปโหลดหนังสือตอบรับการฝึกงาน
   * @deprecated Use internshipAcceptanceLetterService.uploadAcceptanceLetter instead
   */
  async uploadAcceptanceLetter(userId, cs05DocumentId, fileData) {
    const internshipAcceptanceLetterService = require('./internship/acceptanceLetter.service');
    return internshipAcceptanceLetterService.uploadAcceptanceLetter(userId, cs05DocumentId, fileData);
  }


  /**
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน (แก้ไขให้ตรวจสอบจากฐานข้อมูลจริง)
   * @deprecated Use internshipAcceptanceLetterService.checkAcceptanceLetterStatus instead
   */
  async checkAcceptanceLetterStatus(userId, cs05DocumentId) {
    const internshipAcceptanceLetterService = require('./internship/acceptanceLetter.service');
    return internshipAcceptanceLetterService.checkAcceptanceLetterStatus(userId, cs05DocumentId);
  }


  /**
   * ลบหนังสือตอบรับ (กรณีต้องการอัปโหลดใหม่)
   */
  async deleteAcceptanceLetter(userId, acceptanceDocumentId) {
    const transaction = await sequelize.transaction();

    try {
      logger.debug("[DEBUG] deleteAcceptanceLetter:", {
        userId,
        acceptanceDocumentId,
      });

      // 1. ค้นหาเอกสารหนังสือตอบรับ
      const acceptanceDocument = await Document.findOne({
        where: {
          documentId: parseInt(acceptanceDocumentId),
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
        },
        transaction,
      });

      if (!acceptanceDocument) {
        throw new Error(
          "ไม่พบหนังสือตอบรับที่ต้องการลบ หรือไม่มีสิทธิ์เข้าถึง"
        );
      }

      // ตรวจสอบสถานะ (ไม่ให้ลบถ้าได้รับการอนุมัติแล้ว)
      if (acceptanceDocument.status === "approved") {
        throw new Error("ไม่สามารถลบหนังสือตอบรับที่ได้รับการอนุมัติแล้ว");
      }

      const fileName = acceptanceDocument.fileName;
      // const parentDocumentId = acceptanceDocument.parentDocumentId;

      // 2. ลบไฟล์จากระบบ (ถ้ามี)
      if (acceptanceDocument.filePath) {
        const fs = require("fs").promises;
        const path = require("path");

        try {
          await fs.unlink(acceptanceDocument.filePath);
          logger.debug(
            "[DEBUG] File deleted from filesystem:",
            acceptanceDocument.filePath
          );
        } catch (fileError) {
          logger.warn("[DEBUG] Could not delete file:", fileError.message);
          // ไม่ throw error เพราะไฟล์อาจถูกลบไปแล้ว
        }
      }

      // 3. ลบข้อมูลจากฐานข้อมูล
      await acceptanceDocument.destroy({ transaction });

      await transaction.commit();

      return {
        message: `ลบหนังสือตอบรับ "${fileName}" เรียบร้อยแล้ว`,
        deletedDocumentId: acceptanceDocument.documentId,
        // cs05DocumentId: parentDocumentId,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Delete Acceptance Letter Service Error:", error);
      throw error;
    }
  }

  /**
   * ดาวน์โหลดหนังสือตอบรับ
   * @deprecated Use internshipAcceptanceLetterService.downloadAcceptanceLetter instead
   */
  async downloadAcceptanceLetter(userId, acceptanceDocumentId) {
    const internshipAcceptanceLetterService = require('./internship/acceptanceLetter.service');
    return internshipAcceptanceLetterService.downloadAcceptanceLetter(userId, acceptanceDocumentId);
  }


  /**
   * สร้าง PDF หนังสือส่งตัว (ฟังก์ชันช่วย)
   * *** ต้องเพิ่ม PDF generation library ***
   * @deprecated Use internshipReferralLetterService.createReferralLetterPDF instead
   */
  async createReferralLetterPDF(data) {
    const internshipReferralLetterService = require('./internship/referralLetter.service');
    return internshipReferralLetterService.createReferralLetterPDF(data);
  }


  /**
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน (ฟังก์ชันอื่นที่ใช้งานคล้ายกัน)
   * @deprecated Use internshipAcceptanceLetterService.getAcceptanceLetterStatus instead
   */
  async getAcceptanceLetterStatus(userId, cs05DocumentId) {
    const internshipAcceptanceLetterService = require('./internship/acceptanceLetter.service');
    return internshipAcceptanceLetterService.getAcceptanceLetterStatus(userId, cs05DocumentId);
  }


  /**
   * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว (แก้ไขให้อัปเดต acceptanceLetter แทน)
   * @deprecated Use internshipReferralLetterService.markReferralLetterDownloaded instead
   */
  async markReferralLetterDownloaded(userId, cs05DocumentId) {
    const internshipReferralLetterService = require('./internship/referralLetter.service');
    return internshipReferralLetterService.markReferralLetterDownloaded(userId, cs05DocumentId);
  }


  // ============= Certificate Management (ปรับปรุงใหม่) =============
  // NOTE: Methods moved to services/internship/certificate.service.js
  // This service now delegates to the new service for better organization

  /**
   * ✅ ปรับปรุง previewCertificatePDF ให้ดีขึ้น
   * @deprecated Use internshipCertificateService.previewCertificatePDF instead
   */
  async previewCertificatePDF(userId) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.previewCertificatePDF(userId);
  }

  /**
   * ✅ ปรับปรุง downloadCertificatePDF ให้ดีขึ้น
   * @deprecated Use internshipCertificateService.downloadCertificatePDF instead
   */
  async downloadCertificatePDF(userId) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.downloadCertificatePDF(userId);
  }

  /**
   * ✅ ปรับปรุง createCertificatePDF ให้มีเนื้อหาครบถ้วน
   * @deprecated Use internshipCertificateService.createCertificatePDF instead
   */
  async createCertificatePDF(certificateData) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.createCertificatePDF(certificateData);
  }

  /**
   * ดึงข้อมูลสำหรับสร้างหนังสือรับรอง (ปรับปรุงให้เหมาะกับ Frontend PDF Generation)
   * @deprecated Use internshipCertificateService.getCertificateData instead
   */
  async getCertificateData(userId) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.getCertificateData(userId);
  }

  /**
   * บันทึกการดาวน์โหลดหนังสือรับรอง (เรียกจาก Frontend หลังดาวน์โหลดสำเร็จ)
   * @deprecated Use internshipCertificateService.markCertificateDownloaded instead
   */
  async markCertificateDownloaded(userId) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.markCertificateDownloaded(userId);
  }

  /**
   * @deprecated Use internshipCertificateService.getCertificateStatus instead
   */
  async getCertificateStatus(userId) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.getCertificateStatus(userId);
  }

  /**
   * @deprecated Use internshipCertificateService.submitCertificateRequest instead
   */
  async submitCertificateRequest(userId, requestData) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.submitCertificateRequest(userId, requestData);
  }

  /**
   * @deprecated Use internshipCertificateService.generateCertificateNumber instead
   */
  generateCertificateNumber(studentCode) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.generateCertificateNumber(studentCode);
  }

  /**
   * @deprecated Use internshipCertificateService.formatThaiDate instead
   */
  formatThaiDate(date) {
    const internshipCertificateService = require('./internship/certificate.service');
    return internshipCertificateService.formatThaiDate(date);
  }

  /**
   * 🆕 อัปเดตสถานะการฝึกงานของนักศึกษาในฐานข้อมูล
   * @param {number} userId - User ID
   * @param {string} status - สถานะใหม่ ('not_started', 'pending_approval', 'in_progress', 'completed')
   */
  async updateStudentInternshipStatus(userId, status) {
    try {
      const { sequelize } = require("../config/database");
      
      // ตรวจสอบสถานะปัจจุบันก่อน
      const [currentData] = await sequelize.query(
        'SELECT student_code, internship_status FROM students WHERE user_id = ?',
        { replacements: [userId] }
      );

      if (currentData.length === 0) {
        logger.warn(`[updateStudentInternshipStatus] Student not found for userId: ${userId}`);
        return;
      }

      const currentStudent = currentData[0];
      

      // อัปเดตสถานะด้วย raw SQL
      await sequelize.query(
        'UPDATE students SET internship_status = ?, updated_at = NOW() WHERE user_id = ?',
        { replacements: [status, userId] }
      );

      logger.debug(`[updateStudentInternshipStatus] Successfully updated internship_status from '${currentStudent.internship_status}' to '${status}' for student ${currentStudent.student_code}`);
      
    } catch (error) {
      logger.error(`[updateStudentInternshipStatus] Error updating status:`, error);
    }
  }
}

module.exports = new InternshipManagementService();
