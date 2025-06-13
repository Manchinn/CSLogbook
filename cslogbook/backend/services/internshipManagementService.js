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
const notificationSettingsService = require('./notificationSettingsService'); // เพิ่มบรรทัดนี้

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
      internshipPosition: document.internshipDocument.internshipPosition,   // เพิ่มฟิลด์ใหม่
      contactPersonName: document.internshipDocument.contactPersonName,     // เพิ่มฟิลด์ใหม่
      contactPersonPosition: document.internshipDocument.contactPersonPosition, // เพิ่มฟิลด์ใหม่
      createdAt: document.created_at,
    };
  }

  /**
   * บันทึกคำร้องขอฝึกงาน (CS05)
   */
  async submitCS05(
    userId,
    { companyName, companyAddress, startDate, endDate, internshipPosition, contactPersonName, contactPersonPosition }
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
          internshipPosition,    // เพิ่มฟิลด์ใหม่
          contactPersonName,     // เพิ่มฟิลด์ใหม่
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
        internshipPosition,   // เพิ่มฟิลด์ใหม่
        contactPersonName,   // เพิ่มฟิลด์ใหม่
        contactPersonPosition // เพิ่มฟิลด์ใหม่
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
          internshipPosition,   // เพิ่มฟิลด์ใหม่
          contactPersonName,    // เพิ่มฟิลด์ใหม่
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
        internshipPosition,   // เพิ่มฟิลด์ใหม่
        contactPersonName,    // เพิ่มฟิลด์ใหม่
        contactPersonPosition,// เพิ่มฟิลด์ใหม่
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
      internshipPosition: document.InternshipDocument.internshipPosition,   // เพิ่มฟิลด์ใหม่
      contactPersonName: document.InternshipDocument.contactPersonName,     // เพิ่มฟิลด์ใหม่
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
      if (document.status === 'rejected') {
        throw new Error('ไม่สามารถกรอกข้อมูลได้เนื่องจากคำร้อง CS05 ไม่ได้รับการอนุมัติ');
      }

      // อัพเดทข้อมูลผู้ควบคุมงาน
      await document.internshipDocument.update(
        {
          supervisorName: supervisorName.trim(),
          supervisorPosition: supervisorPosition ? supervisorPosition.trim() : '',
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
        supervisorPosition: supervisorPosition ? supervisorPosition.trim() : '',
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
          attributes: ["supervisorName", "supervisorPhone", "supervisorEmail", "supervisorPosition"],
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
      const isEvaluationNotificationEnabled = await notificationSettingsService.isNotificationEnabled('EVALUATION', true);
      
      if (!isEvaluationNotificationEnabled) {
        throw new Error('ขณะนี้ระบบปิดการแจ้งเตือนการประเมินผลชั่วคราว กรุณาติดต่อเจ้าหน้าที่หรือลองใหม่ในภายหลัง');
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
    const isEvaluationNotificationEnabled = await notificationSettingsService.isNotificationEnabled('EVALUATION', true);

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
      // เพิ่มข้อมูลสถานะการแจ้งเตือน
      notificationEnabled: isEvaluationNotificationEnabled,
      canSendEvaluation: isEvaluationNotificationEnabled && (status === "sent" || status === "not_sent")
    };
  }

  /**
   * ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินผลโดย Supervisor
   */
  async getSupervisorEvaluationFormDetails(token) {
    // 1. ตรวจสอบ token และดึงข้อมูลที่เกี่ยวข้อง
    const approvalTokenInstance = await ApprovalToken.findOne({
      where: {
        token: token,
        type: "supervisor_evaluation",
        status: "pending",
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Document,
          as: "document",
          required: true,
          include: [
            {
              model: InternshipDocument,
              as: "internshipDocument",
              required: true,
            },
            {
              model: User,
              as: "owner",
              required: true,
              attributes: ["firstName", "lastName", "email"],
              include: [
                {
                  model: Student,
                  as: "student",
                  required: true,
                  attributes: ["studentId", "studentCode"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!approvalTokenInstance) {
      throw new Error("โทเค็นไม่ถูกต้อง หมดอายุ หรือแบบประเมินถูกส่งไปแล้ว");
    }

    // แยกข้อมูลที่จำเป็นจากโครงสร้างใหม่
    const mainDocument = approvalTokenInstance.document;
    if (!mainDocument) {
      throw new Error("ไม่พบเอกสารที่เกี่ยวข้องกับโทเค็นนี้");
    }

    const internshipDetails = mainDocument.internshipDocument;
    const studentUser = mainDocument.owner;
    const studentRecord = studentUser ? studentUser.student : null;

    if (!internshipDetails || !studentUser || !studentRecord) {
      throw new Error(
        "ไม่พบข้อมูลการฝึกงานหรือข้อมูลนักศึกษาที่เกี่ยวข้องอย่างสมบูรณ์"
      );
    }

    // เตรียมข้อมูลสำหรับ frontend
    return {
      studentInfo: {
        fullName: `${studentUser.firstName} ${studentUser.lastName}`,
        studentCode: studentRecord.studentCode,
      },
      companyInfo: {
        companyName: internshipDetails.companyName,
      },
      internshipPeriod: {
        startDate: internshipDetails.startDate,
        endDate: internshipDetails.endDate,
      },
      supervisorInfo: {
        name: internshipDetails.supervisorName,
        email: approvalTokenInstance.email,
        position: internshipDetails.supervisorPosition,
      },
    };
  }

  /**
   * บันทึกข้อมูลการประเมินผลโดย Supervisor
   */
  async submitSupervisorEvaluation(token, evaluationData) {
    const transaction = await sequelize.transaction();
    try {
      const approvalToken = await ApprovalToken.findOne({
        where: {
          token: token,
          type: "supervisor_evaluation",
          status: "pending",
          expiresAt: { [Op.gt]: new Date() },
        },
        include: [
          {
            model: Document,
            as: "document",
            required: true,
            include: [
              {
                model: InternshipDocument,
                as: "internshipDocument",
                required: true,
              },
              {
                model: User,
                as: "owner",
                required: true,
                include: [
                  {
                    model: Student,
                    as: "student",
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!approvalToken) {
        const error = new Error(
          "แบบฟอร์มการประเมินไม่ถูกต้อง, หมดอายุ หรือถูกใช้งานไปแล้ว"
        );
        error.statusCode = 404;
        throw error;
      }

      const internshipDocument = approvalToken.document.internshipDocument;
      const studentRecord = approvalToken.document.owner.student;
      const studentUser = approvalToken.document.owner;

      // สร้างบันทึกการประเมิน InternshipEvaluation
      const evaluation = await InternshipEvaluation.create(
        {
          internshipId: internshipDocument.internshipId,
          studentId: studentRecord.studentId,
          evaluatorType: "supervisor",
          evaluatorName:
            evaluationData.supervisorName || internshipDocument.supervisorName,
          evaluatorEmail: evaluationData.supervisorEmail || approvalToken.email,
          evaluationDate: new Date(),
          ...evaluationData,
          documentId: approvalToken.documentId,
        },
        { transaction }
      );

      // อัปเดตสถานะ ApprovalToken
      await approvalToken.update({ status: "used" }, { transaction });

      // อัปเดตสถานะ Document
      await approvalToken.document.update(
        { status: "supervisor_evaluated" },
        { transaction }
      );

      // ส่งการแจ้งเตือนไปยังอาจารย์ที่ปรึกษา (ถ้ามี)
      const academicAdvisorUser = studentRecord.academicAdvisor?.user;
      if (academicAdvisorUser && academicAdvisorUser.email) {
        const mailOptions = {
          to: academicAdvisorUser.email,
          subject: `การประเมินผลการฝึกงานของนักศึกษา ${studentUser.firstName} ${studentUser.lastName} เสร็จสิ้น`,
          template: "advisorEvaluationSubmitted",
          context: {
            advisorName: `${academicAdvisorUser.firstName} ${academicAdvisorUser.lastName}`,
            studentName: `${studentUser.firstName} ${studentUser.lastName}`,
            studentCode: studentRecord.studentCode,
            companyName: internshipDocument.companyName,
            supervisorName: evaluation.evaluatorName,
            evaluationDate:
              evaluation.evaluationDate.toLocaleDateString("th-TH"),
          },
        };
        try {
          await emailService.sendMail(mailOptions);
        } catch (emailError) {
          console.error(
            "Failed to send email to academic advisor:",
            emailError
          );
        }
      }

      await transaction.commit();

      return {
        evaluationId: evaluation.evaluationId,
        message: "บันทึกผลการประเมินเรียบร้อยแล้ว",
      };
    } catch (error) {
      await transaction.rollback();

      // ตรวจสอบประเภทของ error และกำหนด status code ที่เหมาะสม
      if (error.name === "SequelizeValidationError") {
        error.statusCode = 400;
        error.errors = error.errors?.map((e) => e.message);
      }

      // ถ้าไม่มี statusCode ที่กำหนดไว้ ให้ใช้ 500 เป็นค่าเริ่มต้น
      if (!error.statusCode) {
        error.statusCode = 500;
      }

      throw error;
    }
  }
}

module.exports = new InternshipManagementService();
