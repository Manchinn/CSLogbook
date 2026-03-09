// services/internship/cooperationLetter.service.js
// หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
const path = require("path");
const {
  Document,
  InternshipDocument,
  Student,
  User,
} = require("../../models");
const logger = require("../../utils/logger");
const { sanitizeFilename } = require("../../utils/sanitizeFilename");
const { calculateStudentYear } = require("../../utils/studentUtils");
const { formatThaiDate } = require("../../utils/dateUtils");
const DEPARTMENT_INFO = require("../../config/departmentInfo");

// Thai font paths
const FONT_REGULAR = path.join(__dirname, "../../fonts/Loma.otf");
const FONT_BOLD = path.join(__dirname, "../../fonts/Loma-Bold.otf");

/**
 * Status ของ CS05 ที่ถือว่า "ได้รับการอนุมัติแล้ว"
 * ต้องตรงกับ STATUSES_WITH_DOWNLOADS ใน frontend/InternshipFlowContent.tsx
 */
const CS05_POST_APPROVAL_STATUSES = new Set([
  "approved",
  "acceptance_pending",
  "acceptance_approved",
  "referral_letter_pending",
  "referral_letter_ready",
  "active",
  "completed",
  "supervisor_approved",
  "supervisor_evaluated",
]);

/**
 * Service สำหรับสร้างหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
 */
class InternshipCooperationLetterService {
  /**
   * สร้าง PDF หนังสือขอความอนุเคราะห์
   * ต่างจากหนังสือส่งตัว: ไม่ต้องเช็ค acceptance letter และ supervisor info
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ข้อมูล PDF buffer และ metadata
   */
  async generateCooperationLetterPDF(userId, documentId) {
    try {
      logger.debug("[DEBUG] generateCooperationLetterPDF:", {
        userId,
        documentId,
      });

      // 1. ตรวจสอบเอกสาร CS05 และสิทธิ์
      const cs05Document = await Document.findOne({
        where: {
          documentId: parseInt(documentId),
          userId: userId,
          documentName: "CS05",
          status: [...CS05_POST_APPROVAL_STATUSES],
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
          "ไม่พบเอกสาร คพ.05 ที่ได้รับการอนุมัติ หรือไม่มีสิทธิ์เข้าถึง"
        );
      }

      // 2. ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId: userId },
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

      // 3. เตรียมข้อมูลสำหรับ PDF
      const internshipDoc = cs05Document.internshipDocument;
      const yearInfo = calculateStudentYear(student.studentCode);
      const buddhistYear = new Date().getFullYear() + 543;

      const pdfData = {
        // ข้อมูลเอกสาร
        documentNumber: `CS05/${buddhistYear}/${documentId}`,
        documentDate: new Date(),

        // ข้อมูลนักศึกษา
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        studentCode: student.studentCode,
        yearLevel: yearInfo?.error ? 3 : yearInfo.year,
        classroom: student.classroom || "",

        // ข้อมูลบริษัท
        companyName: internshipDoc.companyName,
        companyAddress: internshipDoc.companyAddress || "",
        contactPersonName: internshipDoc.contactPersonName,
        contactPersonPosition: internshipDoc.contactPersonPosition,
        internshipPosition: internshipDoc.internshipPosition,

        // ข้อมูลระยะเวลา
        startDate: internshipDoc.startDate,
        endDate: internshipDoc.endDate,
      };

      // 4. สร้าง PDF
      const PDFDocument = require("pdfkit");

      const pdf = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: "หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน",
          Subject: `หนังสือขอความอนุเคราะห์ ${pdfData.fullName}`,
          Author: DEPARTMENT_INFO.departmentName,
        },
      });

      // สร้าง buffer สำหรับเก็บ PDF
      const buffers = [];
      pdf.on("data", (chunk) => {
        buffers.push(chunk);
      });

      // 5. ลงทะเบียน Thai font
      pdf.registerFont("Thai", FONT_REGULAR);
      pdf.registerFont("Thai-Bold", FONT_BOLD);
      pdf.font("Thai");

      // === หัวข้อเอกสาร ===
      pdf
        .font("Thai-Bold")
        .fontSize(18)
        .text("หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน", {
          align: "center",
        });

      pdf.moveDown();

      // === เลขที่เอกสารและวันที่ ===
      pdf.font("Thai").fontSize(12);
      pdf.text(`เลขที่: ${pdfData.documentNumber}`, { align: "left" });
      pdf.text(`วันที่: ${formatThaiDate(pdfData.documentDate)}`, {
        align: "right",
      });

      pdf.moveDown();

      // === เรียน ===
      pdf.text(
        `เรียน ${pdfData.contactPersonName || "ผู้จัดการ"}`
      );
      pdf.text(`       ${pdfData.companyName}`);
      if (pdfData.companyAddress) {
        pdf.text(`       ${pdfData.companyAddress}`);
      }

      pdf.moveDown();

      // === สิ่งที่ส่งมาด้วย ===
      pdf.text(
        "สิ่งที่ส่งมาด้วย  แบบฟอร์มตอบรับนักศึกษาฝึกงาน จำนวน 1 ฉบับ"
      );

      pdf.moveDown();

      // === เนื้อหา ===
      pdf.text(
        `       ด้วย ${DEPARTMENT_INFO.departmentName} ${DEPARTMENT_INFO.facultyName} ${DEPARTMENT_INFO.universityName} ` +
          `ได้จัดให้มีการฝึกงานสำหรับนักศึกษาชั้นปีที่ ${pdfData.yearLevel} ` +
          `เพื่อเพิ่มพูนประสบการณ์และทักษะวิชาชีพ ` +
          `จึงขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน ดังนี้`,
        { align: "justify" }
      );

      pdf.moveDown();

      // === ข้อมูลนักศึกษา ===
      pdf.text(`       ชื่อ-สกุล: ${pdfData.fullName}`);
      pdf.text(`       รหัสนักศึกษา: ${pdfData.studentCode}`);
      pdf.text(
        `       ชั้นปีที่: ${pdfData.yearLevel}` +
          (pdfData.classroom ? `  ห้อง: ${pdfData.classroom}` : "")
      );
      if (pdfData.internshipPosition) {
        pdf.text(
          `       ตำแหน่งที่ขอฝึกงาน: ${pdfData.internshipPosition}`
        );
      }
      pdf.text(
        `       ระยะเวลา: ${formatThaiDate(pdfData.startDate)} ถึง ${formatThaiDate(pdfData.endDate)}`
      );

      pdf.moveDown();

      // === ปิดท้าย ===
      pdf.text(
        "       จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้",
        { align: "justify" }
      );

      pdf.moveDown(2);

      // === ลายเซ็น ===
      pdf.text("ขอแสดงความนับถือ", { align: "center" });
      pdf.moveDown(3);
      pdf
        .font("Thai-Bold")
        .text(`(${DEPARTMENT_INFO.departmentHead.name})`, {
          align: "center",
        });
      pdf
        .font("Thai")
        .text(DEPARTMENT_INFO.departmentHead.title, { align: "center" });

      // ปิด PDF
      pdf.end();

      // 6. รอให้ PDF เสร็จสิ้น
      const pdfBuffer = await new Promise((resolve) => {
        pdf.on("end", () => resolve(Buffer.concat(buffers)));
      });

      const fileName = `หนังสือขอความอนุเคราะห์-${sanitizeFilename(pdfData.fullName)}-${documentId}.pdf`;

      logger.debug("[DEBUG] Cooperation letter PDF generated:", {
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
          studentName: pdfData.fullName,
          companyName: pdfData.companyName,
          generateDate: new Date(),
        },
      };
    } catch (error) {
      logger.error("Generate Cooperation Letter PDF Service Error:", error);
      throw error;
    }
  }
}

module.exports = new InternshipCooperationLetterService();
