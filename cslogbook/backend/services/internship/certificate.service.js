// services/internship/certificate.service.js
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
   * สร้าง PDF หนังสือรับรอง
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

        // เขียนเนื้อหาหนังสือรับรอง
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

  /**
   * จัดรูปแบบวันที่ไทย
   */
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
}

module.exports = new InternshipCertificateService();
