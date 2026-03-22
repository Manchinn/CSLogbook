// services/internship/evaluation.service.js
const {
  Document,
  InternshipDocument,
  Student,
  User,
  ApprovalToken,
  InternshipEvaluation,
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { sequelize } = require("../../config/database");
const emailService = require("../../utils/mailer.js");
const crypto = require("crypto");
const notificationSettingsService = require("../notificationSettingsService");
const logger = require("../../utils/logger");

/**
 * Service สำหรับจัดการการประเมินการฝึกงาน
 */
class InternshipEvaluationService {
  /**
   * ตรวจสอบสถานะการแจ้งเตือนก่อนแสดงข้อมูลการประเมิน
   */
  async getEvaluationStatus(userId) {
    // ตรวจสอบสถานะการแจ้งเตือนก่อน
    const isEvaluationNotificationEnabled =
      await notificationSettingsService.isNotificationEnabled(
        "EVALUATION",
        true
      );

    // ดำเนินการตามปกติเพื่อดึงข้อมูล
    const student = await Student.findOne({
      where: { userId },
      attributes: ["studentId"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    if (!student) {
      throw new Error("ไม่พบข้อมูลนักศึกษา");
    }

    const document = await Document.findOne({
      where: {
        userId,
        documentName: "CS05",
        status: ["approved", "supervisor_approved", "supervisor_evaluated"],
      },
      attributes: ["documentId", "status", "documentName"],
      include: [
        {
          model: InternshipDocument,
          as: "internshipDocument",
          required: true,
          attributes: [
            "internshipId",
            "companyName",
            "supervisorName",
            "supervisorEmail",
            "supervisorPhone",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!document || !document.internshipDocument) {
      throw new Error("ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ");
    }

    const evaluationRequest = await ApprovalToken.findOne({
      where: {
        documentId: document.documentId,
        type: "supervisor_evaluation",
        email: document.internshipDocument.supervisorEmail,
      },
      order: [["created_at", "DESC"]],
    });

    const existingEvaluation = await InternshipEvaluation.findOne({
      where: {
        studentId: student.studentId,
        internshipId: document.internshipDocument.internshipId,
      },
    });

    let status = "not_sent";
    let lastSentDate = null;

    if (evaluationRequest) {
      status = evaluationRequest.status === "used" ? "completed" : "sent";
      lastSentDate = evaluationRequest.created_at;
    }

    if (existingEvaluation) {
      status = "completed";
    }

    return {
      documentId: document.documentId,
      internshipId: document.internshipDocument.internshipId,
      companyName: document.internshipDocument.companyName,
      supervisorName: document.internshipDocument.supervisorName,
      supervisorEmail: document.internshipDocument.supervisorEmail,
      supervisorPhone: document.internshipDocument.supervisorPhone,
      evaluationStatus: status,
      lastSentDate: lastSentDate,
      hasEvaluation: !!existingEvaluation,
      canResend: status === "sent" || status === "not_sent",
    };
  }

  /**
   * ส่งแบบประเมินให้ผู้ควบคุมงาน - แก้ไขการค้นหาเอกสาร
   */
  async sendEvaluationForm(documentId, userId) {
    const transaction = await sequelize.transaction();
    try {
      // ตรวจสอบว่าการแจ้งเตือนประเมินผลเปิดใช้งานหรือไม่
      const isEvaluationNotificationEnabled =
        await notificationSettingsService.isNotificationEnabled(
          "EVALUATION",
          true
        );

      if (!isEvaluationNotificationEnabled) {
        throw new Error(
          "ขณะนี้ระบบปิดการแจ้งเตือนการประเมินผลชั่วคราว กรุณาติดต่อเจ้าหน้าที่หรือลองใหม่ในภายหลัง"
        );
      }

      // ดึงข้อมูลนักศึกษาสำหรับอีเมล
      const studentInfo = await Student.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName"],
          },
        ],
        attributes: ["studentId"],
        transaction,
      });

      if (!studentInfo || !studentInfo.user) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // 1. ค้นหาเอกสาร CS05 โดยใช้ documentId
      const document = await Document.findOne({
        where: {
          documentId: documentId,
          userId,
          documentName: "CS05",
          status: ["approved", "supervisor_approved"],
        },
        attributes: ["documentId", "status"],
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument", // ระบุ alias ชัดเจน
            required: true,
            attributes: [
              "internshipId",
              "companyName",
              "supervisorName",
              "supervisorEmail",
              "endDate",
            ],
          },
        ],
        transaction,
      });

      if (!document || !document.internshipDocument) {
        throw new Error(
          "ไม่พบเอกสาร CS05 ที่ได้รับการอนุมัติ หรือข้อมูลการฝึกงานไม่สมบูรณ์"
        );
      }

      // ตรวจสอบข้อมูลผู้ควบคุมงาน
      if (!document.internshipDocument.supervisorEmail) {
        throw new Error(
          "ไม่พบข้อมูลอีเมลผู้ควบคุมงาน กรุณาเพิ่มข้อมูลผู้ควบคุมงานก่อน"
        );
      }

      // ตรวจสอบว่าบันทึกประจำวันครบทุกวันแล้วหรือไม่ก่อนส่งแบบประเมิน
      // ใช้ lazy require เพื่อหลีกเลี่ยง circular dependency
      const internshipLogbookService = require("../internshipLogbookService");
      const logbookStats = await internshipLogbookService.getTimeSheetStats(userId);
      if (logbookStats && logbookStats.total > 0 && logbookStats.completed < logbookStats.total) {
        throw new Error(
          `กรุณาบันทึกข้อมูลประจำวันให้ครบก่อนส่งแบบประเมิน (บันทึกแล้ว ${logbookStats.completed}/${logbookStats.total} วัน)`
        );
      }

      // 2. ตรวจสอบว่ามี token ที่ยังไม่หมดอายุอยู่หรือไม่
      const existingToken = await ApprovalToken.findOne({
        where: {
          documentId: document.documentId,
          email: document.internshipDocument.supervisorEmail,
          type: "supervisor_evaluation",
          status: "pending",
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (existingToken) {
        throw new Error(
          `คำขอประเมินผลถูกส่งไปยัง ${
            document.internshipDocument.supervisorEmail
          } แล้ว และยังไม่หมดอายุ (หมดอายุ ${existingToken.expiresAt.toLocaleDateString(
            "th-TH"
          )})`
        );
      }

      // 3. สร้างและบันทึก token ใหม่
      const tokenValue = crypto.randomBytes(32).toString("hex");
      //const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

      await ApprovalToken.create(
        {
          token: tokenValue,
          documentId: document.documentId,
          email: document.internshipDocument.supervisorEmail,
          type: "supervisor_evaluation",
          status: "pending",
          expiresAt: expiresAt,
          studentId: studentInfo.studentId,
          supervisorId: document.internshipDocument.supervisorName,
          logId: document.documentId.toString(),
        },
        { transaction }
      );

      // 4. เขียนและส่งอีเมลให้ผู้ควบคุมงาน
      const evaluationLink = `${process.env.FRONTEND_URL}/evaluate/supervisor/${tokenValue}`;
      const studentFullName = `${studentInfo.user.firstName} ${studentInfo.user.lastName}`;
      const supervisorName =
        document.internshipDocument.supervisorName || "ผู้ควบคุมการฝึกงาน";

      await emailService.sendInternshipEvaluationRequestEmail(
        document.internshipDocument.supervisorEmail,
        supervisorName,
        studentFullName,
        studentInfo.studentId,
        document.internshipDocument.companyName,
        evaluationLink,
        expiresAt
      );

      await transaction.commit();

      return {
        message: `คำขอประเมินผลถูกส่งไปยัง ${document.internshipDocument.supervisorEmail} เรียบร้อยแล้ว`,
        supervisorEmail: document.internshipDocument.supervisorEmail,
        expiresAt: expiresAt,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินโดย Supervisor (แบบเดียวกับ getEvaluationStatus)
   */
  async getSupervisorEvaluationFormDetails(token) {
    try {
      logger.info(`🔍 กำลังดึงข้อมูลแบบประเมินสำหรับ token: ${token}`);

      // 1. ตรวจสอบ token และดึงข้อมูลการประเมิน
      const approvalToken = await ApprovalToken.findOne({
        where: {
          token: token,
          type: "supervisor_evaluation",
          status: "pending",
        },
      });

      if (!approvalToken) {
        throw new Error("ไม่พบข้อมูลแบบประเมินหรือลิงก์ไม่ถูกต้อง");
      }

      // ตรวจสอบว่า token หมดอายุหรือไม่
      if (approvalToken.expiresAt && new Date() > approvalToken.expiresAt) {
        throw new Error("ลิงก์การประเมินหมดอายุแล้ว");
      }

      logger.info(`✅ Token ถูกต้อง:`, {
        tokenId: approvalToken.tokenId,
        documentId: approvalToken.documentId,
        studentId: approvalToken.studentId,
        email: approvalToken.email,
      });

      // 2. ✅ ใช้แบบเดียวกับ getEvaluationStatus - ค้นหา document โดยตรง
      const document = await Document.findOne({
        where: {
          documentId: approvalToken.documentId,
          documentName: "CS05",
          status: ["approved", "supervisor_approved"],
        },
        attributes: ["documentId", "status", "documentName", "userId"],
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: [
              "internshipId",
              "companyName",
              "companyAddress",
              "startDate",
              "endDate",
              "internshipPosition",
              "supervisorName",
              "supervisorPosition",
              "supervisorEmail",
              "supervisorPhone",
            ],
          },
        ],
      });

      if (!document || !document.internshipDocument) {
        throw new Error("ไม่พบข้อมูลการฝึกงาน");
      }

      logger.info(`✅ ดึงข้อมูลเอกสารสำเร็จ:`, {
        documentId: document.documentId,
        hasInternshipDoc: !!document.internshipDocument,
        userId: document.userId,
      });

      // 3. ✅ ดึงข้อมูล User และ Student แยกต่างหาก (เหมือน getEvaluationStatus)
      const student = await Student.findOne({
        where: { userId: document.userId },
        attributes: ["studentId", "studentCode"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
          },
        ],
      });

      if (!student || !student.user) {
        // ✅ ถ้าไม่พบ ใช้ข้อมูลจาก approvalToken แทน
        logger.warn(
          `⚠️ ไม่พบข้อมูลนักศึกษาสำหรับ userId: ${document.userId}, ใช้ข้อมูลจาก token`
        );
      }

      // 4. ✅ จัดเตรียมข้อมูลสำหรับแบบฟอร์ม
      const internshipDoc = document.internshipDocument;
      const user = student?.user;
      const studentData = student;

      const formData = {
        tokenId: approvalToken.tokenId,
        token: approvalToken.token,
        studentInfo: {
          studentId: studentData?.studentId || approvalToken.studentId,
          studentCode:
            studentData?.studentCode || `นศ.${approvalToken.studentId}`,
          firstName: user?.firstName || "ไม่พบข้อมูล",
          lastName: user?.lastName || "",
          fullName: user
            ? `${user.firstName} ${user.lastName}`
            : `นักศึกษารหัส ${approvalToken.studentId}`,
          email: user?.email || approvalToken.email,
        },
        internshipInfo: {
          companyName: internshipDoc.companyName,
          companyAddress: internshipDoc.companyAddress,
          startDate: internshipDoc.startDate,
          endDate: internshipDoc.endDate,
          internshipPosition: internshipDoc.internshipPosition,
          supervisorName: internshipDoc.supervisorName,
          supervisorPosition: internshipDoc.supervisorPosition,
          supervisorEmail: internshipDoc.supervisorEmail,
          supervisorPhone: internshipDoc.supervisorPhone,
        },
        evaluationDetails: {
          sentDate: approvalToken.created_at,
          expiresAt: approvalToken.expiresAt,
          status: approvalToken.status,
          documentId: document.documentId,
          internshipId: internshipDoc.internshipId,
        },
      };

      logger.info(
        `✅ ดึงข้อมูลแบบประเมินสำเร็จสำหรับนักศึกษา: ${formData.studentInfo.fullName}`
      );

      return formData;
    } catch (error) {
      logger.error("❌ Error in getSupervisorEvaluationFormDetails:", error);
      throw error;
    }
  }

  /**
   * ✅ ฟังก์ชันใหม่: ดึงข้อมูลนักศึกษาจาก userId (แบบง่าย)
   */
  async getStudentFromUserId(userId) {
    try {
      const student = await Student.findOne({
        where: { userId },
        attributes: ["studentId", "studentCode"],
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

      return {
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        studentId: student.studentId,
        studentCode: student.studentCode,
      };
    } catch (error) {
      logger.error("Error getting student from userId:", error);
      throw error;
    }
  }

  /**
   * บันทึกผลการประเมินโดย Supervisor
   */
  async submitSupervisorEvaluation(token, evaluationData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(`🔍 กำลังบันทึกผลการประเมินสำหรับ token: ${token}`);

      // ตรวจสอบ token
      const approvalToken = await ApprovalToken.findOne({
        where: {
          token: token,
          type: "supervisor_evaluation",
          status: "pending",
        },
      });

      if (!approvalToken) {
        throw new Error("ไม่พบข้อมูลแบบประเมินหรือลิงก์ไม่ถูกต้อง");
      }

      // ตรวจสอบว่า token หมดอายุหรือไม่
      if (approvalToken.expiresAt && new Date() > approvalToken.expiresAt) {
        throw new Error("ลิงก์การประเมินหมดอายุแล้ว");
      }

      // ตรวจสอบข้อมูลที่จำเป็น
      const requiredFields = [
        "supervisorName",
        "supervisorPosition",
        // โครงสร้างใหม่ใช้ categories + supervisorDecision แทน evaluationScores / overallRating
        "categories",
        "supervisorDecision",
        "strengths",
        "improvements",
      ];

      const missingFields = requiredFields.filter(
        (field) => !evaluationData[field]
      );
      if (missingFields.length > 0) {
        const error = new Error(
          `ข้อมูลไม่ครบถ้วน: ${missingFields.join(", ")}`
        );
        error.statusCode = 400;
        error.errors = missingFields.map((field) => ({
          field,
          message: "ข้อมูลจำเป็น",
        }));
        throw error;
      }

      // ดึงข้อมูล internship document
      const document = await Document.findOne({
        where: { documentId: approvalToken.documentId },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
        transaction,
      });

      if (!document || !document.internshipDocument) {
        throw new Error("ไม่พบข้อมูลการฝึกงาน");
      }

      // ================== รูปแบบใหม่ (2025-08): 5 หมวด × 4 รายการ รวม 100 คะแนน ==================
      // expected evaluationData.categories = { discipline:[..4], behavior:[..4], performance:[..4], method:[..4], relation:[..4] }
      // supervisorDecision = true/false
      const categories = evaluationData.categories || {};
      const requiredCats = ['discipline','behavior','performance','method','relation'];
      // ตรวจสอบจำนวนรายการย่อย (4 ต่อหมวด)
      for (const cat of requiredCats) {
        if (!Array.isArray(categories[cat]) || categories[cat].length !== 4) {
          const err = new Error(`โครงสร้างคะแนนหมวด ${cat} ไม่ถูกต้อง (ต้องมี 4 รายการ)`);
          err.statusCode = 400;
          throw err;
        }
      }

      // validate คะแนนเป็น 1..5
      const validateScore = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
      for (const cat of requiredCats) {
        categories[cat].forEach((s,i)=>{
          if (!validateScore(s)) {
            const err = new Error(`คะแนนหมวด ${cat} ลำดับ ${i+1} ไม่ถูกต้อง ต้องเป็นจำนวนเต็ม 1-5`);
            err.statusCode = 400; throw err;
          }
        });
      }

      const sum = arr => arr.reduce((a,b)=>a+b,0);
      const disciplineScore = sum(categories.discipline); // 0-20
      const behaviorScore = sum(categories.behavior);
      const performanceScore = sum(categories.performance);
      const methodScore = sum(categories.method);
      const relationScore = sum(categories.relation);
      const overallScore = disciplineScore + behaviorScore + performanceScore + methodScore + relationScore; // 0-100

      const supervisorPassDecision = !!evaluationData.supervisorDecision; // boolean
      const { PASS_SCORE } = require('../../config/scoring');
      const passFail = (overallScore >= PASS_SCORE && supervisorPassDecision) ? 'pass' : 'fail';
      const evaluatedAt = new Date();

      // เตรียม evaluationItems array
      const makeItems = (catKey, arr) => arr.map((score, idx)=>({
        category: catKey,
        item: `${catKey}_${idx+1}`,
        score
      }));
      const allItems = [
        ...makeItems('discipline', categories.discipline),
        ...makeItems('behavior', categories.behavior),
        ...makeItems('performance', categories.performance),
        ...makeItems('method', categories.method),
        ...makeItems('relation', categories.relation),
      ];

      const weaknessesToImprove = evaluationData.improvements || evaluationData.weaknessesToImprove || null;

      const defaultsPayload = {
        evaluatorName: evaluationData.supervisorName,
        strengths: evaluationData.strengths || null,
        weaknessesToImprove,
        additionalComments: evaluationData.additionalComments || null,
        status: 'completed',
        evaluatedBySupervisorAt: evaluatedAt,
        // ใหม่
        evaluationItems: JSON.stringify(allItems),
        disciplineScore, behaviorScore, performanceScore, methodScore, relationScore,
        overallScore, // ใช้คอลัมน์เดิม overall_score
        supervisorPassDecision,
        passFail,
        passEvaluatedAt: evaluatedAt,
      };

      const [evaluation, created] = await InternshipEvaluation.findOrCreate({
        where: {
          studentId: approvalToken.studentId,
          internshipId: document.internshipDocument.internshipId,
        },
        defaults: defaultsPayload,
        transaction,
      });

      if (!created) {
        await evaluation.update(defaultsPayload, { transaction });
      }

      // อัปเดตสถานะ token
      await approvalToken.update(
        {
          status: "used",
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(
        `✅ บันทึกผลการประเมินสำเร็จสำหรับ evaluationId: ${evaluation.evaluationId}`
      );

      // ✅ ตรวจสอบสถานะการแจ้งเตือนก่อนส่งอีเมล
      try {
        const isEvaluationNotificationEnabled =
          await notificationSettingsService.isNotificationEnabled(
            "EVALUATION",
            true
          );

        if (!isEvaluationNotificationEnabled) {
          logger.info("⚠️ การแจ้งเตือน EVALUATION ถูกปิดใช้งาน");
        } else {
          // ✅ ใช้ฟังก์ชันใหม่ที่ง่ายกว่า
          const studentData = await this.getStudentFromUserId(document.userId);

          if (studentData && studentData.email) {
            logger.info(`📧 กำลังส่งอีเมลแจ้งเตือนไปยัง: ${studentData.email}`);

            // fire-and-forget: ไม่ block response
            emailService.sendEvaluationSubmittedNotificationToStudent(
              studentData.email,
              studentData.firstName,
              document.internshipDocument.companyName,
              evaluationData.supervisorName
            ).then(() => {
              logger.info(`ส่งอีเมลแจ้งเตือนสำเร็จไปยัง: ${studentData.email}`);
            }).catch(err => {
              logger.warn('evaluation_email_to_student_failed', { error: err.message });
            });
          }
        }
      } catch (emailError) {
        logger.warn("⚠️ ไม่สามารถส่งอีเมลแจ้งเตือนได้:", emailError.message);
      }

      return {
        message: "บันทึกผลการประเมินเรียบร้อยแล้ว ขอบคุณสำหรับการประเมิน",
        data: {
          evaluationId: evaluation.evaluationId,
          completedDate: evaluation.completedDate,
          overallRating: evaluationData.overallRating,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("❌ Error in submitSupervisorEvaluation:", error);
      throw error;
    }
  }
}

module.exports = new InternshipEvaluationService();
