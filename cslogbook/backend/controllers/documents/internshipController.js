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
} = require("../../models");
const { Sequelize, Op } = require("sequelize");
const { sequelize } = require("../../config/database");
const {
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear,
} = require("../../utils/studentUtils");
const emailService = require("../../utils/mailer.js"); // Using mailer.js directly for email functions
const crypto = require("crypto");
const internshipManagementService = require("../../services/internshipManagementService");
const internshipLogbookService = require("../../services/internshipLogbookService");

// ============= Controller สำหรับข้อมูลนักศึกษา =============
/**
 * ดึงข้อมูลนักศึกษาและตรวจสอบสิทธิ์การฝึกงาน
 */
exports.getStudentInfo = async (req, res) => {
  try {
    const result = await internshipManagementService.getStudentInfo(
      req.user.userId
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching student info:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา",
    });
  }
};

// ============= Controller สำหรับจัดการ คพ.05 =============
/**
 * ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา
 */
exports.getCurrentCS05 = async (req, res) => {
  try {
    const result = await internshipManagementService.getCurrentCS05(
      req.user.userId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Current CS05 Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล CS05",
    });
  }
};

/**
 * บันทึกคำร้องขอฝึกงาน (คพ.05)
 */
exports.submitCS05 = async (req, res) => {
  try {
    const {
      companyName,
      companyAddress,
      startDate,
      endDate,
      internshipPosition, // เพิ่มฟิลด์ใหม่
      contactPersonName, // เพิ่มฟิลด์ใหม่
      contactPersonPosition, // เพิ่มฟิลด์ใหม่
    } = req.body;

    const result = await internshipManagementService.submitCS05(
      req.user.userId,
      {
        companyName,
        companyAddress,
        startDate,
        endDate,
        internshipPosition, // เพิ่มฟิลด์ใหม่
        contactPersonName, // เพิ่มฟิลด์ใหม่
        contactPersonPosition, // เพิ่มฟิลด์ใหม่
      }
    );

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Submit CS05 Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    });
  }
};

/**
 * บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
 */
exports.submitCS05WithTranscript = async (req, res) => {
  try {
    // แก้ไขลำดับพารามิเตอร์ส่ง `req.file` ก่อน `req.body`
    const result = await internshipManagementService.submitCS05WithTranscript(
      req.user.userId,
      req.file, // ส่ง fileData เป็น req.file
      req.body.formData ? JSON.parse(req.body.formData) : req.body // ส่ง formData
    );

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in submitCS05WithTranscript:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    });
  }
};

/**
 * ดึงข้อมูล คพ.05 ตาม ID
 */
exports.getCS05ById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await internshipManagementService.getCS05ById(
      id,
      req.user.userId,
      req.user.role
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get CS05 Error:", error);
    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ไม่มีสิทธิ์")
      ? 403
      : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
};

/**
 * บันทึกข้อมูลผู้ควบคุมงาน
 */
exports.submitCompanyInfo = async (req, res) => {
  try {
    const {
      documentId,
      supervisorName,
      supervisorPosition,
      supervisorPhone,
      supervisorEmail,
    } = req.body;
    const userId = req.user.userId;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    if (!supervisorName || !supervisorPhone || !supervisorEmail) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลผู้ควบคุมงานให้ครบถ้วน",
      });
    }

    // แก้ไข: ส่งพารามิเตอร์ในลำดับที่ถูกต้อง
    const result = await internshipManagementService.submitCompanyInfo(
      documentId, // พารามิเตอร์แรก
      userId, // พารามิเตอร์ที่สอง
      {
        // พารามิเตอร์ที่สาม
        supervisorName,
        supervisorPosition,
        supervisorPhone,
        supervisorEmail,
      }
    );

    return res.json({
      success: true,
      message: "บันทึกข้อมูลสถานประกอบการเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Submit Company Info Error:", error);
    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    });
  }
};

/**
 * ดึงข้อมูลผู้ควบคุมงาน
 */
exports.getCompanyInfo = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await internshipManagementService.getCompanyInfo(
      documentId,
      req.user.userId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Company Info Error:", error);
    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
};

/**
 * ดึงข้อมูลสรุปการฝึกงาน
 */
exports.getInternshipSummary = async (req, res) => {
  try {
    // ... ตรวจสอบ req.user ...
    const summary = await internshipManagementService.getInternshipSummary(req.user.userId);

    if (!summary) {
      // กรณีไม่พบข้อมูล ให้ส่ง success: true, data: null
      return res.status(200).json({
        success: true,
        data: null,
        message: "ยังไม่มีข้อมูลสรุปการฝึกงาน"
      });
    }

    return res.status(200).json({
      success: true,
      data: summary,
      message: "ดึงข้อมูลสรุปการฝึกงานสำเร็จ"
    });
  } catch (error) {
    // error จริง เช่น DB ล่ม, query ผิด ฯลฯ
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการฝึกงาน"
    });
  }
};

/**
 * ดาวน์โหลดเอกสารสรุปการฝึกงาน PDF
 */
exports.downloadInternshipSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ดึงข้อมูลสรุปการฝึกงานครบถ้วน
    const summaryData =
      await internshipLogbookService.getInternshipSummaryForPDF(userId);

    if (!summaryData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลการฝึกงาน",
      });
    }

    // ตรวจสอบความครบถ้วนของข้อมูล
    if (!summaryData.logEntries || summaryData.logEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ยังไม่มีบันทึกการฝึกงาน กรุณาบันทึกข้อมูลก่อน",
      });
    }

    // สร้าง PDF
    const pdfBuffer =
      await internshipLogbookService.generateInternshipSummaryPDF(summaryData);

    // สร้างชื่อไฟล์
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `บันทึกฝึกงาน-${summaryData.studentInfo.studentId}-${currentDate}.pdf`;

    // ส่ง PDF กลับ
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading internship summary:", error);

    if (error.message.includes("ไม่พบข้อมูล")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "ไม่สามารถสร้างเอกสารบันทึกฝึกงานได้",
    });
  }
};

/**
 * แสดงตัวอย่างเอกสารสรุปการฝึกงาน PDF
 */
exports.previewInternshipSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ดึงข้อมูลสรุปการฝึกงาน
    const summaryData =
      await internshipLogbookService.getInternshipSummaryForPDF(userId);

    if (!summaryData) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลการฝึกงาน",
      });
    }

    // สร้าง PDF
    const pdfBuffer =
      await internshipLogbookService.generateInternshipSummaryPDF(summaryData);

    // ส่ง PDF สำหรับแสดงผลในเบราว์เซอร์
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline"); // แสดงในเบราว์เซอร์แทนการดาวน์โหลด

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error previewing internship summary:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถแสดงตัวอย่างเอกสารได้",
    });
  }
};

/**
 * ดึงรายการ คพ.05 ทั้งหมดของนักศึกษา
 */
exports.getCS05List = async (req, res) => {
  try {
    const result = await internshipManagementService.getCS05List(
      req.user.userId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get CS05 List Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
};

// ============= Controller สำหรับการประเมินผลการฝึกงาน =============
/**
 * ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
 */
exports.getEvaluationStatus = async (req, res) => {
  try {
    const result = await internshipManagementService.getEvaluationStatus(
      req.user.userId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Evaluation Status Error:", error);
    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสถานะการประเมิน",
    });
  }
};

/**
 * ส่งแบบประเมินให้พี่เลี้ยง - เพิ่มการจัดการ error เฉพาะ
 */
exports.sendEvaluationForm = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;

    // ตรวจสอบ input
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร",
      });
    }

    console.log(
      `Sending evaluation form for documentId: ${documentId}, userId: ${userId}`
    );

    const result = await internshipManagementService.sendEvaluationForm(
      documentId,
      userId
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        supervisorEmail: result.supervisorEmail,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error sending evaluation form:", error);

    // จัดการ error เฉพาะสำหรับการปิดการแจ้งเตือน
    if (error.message.includes("ระบบปิดการแจ้งเตือนการประเมินผล")) {
      return res.status(423).json({
        // 423 Locked - เหมาะสำหรับฟีเจอร์ที่ถูกปิดชั่วคราว
        success: false,
        message: error.message,
        errorType: "NOTIFICATION_DISABLED",
      });
    }

    // จัดการ error อื่นๆ ตามเดิม
    if (error.message.includes("ไม่พบเอกสาร")) {
      return res.status(404).json({
        success: false,
        message: error.message,
        errorType: "DOCUMENT_NOT_FOUND",
      });
    }

    if (error.message.includes("คำขอประเมินผลถูกส่งไปยัง")) {
      return res.status(409).json({
        success: false,
        message: error.message,
        errorType: "ALREADY_SENT",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการส่งแบบประเมิน",
      errorType: "SERVER_ERROR",
    });
  }
};

// ============= Controller สำหรับการประเมินผลการฝึกงาน โดย Supervisor =============

/**
 * ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินผลโดย Supervisor
 */
exports.getSupervisorEvaluationFormDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const result =
      await internshipManagementService.getSupervisorEvaluationFormDetails(
        token
      );

    return res.status(200).json({
      success: true,
      data: result,
      message: "ดึงข้อมูลสำหรับแบบประเมินผลสำเร็จ",
    });
  } catch (error) {
    console.error("Error fetching supervisor evaluation form details:", error);
    const statusCode =
      error.message.includes("ไม่ถูกต้อง") || error.message.includes("หมดอายุ")
        ? 404
        : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลแบบประเมินผล",
    });
  }
};

/**
 * บันทึกข้อมูลการประเมินผลโดย Supervisor
 */
exports.submitSupervisorEvaluation = async (req, res) => {
  try {
    const { token } = req.params;
    const evaluationData = req.body;

    const result = await internshipManagementService.submitSupervisorEvaluation(
      token,
      evaluationData
    );

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Submit Supervisor Evaluation Error:", error);

    // Use error handling from service layer
    let statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกผลการประเมิน",
      errors: error.errors,
    });
  }
};

/**
 * อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน
 */
exports.uploadAcceptanceLetter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.body; // CS05 document ID
    const uploadedFile = req.file;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบไฟล์ที่อัปโหลด",
      });
    }

    // ตรวจสอบประเภทไฟล์
    if (uploadedFile.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น",
      });
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "ขนาดไฟล์ต้องไม่เกิน 10MB",
      });
    }

    // เรียก Service
    const result = await internshipManagementService.uploadAcceptanceLetter(
      userId,
      documentId,
      uploadedFile
    );

    return res.status(200).json({
      success: true,
      message: "อัปโหลดหนังสือตอบรับเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Upload Acceptance Letter Error:", error);

    // ลบไฟล์ที่อัปโหลดถ้าเกิดข้อผิดพลาด
    if (req.file && req.file.path) {
      const fs = require("fs");
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ไม่ได้รับการอนุมัติ")
      ? 403
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการอัปโหลดหนังสือตอบรับ",
    });
  }
};

/**
 * ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ
 */
exports.getAcceptanceLetterStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    const status = await internshipManagementService.getAcceptanceLetterStatus(
      userId,
      documentId
    );

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get Acceptance Letter Status Error:", error);

    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "ไม่สามารถตรวจสอบสถานะได้",
    });
  }
};

/**
 * ดาวน์โหลดหนังสือตอบรับที่อัปโหลดแล้ว
 */
exports.downloadAcceptanceLetter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    const fileInfo = await internshipManagementService.getAcceptanceLetterFile(
      userId,
      documentId
    );

    if (!fileInfo || !fileInfo.filePath) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบหนังสือตอบรับที่อัปโหลด",
      });
    }

    // ตรวจสอบว่าไฟล์มีอยู่จริง
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(fileInfo.filePath)) {
      return res.status(404).json({
        success: false,
        message: "ไฟล์หนังสือตอบรับไม่พบในระบบ",
      });
    }

    // ส่งไฟล์
    const fileName = fileInfo.originalName || `หนังสือตอบรับ-${documentId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    return res.sendFile(path.resolve(fileInfo.filePath));
  } catch (error) {
    console.error("Download Acceptance Letter Error:", error);
    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "ไม่สามารถดาวน์โหลดหนังสือตอบรับได้",
    });
  }
};

/**
 * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา (ปรับปรุงใหม่)
 */
exports.getReferralLetterStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    console.log("[DEBUG] Controller getReferralLetterStatus:", {
      userId,
      documentId,
      params: req.params,
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
        errorType: "MISSING_DOCUMENT_ID",
      });
    }

    // ตรวจสอบว่า documentId เป็นตัวเลข
    const documentIdInt = parseInt(documentId);
    if (isNaN(documentIdInt)) {
      return res.status(400).json({
        success: false,
        message: "รหัสเอกสาร CS05 ไม่ถูกต้อง",
        errorType: "INVALID_DOCUMENT_ID",
      });
    }

    // เรียก Service เพื่อตรวจสอบสถานะ
    const result = await internshipManagementService.getReferralLetterStatus(
      userId,
      documentIdInt
    );

    console.log("[DEBUG] Controller getReferralLetterStatus Result:", result);

    // ✅ เพิ่มข้อมูล mapping info สำหรับ Frontend
    const responseData = {
      ...result,
      // เพิ่มข้อมูลสำหรับ mapping ใน frontend (ถ้ายังไม่มี)
      mappingInfo: result.mappingInfo || {
        backendStatus: result.status,
        shouldMapTo: result.isDownloaded
          ? "downloaded"
          : result.isReady
          ? "ready"
          : "not_ready",
        confidence: "high",
      },
      // เพิ่มข้อมูล debug สำหรับ development
      debug: {
        timestamp: new Date().toISOString(),
        userId: userId,
        documentId: documentIdInt,
        backendStatus: result.status,
        frontendStatus: result.mappingInfo?.shouldMapTo || "unknown",
      },
    };

    return res.json({
      success: true,
      data: responseData,
      message: "ตรวจสอบสถานะหนังสือส่งตัวสำเร็จ",
    });
  } catch (error) {
    console.error("[DEBUG] Controller getReferralLetterStatus Error:", error);

    // จัดการ error แบบละเอียด
    let statusCode = 500;
    let errorType = "SERVER_ERROR";
    let message = "เกิดข้อผิดพลาดในการตรวจสอบสถานะหนังสือส่งตัว";

    if (error.message.includes("ไม่พบ")) {
      statusCode = 404;
      errorType = "NOT_FOUND";
      message = error.message;
    } else if (error.message.includes("ไม่มีสิทธิ์")) {
      statusCode = 403;
      errorType = "FORBIDDEN";
      message = error.message;
    } else if (error.message.includes("ไม่ได้รับการอนุมัติ")) {
      statusCode = 409;
      errorType = "NOT_APPROVED";
      message = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      errorType: errorType,
      debug: {
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        documentId: req.params.documentId,
        originalError: error.message,
      },
    });
  }
};

/**
 * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว (ปรับปรุงใหม่)
 */
exports.markReferralLetterDownloaded = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    console.log("[DEBUG] Mark Referral Downloaded Request:", {
      userId,
      documentId,
      params: req.params,
    });

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    // เรียก Service เพื่ออัปเดตสถานะ
    const result =
      await internshipManagementService.markReferralLetterDownloaded(
        userId,
        parseInt(documentId)
      );

    console.log("[DEBUG] Mark Referral Downloaded Result:", result);

    return res.json({
      success: true,
      message: "อัปเดตสถานะการดาวน์โหลดเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Mark Referral Letter Downloaded Error:", error);

    // จัดการ error ตาม status code
    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ไม่มีสิทธิ์")
      ? 403
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    });
  }
};

/**
 * ดาวน์โหลดหนังสือส่งตัวนักศึกษา (สร้างแบบ real-time)
 */
exports.downloadReferralLetter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    // สร้าง PDF หนังสือส่งตัวแบบ real-time
    const pdfData = await internshipManagementService.generateReferralLetterPDF(
      userId,
      documentId
    );

    if (!pdfData || !pdfData.pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: "ไม่สามารถสร้างหนังสือส่งตัวได้",
      });
    }

    // 🆕 อัปเดตสถานะการดาวน์โหลดทันทีเมื่อสร้าง PDF สำเร็จ
    try {
      await internshipManagementService.markReferralLetterDownloaded(
        userId,
        documentId
      );
      console.log(
        `✅ อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว documentId: ${documentId}`
      );
    } catch (markError) {
      console.warn(
        "⚠️ ไม่สามารถอัปเดตสถานะการดาวน์โหลดได้:",
        markError.message
      );
      // ไม่ throw error เพราะ PDF สร้างสำเร็จแล้ว
    }

    // ตั้งค่า headers สำหรับการดาวน์โหลด PDF
    const fileName = pdfData.fileName || `หนังสือส่งตัว-${documentId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("Content-Length", pdfData.pdfBuffer.length);

    // ส่ง PDF buffer
    return res.send(pdfData.pdfBuffer);
  } catch (error) {
    console.error("Download Referral Letter Error:", error);

    // จัดการ error ตาม status code
    if (error.response?.status) {
      const status = error.response.status;
      const message = error.response.data?.message;

      switch (status) {
        case 400:
          return res.status(400).json({
            success: false,
            message: message || "ข้อมูลคำร้องไม่ถูกต้อง",
          });
        case 403:
          return res.status(403).json({
            success: false,
            message: "ไม่มีสิทธิ์ในการดาวน์โหลดหนังสือส่งตัว",
          });
        case 404:
          return res.status(404).json({
            success: false,
            message: "ไม่พบหนังสือส่งตัว อาจยังไม่ได้รับการอนุมัติ",
          });
        case 409:
          return res.status(409).json({
            success: false,
            message:
              "หนังสือส่งตัวยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่",
          });
        default:
          return res.status(500).json({
            success: false,
            message: message || "เกิดข้อผิดพลาดในการดาวน์โหลดหนังสือส่งตัว",
          });
      }
    }

    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ไม่ได้รับการอนุมัติ")
      ? 403
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดาวน์โหลดหนังสือส่งตัว",
    });
  }
};

/**
 * อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว
 */
exports.markReferralLetterDownloaded = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสเอกสาร CS05",
      });
    }

    const result =
      await internshipManagementService.markReferralLetterDownloaded(
        userId,
        documentId
      );

    return res.json({
      success: true,
      message: "อัปเดตสถานะการดาวน์โหลดเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Mark Referral Letter Downloaded Error:", error);

    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "ไม่สามารถอัปเดตสถานะได้",
    });
  }
};

/**
 * ดึงข้อมูลสำหรับสร้างหนังสือรับรองการฝึกงาน (Frontend PDF Generation)
 */
exports.getCertificateData = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(
      `[getCertificateData] Fetching certificate data for userId: ${userId}`
    );

    const certificateData =
      await internshipManagementService.getCertificateData(userId);

    return res.status(200).json({
      success: true,
      data: certificateData,
      message: "ดึงข้อมูลหนังสือรับรองเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Get Certificate Data Error:", error);
    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ยังไม่พร้อม")
      ? 409
      : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือรับรอง",
    });
  }
};

/**
 * แสดงตัวอย่างหนังสือรับรอง
 */
exports.previewCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`[previewCertificate] Controller called for userId: ${userId}`);

    const result = await internshipManagementService.previewCertificatePDF(
      userId
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="certificate-preview.pdf"'
    );
    res.send(result.pdfBuffer);
  } catch (error) {
    console.error("Preview Certificate Controller Error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้",
    });
  }
};

/**
 * ดาวน์โหลดหนังสือรับรอง
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(
      `[downloadCertificate] Controller called for userId: ${userId}`
    );

    const result = await internshipManagementService.downloadCertificatePDF(
      userId
    );

    res.setHeader("Content-Type", "application/pdf");
    
    res.send(result.pdfBuffer);
  } catch (error) {
    console.error("Download Certificate Controller Error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "ไม่สามารถดาวน์โหลดหนังสือรับรองได้",
    });
  }
};

/**
 * แสดงตัวอย่างข้อมูลหนังสือรับรองการฝึกงาน (สำหรับ Frontend Preview)
 */
exports.previewCertificateData = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(
      `[previewCertificateData] Fetching preview data for userId: ${userId}`
    );

    const certificateData =
      await internshipManagementService.getCertificateData(userId);

    // เพิ่ม flag สำหรับ preview
    certificateData.isPreview = true;
    certificateData.previewWatermark = "ตัวอย่าง - PREVIEW";

    return res.status(200).json({
      success: true,
      data: certificateData,
      message: "ดึงข้อมูลตัวอย่างหนังสือรับรองเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Preview Certificate Data Error:", error);
    const statusCode = error.message.includes("ไม่พบ")
      ? 404
      : error.message.includes("ยังไม่พร้อม")
      ? 409
      : 500;
    return res.status(statusCode).json({
      success: false,
      message:
        error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตัวอย่างหนังสือรับรอง",
    });
  }
};

/**
 * บันทึกการดาวน์โหลดหนังสือรับรอง (เรียกจาก Frontend หลังดาวน์โหลดสำเร็จ)
 */
exports.markCertificateDownloaded = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(
      `[markCertificateDownloaded] Recording download for userId: ${userId}`
    );

    const result = await internshipManagementService.markCertificateDownloaded(
      userId
    );

    return res.status(200).json({
      success: true,
      message: "บันทึกการดาวน์โหลดเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    console.error("Mark Certificate Downloaded Error:", error);
    const statusCode = error.message.includes("ไม่พบ") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการบันทึกการดาวน์โหลด",
    });
  }
};

/**
 * ตรวจสอบสถานะหนังสือรับรองการฝึกงาน
 */
exports.getCertificateStatus = async (req, res) => {
  try {
    // ... ตรวจสอบ req.user ...
    const status = await internshipManagementService.getCertificateStatus(req.user.userId);

    if (!status) {
      // กรณีไม่พบข้อมูล ให้ส่ง success: true, data: null
      return res.status(200).json({
        success: true,
        data: null,
        message: "ยังไม่มีข้อมูลสถานะหนังสือรับรอง"
      });
    }

    return res.status(200).json({
      success: true,
      data: status,
      message: "ดึงสถานะหนังสือรับรองสำเร็จ"
    });
  } catch (error) {
    // error จริง เช่น DB ล่ม, query ผิด ฯลฯ
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงสถานะหนังสือรับรอง"
    });
  }
};

/**
 * ส่งคำขอหนังสือรับรองการฝึกงาน
 */
exports.submitCertificateRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requestData = req.body;

    console.log(
      `[submitCertificateRequest] Processing certificate request for userId: ${userId}`
    );

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!requestData.studentId || !requestData.requestDate) {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลคำขอไม่ครบถ้วน",
      });
    }

    const result = await internshipManagementService.submitCertificateRequest(
      userId,
      requestData
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: "ส่งคำขอหนังสือรับรองการฝึกงานเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Submit Certificate Request Error:", error);
    const statusCode = error.message.includes("ไม่ผ่านเงื่อนไข")
      ? 400
      : error.message.includes("ไม่พบ")
      ? 404
      : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการส่งคำขอหนังสือรับรอง",
    });
  }
};
