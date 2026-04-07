// services/internship/referralLetter.service.js
const path = require("path");
const {
  Document,
  InternshipDocument,
  Student,
  User,
} = require("../../models");
const { sequelize } = require("../../config/database");
const logger = require("../../utils/logger");
const { sanitizeFilename } = require("../../utils/sanitizeFilename");
const { calculateStudentYear } = require("../../utils/studentUtils");
const DEPARTMENT_INFO = require("../../config/departmentInfo");

// Font paths (TH Sarabun New — font ราชการ)
const FONT_REGULAR = path.join(__dirname, "../../fonts/THSarabunNew.ttf");
const FONT_BOLD = path.join(__dirname, "../../fonts/THSarabunNew-Bold.ttf");
const GARUDA_IMAGE = path.join(__dirname, "../../assets/garuda.png");

/**
 * Status ของ CS05 ที่ถือว่า "ได้รับการอนุมัติแล้ว" (ผ่าน approved ไปแล้ว)
 */
const CS05_POST_APPROVAL_STATUSES = new Set([
  "approved",
  "acceptance_approved",
  "supervisor_evaluated",
  "referral_ready",
  "referral_downloaded",
  "completed",
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
 * Service สำหรับจัดการหนังสือส่งตัวนักศึกษา
 */
class InternshipReferralLetterService {
  /**
   * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา
   */
  async getReferralLetterStatus(userId, cs05DocumentId) {
    try {
      logger.debug("[DEBUG] getReferralLetterStatus:", {
        userId,
        cs05DocumentId,
      });

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

      const acceptanceLetter = await Document.findOne({
        where: {
          userId: userId,
          documentType: "INTERNSHIP",
          documentName: "ACCEPTANCE_LETTER",
          category: "acceptance",
          status: "approved",
        },
      });

      let status = cs05Document.status;
      let isReady = false;
      let isDownloaded = false;
      const missingRequirements = [];

      const hasSupervisorInfo = !!(
        cs05Document.internshipDocument?.supervisorName &&
        cs05Document.internshipDocument?.supervisorEmail
      );

      if (
        CS05_POST_APPROVAL_STATUSES.has(cs05Document.status) &&
        acceptanceLetter &&
        acceptanceLetter.status === "approved"
      ) {
        if (hasSupervisorInfo) {
          isReady = true;
        } else {
          missingRequirements.push("ข้อมูลผู้ควบคุมงานไม่ครบถ้วน");
        }
      }

      if (
        acceptanceLetter?.downloadStatus === "downloaded" ||
        acceptanceLetter?.downloadedAt
      ) {
        isDownloaded = true;
      }

      logger.debug("[DEBUG] Status calculation result:", {
        cs05Status: status,
        hasAcceptanceLetter: !!acceptanceLetter,
        isReady,
        isDownloaded,
      });

      return {
        hasReferralLetter: isReady || isDownloaded,
        status: status,
        cs05Status: status,
        hasAcceptanceLetter: !!acceptanceLetter,
        acceptanceLetterStatus: acceptanceLetter?.status,
        hasSupervisorInfo,
        missingRequirements,
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
        downloadedAt: acceptanceLetter?.downloadedAt,
        downloadCount: acceptanceLetter?.downloadCount || 0,
        mappingInfo: {
          backendStatus: status,
          shouldMapTo: isDownloaded
            ? "downloaded"
            : isReady
            ? "ready"
            : "not_ready",
          requiresSupervisorInfo: true,
          supervisorInfoOptional: false,
          cs05AlwaysApproved: true,
        },
      };
    } catch (error) {
      logger.error("Get Referral Letter Status Service Error:", error);
      throw error;
    }
  }

  /**
   * สร้าง PDF หนังสือส่งตัวนักศึกษา
   * pdfkit + TH Sarabun New + ตราครุฑ + layout ราชการ
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
        ],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // 5. เตรียมข้อมูล
      const yearInfo = calculateStudentYear(student.studentCode);
      const data = {
        docNumber: acceptanceLetter.officialNumber || `${documentId}`,
        docDate: new Date(),
        student: {
          fullName: `${student.user.firstName} ${student.user.lastName}`,
        },
        company: internshipDoc.companyName,
        companyAddress: internshipDoc.companyAddress,
        contactName: internshipDoc.contactPersonName,
        contactPosition: internshipDoc.contactPersonPosition,
        startDate: internshipDoc.startDate,
        endDate: internshipDoc.endDate,
      };

      // ===== 6. สร้าง PDF ด้วย pdfkit =====
      const PDFDocument = require("pdfkit");

      const pdf = new PDFDocument({
        size: "A4",
        margins: { top: 38, bottom: 40, left: 72, right: 55 },
        info: {
          Title: "หนังสือส่งตัวนักศึกษาฝึกงาน",
          Subject: `หนังสือส่งตัวนักศึกษา ${data.student.fullName}`,
          Author: DEPARTMENT_INFO.departmentName,
        },
      });

      const buffers = [];
      pdf.on("data", (chunk) => buffers.push(chunk));

      // Register fonts
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
      const garudaRatio = 1024 / 1229; // จาก garuda.png aspect ratio
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
      pdf.text("ส่งตัวนักศึกษาเข้าฝึกงาน", subjectX, y, { lineBreak: false });

      // ===== เรียน =====
      y += lineH + 4;
      pdf.font("Thai-Bold").fontSize(sz);
      pdf.text("เรียน", ML, y, { lineBreak: false });
      const labelX = ML + pdf.widthOfString("เรียน") + 16;
      pdf.font("Thai").fontSize(sz);
      const recipientText = `คุณ ${data.contactName || "ผู้จัดการฝ่ายบุคคล"} ตำแหน่ง ${data.contactPosition || ""}`.trim();
      pdf.text(recipientText, labelX, y, { lineBreak: false });

      y += lineH;
      pdf.text(data.company || "", labelX, y, { lineBreak: false });

      // ===== เนื้อหา =====
      y += lineH;
      pdf.text(
        `ตามที่${DEPARTMENT_INFO.departmentName} ขอความอนุเคราะห์ให้นักศึกษาของภาควิชาฯ เข้าฝึกงาน โดยเริ่มฝึกงาน ตั้งแต่วันที่ ${formatThaiDateGov(data.startDate)} - ${formatThaiDateGov(data.endDate)} (จนกว่าจะครบ 240 ชั่วโมง) บัดนี้ ภาควิชาฯ ขอส่งนักศึกษาเพื่อเข้าฝึกงานในหน่วยงานของท่าน จำนวน 1 คน ดังนี้`,
        ML + indent,
        y,
        { width: contentWidth - indent }
      );
      y = pdf.y;

      // รายชื่อนักศึกษา
      y += 4;
      pdf.text(`1. ${data.student.fullName}`, ML + indent + 40, y, {
        lineBreak: false,
      });
      y += lineH;

      // จึงเรียนมา + ขอให้ตรวจสอบ
      pdf.text(
        "จึงเรียนมาเพื่อโปรดรับนักศึกษาเข้าฝึกงานที่ได้เรียนไว้แล้ว อนึ่งภาควิชาฯ ใคร่ขอให้ท่านช่วยตรวจสอบการฝึกงานของนักศึกษา โดย",
        ML + indent,
        y,
        { width: contentWidth - indent }
      );
      y = pdf.y;

      // Checklist 3 ข้อ
      pdf.text("1. ให้นักศึกษาลงวันที่และเวลาการฝึกงาน", ML + indent + 40, y, { lineBreak: false });
      y += lineH;
      pdf.text("2. ให้นักศึกษากรอกข้อความการปฏิบัติงานของนักศึกษาลงในใบรายการฝึกงาน", ML + indent + 40, y, { width: contentWidth - indent - 40 });
      y = pdf.y;
      pdf.text("3. แบบรายงานผลฝึกงานของนักศึกษาโปรดส่งคืนให้กับนักศึกษาเพื่อนำส่งให้ภาควิชาฯ ต่อไป", ML + indent + 40, y, { width: contentWidth - indent - 40 });
      y = pdf.y;

      // ขอขอบคุณ
      y += 4;
      pdf.text("ขอขอบคุณมา ณ โอกาสนี้", ML + indent, y, { lineBreak: false });
      y += lineH;

      // หมายเหตุ
      pdf.text("(โดยแบบฟอร์มทั้ง 3 ข้อ นักศึกษาจะนำไปให้หน่วยงานของท่านด้วยตนเอง)", ML + indent, y, { width: contentWidth - indent });
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
      y += lineH;
      textCenter(`${DEPARTMENT_INFO.facultyName} ${DEPARTMENT_INFO.universityName}`, y);

      // ===== Footer =====
      let fy = 750;
      pdf.font("Thai").fontSize(sz);
      pdf.text(`${DEPARTMENT_INFO.departmentName} ${DEPARTMENT_INFO.facultyName}`, ML, fy, { lineBreak: false });
      fy += 18;
      pdf.text(DEPARTMENT_INFO.universityName, ML, fy, { lineBreak: false });
      fy += 18;
      pdf.text("โทร. 02-555-2000 ต่อ 4601", ML, fy, { lineBreak: false });

      // ===== 7. Export =====
      pdf.end();

      const pdfBuffer = await new Promise((resolve) => {
        pdf.on("end", () => resolve(Buffer.concat(buffers)));
      });

      const fileName = `หนังสือส่งตัว-${sanitizeFilename(data.student.fullName)}-${documentId}.pdf`;

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
          studentName: data.student.fullName,
          companyName: data.company,
          generateDate: new Date(),
        },
      };
    } catch (error) {
      logger.error("Generate Referral Letter PDF Service Error:", error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว
   */
  async markReferralLetterDownloaded(userId, cs05DocumentId) {
    const transaction = await sequelize.transaction();

    try {
      logger.debug("[DEBUG] Service markReferralLetterDownloaded:", {
        userId,
        cs05DocumentId,
      });

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

      if (!CS05_POST_APPROVAL_STATUSES.has(cs05Document.status)) {
        throw new Error(
          "เอกสาร CS05 ต้องได้รับการอนุมัติก่อนจึงจะดาวน์โหลดหนังสือส่งตัวได้"
        );
      }

      const downloadTimestamp = new Date();
      const currentDownloadCount = acceptanceLetter.downloadCount || 0;

      await acceptanceLetter.update(
        {
          status: "approved",
          downloadedAt: downloadTimestamp,
          downloadCount: currentDownloadCount + 1,
          downloadStatus: "downloaded",
          updated_at: downloadTimestamp,
        },
        { transaction }
      );

      await acceptanceLetter.reload({ transaction });
      await transaction.commit();

      return {
        documentId: cs05Document.documentId,
        cs05DocumentId: cs05Document.documentId,
        cs05Status: cs05Document.status,
        acceptanceDocumentId: acceptanceLetter.documentId,
        acceptanceStatus: acceptanceLetter.status,
        status: "referral_downloaded",
        downloadDate: downloadTimestamp,
        downloadCount: currentDownloadCount + 1,
        completedProcess: true,
        referralLetterDownloaded: true,
        shouldUpdateCS05Status: false,
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
