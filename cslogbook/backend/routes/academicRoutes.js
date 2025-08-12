const express = require("express");
const router = express.Router();
const academicController = require("../controllers/academicController");
const {
  authenticateToken,
  checkRole,
} = require("../middleware/authMiddleware");

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
  checkRole(["admin"]),
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
  checkRole(["admin"]),
  academicController.createAcademicSettings
);

// อัปเดตข้อมูลการตั้งค่าปีการศึกษา
router.put(
  "/",
  authenticateToken,
  checkRole(["admin"]),
  academicController.updateAcademicSettings
);

// ลบข้อมูลการตั้งค่าปีการศึกษา
router.delete(
  "/:id",
  authenticateToken,
  checkRole(["admin"]),
  academicController.deleteAcademicSettings
);

module.exports = router;
