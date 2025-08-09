const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload } = require("../../config/uploadConfig");
const { Document } = require("../../models");
const cp05ApprovalController = require("../../controllers/documents/cp05ApprovalController");
const documentController = require("../../controllers/documents/documentController");
const internshipController = require("../../controllers/documents/internshipController");
const {
  authenticateToken,
  checkRole,
  checkTeacherType,
  checkTeacherPosition,
} = require("../../middleware/authMiddleware");

// ============= เส้นทางสำหรับข้อมูลนักศึกษา =============
// ดึงข้อมูลนักศึกษาและสิทธิ์การฝึกงาน
router.get(
  "/student/info",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getStudentInfo
);

// ============= เส้นทางสำหรับแบบฟอร์ม คพ.05 =============

// ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา
router.get(
  "/current-cs05",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getCurrentCS05
);

// ส่งคำร้องขอฝึกงาน (คพ.05)
router.post(
  "/cs-05/submit",
  authenticateToken,
  checkRole(["student"]),
  internshipController.submitCS05
);

// บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
router.post(
  "/cs-05/submit-with-transcript",
  authenticateToken,
  checkRole(["student"]),
  upload.single("transcript"),
  internshipController.submitCS05WithTranscript
);

// ดึงข้อมูล คพ.05 ตาม ID
router.get("/cs-05/:id", authenticateToken, internshipController.getCS05ById);

// บันทึกข้อมูลบริษัท/หน่วยงานฝึกงาน
router.post(
  "/company-info/submit",
  authenticateToken,
  checkRole(["student"]),
  (req, res, next) => {
    // Validate required fields
    const { documentId, supervisorName, supervisorPhone, supervisorEmail } =
      req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุ Document ID",
      });
    }
    next();
  },
  internshipController.submitCompanyInfo
);

// ดึงข้อมูลผู้ควบคุมงาน
router.get(
  "/company-info/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getCompanyInfo
);

// ============= เส้นทางสำหรับเอกสารสรุปการฝึกงาน =============

// ดึงข้อมูลสรุปการฝึกงาน
router.get(
  "/summary",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getInternshipSummary
);

// ============= เส้นทางสำหรับการรายงานผล =============

// ตรวจสอบสถานะของสรุปการฝึกงาน
router.get(
  "/summary",
  authenticateToken,
  checkRole(["student", "teacher"]),
  internshipController.getInternshipSummary
);

// ============= เส้นทางสำหรับการประเมินผลการฝึกงาน =============

// ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
router.get(
  "/evaluation/status",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getEvaluationStatus
);

// ส่งคำขอประเมินผลไปยัง Supervisor
router.post(
  "/request-evaluation/send/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.sendEvaluationForm
);

// ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินผลโดย Supervisor (ใหม่)
router.get(
  "/supervisor/evaluation/:token/details",
  // No authentication needed here as the token itself is the authorization
  internshipController.getSupervisorEvaluationFormDetails
);

// บันทึกข้อมูลการประเมินผลโดย Supervisor (ใหม่)
router.post(
  "/supervisor/evaluation/:token",
  // No authentication needed here
  internshipController.submitSupervisorEvaluation
);

// ============= Certificate Management Routes (ปรับปรุงใหม่) =============

// ============= Certificate PDF Routes =============

// แสดงตัวอย่างหนังสือรับรอง
router.get(
  "/certificate/preview",
  authenticateToken,
  checkRole(["student"]),
  internshipController.previewCertificate
);

// ดาวน์โหลดหนังสือรับรอง
router.get(
  "/certificate/download",
  authenticateToken,
  checkRole(["student"]),
  internshipController.downloadCertificate
);

// ตรวจสอบสถานะหนังสือรับรอง (เดิมมีอยู่แล้ว)
router.get(
  "/certificate-status",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getCertificateStatus
);

// ส่งคำขอหนังสือรับรอง (เดิมมีอยู่แล้ว)
router.post(
  "/certificate-request",
  authenticateToken,
  checkRole(["student"]),
  internshipController.submitCertificateRequest
);

// บันทึกการดาวน์โหลดหนังสือรับรอง
router.post(
  "/certificate-downloaded",
  authenticateToken,
  checkRole(["student"]),
  internshipController.markCertificateDownloaded
);

// ============= เส้นทางสำหรับอัปโหลดเอกสาร =============
// อัปโหลดใบแสดงผลการเรียน (Transcript)
router.post(
  "/upload-transcript",
  authenticateToken,
  checkRole(["student"]),
  upload.single("file"),
  async (req, res) => {
    try {
      // หา CS05 ที่มีอยู่
      const existingCS05 = await Document.findOne({
        where: {
          userId: req.user.userId,
          documentName: "CS05",
          category: "proposal",
          status: "pending",
        },
      });

      if (!existingCS05) {
        return res.status(400).json({
          success: false,
          message: "กรุณาสร้างแบบฟอร์ม CS05 ก่อนอัปโหลด Transcript",
        });
      }

      // อัปเดท Document เดิม
      await existingCS05.update({
        filePath: req.file.path,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      });

      res.json({
        success: true,
        fileUrl: `/uploads/internship/transcript/${req.file.filename}`,
        documentId: existingCS05.id,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์",
      });
    }
  }
);

// ============= เส้นทางสำหรับอัปโหลดหนังสือตอบรับ =============

// อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน
router.post(
  "/upload-acceptance-letter",
  authenticateToken,
  checkRole(["student"]),
  upload.single("acceptanceLetter"), // ใช้ field name เดียวกับ frontend
  internshipController.uploadAcceptanceLetter
);

// ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ
router.get(
  "/acceptance-letter-status/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getAcceptanceLetterStatus
);

// ดาวน์โหลดหนังสือตอบรับที่อัปโหลดแล้ว
router.get(
  "/download-acceptance-letter/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.downloadAcceptanceLetter
);

// ============= เส้นทางสำหรับหนังสือส่งตัวนักศึกษา =============

// ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา
router.get(
  "/referral-letter-status/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.getReferralLetterStatus
);

// ดาวน์โหลดหนังสือส่งตัวนักศึกษา
router.get(
  "/download-referral-letter/:documentId",
  authenticateToken,
  checkRole(["student"]),
  internshipController.downloadReferralLetter
);

// อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว
router.patch(
  "/referral-letter/:documentId/mark-downloaded",
  authenticateToken,
  checkRole(["student"]),
  internshipController.markReferralLetterDownloaded
);

module.exports = router;

// ============= เส้นทางสำหรับการอนุมัติ คพ.05 (CP.05 Approval Flow) =============
// หัวหน้าภาค: ดึงคิวเอกสาร CS05 ที่รออนุมัติ
router.get(
  "/cs-05/head/queue",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  checkTeacherPosition(["หัวหน้าภาควิชา"]),
  cp05ApprovalController.listForHead
);

// เจ้าหน้าที่ภาค (support) ตรวจสอบ
router.post(
  "/cs-05/:id/review",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  checkTeacherType(["support"]),
  cp05ApprovalController.reviewByStaff
);

// หัวหน้าภาค อนุมัติ
router.post(
  "/cs-05/:id/approve",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  checkTeacherPosition(["หัวหน้าภาควิชา"]),
  cp05ApprovalController.approveByHead
);

// ปฏิเสธ (เจ้าหน้าที่หรือหัวหน้าภาค)
router.post(
  "/cs-05/:id/reject",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  cp05ApprovalController.reject
);

// หัวหน้าภาค: เปิดดูไฟล์ PDF ของเอกสาร CS05 โดยตรง (เหมือนฝั่งเจ้าหน้าที่)
router.get(
  "/cs-05/:id/view",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  checkTeacherPosition(["หัวหน้าภาควิชา"]),
  documentController.viewDocument
);
