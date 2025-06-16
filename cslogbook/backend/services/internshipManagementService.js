const {
  Document,
  InternshipDocument,
  Student,
  User,
  InternshipLogbook,
  InternshipLogbookReflection,
  Academic,
  Curriculum,
  ApprovalToken,
  InternshipEvaluation,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear,
} = require("../utils/studentUtils");
const emailService = require("../utils/mailer.js");
const crypto = require("crypto");
const notificationSettingsService = require("./notificationSettingsService"); // เพิ่มบรรทัดนี้

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
        faculty: student.faculty,
        major: student.major,
        totalCredits: student.totalCredits,
        year: yearInfo.year,
        status: yearInfo.status,
        classroom: student.classroom,
        phoneNumber: student.phoneNumber,
        statusLabel: yearInfo.statusLabel,
        isEligible: eligibilityCheck.eligible,
        academicYear: getCurrentAcademicYear(),
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

  /**
   * ดึงข้อมูล CS05 ปัจจุบันของนักศึกษา
   */
  async getCurrentCS05(userId) {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    if (!userId) {
      throw new Error("ไม่พบข้อมูลผู้ใช้");
    }

    const document = await Document.findOne({
      where: {
        userId,
        documentName: "CS05",
        status: [
          "pending",
          "approved",
          "supervisor_approved",
          "supervisor_evaluated",
        ],
      },
      include: [
        {
          model: InternshipDocument,
          required: true,
          as: "internshipDocument",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!document) {
      return null;
    }

    return {
      documentId: document.documentId,
      status: document.status,
      companyName: document.internshipDocument.companyName,
      companyAddress: document.internshipDocument.companyAddress,
      startDate: document.internshipDocument.startDate,
      endDate: document.internshipDocument.endDate,
      supervisorName: document.internshipDocument.supervisorName,
      supervisorPhone: document.internshipDocument.supervisorPhone,
      supervisorEmail: document.internshipDocument.supervisorEmail,
      internshipPosition: document.internshipDocument.internshipPosition, // เพิ่มฟิลด์ใหม่
      contactPersonName: document.internshipDocument.contactPersonName, // เพิ่มฟิลด์ใหม่
      contactPersonPosition: document.internshipDocument.contactPersonPosition, // เพิ่มฟิลด์ใหม่
      createdAt: document.created_at,
    };
  }

  /**
   * บันทึกคำร้องขอฝึกงาน (CS05)
   */
  async submitCS05(
    userId,
    {
      companyName,
      companyAddress,
      startDate,
      endDate,
      internshipPosition,
      contactPersonName,
      contactPersonPosition,
    }
  ) {
    const transaction = await sequelize.transaction();
    try {
      const existingDocument = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: "pending",
        },
      });

      if (existingDocument) {
        throw new Error("คุณมีคำร้อง CS05 ที่รอการพิจารณาอยู่แล้ว");
      }

      // 1. สร้าง Document
      const document = await Document.create(
        {
          userId,
          documentType: "INTERNSHIP",
          documentName: "CS05",
          category: "proposal",
          status: "pending",
          filePath: null,
          fileSize: null,
          mimeType: null,
        },
        { transaction }
      );

      // 2. สร้าง InternshipDocument
      const internshipDoc = await InternshipDocument.create(
        {
          documentId: document.documentId,
          companyName,
          companyAddress,
          internshipPosition, // เพิ่มฟิลด์ใหม่
          contactPersonName, // เพิ่มฟิลด์ใหม่
          contactPersonPosition, // เพิ่มฟิลด์ใหม่
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "pending",
          supervisorName,
          supervisorPosition,
          supervisorPhone,
          supervisorEmail,
        },
        { transaction }
      );

      // 3. อัปเดตสถานะการฝึกงานในตาราง students
      const student = await Student.findOne(
        {
          where: { userId },
        },
        { transaction }
      );

      if (student) {
        await student.update(
          {
            internshipStatus: "pending_approval",
            isEnrolledInternship: true,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status,
        requireTranscript: true,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * บันทึกคำร้องขอฝึกงาน (CS05) พร้อม transcript
   */
  async submitCS05WithTranscript(userId, fileData, formData) {
    const transaction = await sequelize.transaction();
    try {
      // ตรวจสอบว่ามีไฟล์ transcript หรือไม่
      if (!fileData) {
        throw new Error("กรุณาแนบไฟล์ Transcript");
      }

      // ตรวจสอบประเภทไฟล์
      if (fileData.mimetype !== "application/pdf") {
        throw new Error("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
      }

      const {
        companyName,
        companyAddress,
        startDate,
        endDate,
        internshipPosition, // เพิ่มฟิลด์ใหม่
        contactPersonName, // เพิ่มฟิลด์ใหม่
        contactPersonPosition, // เพิ่มฟิลด์ใหม่
      } = formData;

      // ตรวจสอบว่ามี CS05 ที่ pending อยู่หรือไม่
      const existingDocument = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: "pending",
        },
      });

      if (existingDocument) {
        throw new Error("คุณมีคำร้อง CS05 ที่รอการพิจารณาอยู่แล้ว");
      }

      // 1. สร้าง Document ที่มีข้อมูลไฟล์ transcript ด้วย
      const document = await Document.create(
        {
          userId,
          documentType: "INTERNSHIP",
          documentName: "CS05",
          category: "proposal",
          status: "pending",
          filePath: fileData.path,
          fileName: fileData.filename,
          fileSize: fileData.size,
          mimeType: fileData.mimetype,
        },
        { transaction }
      );

      // 2. สร้าง InternshipDocument
      const internshipDoc = await InternshipDocument.create(
        {
          documentId: document.documentId,
          companyName,
          companyAddress,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "pending",
          internshipPosition, // เพิ่มฟิลด์ใหม่
          contactPersonName, // เพิ่มฟิลด์ใหม่
          contactPersonPosition, // เพิ่มฟิลด์ใหม่
          supervisorName: null,
          supervisorPosition: null,
          supervisorPhone: null,
          supervisorEmail: null,
        },
        { transaction }
      );

      // 3. อัปเดตสถานะการฝึกงานในตาราง students
      const student = await Student.findOne(
        {
          where: { userId },
        },
        { transaction }
      );

      if (student) {
        await student.update(
          {
            internshipStatus: "pending_approval",
            isEnrolledInternship: true,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status,
        companyName,
        companyAddress,
        startDate,
        endDate,
        internshipPosition, // เพิ่มฟิลด์ใหม่
        contactPersonName, // เพิ่มฟิลด์ใหม่
        contactPersonPosition, // เพิ่มฟิลด์ใหม่
        transcriptFilename: fileData.filename,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * ดึงข้อมูล CS05 ตาม ID
   */
  async getCS05ById(documentId, userId, userRole) {
    const document = await Document.findOne({
      where: {
        documentId,
        documentName: "CS05",
      },
      include: [
        {
          model: InternshipDocument,
          required: true,
        },
        {
          model: Student,
          include: [
            {
              model: User,
              attributes: ["firstName", "lastName"],
            },
          ],
        },
      ],
    });

    if (!document) {
      throw new Error("ไม่พบข้อมูลแบบฟอร์ม คพ.05");
    }

    // ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
    if (document.userId !== userId && userRole !== "admin") {
      throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
    }

    return {
      documentId: document.documentId,
      studentName: `${document.Student.User.firstName} ${document.Student.User.lastName}`,
      studentCode: document.Student.studentCode,
      companyName: document.InternshipDocument.companyName,
      companyAddress: document.InternshipDocument.companyAddress,
      internshipPosition: document.InternshipDocument.internshipPosition, // เพิ่มฟิลด์ใหม่
      contactPersonName: document.InternshipDocument.contactPersonName, // เพิ่มฟิลด์ใหม่
      contactPersonPosition: document.InternshipDocument.contactPersonPosition, // เพิ่มฟิลด์ใหม่
      startDate: document.InternshipDocument.startDate,
      endDate: document.InternshipDocument.endDate,
      status: document.status,
      createdAt: document.created_at,
    };
  }

  /**
   * บันทึกข้อมูลผู้ควบคุมงาน
   */
  async submitCompanyInfo(
    documentId,
    userId,
    { supervisorName, supervisorPhone, supervisorEmail, supervisorPosition }
  ) {
    const transaction = await sequelize.transaction();
    try {
      const document = await Document.findOne({
        where: {
          documentId,
          userId,
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId", "companyName"],
          },
        ],
        transaction,
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05");
      }

      // ตรวจสอบสถานะ CS05 ว่าสามารถแก้ไขข้อมูลได้หรือไม่
      if (document.status === "rejected") {
        throw new Error(
          "ไม่สามารถกรอกข้อมูลได้เนื่องจากคำร้อง CS05 ไม่ได้รับการอนุมัติ"
        );
      }

      // อัพเดทข้อมูลผู้ควบคุมงาน
      await document.internshipDocument.update(
        {
          supervisorName: supervisorName.trim(),
          supervisorPosition: supervisorPosition
            ? supervisorPosition.trim()
            : "",
          supervisorPhone: supervisorPhone.trim(),
          supervisorEmail: supervisorEmail.trim(),
        },
        { transaction }
      );

      await transaction.commit();

      return {
        documentId: document.documentId,
        companyName: document.internshipDocument.companyName,
        supervisorName: supervisorName.trim(),
        supervisorPosition: supervisorPosition ? supervisorPosition.trim() : "",
        supervisorPhone: supervisorPhone.trim(),
        supervisorEmail: supervisorEmail.trim(),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผู้ควบคุมงาน
   */
  async getCompanyInfo(documentId, userId) {
    const document = await Document.findOne({
      where: {
        documentId,
        userId,
      },
      include: [
        {
          model: InternshipDocument,
          as: "internshipDocument",
          required: true,
          attributes: [
            "supervisorName",
            "supervisorPhone",
            "supervisorEmail",
            "supervisorPosition",
          ],
        },
      ],
    });

    if (!document) {
      throw new Error("ไม่พบข้อมูลเอกสาร");
    }

    return {
      documentId: document.documentId,
      supervisorName: document.internshipDocument.supervisorName,
      supervisorPhone: document.internshipDocument.supervisorPhone,
      supervisorEmail: document.internshipDocument.supervisorEmail,
      supervisorPosition: document.internshipDocument.supervisorPosition,
    };
  }

  /**
   * ดึงรายการ CS05 ทั้งหมดของนักศึกษา
   */
  async getCS05List(userId) {
    const documents = await Document.findAll({
      where: {
        documentName: "CS05",
        userId,
      },
      include: [
        {
          model: InternshipDocument,
          required: true,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return documents.map((doc) => ({
      documentId: doc.documentId,
      companyName: doc.InternshipDocument.companyName,
      status: doc.status,
      createdAt: doc.created_at,
      startDate: doc.InternshipDocument.startDate,
      endDate: doc.InternshipDocument.endDate,
    }));
  }

  // ============= Internship Summary Management =============

  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  async getInternshipSummary(userId) {
    // ค้นหาข้อมูลนักศึกษาจาก userId ก่อน
    const student = await Student.findOne({
      where: { userId },
      attributes: ["studentId", "studentCode"],
    });

    if (!student) {
      throw new Error("ไม่พบข้อมูลนักศึกษา");
    }

    const studentId = student.studentId;

    // ดึงข้อมูล internship document ล่าสุด
    const internshipDoc = await InternshipDocument.findOne({
      attributes: [
        "internshipId",
        "documentId",
        "companyName",
        "companyAddress",
        "supervisorName",
        "supervisorPosition",
        "supervisorPhone",
        "supervisorEmail",
        "startDate",
        "endDate",
      ],
      include: [
        {
          model: Document,
          as: "document",
          attributes: ["documentId", "status"],
          where: {
            userId,
            documentName: "CS05",
            status: ["approved", "supervisor_approved", "supervisor_evaluated"],
          },
        },
      ],
      order: [[sequelize.literal("`InternshipDocument`.`created_at`"), "DESC"]],
    });

    if (!internshipDoc) {
      throw new Error("ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ");
    }

    // ดึงข้อมูลบันทึกฝึกงาน (logbooks)
    const logbooks = await InternshipLogbook.findAll({
      where: {
        internshipId: internshipDoc.internshipId,
        studentId: studentId,
      },
      order: [["workDate", "ASC"]],
    });

    // คำนวณสถิติต่างๆ
    const totalDays = logbooks.length;
    const totalHours = logbooks.reduce(
      (sum, log) => sum + parseFloat(log.workHours || 0),
      0
    );
    const approvedDays = logbooks.filter(
      (log) => log.supervisorApproved
    ).length;
    const approvedHours = logbooks
      .filter((log) => log.supervisorApproved)
      .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

    // ดึงข้อมูลสรุปทักษะและความรู้ (Reflection)
    let learningOutcomes = "";
    if (internshipDoc && internshipDoc.internshipId && studentId) {
      try {
        const reflectionEntry = await InternshipLogbookReflection.findOne({
          where: {
            studentId: studentId,
            internshipId: internshipDoc.internshipId,
          },
          order: [["created_at", "DESC"]],
        });

        if (reflectionEntry && reflectionEntry.reflection_text) {
          learningOutcomes = reflectionEntry.reflection_text;
        }
      } catch (reflectionError) {
        console.error(
          `Error fetching internship reflection for studentId ${studentId}, internshipId ${internshipDoc.internshipId}:`,
          reflectionError
        );
      }
    }

    return {
      documentId: internshipDoc.document.documentId,
      status: internshipDoc.document.status,
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
    };
  }

  // ============= Evaluation Management =============

  /**
   * ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
   */
  async getEvaluationStatus(userId) {
    // ค้นหา student record เพื่อได้ studentId
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

    // ค้นหา Document ที่เป็น CS05 ล่าสุด
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
          as: "internshipDocument", // ระบุ alias ชัดเจน
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

    // ตรวจสอบว่ามีการส่งแบบประเมินแล้วหรือไม่
    const evaluationRequest = await ApprovalToken.findOne({
      where: {
        documentId: document.documentId, // ใช้ documentId แทน
        type: "supervisor_evaluation",
        email: document.internshipDocument.supervisorEmail,
      },
      order: [["created_at", "DESC"]],
    });

    // ตรวจสอบว่าพี่เลี้ยงได้ทำการประเมินแล้วหรือไม่
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
   * ส่งแบบประเมินให้พี่เลี้ยง - แก้ไขการค้นหาเอกสาร
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
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      //const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

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
   * ส่งแบบประเมินให้พี่เลี้ยง - แก้ไขการค้นหาเอกสาร
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
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      //const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

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
   * ส่งแบบประเมินให้พี่เลี้ยง - แก้ไขการค้นหาเอกสาร
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
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      //const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

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
   * ส่งแบบประเมินให้พี่เลี้ยง - แก้ไขการค้นหาเอกสาร
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
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      //const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

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
   * ส่งแบบประเมินให้พี่เลี้ยง - แก้ไขการค้นหาเอกสาร
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
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 นาทีหมดอายุ
      //const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วันหมดอายุ

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
   * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา (แก้ไขใหม่)
   */
  async getReferralLetterStatus(userId, cs05DocumentId) {
    try {
      console.log("[DEBUG] getReferralLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ตรวจสอบเอกสาร CS05
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
          },
        ],
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05");
      }

      console.log("[DEBUG] CS05 Document found:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
        // ✅ ใช้ชื่อ attribute ที่ถูกต้อง
        downloadStatus: cs05Document.downloadStatus,
        downloadedAt: cs05Document.downloadedAt,
        downloadCount: cs05Document.downloadCount,
      });

      // 2. ตรวจสอบว่ามีหนังสือตอบรับที่ได้รับการอนุมัติแล้วหรือไม่
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "approved",
        },
      });

      // 3. ตรวจสอบสถานะข้อมูลผู้ควบคุมงาน
      const hasCompleteSupervisorInfo =
        cs05Document.internshipDocument &&
        cs05Document.internshipDocument.supervisorName &&
        cs05Document.internshipDocument.supervisorEmail;

      // 4. กำหนดเงื่อนไขการพร้อมใช้งาน
      const isReady =
        cs05Document.status === "approved" &&
        acceptanceLetter &&
        hasCompleteSupervisorInfo;

      // 5. ✅ ตรวจสอบสถานะการดาวน์โหลดจาก field ใหม่
      let downloadStatus = "not_downloaded";

      // ✅ ใช้ชื่อ attribute ที่ถูกต้อง
      if (cs05Document.downloadStatus === "downloaded") {
        downloadStatus = "downloaded";
      }

      console.log("[DEBUG] Status calculation:", {
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        hasCompleteSupervisorInfo,
        isReady,
        downloadStatus,
        downloadedAt: cs05Document.downloadedAt, // ✅ ใช้ชื่อ attribute
        downloadCount: cs05Document.downloadCount, // ✅ ใช้ชื่อ attribute
      });

      return {
        hasReferralLetter: isReady,
        status: isReady ? downloadStatus : "not_ready",
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceLetterStatus: acceptanceLetter?.status || "not_uploaded",
        hasSupervisorInfo: hasCompleteSupervisorInfo,
        createdDate: isReady ? cs05Document.created_at : null,
        readyDate: acceptanceLetter?.updated_at || null,
        downloadedAt: cs05Document.downloadedAt, // ✅ ใช้ชื่อ attribute
        downloadCount: cs05Document.downloadCount || 0, // ✅ ใช้ชื่อ attribute
        originalStatus: downloadStatus,
      };
    } catch (error) {
      console.error("Get Referral Letter Status Service Error:", error);
      throw error;
    }
  }

  /**
   * สร้าง PDF หนังสือส่งตัวนักศึกษา
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ข้อมูล PDF buffer และ metadata
   */
  async generateReferralLetterPDF(userId, documentId) {
    try {
      console.log("[DEBUG] generateReferralLetterPDF:", { userId, documentId });

      // 1. ตรวจสอบเอกสาร CS05 และสิทธิ์
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(documentId),
          userId: userId,
          documentName: "CS05",
          status: "approved", // ต้องได้รับการอนุมัติแล้ว
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
      });

      if (!cs05Document) {
        throw new Error(
          "ไม่พบเอกสาร CS05 ที่ได้รับการอนุมัติ หรือไม่มีสิทธิ์เข้าถึง"
        );
      }

      // 2. ตรวจสอบว่ามีหนังสือตอบรับที่อนุมัติแล้ว
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "approved",
        },
      });

      if (!acceptanceLetter) {
        throw new Error("ไม่พบหนังสือตอบรับที่ได้รับการอนุมัติ");
      }

      // 3. ตรวจสอบข้อมูลผู้ควบคุมงาน
      const internshipDoc = cs05Document.internshipDocument;
      if (!internshipDoc?.supervisorName || !internshipDoc?.supervisorEmail) {
        throw new Error("ข้อมูลผู้ควบคุมงานไม่ครบถ้วน");
      }

      // 4. ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId: userId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
          },
          {
            model: Academic,
            as: "academic",
            attributes: ["year", "classroom"],
          },
        ],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // 5. เตรียมข้อมูลสำหรับ PDF
      const pdfData = {
        // ข้อมูลเอกสาร
        documentNumber: `CS05/${new Date().getFullYear()}/${documentId}`,
        documentDate: new Date(),

        // ข้อมูลนักศึกษา
        studentData: [
          {
            fullName: `${student.user.firstName} ${student.user.lastName}`,
            studentId: student.studentCode,
            yearLevel: student.academic?.year || 3,
            classroom: student.academic?.classroom || "",
            phoneNumber: student.phoneNumber || "",
            email: student.user.email,
            totalCredits: student.totalCredits || 0,
          },
        ],

        // ข้อมูลบริษัท
        companyName: internshipDoc.companyName,
        companyAddress: internshipDoc.companyAddress,
        contactPersonName: internshipDoc.contactPersonName,
        contactPersonPosition: internshipDoc.contactPersonPosition,
        internshipPosition: internshipDoc.internshipPosition,

        // ข้อมูลผู้ควบคุมงาน
        supervisorName: internshipDoc.supervisorName,
        supervisorPosition: internshipDoc.supervisorPosition,
        supervisorPhone: internshipDoc.supervisorPhone,
        supervisorEmail: internshipDoc.supervisorEmail,

        // ข้อมูลระยะเวลา
        startDate: internshipDoc.startDate,
        endDate: internshipDoc.endDate,
        internshipDuration: internshipDoc.internshipDuration,

        // ข้อมูลอาจารย์ที่ปรึกษา (ค่าเริ่มต้น)
        advisorName: "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
        advisorTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
      };

      // 6. สร้าง PDF (ใช้ library ที่เหมาะสม เช่น puppeteer, PDFKit, หรือ jsPDF)
      // ตัวอย่างการใช้ PDFKit (ต้อง npm install pdfkit)
      const PDFDocument = require("pdfkit");
      const fs = require("fs");
      const path = require("path");

      const pdf = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: "หนังสือส่งตัวนักศึกษาฝึกงาน",
          Subject: `หนังสือส่งตัวนักศึกษา ${pdfData.studentData[0].fullName}`,
          Author: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        },
      });

      // สร้าง buffer สำหรับเก็บ PDF
      let pdfBuffer = Buffer.alloc(0);
      pdf.on("data", (chunk) => {
        pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
      });

      // 7. เขียนเนื้อหา PDF
      pdf.font("Helvetica");

      // หัวข้อเอกสาร
      pdf.fontSize(18).text("หนังสือส่งตัวนักศึกษาเข้าฝึกงาน", {
        align: "center",
      });

      pdf.moveDown();

      // เลขที่เอกสารและวันที่
      pdf.fontSize(12);
      pdf.text(`เลขที่: ${pdfData.documentNumber}`, { align: "left" });
      pdf.text(`วันที่: ${pdfData.documentDate.toLocaleDateString("th-TH")}`, {
        align: "right",
      });

      pdf.moveDown();

      // เรียน
      pdf.text(`เรียน ${pdfData.contactPersonName || "ผู้จัดการฝ่ายบุคคล"}`);
      pdf.text(`${pdfData.companyName}`);

      pdf.moveDown();

      // เนื้อหา
      pdf.text(
        "ด้วย ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยธนบุรี",
        {
          align: "justify",
        }
      );

      pdf.text(
        `ขอส่งนักศึกษา ${pdfData.studentData[0].fullName} รหัสนักศึกษา ${pdfData.studentData[0].studentId}`,
        {
          align: "justify",
        }
      );

      pdf.text(
        `เข้าฝึกงานในตำแหน่ง ${pdfData.internshipPosition} ณ บริษัทของท่าน`,
        {
          align: "justify",
        }
      );

      pdf.text(
        `ตั้งแต่วันที่ ${new Date(pdfData.startDate).toLocaleDateString(
          "th-TH"
        )} ถึงวันที่ ${new Date(pdfData.endDate).toLocaleDateString("th-TH")}`,
        {
          align: "justify",
        }
      );

      pdf.moveDown();

      // ข้อมูลผู้ควบคุมงาน
      pdf.text("ขอแจ้งให้ทราบว่า ผู้ควบคุมงานของนักศึกษาคือ:", {
        align: "justify",
      });
      pdf.text(
        `${pdfData.supervisorName} ตำแหน่ง ${
          pdfData.supervisorPosition || "ไม่ระบุ"
        }`
      );
      pdf.text(
        `โทรศัพท์: ${pdfData.supervisorPhone || "ไม่ระบุ"} อีเมล: ${
          pdfData.supervisorEmail
        }`
      );

      pdf.moveDown();

      // ปิดท้าย
      pdf.text("จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบคุณมา ณ โอกาสนี้", {
        align: "justify",
      });

      pdf.moveDown(2);

      // ลายเซ็น
      pdf.text("ขอแสดงความนับถือ", { align: "center" });
      pdf.moveDown(3);
      pdf.text(pdfData.advisorName, { align: "center" });
      pdf.text(pdfData.advisorTitle, { align: "center" });

      // ปิด PDF
      pdf.end();

      // 8. รอให้ PDF เสร็จสิ้น
      await new Promise((resolve) => {
        pdf.on("end", resolve);
      });

      const fileName = `หนังสือส่งตัว-${pdfData.studentData[0].fullName}-${documentId}.pdf`;

      console.log("[DEBUG] PDF generated successfully:", {
        documentId,
        fileName,
        bufferSize: pdfBuffer.length,
      });

      return {
        pdfBuffer,
        fileName,
        contentType: "application/pdf",
        metadata: {
          documentId,
          studentName: pdfData.studentData[0].fullName,
          companyName: pdfData.companyName,
          generateDate: new Date(),
        },
      };
    } catch (error) {
      console.error("Generate Referral Letter PDF Service Error:", error);
      throw error;
    }
  }

  /**
   * อัปโหลดหนังสือตอบรับการฝึกงาน
   */
  async uploadAcceptanceLetter(userId, cs05DocumentId, fileData) {
    const transaction = await sequelize.transaction();

    try {
      console.log("[DEBUG] uploadAcceptanceLetter:", {
        userId,
        cs05DocumentId,
        fileName: fileData?.filename,
        fileSize: fileData?.size,
        mimeType: fileData?.mimetype,
      });

      // 1. ตรวจสอบไฟล์ที่อัปโหลด
      if (!fileData) {
        throw new Error("กรุณาเลือกไฟล์หนังสือตอบรับ");
      }

      // ตรวจสอบประเภทไฟล์ (รองรับเฉพาะ PDF)
      if (fileData.mimetype !== "application/pdf") {
        throw new Error("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
      }

      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (fileData.size > maxFileSize) {
        throw new Error("ขนาดไฟล์ไม่ควรเกิน 10 MB");
      }

      // 2. ตรวจสอบเอกสาร CS05
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
        },
        transaction,
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05 หรือไม่มีสิทธิ์เข้าถึง");
      }

      // ตรวจสอบสถานะ CS05 (ต้องได้รับการอนุมัติแล้ว)
      if (cs05Document.status !== "approved") {
        throw new Error(
          "ไม่สามารถอัปโหลดหนังสือตอบรับได้ กรุณารอการอนุมัติเอกสาร CS05 ก่อน"
        );
      }

      console.log("[DEBUG] CS05 Document validated:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
      });

      // 3. ตรวจสอบหนังสือตอบรับที่มีอยู่แล้ว
      const existingAcceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: ["pending", "approved"], // หาเฉพาะที่ยังไม่ถูกปฏิเสธ
        },
        transaction,
      });

      // ถ้ามีหนังสือตอบรับที่ approved แล้ว ไม่ให้อัปโหลดใหม่
      if (
        existingAcceptanceLetter &&
        existingAcceptanceLetter.status === "approved"
      ) {
        throw new Error(
          "หนังสือตอบรับได้รับการอนุมัติแล้ว ไม่สามารถอัปโหลดใหม่ได้"
        );
      }

      // ถ้ามีหนังสือตอบรับที่ pending อยู่ ให้อัปเดตแทน
      if (
        existingAcceptanceLetter &&
        existingAcceptanceLetter.status === "pending"
      ) {
        console.log("[DEBUG] Updating existing acceptance letter:", {
          existingDocumentId: existingAcceptanceLetter.documentId,
        });

        // อัปเดตข้อมูลไฟล์ใหม่
        await existingAcceptanceLetter.update(
          {
            filePath: fileData.path,
            fileName: fileData.filename,
            fileSize: fileData.size,
            mimeType: fileData.mimetype,
            status: "pending", // รีเซ็ตสถานะเป็น pending
            updated_at: new Date(),
          },
          { transaction }
        );

        await transaction.commit();

        return {
          documentId: existingAcceptanceLetter.documentId,
          cs05DocumentId: cs05Document.documentId,
          fileName: fileData.filename,
          fileSize: fileData.size,
          status: "pending",
          message: "อัปโหลดหนังสือตอบรับใหม่เรียบร้อยแล้ว (แทนที่ไฟล์เดิม)",
          isUpdate: true,
          uploadedAt: new Date(),
        };
      }

      // 4. สร้างเอกสารหนังสือตอบรับใหม่
      const acceptanceDocument = await Document.create(
        {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "pending",
          filePath: fileData.path,
          fileName: fileData.filename,
          fileSize: fileData.size,
          mimeType: fileData.mimetype,
          parentDocumentId: cs05Document.documentId, // เชื่อมโยงกับ CS05
        },
        { transaction }
      );

      console.log("[DEBUG] Created new acceptance letter document:", {
        documentId: acceptanceDocument.documentId,
        fileName: fileData.filename,
        parentDocumentId: cs05Document.documentId,
      });

      console.log("[DEBUG] Updated CS05 status to acceptance_uploaded");

      await transaction.commit();

      return {
        documentId: acceptanceDocument.documentId,
        cs05DocumentId: cs05Document.documentId,
        fileName: fileData.filename,
        fileSize: fileData.size,
        status: "pending",
        message: "อัปโหลดหนังสือตอบรับเรียบร้อยแล้ว รอการพิจารณาจากเจ้าหน้าที่",
        isUpdate: false,
        uploadedAt: acceptanceDocument.created_at,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Upload Acceptance Letter Service Error:", error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน (ปรับปรุงใหม่ - คล้ายกับ getReferralLetterStatus)
   */
  async checkAcceptanceLetterStatus(userId, cs05DocumentId) {
    try {
      console.log("[DEBUG] checkAcceptanceLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ตรวจสอบเอกสาร CS05 ก่อน
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
          },
        ],
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05");
      }

      console.log("[DEBUG] CS05 Document found:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
      });

      // 2. ค้นหาหนังสือตอบรับที่เกี่ยวข้องกับ CS05 นี้โดยตรง
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          parentDocumentId: cs05Document.documentId, // ✅ เชื่อมโยงกับ CS05 โดยตรง
        },
        order: [["created_at", "DESC"]], // เอาล่าสุด
      });

      console.log("[DEBUG] Acceptance letter found:", {
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus: acceptanceLetter?.status,
        fileName: acceptanceLetter?.fileName,
        uploadedAt: acceptanceLetter?.created_at,
      });

      // 3. ตรวจสอบข้อมูลผู้ควบคุมงาน
      const hasCompleteSupervisorInfo =
        cs05Document.internshipDocument &&
        cs05Document.internshipDocument.supervisorName &&
        cs05Document.internshipDocument.supervisorEmail;

      // 4. คำนวณสถานะการอัปโหลด
      let acceptanceStatus = "not_uploaded";
      let canUpload = false;
      let requiresApproval = false;
      let statusMessage = "";

      // ตรวจสอบสิทธิ์ในการอัปโหลด (CS05 ต้องได้รับการอนุมัติก่อน)
      if (cs05Document.status === "approved") {
        canUpload = true;
      }

      if (acceptanceLetter) {
        acceptanceStatus = acceptanceLetter.status;

        switch (acceptanceLetter.status) {
          case "pending":
            requiresApproval = true;
            statusMessage = "หนังสือตอบรับอยู่ระหว่างการพิจารณา";
            break;
          case "approved":
            statusMessage = "หนังสือตอบรับได้รับการอนุมัติแล้ว";

            // ✅ อัปเดต CS05 status เป็น acceptance_approved ถ้าจำเป็น
            if (cs05Document.status !== "acceptance_approved") {
              console.log(
                "[DEBUG] 🔄 อัปเดต CS05 status เป็น acceptance_approved"
              );

              await cs05Document.update({
                status: "acceptance_approved",
                updated_at: new Date(),
              });

              console.log("[DEBUG] ✅ อัปเดต CS05 status เรียบร้อย");
            }
            break;
          case "rejected":
            statusMessage = "หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่";
            canUpload = true; // อนุญาตให้อัปโหลดใหม่
            break;
          default:
            statusMessage = "สถานะไม่ทราบ";
        }
      } else {
        // ไม่มีการอัปโหลด
        if (canUpload) {
          statusMessage = "กรุณาอัปโหลดหนังสือตอบรับจากบริษัท";
        } else {
          statusMessage = "รอการอนุมัติ CS05 ก่อนอัปโหลดหนังสือตอบรับ";
        }
      }

      // 5. ตรวจสอบความพร้อมสำหรับขั้นตอนถัดไป
      const isReadyForNextStep =
        acceptanceStatus === "approved" && hasCompleteSupervisorInfo;

      console.log("[DEBUG] Final status calculation:", {
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus,
        canUpload,
        requiresApproval,
        statusMessage,
        hasCompleteSupervisorInfo,
        isReadyForNextStep,
      });

      return {
        // ข้อมูลเอกสาร CS05
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status, // อาจจะเป็น "acceptance_approved" หลังการอัปเดต

        // ข้อมูลหนังสือตอบรับ
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus,
        acceptanceLetterStatus: acceptanceStatus, // alias เพื่อ backward compatibility

        // สิทธิ์และการอนุมัติ
        canUpload,
        requiresApproval,
        statusMessage,

        // ข้อมูลผู้ควบคุมงาน
        hasSupervisorInfo: hasCompleteSupervisorInfo,
        supervisorName: cs05Document.internshipDocument?.supervisorName,
        supervisorEmail: cs05Document.internshipDocument?.supervisorEmail,

        // วันที่สำคัญ
        uploadedAt: acceptanceLetter?.created_at || null,
        updatedAt: acceptanceLetter?.updated_at || null,
        approvedAt:
          acceptanceStatus === "approved" ? acceptanceLetter?.updated_at : null,

        // ข้อมูลไฟล์
        fileName: acceptanceLetter?.fileName || null,
        fileSize: acceptanceLetter?.fileSize || null,
        documentId: acceptanceLetter?.documentId || null, // ID ของ acceptance letter

        // สถานะขั้นตอนถัดไป
        isReadyForNextStep,
        canProceedToReferralLetter: isReadyForNextStep,

        // ข้อมูลเพิ่มเติม
        originalStatus: acceptanceStatus, // เก็บสถานะดั้งเดิมไว้สำหรับ debug
      };
    } catch (error) {
      console.error("Check Acceptance Letter Status Service Error:", error);
      throw error;
    }
  }

  /**
   * ลบหนังสือตอบรับ (กรณีต้องการอัปโหลดใหม่)
   */
  async deleteAcceptanceLetter(userId, acceptanceDocumentId) {
    const transaction = await sequelize.transaction();

    try {
      console.log("[DEBUG] deleteAcceptanceLetter:", {
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
      const parentDocumentId = acceptanceDocument.parentDocumentId;

      // 2. ลบไฟล์จากระบบ (ถ้ามี)
      if (acceptanceDocument.filePath) {
        const fs = require("fs").promises;
        const path = require("path");

        try {
          await fs.unlink(acceptanceDocument.filePath);
          console.log(
            "[DEBUG] File deleted from filesystem:",
            acceptanceDocument.filePath
          );
        } catch (fileError) {
          console.warn("[DEBUG] Could not delete file:", fileError.message);
          // ไม่ throw error เพราะไฟล์อาจถูกลบไปแล้ว
        }
      }

      // 3. ลบข้อมูลจากฐานข้อมูล
      await acceptanceDocument.destroy({ transaction });

      // 4. อัปเดตสถานะ CS05 กลับเป็น approved (ถ้ามี parent document)
      if (parentDocumentId) {
        const cs05Document = await Document.findOne({
          where: {
            documentId: parentDocumentId,
            userId: userId,
            documentName: "CS05",
          },
          transaction,
        });

        if (cs05Document && cs05Document.status === "acceptance_uploaded") {
          await cs05Document.update(
            {
              status: "approved", // เปลี่ยนกลับเป็น approved
              updated_at: new Date(),
            },
            { transaction }
          );
          console.log("[DEBUG] CS05 status reverted to approved");
        }
      }

      await transaction.commit();

      return {
        message: `ลบหนังสือตอบรับ "${fileName}" เรียบร้อยแล้ว`,
        deletedDocumentId: acceptanceDocument.documentId,
        cs05DocumentId: parentDocumentId,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Delete Acceptance Letter Service Error:", error);
      throw error;
    }
  }

  /**
   * ดาวน์โหลดหนังสือตอบรับ
   */
  async downloadAcceptanceLetter(userId, acceptanceDocumentId) {
    try {
      console.log("[DEBUG] downloadAcceptanceLetter:", {
        userId,
        acceptanceDocumentId,
      });

      // ค้นหาเอกสารหนังสือตอบรับ
      const acceptanceDocument = await Document.findOne({
        where: {
          documentId: parseInt(acceptanceDocumentId),
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
        },
      });

      if (!acceptanceDocument) {
        throw new Error(
          "ไม่พบหนังสือตอบรับที่ต้องการดาวน์โหลด หรือไม่มีสิทธิ์เข้าถึง"
        );
      }

      // ตรวจสอบว่าไฟล์มีอยู่จริง
      if (!acceptanceDocument.filePath) {
        throw new Error("ไม่พบไฟล์ที่แนบมา");
      }

      const fs = require("fs").promises;

      try {
        // ตรวจสอบว่าไฟล์มีอยู่จริงในระบบ
        await fs.access(acceptanceDocument.filePath);

        // อ่านไฟล์
        const fileBuffer = await fs.readFile(acceptanceDocument.filePath);

        console.log("[DEBUG] File read successfully:", {
          filePath: acceptanceDocument.filePath,
          fileSize: fileBuffer.length,
        });

        return {
          fileBuffer,
          fileName: acceptanceDocument.fileName,
          mimeType: acceptanceDocument.mimeType,
          fileSize: acceptanceDocument.fileSize,
          documentId: acceptanceDocument.documentId,
        };
      } catch (fileError) {
        console.error("[DEBUG] File access error:", fileError);
        throw new Error("ไม่สามารถเข้าถึงไฟล์ได้ ไฟล์อาจถูกลบหรือย้ายที่");
      }
    } catch (error) {
      console.error("Download Acceptance Letter Service Error:", error);
      throw error;
    }
  }

  /**
   * สร้าง PDF หนังสือส่งตัว (ฟังก์ชันช่วย)
   * *** ต้องเพิ่ม PDF generation library ***
   */
  async createReferralLetterPDF(data) {
    // ตัวอย่างการใช้ PDFKit (ต้องติดตั้ง: npm install pdfkit)
    const PDFDocument = require("pdfkit");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // เพิ่มเนื้อหาหนังสือส่งตัว
        doc
          .fontSize(18)
          .text("หนังสือส่งตัวนักศึกษาเข้าฝึกงาน", { align: "center" });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`เลขที่ ${data.documentNumber}`);
        doc.text(
          `วันที่ ${new Date(data.documentDate).toLocaleDateString("th-TH")}`
        );
        doc.moveDown();

        doc.text(`เรียน ผู้จัดการ ${data.companyName}`);
        doc.moveDown();

        doc.text(`เรื่อง ส่งตัวนักศึกษาเข้าฝึกงาน`);
        doc.moveDown();

        doc.text(
          `บัดนี้ ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอส่งตัวนักศึกษา:`
        );

        if (data.studentData && data.studentData.length > 0) {
          data.studentData.forEach((student, index) => {
            doc.text(
              `${index + 1}. ${student.fullName} รหัส ${student.studentId}`
            );
          });
        }

        doc.moveDown();
        doc.text(
          `เข้าฝึกงาน${
            data.internshipPosition
              ? ` ในตำแหน่ง ${data.internshipPosition}`
              : ""
          }`
        );
        doc.text(
          `ตั้งแต่วันที่ ${new Date(data.startDate).toLocaleDateString(
            "th-TH"
          )} ถึง ${new Date(data.endDate).toLocaleDateString("th-TH")}`
        );

        if (data.supervisorName) {
          doc.moveDown();
          doc.text(
            `โดยมี ${data.supervisorName}${
              data.supervisorPosition
                ? ` ตำแหน่ง ${data.supervisorPosition}`
                : ""
            } เป็นผู้ควบคุมการฝึกงาน`
          );
        }

        doc.moveDown();
        doc.text("จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป");

        doc.moveDown(2);
        doc.text("ขอแสดงความนับถือ", { align: "center" });
        doc.moveDown(2);
        doc.text("(รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล)", {
          align: "center",
        });
        doc.text("หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ", {
          align: "center",
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน
   */
  async getAcceptanceLetterStatus(userId, cs05DocumentId) {
    try {
      console.log("[DEBUG] getAcceptanceLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ตรวจสอบเอกสาร CS05 ก่อน
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
        },
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05");
      }

      console.log("[DEBUG] CS05 Document found:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
      });

      // 2. ค้นหาหนังสือตอบรับที่เกี่ยวข้องกับ CS05 นี้
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
        },
        order: [["created_at", "DESC"]], // เอาล่าสุด
      });

      // 3. คำนวณสถานะ
      let acceptanceStatus = "not_uploaded";
      let canUpload = false;
      let requiresApproval = false;
      let statusMessage = "";

      // ตรวจสอบสิทธิ์ในการอัปโหลด (CS05 ต้องได้รับการอนุมัติก่อน)
      if (cs05Document.status === "approved") {
        canUpload = true;
      }

      if (acceptanceLetter) {
        acceptanceStatus = acceptanceLetter.status;

        switch (acceptanceLetter.status) {
          case "pending":
            requiresApproval = true;
            statusMessage = "หนังสือตอบรับอยู่ระหว่างการพิจารณา";
            break;
          case "approved":
            statusMessage = "หนังสือตอบรับได้รับการอนุมัติแล้ว";
            break;
          case "rejected":
            statusMessage = "หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่";
            canUpload = true; // อนุญาตให้อัปโหลดใหม่
            break;
          default:
            statusMessage = "สถานะไม่ทราบ";
        }
      } else {
        if (canUpload) {
          statusMessage = "กรุณาอัปโหลดหนังสือตอบรับจากบริษัท";
        } else {
          statusMessage = "รอการอนุมัติ CS05 ก่อนอัปโหลดหนังสือตอบรับ";
        }
      }

      console.log("[DEBUG] Acceptance letter status calculation:", {
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus,
        canUpload,
        requiresApproval,
        statusMessage,
      });

      return {
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus,
        canUpload,
        requiresApproval,
        statusMessage,
        uploadedAt: acceptanceLetter?.created_at || null,
        updatedAt: acceptanceLetter?.updated_at || null,
        fileName: acceptanceLetter?.fileName || null,
        documentId: acceptanceLetter?.documentId || null,
      };
    } catch (error) {
      console.error("Get Acceptance Letter Status Service Error:", error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว (แก้ไขใหม่)
   */
  async markReferralLetterDownloaded(userId, cs05DocumentId) {
    const transaction = await sequelize.transaction();

    try {
      console.log("[DEBUG] Service markReferralLetterDownloaded:", {
        userId,
        cs05DocumentId,
      });

      // ตรวจสอบเอกสาร CS05
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
        },
        transaction,
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05 หรือไม่มีสิทธิ์เข้าถึง");
      }

      console.log("[DEBUG] Found CS05 Document BEFORE update:", {
        documentId: cs05Document.documentId,
        currentStatus: cs05Document.status,
        // ✅ ใช้ชื่อ attribute ที่ถูกต้อง
        currentDownloadStatus: cs05Document.downloadStatus,
        currentDownloadCount: cs05Document.downloadCount,
        currentDownloadedAt: cs05Document.downloadedAt,
      });

      // ✅ อัปเดตข้อมูลการดาวน์โหลดใน field ใหม่
      const downloadTimestamp = new Date();
      const currentDownloadCount = cs05Document.downloadCount || 0;

      // ✅ ใช้ update() ของ Sequelize แทน raw SQL
      const [affectedRows] = await cs05Document.update(
        {
          downloadStatus: "downloaded", // ✅ ใช้ชื่อ attribute
          downloadedAt: downloadTimestamp, // ✅ ใช้ชื่อ attribute
          downloadCount: currentDownloadCount + 1, // ✅ ใช้ชื่อ attribute
        },
        { transaction }
      );

      console.log("[DEBUG] Update result:", {
        affectedRows: affectedRows,
        documentId: cs05Document.documentId,
      });

      // ตรวจสอบผลลัพธ์หลัง update
      await cs05Document.reload({ transaction });

      console.log("[DEBUG] Document AFTER update:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
        downloadStatus: cs05Document.downloadStatus, // ✅ ใช้ชื่อ attribute
        downloadedAt: cs05Document.downloadedAt, // ✅ ใช้ชื่อ attribute
        downloadCount: cs05Document.downloadCount, // ✅ ใช้ชื่อ attribute
      });

      await transaction.commit();

      return {
        documentId: cs05Document.documentId,
        status: "downloaded",
        downloadDate: downloadTimestamp,
        downloadCount: currentDownloadCount + 1,
        completedProcess: true,
        previousStatus: cs05Document.status,
        mainDocumentStatus: cs05Document.status,
        affectedRows: 1, // Sequelize update จะคืนค่า array ของ affected rows
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Mark Referral Letter Downloaded Service Error:", error);
      throw error;
    }
  }
}

module.exports = new InternshipManagementService();
