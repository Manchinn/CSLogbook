// services/internship/certificate.service.js
const path = require("path");
const {
  Document,
  InternshipDocument,
  Student,
  User,
  InternshipLogbook,
  InternshipLogbookReflection,
  InternshipEvaluation,
  InternshipCertificateRequest,
} = require("../../models");
const { sequelize } = require("../../config/database");
const logger = require("../../utils/logger");
const DEPARTMENT_INFO = require("../../config/departmentInfo");
const { CS05_POST_APPROVED_STATUSES } = require("./cs05Statuses");

// Thai font paths — bundled in repo → ใช้งานได้ทั้ง dev และ Docker
// ใช้ THSarabunNew (TTF) เพราะ render Thai combining marks ถูกต้องกว่า Loma OTF กับ PDFKit
const FONT_REGULAR = path.join(__dirname, "../../fonts/THSarabunNew.ttf");
const FONT_BOLD = path.join(__dirname, "../../fonts/THSarabunNew-Bold.ttf");
const LOGO_WATERMARK = path.join(__dirname, "../../assets/cis-logo.png");

/**
 * Service สำหรับจัดการหนังสือรับรองการฝึกงาน
 */
class InternshipCertificateService {
  /**
   * ตรวจสอบสถานะหนังสือรับรอง
   */
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
          status: CS05_POST_APPROVED_STATUSES,
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

      // คำนวณทั้ง totalHours และ approvedHours
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

      // คำนวณสถานะ (ใช้ approvedHours แทน totalHours)
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

      // ดึงข้อมูลสถานประกอบการจากเอกสาร CS05
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
        approvedHours,
      };

      const result = {
        // สถานะโดยรวม
        status: certificateStatus,
        canRequestCertificate:
          canRequestCertificate && certificateStatus === "not_requested",

        // internshipId สำหรับ filter query อื่น (ป้องกันดึงข้อมูลผิดรอบ)
        internshipId: cs05Document.internshipDocument.internshipId,

        // ข้อมูลการตรวจสอบเงื่อนไข
        requirements: {
          totalHours: {
            current: totalHours,
            approved: approvedHours,
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

        // ข้อมูลสถานประกอบการและการฝึกงาน
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

      return result;
    } catch (error) {
      if (
        error.message.includes("ไม่พบข้อมูล") ||
        error.message.includes("ยังไม่มีข้อมูล")
      ) {
        logger.warn(`[getCertificateStatus] No data:`, error.message);
      } else {
        logger.error(`[getCertificateStatus] Error:`, error);
      }
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสำหรับสร้างหนังสือรับรอง
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

      // ดึงข้อมูล summary (ต้องใช้ internshipManagementService)
      const internshipManagementService = require('../internshipManagementService');
      const summaryData = await internshipManagementService.getInternshipSummary(userId);

      // ดึงข้อมูลนักศึกษา
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

      // ดึงข้อมูลคำขอหนังสือรับรอง (filter internshipId ป้องกันดึงผิดรอบ)
      const certificateRequest = await InternshipCertificateRequest.findOne({
        where: {
          studentId: student.studentId,
          internshipId: status.internshipId,
          status: "approved",
        },
        order: [["created_at", "DESC"]],
      });

      if (!certificateRequest) {
        throw new Error("ไม่พบคำขอหนังสือรับรองที่ได้รับการอนุมัติ");
      }

      // ดึงข้อมูลการประเมินจากผู้ควบคุมงาน (filter ด้วย internshipId เพื่อป้องกันดึงผิดรอบ)
      const evaluation = await InternshipEvaluation.findOne({
        where: {
          studentId: student.studentId,
          internshipId: certificateRequest.internshipId,
        },
        order: [["created_at", "DESC"]],
      });

      // รวมข้อมูลสำหรับหนังสือรับรอง
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

        // ข้อมูลนักศึกษา
        studentInfo: {
          ...summaryData.studentInfo,
          studentId: summaryData.studentInfo.studentId,
          studentCode: summaryData.studentInfo.studentId,
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

        // ข้อมูลผู้ลงนาม — หนังสือรับรองการฝึกงานใช้นักวิชาการศึกษา ไม่ใช่หัวหน้าภาค
        approvalInfo: {
          approvedBy: DEPARTMENT_INFO.officer.name,
          approverTitle: DEPARTMENT_INFO.officer.title,
          approvedDate: certificateRequest.processedAt,
          departmentName: DEPARTMENT_INFO.departmentName,
          facultyName: DEPARTMENT_INFO.facultyName,
          universityName: DEPARTMENT_INFO.universityName,
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
   * สร้าง PDF หนังสือรับรองการฝึกงาน — landscape A4
   * Layout: title → info table → body paragraph → checklist + signature → footer
   * Watermark: KMUTNB logo กลางหน้า โปร่ง 8%
   */
  async createCertificatePDF(certificateData) {
    const PDFDocument = require("pdfkit");
    const fs = require("fs");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
          info: {
            Title: "หนังสือรับรองการฝึกงาน",
            Subject: `หนังสือรับรองการฝึกงาน - ${certificateData.studentInfo.fullName}`,
            Author: DEPARTMENT_INFO.departmentName,
          },
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc.registerFont("Thai", FONT_REGULAR);
        doc.registerFont("Thai-Bold", FONT_BOLD);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const marginX = 60;
        const contentWidth = pageWidth - marginX * 2;

        // Watermark — CIS KMUTNB logo กลางหน้า โปร่ง
        if (fs.existsSync(LOGO_WATERMARK)) {
          const wmWidth = 340;
          const wmX = (pageWidth - wmWidth) / 2;
          const wmY = pageHeight / 2 - 130;
          doc.save();
          doc.opacity(0.1);
          doc.image(LOGO_WATERMARK, wmX, wmY, { width: wmWidth });
          doc.restore();
        }

        // Title — THSarabunNew มี x-height เล็ก ต้อง +4pt จากขนาดปกติ
        doc.font("Thai-Bold").fontSize(32).fillColor("#000");
        doc.text("หนังสือรับรองการฝึกงาน", marginX, 50, {
          width: contentWidth,
          align: "center",
        });

        // Info table — 2 rows
        const tableX = marginX + 20;
        const tableWidth = contentWidth - 40;
        const labelW = 130;
        const valueW1 = 270;
        const labelW2 = 130;
        const valueW2 = tableWidth - labelW - valueW1 - labelW2;
        const rowH = 40;
        let tableY = 120;

        // Row 1 — ชื่อ / รหัสนักศึกษา
        this._drawTableCell(doc, tableX, tableY, labelW, rowH, "ชื่อ – นามสกุล", {
          bold: true,
          bgLabel: true,
        });
        this._drawTableCell(
          doc,
          tableX + labelW,
          tableY,
          valueW1,
          rowH,
          certificateData.studentInfo.fullName,
          { bold: true, fontSize: 17 }
        );
        this._drawTableCell(
          doc,
          tableX + labelW + valueW1,
          tableY,
          labelW2,
          rowH,
          "รหัสนักศึกษา",
          { bold: true, bgLabel: true }
        );
        this._drawTableCell(
          doc,
          tableX + labelW + valueW1 + labelW2,
          tableY,
          valueW2,
          rowH,
          String(certificateData.studentInfo.studentId || ""),
          { bold: true, fontSize: 17 }
        );

        // Row 2 — สถานที่ฝึกงาน (colspan 3)
        tableY += rowH;
        this._drawTableCell(doc, tableX, tableY, labelW, rowH, "สถานที่ฝึกงาน", {
          bold: true,
          bgLabel: true,
        });
        this._drawTableCell(
          doc,
          tableX + labelW,
          tableY,
          tableWidth - labelW,
          rowH,
          certificateData.internshipInfo.companyName || "-",
          { bold: true, fontSize: 17 }
        );

        // Body paragraph
        const bodyY = tableY + rowH + 30;
        doc.font("Thai").fontSize(18).fillColor("#000");
        doc.text(
          "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอรับรองว่า นักศึกษาได้ผ่านการฝึกงานภาคสนาม" +
            "ตามหลักสูตรที่กำหนด (ไม่น้อยกว่า 240 ชั่วโมง) และส่งเอกสารหลังเสร็จสิ้นการฝึกงานเป็นที่เรียบร้อยแล้ว",
          marginX + 20,
          bodyY,
          {
            width: contentWidth - 40,
            align: "left",
            lineGap: 4,
          }
        );

        // Two-column section: checklist (left) + signature (right)
        const sectionY = bodyY + 75;

        // Checklist box (left)
        const cbX = marginX + 30;
        const cbY = sectionY;
        const cbW = 300;
        const cbH = 130;
        doc.lineWidth(1).rect(cbX, cbY, cbW, cbH).stroke();

        doc.font("Thai-Bold").fontSize(17);
        doc.text("ตรวจสอบเอกสาร", cbX + 15, cbY + 12);

        const items = [
          "ใบลงเวลาของนักศึกษาฝึกงาน",
          "แบบประเมินผลการฝึกงาน",
          "สมุดบันทึกการปฏิบัติงาน",
        ];
        doc.font("Thai").fontSize(16);
        items.forEach((item, idx) => {
          const itemY = cbY + 44 + idx * 26;
          this._drawCheckbox(doc, cbX + 20, itemY, true);
          doc.text(item, cbX + 42, itemY - 3);
        });

        // Signature block (right)
        const sigX = pageWidth - marginX - 280;
        const sigY = sectionY + 40;
        doc.font("Thai").fontSize(17);
        doc.text("ลงชื่อ................................................", sigX, sigY, {
          width: 280,
          align: "left",
        });
        doc.text(
          `(${certificateData.approvalInfo?.approvedBy || DEPARTMENT_INFO.officer.name})`,
          sigX,
          sigY + 30,
          { width: 280, align: "center" }
        );
        doc.text(
          certificateData.approvalInfo?.approverTitle || DEPARTMENT_INFO.officer.title,
          sigX,
          sigY + 56,
          { width: 280, align: "center" }
        );

        // Footer instruction — ติดขอบล่าง (ระวัง bottom margin 40 → ต้องให้ข้อความจบก่อน pageHeight-40)
        doc.font("Thai-Bold").fontSize(14);
        doc.text(
          "**นักศึกษาโปรดนำเอกสารฉบับนี้มายื่นเพื่อประกอบการพิจารณาขออนุมัติจบการศึกษาด้วย**",
          marginX,
          pageHeight - 70,
          { width: contentWidth, align: "left", lineBreak: false }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * วาด cell ของตาราง — border + text กลาง
   */
  _drawTableCell(doc, x, y, w, h, text, opts = {}) {
    const { bold = false, fontSize = 16, bgLabel = false } = opts;

    if (bgLabel) {
      doc.save();
      doc.rect(x, y, w, h).fillAndStroke("#f5f5f5", "#000");
      doc.restore();
    } else {
      doc.rect(x, y, w, h).stroke();
    }

    doc.fillColor("#000");
    doc.font(bold ? "Thai-Bold" : "Thai").fontSize(fontSize);
    const textHeight = doc.heightOfString(text || "", { width: w - 10 });
    const textY = y + (h - textHeight) / 2;
    doc.text(text || "", x + 5, textY, {
      width: w - 10,
      align: "center",
    });
  }

  /**
   * วาด checkbox แบบ manual (สี่เหลี่ยม + เครื่องหมาย ✓)
   * ใช้ path แทน Unicode ☑ เพราะ Loma font อาจ render ไม่ได้
   */
  _drawCheckbox(doc, x, y, checked = false) {
    const size = 14;
    doc.lineWidth(1.2).rect(x, y, size, size).stroke();
    if (checked) {
      doc
        .moveTo(x + 3, y + size / 2)
        .lineTo(x + size / 2 - 1, y + size - 3)
        .lineTo(x + size - 2, y + 3)
        .lineWidth(1.8)
        .stroke();
    }
  }

  /**
   * Preview หนังสือรับรอง PDF
   */
  async previewCertificatePDF(userId) {
    try {
      logger.debug(`[previewCertificatePDF] Starting for userId: ${userId}`);

      // ตรวจสอบสถานะหนังสือรับรอง
      const certificateStatus = await this.getCertificateStatus(userId);

      if (certificateStatus.status !== "ready") {
        const error = new Error(
          "หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่ภาควิชา"
        );
        error.statusCode = 409;
        throw error;
      }

      // ดึงข้อมูลสำหรับสร้าง PDF
      const certificateData = await this.getCertificateData(userId);

      // สร้าง PDF
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
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }

  /**
   * Download หนังสือรับรอง PDF
   */
  async downloadCertificatePDF(userId) {
    try {
      logger.debug(`[downloadCertificatePDF] Starting for userId: ${userId}`);

      // ตรวจสอบสถานะหนังสือรับรอง
      const certificateStatus = await this.getCertificateStatus(userId);

      if (certificateStatus.status !== "ready") {
        const error = new Error(
          "หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่ภาควิชา"
        );
        error.statusCode = 409;
        throw error;
      }

      // ดึงข้อมูลสำหรับสร้าง PDF
      const certificateData = await this.getCertificateData(userId);

      // สร้าง PDF
      const pdfBuffer = await this.createCertificatePDF(certificateData);

      // บันทึกการดาวน์โหลด
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
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }

  /**
   * บันทึกการดาวน์โหลดหนังสือรับรอง
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

      // หา internshipId จาก CS05 ล่าสุด (ป้องกัน update ผิดรอบ)
      const cs05Document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: CS05_POST_APPROVED_STATUSES,
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!cs05Document) {
        throw new Error("ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ");
      }

      const internshipId = cs05Document.internshipDocument.internshipId;

      // อัปเดตสถานะการดาวน์โหลด (filter internshipId ป้องกัน update ผิดรอบ)
      const updateResult = await InternshipCertificateRequest.update(
        {
          downloadedAt: new Date(),
          downloadCount: sequelize.literal("COALESCE(download_count, 0) + 1"),
          lastDownloadedAt: new Date(),
        },
        {
          where: {
            studentId: student.studentId,
            internshipId,
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

  /**
   * ส่งคำขอหนังสือรับรอง
   */
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

      // ตรวจสอบว่าหนังสือตอบรับได้รับการอนุมัติแล้ว
      const acceptanceLetter = await Document.findOne({
        where: {
          userId,
          documentName: "ACCEPTANCE_LETTER",
          documentType: "INTERNSHIP",
          status: "approved",
        },
      });

      if (!acceptanceLetter) {
        throw new Error("ยังไม่มีหนังสือตอบรับที่ได้รับการอนุมัติ กรุณาตรวจสอบสถานะหนังสือตอบรับก่อนขอหนังสือรับรอง");
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
          status: CS05_POST_APPROVED_STATUSES,
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

      // สร้างคำขอหนังสือรับรอง
      const certificateRequest = await InternshipCertificateRequest.create(
        {
          studentId: student.studentId,
          internshipId: cs05Document.internshipDocument.internshipId,
          documentId: cs05Document.documentId,
          requestDate: new Date(requestData.requestDate),
          status: "pending",
          totalHours:
            requestData.approvedHours ||
            currentStatus.requirements.totalHours.approved,
          evaluationStatus: requestData.evaluationStatus || "completed",
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

  /**
   * สร้างหมายเลขหนังสือรับรอง
   */
  generateCertificateNumber(studentCode) {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const studentYear = studentCode.substring(0, 2);

    return `อว 7105(16)/${studentYear}${month}${year.toString().slice(-2)}`;
  }

}

module.exports = new InternshipCertificateService();
