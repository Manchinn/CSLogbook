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
  InternshipCertificateRequest,
} = require("../models");
const { Sequelize, Op } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear,
  getCurrentSemester,
} = require("../utils/studentUtils");
const emailService = require("../utils/mailer.js");
const crypto = require("crypto");
const notificationSettingsService = require("./notificationSettingsService"); // เพิ่มบรรทัดนี้
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
        {
          model: User,
          as: "owner", // ✅ ใช้ alias ที่ถูกต้องตาม Document.associate
          required: true,
          include: [
            {
              model: Student,
              as: "student",
              attributes: ["studentId", "studentCode", "classroom", "phoneNumber"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!document) {
      return null;
    }

    // ดึงข้อมูล classroom และ phoneNumber จาก Student
    const classroom = document.owner?.student?.classroom || "";
    const phoneNumber = document.owner?.student?.phoneNumber || "";

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
      classroom: classroom, // ✨ เพิ่มข้อมูลห้องเรียน
      phoneNumber: phoneNumber, // ✨ เพิ่มเบอร์โทรศัพท์
      createdAt: document.created_at,
      // เพิ่มข้อมูลไฟล์ transcript เพื่อให้ฝั่ง frontend แสดงลิงก์ดูไฟล์เดิมได้
      transcriptFilename: document.fileName,
      // เหตุผลการปฏิเสธ (ทำให้สอดคล้องกับ Alert ทาง frontend) หาก status = rejected
      rejectionReason: document.status === 'rejected' ? document.reviewComment : undefined,
      reviewComment: document.reviewComment,
      // ✨ เพิ่มข้อมูล late status สำหรับแสดงสถานะการส่งเอกสาร
      isLate: document.isLate || false,
      lateMinutes: document.lateMinutes || null,
      lateReason: document.lateReason || null,
      submittedLate: document.submittedLate || false,
      submissionDelayMinutes: document.submissionDelayMinutes || null
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
          // snapshot academic period
          academicYear: await getCurrentAcademicYear(),
          semester: await getCurrentSemester(),
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
  async submitCS05WithTranscript(userId, fileData, formData, deadlineInfo = {}) {
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
        studentData, // ข้อมูลนักศึกษา (สำหรับบันทึก phoneNumber และ classroom)
        phoneNumber, // เบอร์โทรศัพท์นักศึกษาคนที่ 1
        classroom, // ห้องเรียนนักศึกษาคนที่ 1
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

      // เตรียมข้อมูล late status จาก middleware
      const isLate = deadlineInfo?.isLate === true;
      const minutesLateFromDeadlineInfo = deadlineInfo?.deadlineInfo?.minutesLate;
      const minutesLateFallback = deadlineInfo?.minutesLate;
      const lateMinutes =
        typeof minutesLateFromDeadlineInfo === "number"
          ? minutesLateFromDeadlineInfo
          : typeof minutesLateFallback === "number"
          ? minutesLateFallback
          : null;
      const submittedLate = isLate; // ใช้ค่าเดียวกับ isLate
      const submissionDelayMinutes = lateMinutes; // ใช้ค่าเดียวกับ lateMinutes
      const importantDeadlineId =
        deadlineInfo?.applicableDeadline?.id ?? deadlineInfo?.deadlineInfo?.id ?? null;

      // 1. สร้าง Document ที่มีข้อมูลไฟล์ transcript พร้อม late status
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
          // ✨ บันทึก late status
          isLate,
          lateMinutes,
          submittedLate,
          submissionDelayMinutes,
          importantDeadlineId,
          submittedAt: new Date() // บันทึกเวลาที่ส่ง
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
          academicYear: await getCurrentAcademicYear(),
          semester: await getCurrentSemester(),
        },
        { transaction }
      );

      // 3. อัปเดตสถานะการฝึกงานในตาราง students พร้อมบันทึก phoneNumber และ classroom
      const student = await Student.findOne(
        {
          where: { userId },
        },
        { transaction }
      );

      if (student) {
        // เตรียมข้อมูลสำหรับอัปเดต
        const updateData = {
          internshipStatus: "pending_approval",
          isEnrolledInternship: true,
        };

        // บันทึก phoneNumber ถ้ามี (จากฟิลด์แยก หรือจาก studentData[0])
        const studentPhoneNumber = phoneNumber || studentData?.[0]?.phoneNumber;
        if (studentPhoneNumber && studentPhoneNumber.trim() !== '') {
          updateData.phoneNumber = studentPhoneNumber.trim();
        }

        // บันทึก classroom ถ้ามี (จากฟิลด์แยก หรือจาก studentData[0])
        const studentClassroom = classroom || studentData?.[0]?.classroom;
        if (studentClassroom && studentClassroom.trim() !== '') {
          updateData.classroom = studentClassroom.trim();
        }

        await student.update(updateData, { transaction });

        console.log('✅ [submitCS05WithTranscript] อัปเดตข้อมูลนักศึกษา:', {
          userId,
          studentId: student.studentId,
          phoneNumber: updateData.phoneNumber || 'ไม่ได้ระบุ',
          classroom: updateData.classroom || 'ไม่ได้ระบุ',
          internshipStatus: 'pending_approval'
        });
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
        // ✨ ส่งข้อมูล late status กลับไปด้วย
        isLate,
        lateMinutes,
        submittedLate,
        submissionDelayMinutes
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
          as: 'internshipDocument', // ⚠️ ต้องใช้ as keyword!
          required: true,
        },
        {
          model: User,
          as: 'owner', // ⚠️ Document belongsTo User as 'owner'
          attributes: ["firstName", "lastName", "userId"],
          include: [
            {
              model: Student,
              as: 'student', // ⚠️ User hasOne Student as 'student'
              attributes: ["studentCode", "totalCredits", "studentId"],
            },
          ],
        },
      ],
    });

    if (!document) {
      throw new Error("ไม่พบข้อมูลแบบฟอร์ม คพ.05");
    }

    // ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
    // อนุญาตให้: เจ้าของเอกสาร, admin, teacher, head
    const allowedRoles = ["admin", "teacher", "head", "staff"];
    if (document.userId !== userId && !allowedRoles.includes(userRole)) {
      throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
    }

    // เข้าถึงข้อมูลผ่าน alias ที่ถูกต้อง
    const ownerUser = document.owner;
    const studentData = ownerUser?.student;
    const internshipDoc = document.internshipDocument;

    return {
      documentId: document.documentId,
      studentName: `${ownerUser?.firstName || ''} ${ownerUser?.lastName || ''}`.trim(),
      studentCode: studentData?.studentCode,
      companyName: internshipDoc?.companyName,
      companyAddress: internshipDoc?.companyAddress,
      internshipPosition: internshipDoc?.internshipPosition,
      position: internshipDoc?.internshipPosition, // alias สำหรับ CS05Preview
      contactPersonName: internshipDoc?.contactPersonName,
      contactPersonPosition: internshipDoc?.contactPersonPosition,
      startDate: internshipDoc?.startDate,
      endDate: internshipDoc?.endDate,
      status: document.status,
      createdAt: document.created_at,
      // เพิ่มข้อมูลสำหรับ CS05Preview component
      owner: {
        student: {
          studentCode: studentData?.studentCode,
          totalCredits: studentData?.totalCredits,
        }
      }
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

      // ✅ ตรวจสอบสถานะ CS05 - อนุญาตเฉพาะ approved เท่านั้น
      if (document.status !== "approved") {
        throw new Error(
          `ไม่สามารถกรอกข้อมูลได้ เนื่องจากคำร้องขอฝึกงานยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${document.status})`
        );
      }

      // ✅ ตรวจสอบสถานะ ACCEPTANCE_LETTER - ต้องได้รับการอนุมัติแล้ว
      const acceptanceLetter = await Document.findOne({
        where: {
          userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
        },
        order: [["created_at", "DESC"]],
        transaction,
      });

      if (!acceptanceLetter) {
        throw new Error(
          "ไม่สามารถกรอกข้อมูลได้ เนื่องจากยังไม่มีการอัปโหลดหนังสือตอบรับจากบริษัท"
        );
      }

      if (acceptanceLetter.status !== "approved") {
        throw new Error(
          `ไม่สามารถกรอกข้อมูลได้ เนื่องจากหนังสือตอบรับยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${acceptanceLetter.status})`
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

      // ✅ เปลี่ยนเงื่อนไข: อนุญาตเฉพาะ approved เท่านั้น
      if (cs05Check.status !== "approved") {
        logger.warn(`[getInternshipSummary] CS05 status is '${cs05Check.status}' for userId: ${userId} - Access denied (only 'approved' allowed)`);
        throw new Error(`ไม่สามารถดูสรุปผลได้ เนื่องจากคำร้องขอฝึกงานยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${cs05Check.status})`);
      }

      // ✅ ตรวจสอบสถานะ หนังสืบตอบรับฝึกงาน
      const acceptanceCheck = await Document.findOne({
        where: {
          userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
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

      logger.info(`[getInternshipSummary] Pre-check passed for userId: ${userId}, studentId: ${studentCheck.studentId}, CS05 status: ${cs05Check.status}, Acceptance status: ${acceptanceCheck.status}`);
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
            status: ["approved", "supervisor_approved", "supervisor_evaluated"],
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
          status: ["approved"],
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
      const passFail = (overallScore >= 70 && supervisorPassDecision) ? 'pass' : 'fail';
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

            await emailService.sendEvaluationSubmittedNotificationToStudent(
              studentData.email,
              studentData.firstName,
              document.internshipDocument.companyName,
              evaluationData.supervisorName
            );

            logger.info(
              `✅ ส่งอีเมลแจ้งเตือนสำเร็จไปยัง: ${studentData.email}`
            );
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

  /**
   * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา (แก้ไขให้ CS05 เป็น approved ตลอด)
   */
  async getReferralLetterStatus(userId, cs05DocumentId) {
    try {
      logger.debug("[DEBUG] getReferralLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ค้นหาเอกสาร CS05
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
            required: false,
          },
        ],
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05");
      }

      // 2. ค้นหาหนังสือตอบรับที่ได้รับการอนุมัติ
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "approved",
        },
      });

      // 3. ✅ กำหนดสถานะ (ไม่เปลี่ยน CS05 status)
      let status = cs05Document.status; // ✅ ใช้สถานะเดิมของ CS05
      let isReady = false;
      let isDownloaded = false;

      // 4. ✅ ตรวจสอบเงื่อนไขการพร้อมใช้งาน
      if (
        cs05Document.status === "approved" &&
        acceptanceLetter &&
        acceptanceLetter.status === "approved"
      ) {
        isReady = true;
      }

      // 5. ✅ ตรวจสอบการดาวน์โหลดจาก acceptanceLetter
      if (
        acceptanceLetter?.downloadStatus === "downloaded" ||
        acceptanceLetter?.downloadedAt
      ) {
        isDownloaded = true;
      }

      logger.debug("[DEBUG] Status calculation result:", {
        cs05Status: status, // ✅ ควรเป็น "approved" ตลอด
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceDownloaded: isDownloaded,
        isReady,
        isDownloaded,
        downloadedAt: acceptanceLetter?.downloadedAt,
        downloadCount: acceptanceLetter?.downloadCount,
      });

      return {
        hasReferralLetter: isReady || isDownloaded,
        status: status, // ✅ ส่งสถานะ CS05 ตรงๆ (approved)
        cs05Status: status, // ✅ CS05 ยังคงเป็น "approved"
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceLetterStatus: acceptanceLetter?.status,

        // ข้อมูลผู้ควบคุมงาน
        hasSupervisorInfo: !!(
          cs05Document.internshipDocument?.supervisorName &&
          cs05Document.internshipDocument?.supervisorEmail
        ),
        supervisorInfo: {
          supervisorName:
            cs05Document.internshipDocument?.supervisorName || null,
          supervisorEmail:
            cs05Document.internshipDocument?.supervisorEmail || null,
          supervisorPhone:
            cs05Document.internshipDocument?.supervisorPhone || null,
          supervisorPosition:
            cs05Document.internshipDocument?.supervisorPosition || null,
        },

        isReady: isReady,
        isDownloaded: isDownloaded,
        createdDate: cs05Document.created_at,
        readyDate: acceptanceLetter?.updated_at || null,

        // ✅ ข้อมูลการดาวน์โหลดจาก acceptanceLetter
        downloadedAt: acceptanceLetter?.downloadedAt,
        downloadCount: acceptanceLetter?.downloadCount || 0,

        // ✅ mapping info
        mappingInfo: {
          backendStatus: status, // "approved"
          shouldMapTo: isDownloaded
            ? "downloaded"
            : isReady
            ? "ready"
            : "not_ready",
          requiresSupervisorInfo: false,
          supervisorInfoOptional: true,
          cs05AlwaysApproved: true, // ✅ CS05 เป็น approved ตลอด
        },
      };
    } catch (error) {
      logger.error("Get Referral Letter Status Service Error:", error);
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
      logger.debug("[DEBUG] generateReferralLetterPDF:", { userId, documentId });

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

      const PDFDocument = require("pdfkit");

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

      logger.debug("[DEBUG] PDF generated successfully:", {
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
      logger.error("Generate Referral Letter PDF Service Error:", error);
      throw error;
    }
  }

  /**
   * อัปโหลดหนังสือตอบรับการฝึกงาน
   */
  async uploadAcceptanceLetter(userId, cs05DocumentId, fileData) {
    const transaction = await sequelize.transaction();

    try {
      logger.debug("[DEBUG] uploadAcceptanceLetter:", {
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

      logger.debug("[DEBUG] CS05 Document validated:", {
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
          // parentDocumentId: cs05Document.documentId, // เชื่อมโยงกับ CS05
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
        logger.debug("[DEBUG] Updating existing acceptance letter:", {
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
        },
        { transaction }
      );

      logger.debug("[DEBUG] Created new acceptance letter document:", {
        documentId: acceptanceDocument.documentId,
        fileName: fileData.filename,
      });

      logger.debug("[DEBUG] Updated CS05 status to acceptance_uploaded");

      // 5. Update workflow - หนังสือตอบรับถูกอัปโหลดแล้ว
      const workflowService = require('./workflowService');
      const student = await Student.findOne({ where: { userId }, transaction });
      
      if (student) {
        await workflowService.updateStudentWorkflowActivity(
          student.studentId,
          'internship',
          'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',
          'completed',
          'in_progress',
          { acceptanceLetterDocId: acceptanceDocument.documentId, uploadedAt: new Date().toISOString() },
          { transaction }
        );
        logger.info(`Updated workflow to COMPANY_RESPONSE_RECEIVED for student ${student.studentId}`);
      }

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
        cs05Status: "acceptance_uploaded",
        cs05Updated: true,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Upload Acceptance Letter Service Error:", error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน (แก้ไขให้ตรวจสอบจากฐานข้อมูลจริง)
   */
  async checkAcceptanceLetterStatus(userId, cs05DocumentId) {
    try {
      logger.debug("[DEBUG] checkAcceptanceLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ตรวจสอบเอกสาร CS05 ก่อน
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
          documentType: "INTERNSHIP",
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

      logger.debug("[DEBUG] CS05 Document found:", {
        documentId: cs05Document.documentId,
        status: cs05Document.status,
      });

      // 2. ✅ ค้นหาหนังสือตอบรับจากฐานข้อมูลจริง (ไม่จำกัด status)
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          // ✅ ไม่จำกัด status เพื่อให้หาเจอทุกสถานะ
        },
        order: [["created_at", "DESC"]], // เอาล่าสุด
      });

      logger.debug("[DEBUG] Acceptance letter found:", {
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

      // 4. ✅ คำนวณสถานะตามข้อมูลจริงในฐานข้อมูล
      let acceptanceStatus = "not_uploaded"; // ค่าเริ่มต้น
      let canUpload = false;
      let requiresApproval = false;
      let statusMessage = "";

      // ✅ ตรวจสอบสิทธิ์ในการอัปโหลด (CS05 ต้องได้รับการอนุมัติก่อน)
      if (cs05Document.status === "approved") {
        canUpload = true;
      }

      // ✅ ตรวจสอบจากข้อมูลจริงในฐานข้อมูล
      if (acceptanceLetter) {
        // ✅ มีการอัปโหลดแล้ว - ใช้สถานะจากฐานข้อมูล
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
              logger.debug(
                "[DEBUG] 🔄 อัปเดต CS05 status เป็น acceptance_approved"
              );

              await cs05Document.update({
                status: "acceptance_approved",
                updated_at: new Date(),
              });

              logger.debug("[DEBUG] ✅ อัปเดต CS05 status เรียบร้อย");
            }
            break;
          case "rejected":
            statusMessage = "หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่";
            canUpload = true; // อนุญาตให้อัปโหลดใหม่
            break;
          default:
            statusMessage = `สถานะ: ${acceptanceLetter.status}`;
        }
      } else {
        // ✅ ไม่มีการอัปโหลด - เก็บสถานะเป็น not_uploaded
        acceptanceStatus = "not_uploaded";

        if (canUpload) {
          statusMessage = "กรุณาอัปโหลดหนังสือตอบรับจากบริษัท";
        } else {
          statusMessage = "รอการอนุมัติ CS05 ก่อนอัปโหลดหนังสือตอบรับ";
        }
      }

      // 5. ตรวจสอบความพร้อมสำหรับขั้นตอนถัดไป
      const isReadyForNextStep =
        acceptanceStatus === "approved" && hasCompleteSupervisorInfo;

      logger.debug("[DEBUG] Final status calculation:", {
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus, // ✅ สถานะจริงจากฐานข้อมูล
        canUpload,
        requiresApproval,
        statusMessage,
        hasCompleteSupervisorInfo,
        isReadyForNextStep,
      });

      return {
        // ข้อมูลเอกสาร CS05
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status,
        cs05DocumentType: cs05Document.documentType,

        // ✅ ข้อมูลหนังสือตอบรับ (สถานะจริงจากฐานข้อมูล)
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus, // ✅ จะเป็น pending/approved/rejected หรือ not_uploaded
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
        documentId: acceptanceLetter?.documentId || null,

        // สถานะขั้นตอนถัดไป
        isReadyForNextStep,
        canProceedToReferralLetter: isReadyForNextStep,

        // ✅ ข้อมูลเพิ่มเติมสำหรับ debug
        debugInfo: {
          foundAcceptanceDocument: !!acceptanceLetter,
          originalStatus: acceptanceLetter?.status || "not_found",
          cs05OriginalStatus: cs05Document.status,
        },
  // ✅ เหตุผลการปฏิเสธ (ถ้ามี) สำหรับ frontend แสดงผล
  rejectionReason: acceptanceLetter?.status === 'rejected' ? acceptanceLetter?.reviewComment : undefined,
  reviewComment: acceptanceLetter?.reviewComment
      };
    } catch (error) {
      logger.error("Check Acceptance Letter Status Service Error:", error);
      throw error;
    }
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
   */
  async downloadAcceptanceLetter(userId, acceptanceDocumentId) {
    try {
      logger.debug("[DEBUG] downloadAcceptanceLetter:", {
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

        logger.debug("[DEBUG] File read successfully:", {
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
        logger.error("[DEBUG] File access error:", fileError);
        throw new Error("ไม่สามารถเข้าถึงไฟล์ได้ ไฟล์อาจถูกลบหรือย้ายที่");
      }
    } catch (error) {
      logger.error("Download Acceptance Letter Service Error:", error);
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
   * ตรวจสอบสถานะหนังสือตอบรับการฝึกงาน (ฟังก์ชันอื่นที่ใช้งานคล้ายกัน)
   */
  async getAcceptanceLetterStatus(userId, cs05DocumentId) {
    try {
      logger.debug("[DEBUG] getAcceptanceLetterStatus:", {
        userId,
        cs05DocumentId,
      });

      // 1. ตรวจสอบเอกสาร CS05 ก่อน (รองรับกรณี cs05DocumentId เป็น null/undefined)
      let cs05Document = null;
      const parsedId = Number(cs05DocumentId);
      if (Number.isFinite(parsedId) && parsedId > 0) {
        cs05Document = await Document.findOne({
          where: {
            documentId: parsedId,
            userId: userId,
            documentName: "CS05",
            documentType: "INTERNSHIP",
          },
        });
      } else {
        cs05Document = await Document.findOne({
          where: {
            userId: userId,
            documentName: "CS05",
            documentType: "INTERNSHIP",
          },
          order: [["created_at", "DESC"]],
        });
      }

      if (!cs05Document) {
        logger.warn("[WARN] getAcceptanceLetterStatus: ไม่พบเอกสาร CS05 ของผู้ใช้", { userId, cs05DocumentId });
      } else {
        logger.debug("[DEBUG] CS05 Document found:", {
          documentId: cs05Document.documentId,
          status: cs05Document.status,
        });
      }

      // 2. ✅ ค้นหาหนังสือตอบรับจากฐานข้อมูลจริง
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          // ✅ ไม่จำกัด status
        },
        order: [["created_at", "DESC"]],
      });

      // 3. ✅ คำนวณสถานะตามข้อมูลจริง
      let acceptanceStatus = "not_uploaded";
      let canUpload = false;
      let requiresApproval = false;
      let statusMessage = "";

      // ตรวจสอบสิทธิ์ในการอัปโหลด
  if (cs05Document && cs05Document.status === "approved") {
        canUpload = true;
      }

      if (acceptanceLetter) {
        // ✅ มีการอัปโหลดแล้ว
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
            canUpload = true;
            break;
          default:
            statusMessage = `สถานะ: ${acceptanceLetter.status}`;
        }
      } else {
        // ✅ ไม่มีการอัปโหลด
        if (canUpload) {
          statusMessage = "กรุณาอัปโหลดหนังสือตอบรับจากบริษัท";
        } else {
          statusMessage = "รอการอนุมัติ CS05 ก่อนอัปโหลดหนังสือตอบรับ";
        }
      }

      logger.debug("[DEBUG] Acceptance letter status calculation:", {
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus, // ✅ สถานะจริง
        canUpload,
        requiresApproval,
        statusMessage,
      });

      return {
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus, // ✅ สถานะจริงจากฐานข้อมูล
        canUpload,
        requiresApproval,
        statusMessage,
        uploadedAt: acceptanceLetter?.created_at || null,
        updatedAt: acceptanceLetter?.updated_at || null,
        fileName: acceptanceLetter?.fileName || null,
        documentId: acceptanceLetter?.documentId || null,
        // ✅ เพิ่มข้อมูลเหตุผลการปฏิเสธ (ถ้ามี)
        reviewComment: acceptanceLetter?.reviewComment || null,
        rejectionReason:
          acceptanceLetter?.status === "rejected"
            ? acceptanceLetter?.reviewComment || null
            : null,
      };
    } catch (error) {
      logger.error("Get Acceptance Letter Status Service Error:", error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว (แก้ไขให้อัปเดต acceptanceLetter แทน)
   */
  async markReferralLetterDownloaded(userId, cs05DocumentId) {
    const transaction = await sequelize.transaction();

    try {
      logger.debug("[DEBUG] Service markReferralLetterDownloaded:", {
        userId,
        cs05DocumentId,
      });

      // 1. ค้นหาเอกสาร CS05 (เพื่อตรวจสอบสิทธิ์เท่านั้น)
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(cs05DocumentId),
          userId: userId,
          documentName: "CS05",
          documentType: "INTERNSHIP",
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
        transaction,
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลเอกสาร CS05 หรือไม่มีสิทธิ์เข้าถึง");
      }

      // 2. ✅ ค้นหาหนังสือตอบรับที่ได้รับการอนุมัติ
      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "approved",
        },
        transaction,
      });

      if (!acceptanceLetter) {
        throw new Error(
          "ไม่พบหนังสือตอบรับที่ได้รับการอนุมัติ กรุณาอัปโหลดและรอการอนุมัติหนังสือตอบรับก่อน"
        );
      }

      // 3. ตรวจสอบสถานะ CS05 (ต้องเป็น approved)
      if (cs05Document.status !== "approved") {
        throw new Error(
          "เอกสาร CS05 ต้องได้รับการอนุมัติก่อนจึงจะดาวน์โหลดหนังสือส่งตัวได้"
        );
      }

      logger.debug("[DEBUG] Found documents BEFORE update:", {
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status, // ควรเป็น "approved"
        acceptanceDocumentId: acceptanceLetter.documentId,
        acceptanceStatus: acceptanceLetter.status, // ควรเป็น "approved"
        acceptanceDownloadedAt: acceptanceLetter.downloadedAt,
        acceptanceDownloadCount: acceptanceLetter.downloadCount,
      });

      // 4. ✅ อัปเดตสถานะการดาวน์โหลดใน acceptanceLetter (ไม่ใช่ cs05Document)
      const downloadTimestamp = new Date();
      const currentDownloadCount = acceptanceLetter.downloadCount || 0;

      await acceptanceLetter.update(
        {
          // ✅ เพิ่ม field สำหรับเก็บสถานะการดาวน์โหลด
          status: "approved", // ✅ คงสถานะเป็น approved
          downloadedAt: downloadTimestamp, // ✅ วันที่ดาวน์โหลด
          downloadCount: currentDownloadCount + 1, // ✅ จำนวนครั้งที่ดาวน์โหลด
          downloadStatus: "downloaded", // ✅ เพิ่ม field ใหม่ (ถ้ามี)
          updated_at: downloadTimestamp,
        },
        { transaction }
      );

      // 5. ✅ CS05 ยังคงเป็น "approved" (ไม่เปลี่ยนแปลง)
      logger.debug("[DEBUG] CS05 status remains:", cs05Document.status);

      logger.debug("[DEBUG] Update completed successfully");

      // 6. ตรวจสอบผลลัพธ์หลัง update
      await acceptanceLetter.reload({ transaction });

      logger.debug("[DEBUG] Documents AFTER update:", {
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status, // ยังคงเป็น "approved"
        acceptanceDocumentId: acceptanceLetter.documentId,
        acceptanceStatus: acceptanceLetter.status, // ยังคงเป็น "approved"
        acceptanceDownloadedAt: acceptanceLetter.downloadedAt,
        acceptanceDownloadCount: acceptanceLetter.downloadCount,
      });

      await transaction.commit();

      return {
        // ✅ ข้อมูลที่ส่งกลับ
        documentId: cs05Document.documentId,
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status, // "approved"

        acceptanceDocumentId: acceptanceLetter.documentId,
        acceptanceStatus: acceptanceLetter.status, // "approved"

        status: "referral_downloaded", // สถานะสำหรับ frontend
        downloadDate: downloadTimestamp,
        downloadCount: currentDownloadCount + 1,
        completedProcess: true,

        // ✅ ข้อมูลเพิ่มเติม
        referralLetterDownloaded: true,
        shouldUpdateCS05Status: false, // ✅ ไม่ต้องอัปเดต CS05
        finalStatus: "referral_downloaded",
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Mark Referral Letter Downloaded Service Error:", error);
      throw error;
    }
  }

  // ============= Certificate Management (ปรับปรุงใหม่) =============

  /**
   * ✅ ปรับปรุง previewCertificatePDF ให้ดีขึ้น
   */
  async previewCertificatePDF(userId) {
    try {
      logger.debug(`[previewCertificatePDF] Starting for userId: ${userId}`);

      // 1. ตรวจสอบสถานะหนังสือรับรอง
      const certificateStatus = await this.getCertificateStatus(userId);

      if (certificateStatus.status !== "ready") {
        const error = new Error(
          "หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่ภาควิชา"
        );
        error.statusCode = 409; // Conflict
        throw error;
      }

      // 2. ดึงข้อมูลสำหรับสร้าง PDF
      const certificateData = await this.getCertificateData(userId);

      // 3. สร้าง PDF โดยใช้ PDFKit
      const pdfBuffer = await this.createCertificatePDF(certificateData);

      logger.debug(
        `[previewCertificatePDF] PDF generated successfully for userId: ${userId}`
      );

      return {
        pdfBuffer,
        fileName: `ตัวอย่างหนังสือรับรอง-${certificateData.studentInfo.studentId}.pdf`,
        contentType: "application/pdf",
        metadata: {
          userId,
          studentName: certificateData.studentInfo.fullName,
          generateDate: new Date(),
          type: "preview",
        },
      };
    } catch (error) {
      logger.error(`[previewCertificatePDF] Error:`, error);
      // เพิ่ม statusCode ถ้ายังไม่มี
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }

  /**
   * ✅ ปรับปรุง downloadCertificatePDF ให้ดีขึ้น
   */
  async downloadCertificatePDF(userId) {
    try {
      logger.debug(`[downloadCertificatePDF] Starting for userId: ${userId}`);

      // 1. ตรวจสอบสถานะหนังสือรับรอง
      const certificateStatus = await this.getCertificateStatus(userId);

      if (certificateStatus.status !== "ready") {
        const error = new Error(
          "หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่ภาควิชา"
        );
        error.statusCode = 409; // Conflict
        throw error;
      }

      // 2. ดึงข้อมูลสำหรับสร้าง PDF
      const certificateData = await this.getCertificateData(userId);

      // 3. สร้าง PDF
      const pdfBuffer = await this.createCertificatePDF(certificateData);

      // 4. บันทึกการดาวน์โหลด
      try {
        await this.markCertificateDownloaded(userId);
        logger.debug(
          `[downloadCertificatePDF] Download status recorded for userId: ${userId}`
        );
      } catch (markError) {
        logger.warn(
          `[downloadCertificatePDF] Failed to mark download:`,
          markError.message
        );
        // ไม่ throw error เพราะ PDF สร้างสำเร็จแล้ว
      }

      logger.debug(
        `[downloadCertificatePDF] PDF generated successfully for userId: ${userId}`
      );

      return {
        pdfBuffer,
        fileName: `หนังสือรับรองการฝึกงาน-${certificateData.studentInfo.studentId}.pdf`,
        contentType: "application/pdf",
        metadata: {
          userId,
          studentName: certificateData.studentInfo.fullName,
          generateDate: new Date(),
          type: "download",
        },
      };
    } catch (error) {
      logger.error(`[downloadCertificatePDF] Error:`, error);
      // เพิ่ม statusCode ถ้ายังไม่มี
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }

  /**
   * ✅ ปรับปรุง createCertificatePDF ให้มีเนื้อหาครบถ้วน
   */
  async createCertificatePDF(certificateData) {
    const PDFDocument = require("pdfkit");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: "หนังสือรับรองการฝึกงาน",
            Subject: `หนังสือรับรองการฝึกงาน - ${certificateData.studentInfo.fullName}`,
            Author: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          },
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // ✅ เขียนเนื้อหาหนังสือรับรอง
        doc.font("Helvetica");

        // หัวข้อเอกสาร
        doc.fontSize(20).text("หนังสือรับรองการฝึกงาน", {
          align: "center",
        });

        doc.moveDown();

        // เลขที่เอกสารและวันที่
        doc.fontSize(12);
        doc.text(
          `เลขที่: ${
            certificateData.documentInfo?.certificateNumber ||
            "CS-CERT-" + Date.now()
          }`,
          {
            align: "left",
          }
        );
        doc.text(
          `วันที่: ${this.formatThaiDate(
            certificateData.documentInfo?.issueDate || new Date()
          )}`,
          {
            align: "right",
          }
        );

        doc.moveDown();

        // เนื้อหาหนังสือรับรอง
        doc.fontSize(14);
        doc.text("ข้าพเจ้าขอรับรองว่า", { align: "left" });

        doc.moveDown(0.5);

        doc.text(`นาย/นาง/นางสาว ${certificateData.studentInfo.fullName}`, {
          align: "left",
          underline: true,
        });

        doc.text(`รหัสนักศึกษา ${certificateData.studentInfo.studentId}`, {
          align: "left",
          underline: true,
        });

        doc.moveDown(0.5);

        doc.text("นักศึกษาสาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ", {
          align: "left",
        });

        doc.text(`${certificateData.studentInfo.faculty}`, {
          align: "left",
        });

        doc.text(`${certificateData.studentInfo.university}`, {
          align: "left",
        });

        doc.moveDown();

        doc.text(
          `ได้เข้าฝึกงาน ณ ${certificateData.internshipInfo.companyName}`,
          {
            align: "left",
            underline: true,
          }
        );

        doc.moveDown(0.5);

        doc.text(
          `ตั้งแต่วันที่ ${this.formatThaiDate(
            certificateData.internshipInfo.startDate
          )} ` +
            `ถึงวันที่ ${this.formatThaiDate(
              certificateData.internshipInfo.endDate
            )}`,
          { align: "left" }
        );

        doc.text(
          `รวม ${certificateData.internshipInfo.totalDays || 0} วัน ` +
            `เป็นเวลา ${
              certificateData.internshipInfo.totalHours || 0
            } ชั่วโมง`,
          { align: "left" }
        );

        doc.moveDown();

        doc.text("โดยมีผลการปฏิบัติงานในระดับที่น่าพอใจ", {
          align: "left",
        });

        doc.moveDown();

        doc.text("จึงออกหนังสือรับรองนี้ให้ไว้เป็นหลักฐาน", {
          align: "left",
        });

        doc.moveDown(3);

        // ลายเซ็นและตรายาง
        doc.text("ออกให้ ณ วันที่ " + this.formatThaiDate(new Date()), {
          align: "center",
        });

        doc.moveDown(2);

        doc.text(
          certificateData.approvalInfo?.approvedBy ||
            "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
          {
            align: "center",
          }
        );

        doc.text(
          certificateData.approvalInfo?.approverTitle ||
            "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          {
            align: "center",
          }
        );

        // ปิด PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ดึงข้อมูลสำหรับสร้างหนังสือรับรอง (ปรับปรุงให้เหมาะกับ Frontend PDF Generation)
   */
  async getCertificateData(userId) {
    try {
      logger.debug(`[getCertificateData] Fetching data for userId: ${userId}`);

      // ตรวจสอบสถานะหนังสือรับรอง
      const status = await this.getCertificateStatus(userId);

      if (status.status !== "ready") {
        throw new Error(
          "หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่ภาควิชา"
        );
      }

      // ดึงข้อมูลแบบเดียวกับ getInternshipSummary แต่เพิ่มข้อมูลสำหรับหนังสือรับรอง
      const summaryData = await this.getInternshipSummary(userId);

      // ดึงข้อมูลการประเมินจากผู้ควบคุมงาน
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

      const evaluation = await InternshipEvaluation.findOne({
        where: {
          studentId: student.studentId,
        },
        order: [["created_at", "DESC"]],
      });

      // ดึงข้อมูลคำขอหนังสือรับรอง
      const certificateRequest = await InternshipCertificateRequest.findOne({
        where: {
          studentId: student.studentId,
          status: "approved",
        },
        order: [["created_at", "DESC"]],
      });

      if (!certificateRequest) {
        throw new Error("ไม่พบคำขอหนังสือรับรองที่ได้รับการอนุมัติ");
      }

      // รวมข้อมูลสำหรับหนังสือรับรอง (ตรงตาม Template Format)
      const certificateData = {
        // ข้อมูลเอกสาร
        documentInfo: {
          certificateNumber:
            certificateRequest.certificateNumber ||
            this.generateCertificateNumber(student.studentCode),
          issueDate: certificateRequest.processedAt || new Date(),
          documentDate: certificateRequest.processedAt || new Date(),
          validityPeriod: "ไม่มีกำหนดหมดอายุ",
          purpose:
            "เพื่อใช้เป็นหลักฐานการฝึกงานตามหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        },

        // ข้อมูลนักศึกษา (ตรงตาม Template)
        studentInfo: {
          ...summaryData.studentInfo,
          studentId: summaryData.studentInfo.studentId,
          studentCode: summaryData.studentInfo.studentId, // alias
          fullName: summaryData.studentInfo.fullName,
          firstName: summaryData.studentInfo.firstName,
          lastName: summaryData.studentInfo.lastName,
          yearLevel: summaryData.studentInfo.yearLevel,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          faculty: "คณะวิทยาศาสตร์ประยุกต์",
          university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // ข้อมูลบริษัทและการฝึกงาน
        internshipInfo: {
          companyName: summaryData.companyName,
          companyAddress: summaryData.companyAddress,
          startDate: summaryData.startDate,
          endDate: summaryData.endDate,
          totalDays: summaryData.totalDays,
          totalHours: summaryData.totalHours,
          approvedDays: summaryData.approvedDays,
          approvedHours: summaryData.approvedHours,
          supervisorName: summaryData.supervisorName,
          supervisorPosition: summaryData.supervisorPosition,
          supervisorPhone: summaryData.supervisorPhone,
          supervisorEmail: summaryData.supervisorEmail,
        },

        // ข้อมูลการประเมิน (ถ้ามี)
        evaluationInfo: evaluation
          ? {
              overallRating: evaluation.overallRating,
              workQuality: evaluation.workQuality,
              workAttitude: evaluation.workAttitude,
              punctuality: evaluation.punctuality,
              responsibility: evaluation.responsibility,
              teamwork: evaluation.teamwork,
              learningAbility: evaluation.learningAbility,
              strengths: evaluation.strengths,
              improvements: evaluation.improvements,
              additionalComments: evaluation.additionalComments,
              evaluationDate: evaluation.completedDate,
              supervisorName: evaluation.supervisorName,
              supervisorPosition: evaluation.supervisorPosition,
            }
          : null,

        // ข้อมูลผู้อนุมัติ
        approvalInfo: {
          approvedBy: "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
          approverTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          approvedDate: certificateRequest.processedAt,
          departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          facultyName: "คณะวิทยาศาสตร์ประยุกต์",
          universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // Metadata สำหรับ PDF Generation
        metadata: {
          templateType: "certificate",
          fileName: `หนังสือรับรองการฝึกงาน-${summaryData.studentInfo.studentId}`,
          title: "หนังสือรับรองการฝึกงาน",
          subject: `หนังสือรับรองการฝึกงาน - ${summaryData.studentInfo.fullName}`,
          author: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          keywords: ["หนังสือรับรอง", "การฝึกงาน", "วิทยาการคอมพิวเตอร์"],
        },
      };

      logger.debug(
        `[getCertificateData] Data prepared successfully for ${summaryData.studentInfo.studentId}`
      );

      return certificateData;
    } catch (error) {
      logger.error(`[getCertificateData] Error:`, error);
      throw error;
    }
  }

  /**
   * บันทึกการดาวน์โหลดหนังสือรับรอง (เรียกจาก Frontend หลังดาวน์โหลดสำเร็จ)
   */
  async markCertificateDownloaded(userId) {
    try {
      const student = await Student.findOne({
        where: { userId },
        attributes: ["studentId"],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // อัปเดตสถานะการดาวน์โหลด
      const updateResult = await InternshipCertificateRequest.update(
        {
          downloadedAt: new Date(),
          downloadCount: sequelize.literal("COALESCE(download_count, 0) + 1"),
          lastDownloadedAt: new Date(),
        },
        {
          where: {
            studentId: student.studentId,
            status: "approved",
          },
        }
      );

      logger.debug(
        `[markCertificateDownloaded] Download status updated for studentId: ${student.studentId}`
      );

      return {
        success: true,
        message: "บันทึกการดาวน์โหลดเรียบร้อยแล้ว",
        downloadedAt: new Date(),
        studentId: student.studentId,
      };
    } catch (error) {
      logger.error(`[markCertificateDownloaded] Error:`, error);
      throw error;
    }
  }

  async getCertificateStatus(userId) {
    try {
      logger.debug(
        `[getCertificateStatus] Checking certificate status for userId: ${userId}`
      );

      // ดึงข้อมูลนักศึกษา
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

      // ตรวจสอบเอกสาร CS05 ที่ได้รับการอนุมัติ
      const cs05Document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ");
      }

      // ตรวจสอบชั่วโมงฝึกงาน
      const logbooks = await InternshipLogbook.findAll({
        where: {
          studentId: student.studentId,
          internshipId: cs05Document.internshipDocument.internshipId,
        },
      });

      // ✅ คำนวณทั้ง totalHours และ approvedHours
      const totalHours = logbooks.reduce(
        (sum, log) => sum + parseFloat(log.workHours || 0),
        0
      );
      
      const approvedHours = logbooks
        .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
        .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

      // ตรวจสอบการประเมินจากผู้ควบคุมงาน
      const supervisorEvaluation = await InternshipEvaluation.findOne({
        where: {
          studentId: student.studentId,
          internshipId: cs05Document.internshipDocument.internshipId,
        },
      });

      // ตรวจสอบรายงานสรุปผล
      const reflection = await InternshipLogbookReflection.findOne({
        where: {
          student_id: student.studentId,
          internship_id: cs05Document.internshipDocument.internshipId,
        },
      });

      // ตรวจสอบคำขอหนังสือรับรอง
      const certificateRequest = await InternshipCertificateRequest.findOne({
        where: {
          studentId: student.studentId,
          internshipId: cs05Document.internshipDocument.internshipId,
        },
        order: [["created_at", "DESC"]],
      });

  // ✅ คำนวณสถานะ (ใช้ approvedHours แทน totalHours)
  const isHoursComplete = approvedHours >= 240;
  const isEvaluationComplete = !!supervisorEvaluation;
  const isSummarySubmitted = !!reflection;
  const canRequestCertificate = isHoursComplete && isEvaluationComplete;

      let certificateStatus = "not_requested";
      if (certificateRequest) {
        if (certificateRequest.status === "approved") {
          certificateStatus = "ready";
        } else if (certificateRequest.status === "pending") {
          certificateStatus = "pending";
        }
      }

  // ✅ ดึงข้อมูลสถานประกอบการจากเอกสาร CS05 เพื่อใช้เติมในหนังสือรับรอง
  const internshipDocument = cs05Document.internshipDocument || {};
      const internshipInfo = {
        companyName: internshipDocument.companyName || "",
        companyAddress: internshipDocument.companyAddress || "",
        startDate:
          internshipDocument.startDate ||
          internshipDocument.internshipStartDate ||
          null,
        endDate:
          internshipDocument.endDate ||
          internshipDocument.internshipEndDate ||
          null,
        supervisorName: internshipDocument.supervisorName || "",
        supervisorPosition: internshipDocument.supervisorPosition || "",
        supervisorPhone: internshipDocument.supervisorPhone || "",
        supervisorEmail: internshipDocument.supervisorEmail || "",
        contactPersonName: internshipDocument.contactPersonName || "",
        contactPersonPosition: internshipDocument.contactPersonPosition || "",
        internshipPosition: internshipDocument.internshipPosition || "",
        totalHours,
        approvedHours, // ✅ เพิ่ม approved hours ใน internshipInfo
      };

      const result = {
        // สถานะโดยรวม
        status: certificateStatus,
        canRequestCertificate:
          canRequestCertificate && certificateStatus === "not_requested",

        // ✅ ข้อมูลการตรวจสอบเงื่อนไข (เพิ่ม approvedHours)
        requirements: {
          totalHours: {
            current: totalHours,
            approved: approvedHours, // ✅ เพิ่ม approved hours
            required: 240,
            completed: isHoursComplete,
          },
          supervisorEvaluation: {
            completed: isEvaluationComplete,
            evaluationDate: supervisorEvaluation?.created_at || null,
          },
          summarySubmission: {
            completed: isSummarySubmitted,
            submissionDate: reflection?.created_at || null,
          },
        },

        // ข้อมูลคำขอ
        certificateRequest: certificateRequest
          ? {
              requestId: certificateRequest.id,
              requestDate: certificateRequest.created_at,
              status: certificateRequest.status,
              processedDate: certificateRequest.processed_at,
              processedBy: certificateRequest.processed_by,
            }
          : null,

        // ข้อมูลนักศึกษา
        studentInfo: {
          studentId: student.studentCode,
          fullName: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
        },

        // ข้อมูลสถานประกอบการและการฝึกงาน (ใหม่)
        companyName: internshipInfo.companyName,
        companyAddress: internshipInfo.companyAddress,
        internshipStartDate: internshipInfo.startDate,
        internshipEndDate: internshipInfo.endDate,
        supervisorName: internshipInfo.supervisorName,
        supervisorPosition: internshipInfo.supervisorPosition,
        internshipInfo,
        companyInfo: internshipInfo,
      };

      logger.debug(`[getCertificateStatus] Status check completed:`, {
        status: certificateStatus,
        companyName: internshipInfo.companyName,
        canRequest: canRequestCertificate,
        totalHours,
        hasEvaluation: isEvaluationComplete,
        hasSummary: isSummarySubmitted,
      });

      // 🎯 อัปเดต internship_status ในฐานข้อมูลเมื่อฝึกงานเสร็จสิ้น
      if (certificateStatus === "ready") {
        await this.updateStudentInternshipStatus(userId, "completed");
      }

      return result;
    } catch (error) {
      if (
        error.message.includes("ไม่พบข้อมูล") ||
        error.message.includes("ยังไม่มีข้อมูล")
      ) {
        // log เป็น warning/info
        logger.warn(`[getCertificateStatus] No data:`, error.message);
      } else {
        // log เป็น error จริง
        logger.error(`[getCertificateStatus] Error:`, error);
      }
      throw error;
    }
  }

  // คงเดิม - ไม่เปลี่ยนแปลง
  async submitCertificateRequest(userId, requestData) {
    const transaction = await sequelize.transaction();

    try {
      logger.debug(
        `[submitCertificateRequest] Processing request for userId: ${userId}`
      );

      // ตรวจสอบสถานะปัจจุบัน
      const currentStatus = await this.getCertificateStatus(userId);

      if (!currentStatus.canRequestCertificate) {
        throw new Error("ยังไม่ผ่านเงื่อนไขการขอหนังสือรับรองการฝึกงาน (ต้องชั่วโมงครบและมีการประเมินผู้ควบคุมงาน)");
      }

      // ดึงข้อมูลนักศึกษาและเอกสาร CS05
      const student = await Student.findOne({
        where: { userId },
        attributes: ["studentId", "studentCode"],
        transaction,
      });

      const cs05Document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
        order: [["created_at", "DESC"]],
        transaction,
      });

      // ✅ สร้างคำขอหนังสือรับรอง (บันทึก approvedHours ลงฟิลด์ total_hours)
      const certificateRequest = await InternshipCertificateRequest.create(
        {
          studentId: student.studentId,
          internshipId: cs05Document.internshipDocument.internshipId,
          documentId: cs05Document.documentId,
          requestDate: new Date(requestData.requestDate),
          status: "pending",
          // ✅ บันทึก approvedHours แทน totalHours (ฟิลด์ยังชื่อ total_hours)
          totalHours:
            requestData.approvedHours ||
            currentStatus.requirements.totalHours.approved,
          evaluationStatus: requestData.evaluationStatus || "completed",
          // summaryStatus ไม่บังคับแล้ว ถ้าไม่มีจะตั้งค่าเป็น 'ignored'
          summaryStatus: requestData.summaryStatus || currentStatus.requirements?.summarySubmission?.completed ? 'submitted' : 'ignored',
          requestedBy: userId,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(
        `[submitCertificateRequest] Certificate request created successfully:`,
        {
          requestId: certificateRequest.id,
          studentId: student.studentCode,
          status: "pending",
        }
      );

      return {
        requestId: certificateRequest.id,
        status: "pending",
        requestDate: certificateRequest.requestDate,
        message: "ส่งคำขอหนังสือรับรองการฝึกงานเรียบร้อยแล้ว",
        estimatedProcessingDays: "3-5 วันทำการ",
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(`[submitCertificateRequest] Error:`, error);
      throw error;
    }
  }

  // คงเดิม - สำหรับการสร้างหมายเลขหนังสือรับรอง
  generateCertificateNumber(studentCode) {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const studentYear = studentCode.substring(0, 2);

    return `อว 7105(16)/${studentYear}${month}${year.toString().slice(-2)}`;
  }

  // คงเดิม - สำหรับการจัดรูปแบบวันที่ไทย
  formatThaiDate(date) {
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const d = new Date(date);
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543;

    return `${day} ${month} พ.ศ. ${year}`;
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
