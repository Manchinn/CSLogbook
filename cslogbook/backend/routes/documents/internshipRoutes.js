const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { upload } = require("../../config/uploadConfig");
const { Document } = require("../../models");
const cp05ApprovalController = require("../../controllers/documents/cp05ApprovalController");
const acceptanceApprovalController = require("../../controllers/documents/acceptanceApprovalController");
const documentController = require("../../controllers/documents/documentController");
const internshipController = require("../../controllers/documents/internshipController");
const { authenticateToken } = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");
const { checkInternshipEligibility } = require("../../middleware/internshipEligibilityMiddleware");
const { checkInternshipDeadline } = require("../../middleware/internshipDeadlineMiddleware");
const {
  validateSubmitCS05,
  validateSubmitCS05WithTranscript,
  validateSubmitCompanyInfo,
  validateSendEvaluationForm,
  validateSubmitCertificateRequest,
  validateUploadAcceptanceLetter
} = require("../../validators/internshipValidators");
// Note: checkDeadlineBeforeSubmission is for PROJECT workflows only

// ============= เส้นทางสาธารณะ (ไม่ต้อง auth) =============

// ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ (template PDF สาธารณะ — ไม่ต้อง auth)
router.get("/acceptance-letter-template", (req, res) => {
  const templatePath = path.join(__dirname, "../../public/forms/acceptance-letter-template.pdf");
  res.sendFile(templatePath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        message: "ไม่พบไฟล์แบบฟอร์มหนังสือตอบรับ กรุณาติดต่อเจ้าหน้าที่",
      });
    }
  });
});

// ============= เส้นทางสำหรับข้อมูลนักศึกษา =============
// ดึงข้อมูลนักศึกษาและสิทธิ์การฝึกงาน
router.get(
  "/student/info",
  authenticateToken,
  authorize("internship", "student"),
  internshipController.getStudentInfo
);

// ============= เส้นทางสำหรับแบบฟอร์ม คพ.05 =============

// ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/current-cs05",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getCurrentCS05
);

// ส่งคำร้องขอฝึกงาน (คพ.05) - ต้องตรวจสอบสิทธิ์ฝึกงาน และ deadline
router.post(
  "/cs-05/submit",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  checkInternshipDeadline('CS05', 'SUBMISSION'),
  validateSubmitCS05,
  internshipController.submitCS05
);

// บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript - ต้องตรวจสอบสิทธิ์ฝึกงาน และ deadline
router.post(
  "/cs-05/submit-with-transcript",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  checkInternshipDeadline('CS05', 'SUBMISSION'),
  upload.single("transcript"),
  validateSubmitCS05WithTranscript,
  internshipController.submitCS05WithTranscript
);

// ดึงข้อมูล คพ.05 ตาม ID
router.get("/cs-05/:id", authenticateToken, internshipController.getCS05ById);

// บันทึกข้อมูลบริษัท/หน่วยงานฝึกงาน - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.post(
  "/company-info/submit",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  validateSubmitCompanyInfo,
  internshipController.submitCompanyInfo
);

// ดึงข้อมูลผู้ควบคุมงาน - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/company-info/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getCompanyInfo
);

// ============= เส้นทางสำหรับเอกสารสรุปการฝึกงาน =============

// ดึงข้อมูลสรุปการฝึกงาน (รองรับทั้ง student และ teacher)
router.get(
  "/summary",
  authenticateToken,
  authorize("internship", "summary"),
  internshipController.getInternshipSummary
);

// ============= เส้นทางสำหรับการประเมินผลการฝึกงาน =============

// ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/evaluation/status",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getEvaluationStatus
);

// ส่งคำขอประเมินผลไปยัง Supervisor - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.post(
  "/request-evaluation/send/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  validateSendEvaluationForm,
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

// แสดงตัวอย่างหนังสือรับรอง - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/certificate/preview",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.previewCertificate
);

// ดาวน์โหลดหนังสือรับรอง - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/certificate/download",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.downloadCertificate
);

// ตรวจสอบสถานะหนังสือรับรอง - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/certificate-status",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getCertificateStatus
);

// ส่งคำขอหนังสือรับรอง - ต้องตรวจสอบสิทธิ์ฝึกงาน และ deadline
router.post(
  "/certificate-request",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  checkInternshipDeadline('report', 'SUBMISSION'), // ตรวจสอบ deadline รายงานผลการฝึกงาน
  validateSubmitCertificateRequest,
  internshipController.submitCertificateRequest
);

// บันทึกการดาวน์โหลดหนังสือรับรอง - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.post(
  "/certificate-downloaded",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.markCertificateDownloaded
);

// ============= เส้นทางสำหรับอัปโหลดเอกสาร =============
// อัปโหลดใบแสดงผลการเรียน (Transcript) - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.post(
  "/upload-transcript",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
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

// อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน - ต้องตรวจสอบสิทธิ์ฝึกงาน (ไม่มี deadline)
router.post(
  "/upload-acceptance-letter",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  upload.single("acceptanceLetter"), // ใช้ field name เดียวกับ frontend
  validateUploadAcceptanceLetter,
  internshipController.uploadAcceptanceLetter
);

// ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/acceptance-letter-status/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getAcceptanceLetterStatus
);

// ดาวน์โหลดหนังสือตอบรับที่อัปโหลดแล้ว - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/download-acceptance-letter/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.downloadAcceptanceLetter
);

// ============= เส้นทางสำหรับหนังสือขอความอนุเคราะห์ =============

// ดาวน์โหลดหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน - download ได้ทันทีหลัง CS05 approved
router.get(
  "/download-cooperation-letter/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.downloadCooperationLetter
);

// ============= เส้นทางสำหรับหนังสือส่งตัวนักศึกษา =============

// ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/referral-letter-status/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.getReferralLetterStatus
);

// ดาวน์โหลดหนังสือส่งตัวนักศึกษา - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.get(
  "/download-referral-letter/:documentId",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.downloadReferralLetter
);

// อัปเดตสถานะการดาวน์โหลดหนังสือส่งตัว - ต้องตรวจสอบสิทธิ์ฝึกงาน
router.patch(
  "/referral-letter/:documentId/mark-downloaded",
  authenticateToken,
  authorize("internship", "student"),
  checkInternshipEligibility,
  internshipController.markReferralLetterDownloaded
);

// ============= เส้นทางสำหรับการอนุมัติ คพ.05 (CP.05 Approval Flow) =============
// หัวหน้าภาค: ดึงคิวเอกสาร CS05 ที่รออนุมัติ
router.get(
  "/cs-05/head/queue",
  authenticateToken,
  authorize("internship", "cp05Head"),
  cp05ApprovalController.listForHead
);

// เจ้าหน้าที่ภาค (support) ตรวจสอบ
router.post(
  "/cs-05/:id/review",
  authenticateToken,
  authorize("internship", "cp05Staff"),
  cp05ApprovalController.reviewByStaff
);

// หัวหน้าภาค อนุมัติ
router.post(
  "/cs-05/:id/approve",
  authenticateToken,
  authorize("internship", "cp05Head"),
  cp05ApprovalController.approveByHead
);

// ปฏิเสธ (เจ้าหน้าที่หรือหัวหน้าภาค)
router.post(
  "/cs-05/:id/reject",
  authenticateToken,
  authorize("internship", "cp05Reviewer"),
  cp05ApprovalController.reject
);

// หัวหน้าภาค: เปิดดูไฟล์ PDF ของเอกสาร CS05 โดยตรง (เหมือนฝั่งเจ้าหน้าที่)
router.get(
  "/cs-05/:id/view",
  authenticateToken,
  authorize("internship", "cp05Head"),
  documentController.viewDocument
);

// ============= เส้นทางสำหรับการอนุมัติ หนังสือตอบรับการฝึกงาน (แบบสองขั้น) =============
// หัวหน้าภาค: คิว หนังสือตอบรับการฝึกงาน ที่รออนุมัติ (ผ่านเจ้าหน้าที่ภาคแล้ว)
router.get(
  "/acceptance/head/queue",
  authenticateToken,
  authorize("internship", "acceptanceHead"),
  acceptanceApprovalController.listForHead
);

// เจ้าหน้าที่ภาคตรวจและส่งต่อ Acceptance Letter
router.post(
  "/acceptance/:id/review",
  authenticateToken,
  authorize("internship", "acceptanceStaff"),
  acceptanceApprovalController.reviewByStaff
);

// หัวหน้าภาคอนุมัติ หนังสือตอบรับการฝึกงาน เพื่อส่ง หนังสือส่งตัวนักศึกษา
router.post(
  "/acceptance/:id/approve",
  authenticateToken,
  authorize("internship", "acceptanceHead"),
  acceptanceApprovalController.approveByHead
);

// ปฏิเสธ Acceptance Letter
router.post(
  "/acceptance/:id/reject",
  authenticateToken,
  authorize("internship", "acceptanceReviewer"),
  acceptanceApprovalController.reject
);

module.exports = router;
