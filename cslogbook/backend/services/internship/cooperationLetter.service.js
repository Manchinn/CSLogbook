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
const DEPARTMENT_INFO = require("../../config/departmentInfo");

// Font paths (TH Sarabun New — ฟอนต์ราชการ ตรงกับ referralLetter.service.js)
const FONT_REGULAR = path.join(__dirname, "../../fonts/THSarabunNew.ttf");
const FONT_BOLD = path.join(__dirname, "../../fonts/THSarabunNew-Bold.ttf");
const GARUDA_IMAGE = path.join(__dirname, "../../assets/garuda.png");

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

// ===== PDF Layout Helpers =====

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/** วันที่ไทยแบบราชการ ไม่มี "พ.ศ." เช่น "5 พฤศจิกายน 2568" */
function formatThaiDateGov(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

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

      const data = {
        docNumber: cs05Document.officialNumber || `${documentId}`,
        docDate: new Date(),
        student: {
          fullName: `${student.user.firstName} ${student.user.lastName}`,
          studentCode: student.studentCode,
          year: yearInfo?.error ? 3 : yearInfo.year,
          classroom: student.classroom || "",
        },
        company: internshipDoc.companyName,
        companyAddress: internshipDoc.companyAddress || "",
        contactName: internshipDoc.contactPersonName,
        contactPosition: internshipDoc.contactPersonPosition,
        internshipPosition: internshipDoc.internshipPosition,
        startDate: internshipDoc.startDate,
        endDate: internshipDoc.endDate,
      };

      // ===== 4. สร้าง PDF ด้วย pdfkit (layout ตรงกับ referralLetter.service.js) =====
      const PDFDocument = require("pdfkit");

      const pdf = new PDFDocument({
        size: "A4",
        margins: { top: 38, bottom: 40, left: 72, right: 55 },
        info: {
          Title: "หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน",
          Subject: `หนังสือขอความอนุเคราะห์ ${data.student.fullName}`,
          Author: DEPARTMENT_INFO.departmentName,
        },
      });

      const buffers = [];
      pdf.on("data", (chunk) => buffers.push(chunk));

      // Register fonts (TH Sarabun New — ฟอนต์ราชการ)
      pdf.registerFont("Thai", FONT_REGULAR);
      pdf.registerFont("Thai-Bold", FONT_BOLD);

      const ML = 72; // margin left
      const pageWidth = 595.28;
      const rightEdge = pageWidth - 55;
      const contentWidth = rightEdge - ML;
      const sz = 16;
      const lineH = 20;
      const indent = 55;

      // Helper: วาดข้อความ right-aligned
      const textRight = (text, y) => {
        pdf.text(text, ML, y, { width: contentWidth, align: "right" });
      };

      // Helper: วาดข้อความ center-aligned
      const textCenter = (text, y) => {
        pdf.text(text, ML, y, { width: contentWidth, align: "center" });
      };

      // ===== ตราครุฑ (centered, top) =====
      const garudaW = 53;
      const garudaRatio = 1024 / 1229;
      const garudaH = garudaW * garudaRatio;
      const garudaX = (pageWidth - garudaW) / 2;
      const garudaY = 38;
      pdf.image(GARUDA_IMAGE, garudaX, garudaY, { width: garudaW });

      // ===== เลขที่ + ที่อยู่ =====
      let y = garudaY + garudaH + 10;

      pdf.font("Thai").fontSize(sz);
      pdf.text(`ที่ อว 7105(05)/${data.docNumber}`, ML, y, {
        lineBreak: false,
      });

      // ที่อยู่ (right-aligned block)
      const addressLines = [
        DEPARTMENT_INFO.departmentName,
        DEPARTMENT_INFO.facultyName,
        DEPARTMENT_INFO.universityName,
        "1518 ถ.ประชาราษฎร์ 1 เขตบางซื่อ กทม.10800",
      ];
      let addrY = y;
      for (const line of addressLines) {
        textRight(line, addrY);
        addrY += lineH;
      }

      // วันที่ (right-aligned, ใต้ที่อยู่)
      y = addrY + 4;
      pdf.font("Thai").fontSize(sz);
      textRight(formatThaiDateGov(data.docDate), y);

      // ===== เรื่อง (bold) =====
      y += lineH + 2;
      pdf.font("Thai-Bold").fontSize(sz);
      pdf.text("เรื่อง", ML, y, { lineBreak: false });
      const subjectX = ML + pdf.widthOfString("เรื่อง") + 16;
      pdf.text("ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน", subjectX, y, { lineBreak: false });

      // ===== เรียน =====
      y += lineH + 4;
      pdf.font("Thai-Bold").fontSize(sz);
      pdf.text("เรียน", ML, y, { lineBreak: false });
      const labelX = ML + pdf.widthOfString("เรียน") + 16;
      pdf.font("Thai").fontSize(sz);
      const recipientText = `คุณ ${data.contactName || "ผู้จัดการฝ่ายบุคคล"} ตำแหน่ง ${data.contactPosition || ""}`.trim();
      pdf.text(recipientText, labelX, y, { lineBreak: false });

      y += lineH;
      pdf.text(data.companyAddress || data.company || "", labelX, y, {
        lineBreak: false,
      });

      // ===== สิ่งที่ส่งมาด้วย =====
      y += lineH;
      pdf.font("Thai-Bold").fontSize(sz);
      pdf.text("สิ่งที่ส่งมาด้วย", ML, y, { lineBreak: false });
      const attachX = ML + pdf.widthOfString("สิ่งที่ส่งมาด้วย") + 16;
      pdf.font("Thai").fontSize(sz);
      pdf.text("แบบฟอร์มตอบรับนักศึกษาฝึกงาน จำนวน 1 ฉบับ", attachX, y, { lineBreak: false });

      // ===== เนื้อหา =====
      y += lineH + 4;
      pdf.text(
        `ด้วย ${DEPARTMENT_INFO.departmentName} ${DEPARTMENT_INFO.facultyName} ${DEPARTMENT_INFO.universityName} ` +
          `ได้จัดให้มีการฝึกงานสำหรับนักศึกษาชั้นปีที่ ${data.student.year} ` +
          `เพื่อเพิ่มพูนประสบการณ์และทักษะวิชาชีพ ` +
          `จึงขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน ดังนี้`,
        ML + indent,
        y,
        { width: contentWidth - indent }
      );
      y = pdf.y;

      // ===== ข้อมูลนักศึกษา =====
      y += 4;
      pdf.text(`ชื่อ-สกุล: ${data.student.fullName}`, ML + indent + 40, y, { lineBreak: false });
      y += lineH;
      if (data.internshipPosition) {
        pdf.text(`ตำแหน่งที่ขอฝึกงาน: ${data.internshipPosition}`, ML + indent + 40, y, { lineBreak: false });
        y += lineH;
      }
      pdf.text(
        `ระยะเวลา: ${formatThaiDateGov(data.startDate)} ถึง ${formatThaiDateGov(data.endDate)}`,
        ML + indent + 40,
        y,
        { lineBreak: false }
      );
      y += lineH;

      // ===== ปิดท้าย =====
      y += 4;
      pdf.text(
        "จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้",
        ML + indent,
        y,
        { width: contentWidth - indent }
      );
      y = pdf.y;

      // ===== ลายเซ็น =====
      y += lineH * 1.5;
      textCenter("ขอแสดงความนับถือ", y);

      y += lineH * 2.5;
      pdf.font("Thai-Bold").fontSize(sz);
      textCenter(
        `(${DEPARTMENT_INFO.departmentHead.name})`,
        y
      );
      y += lineH;
      pdf.font("Thai").fontSize(sz);
      textCenter(DEPARTMENT_INFO.departmentHead.title, y);

      // ===== Footer =====
      let fy = 750;
      pdf.text(DEPARTMENT_INFO.departmentName, ML, fy, { lineBreak: false });
      fy += 18;
      pdf.text("เจ้าหน้าที่ภาควิชา: นายนที ปัญญาประสิทธิ์", ML, fy, {
        lineBreak: false,
      });
      fy += 18;
      pdf.text("อีเมล: natee.p@sci.kmutnb.ac.th", ML, fy, {
        lineBreak: false,
      });
      fy += 18;
      pdf.text("โทร. 02-555-2000 ต่อ 4602", ML, fy, { lineBreak: false });

      // ===== 5. Export =====
      pdf.end();

      const pdfBuffer = await new Promise((resolve) => {
        pdf.on("end", () => resolve(Buffer.concat(buffers)));
      });

      const fileName = `หนังสือขอความอนุเคราะห์-${sanitizeFilename(data.student.fullName)}-${documentId}.pdf`;

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
          studentName: data.student.fullName,
          companyName: data.company,
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
