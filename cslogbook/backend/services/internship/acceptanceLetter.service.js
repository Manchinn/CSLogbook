// services/internship/acceptanceLetter.service.js
const {
  Document,
  InternshipDocument,
  Student,
} = require("../../models");
const { sequelize } = require("../../config/database");
const logger = require("../../utils/logger");

/**
 * Service สำหรับจัดการหนังสือตอบรับการฝึกงาน
 */
class InternshipAcceptanceLetterService {
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
      const workflowService = require('../workflowService');
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

      // ✅ ตรวจสอบสิทธิ์ในการอัปโหลด (CS05 ต้องได้รับการอนุมัติก่อน และไม่ใช่ cancelled)
      if (cs05Document.status === "approved") {
        canUpload = true;
      } else if (cs05Document.status === "cancelled") {
        // ถ้า CS05 เป็น cancelled แสดงว่าเป็นกระบวนการใหม่ที่ยังไม่ได้รับการอนุมัติ
        statusMessage = "เอกสาร คำร้องขอฝึกงาน ถูกยกเลิก กรุณายื่น คำร้องขอฝึกงาน ใหม่ก่อนอัปโหลดหนังสือตอบรับ";
        canUpload = false;
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
            break;
          case "rejected":
            statusMessage = "หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่";
            canUpload = true; // อนุญาตให้อัปโหลดใหม่
            break;
          case "cancelled":
            // ✅ หนังสือตอบรับถูกยกเลิก - ถือว่าเป็นกระบวนการใหม่ อนุญาตให้อัปโหลดใหม่ได้
            acceptanceStatus = "not_uploaded"; // เปลี่ยนสถานะเป็น not_uploaded เพื่อให้ UI แสดงว่ายังไม่มีการอัปโหลด
            statusMessage = "หนังสือตอบรับเดิมถูกยกเลิก กรุณาอัปโหลดหนังสือตอบรับใหม่";
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

      // 2. ลบไฟล์จากระบบ (ถ้ามี)
      if (acceptanceDocument.filePath) {
        const fs = require("fs").promises;

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
        cs05Status: cs05Document?.status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceStatus, // ✅ สถานะจริง
        canUpload,
        requiresApproval,
        statusMessage,
      });

      return {
        cs05DocumentId: cs05Document?.documentId,
        cs05Status: cs05Document?.status,
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
}

module.exports = new InternshipAcceptanceLetterService();
