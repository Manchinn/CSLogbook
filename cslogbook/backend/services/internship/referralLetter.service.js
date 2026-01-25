// services/internship/referralLetter.service.js
const {
  Document,
  InternshipDocument,
  Student,
  User,
  Academic,
} = require("../../models");
const { sequelize } = require("../../config/database");
const logger = require("../../utils/logger");

/**
 * Service สำหรับจัดการหนังสือส่งตัวนักศึกษา
 */
class InternshipReferralLetterService {
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
}

module.exports = new InternshipReferralLetterService();
