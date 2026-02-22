const express = require("express");
const router = express.Router();
const academicController = require("../controllers/academicController");
const { authenticateToken } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

// ดึงข้อมูลปีการศึกษาปัจจุบัน (สำหรับทุกคน)
router.get(
  "/current",
  authenticateToken,
  academicController.getAcademicSettings
);

// ดึงข้อมูลการตั้งค่าปีการศึกษา (สำหรับ admin เท่านั้น)
router.get(
  "/",
  authenticateToken,
  authorize("academic", "manage"),
  academicController.getAcademicSettings
);

/* router.get(
  "/curriculums/mappings", 
  authenticateToken,
  checkRole(["admin"]),
  curriculumController.getCurriculumMappings); */

// สร้างข้อมูลการตั้งค่าปีการศึกษาใหม่
router.post(
  "/",
  authenticateToken,
  authorize("academic", "manage"),
  academicController.createAcademicSettings
);

// อัปเดตข้อมูลการตั้งค่าปีการศึกษา
router.put(
  "/",
  authenticateToken,
  authorize("academic", "manage"),
  academicController.updateAcademicSettings
);

// ลบข้อมูลการตั้งค่าปีการศึกษา
router.delete(
  "/:id",
  authenticateToken,
  authorize("academic", "manage"),
  academicController.deleteAcademicSettings
);

module.exports = router;
