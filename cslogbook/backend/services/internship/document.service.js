// services/internship/document.service.js
const {
  Document,
  InternshipDocument,
  Student,
  User,
} = require("../../models");
const { sequelize } = require("../../config/database");
const {
  getCurrentAcademicYear,
  getCurrentSemester,
} = require("../../utils/studentUtils");
const logger = require("../../utils/logger");

/**
 * Service สำหรับจัดการเอกสาร CS05 และเอกสารการฝึกงาน
 */
class InternshipDocumentService {
  /**
   * ดึงข้อมูล CS05 ปัจจุบันของนักศึกษา
   */
  async getCurrentCS05(userId) {
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
          "acceptance_pending",
          "acceptance_approved",
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
          as: "owner",
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
      internshipPosition: document.internshipDocument.internshipPosition,
      contactPersonName: document.internshipDocument.contactPersonName,
      contactPersonPosition: document.internshipDocument.contactPersonPosition,
      classroom,
      phoneNumber,
      createdAt: document.created_at,
      transcriptFilename: document.fileName,
      rejectionReason: document.status === 'rejected' ? document.reviewComment : undefined,
      reviewComment: document.reviewComment,
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
  async submitCS05(userId, {
    companyName,
    companyAddress,
    startDate,
    endDate,
    internshipPosition,
    contactPersonName,
    contactPersonPosition,
    supervisorName,
    supervisorPosition,
    supervisorPhone,
    supervisorEmail,
  }) {
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

      const internshipDoc = await InternshipDocument.create(
        {
          documentId: document.documentId,
          companyName,
          companyAddress,
          internshipPosition,
          contactPersonName,
          contactPersonPosition,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "pending",
          supervisorName,
          supervisorPosition,
          supervisorPhone,
          supervisorEmail,
          academicYear: await getCurrentAcademicYear(),
          semester: await getCurrentSemester(),
        },
        { transaction }
      );

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
      if (!fileData) {
        throw new Error("กรุณาแนบไฟล์ Transcript");
      }

      if (fileData.mimetype !== "application/pdf") {
        throw new Error("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
      }

      const {
        companyName,
        companyAddress,
        startDate,
        endDate,
        internshipPosition,
        contactPersonName,
        contactPersonPosition,
        studentData,
        phoneNumber,
        classroom,
      } = formData;

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

      const isLate = deadlineInfo?.isLate === true;
      const minutesLateFromDeadlineInfo = deadlineInfo?.deadlineInfo?.minutesLate;
      const minutesLateFallback = deadlineInfo?.minutesLate;
      const lateMinutes =
        typeof minutesLateFromDeadlineInfo === "number"
          ? minutesLateFromDeadlineInfo
          : typeof minutesLateFallback === "number"
          ? minutesLateFallback
          : null;
      const submittedLate = isLate;
      const submissionDelayMinutes = lateMinutes;
      const importantDeadlineId =
        deadlineInfo?.applicableDeadline?.id ?? deadlineInfo?.deadlineInfo?.id ?? null;

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
          isLate,
          lateMinutes,
          submittedLate,
          submissionDelayMinutes,
          importantDeadlineId,
          submittedAt: new Date()
        },
        { transaction }
      );

      const internshipDoc = await InternshipDocument.create(
        {
          documentId: document.documentId,
          companyName,
          companyAddress,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "pending",
          internshipPosition,
          contactPersonName,
          contactPersonPosition,
          supervisorName: null,
          supervisorPosition: null,
          supervisorPhone: null,
          supervisorEmail: null,
          academicYear: await getCurrentAcademicYear(),
          semester: await getCurrentSemester(),
        },
        { transaction }
      );

      const student = await Student.findOne(
        {
          where: { userId },
        },
        { transaction }
      );

      if (student) {
        const updateData = {
          internshipStatus: "pending_approval",
          isEnrolledInternship: true,
        };

        const studentPhoneNumber = phoneNumber || studentData?.[0]?.phoneNumber;
        if (studentPhoneNumber && studentPhoneNumber.trim() !== '') {
          updateData.phoneNumber = studentPhoneNumber.trim();
        }

        const studentClassroom = classroom || studentData?.[0]?.classroom;
        if (studentClassroom && studentClassroom.trim() !== '') {
          updateData.classroom = studentClassroom.trim();
        }

        await student.update(updateData, { transaction });
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
        internshipPosition,
        contactPersonName,
        contactPersonPosition,
        transcriptFilename: fileData.filename,
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
          as: 'internshipDocument',
          required: true,
        },
        {
          model: User,
          as: 'owner',
          attributes: ["firstName", "lastName", "userId"],
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ["studentCode", "totalCredits", "studentId"],
            },
          ],
        },
      ],
    });

    if (!document) {
      throw new Error("ไม่พบข้อมูลแบบฟอร์ม คพ.05");
    }

    const allowedRoles = ["admin", "teacher", "head", "staff"];
    if (document.userId !== userId && !allowedRoles.includes(userRole)) {
      throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
    }

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
      position: internshipDoc?.internshipPosition,
      contactPersonName: internshipDoc?.contactPersonName,
      contactPersonPosition: internshipDoc?.contactPersonPosition,
      startDate: internshipDoc?.startDate,
      endDate: internshipDoc?.endDate,
      status: document.status,
      createdAt: document.created_at,
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

      if (document.status !== "approved") {
        throw new Error(
          `ไม่สามารถกรอกข้อมูลได้ เนื่องจากคำร้องขอฝึกงานยังไม่ได้รับการอนุมัติ (สถานะปัจจุบัน: ${document.status})`
        );
      }

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
}

module.exports = new InternshipDocumentService();
