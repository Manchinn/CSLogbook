const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timelineController");
const {
  authenticateToken,
  checkRole,
} = require("../middleware/authMiddleware");

/**
 * @route   GET /api/timeline/student/:studentId
 * @desc    ดึงข้อมูล Timeline ของนักศึกษา
 * @access  Private (Student, Teacher, Admin)
 */
router.get(
  "/student/:studentId",
  authenticateToken,
  checkRole(["student", "teacher", "admin"]),
  timelineController.getStudentTimeline
);

/**
 * @route   POST /api/timeline/student/:studentId/init
 * @desc    สร้างไทม์ไลน์เริ่มต้นสำหรับนักศึกษา
 * @access  Private (Student, Teacher, Admin)
 */
router.post(
  "/student/:studentId/init",
  authenticateToken,
  checkRole(["student", "teacher", "admin"]),
  timelineController.initializeStudentTimeline
);

/**
 * @route   PUT /api/timeline/step/:stepId
 * @desc    อัพเดทขั้นตอนในไทม์ไลน์
 * @access  Private (Teacher, Admin)
 */
router.put(
  "/step/:stepId",
  authenticateToken,
  checkRole(["teacher", "admin"]),
  timelineController.updateTimelineStep
);

/**
 * @route   GET /api/timeline/all
 * @desc    ดึงข้อมูล Timeline ทั้งหมด (สำหรับผู้ดูแลระบบ)
 * @access  Private (Admin)
 */
router.get(
  "/all",
  authenticateToken,
  checkRole(["admin"]),
  timelineController.getAllTimelines
);

module.exports = router;