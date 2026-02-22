const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timelineController");
const { authenticateToken } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

/**
 * @route   GET /api/timeline/student/:studentId
 * @desc    ดึงข้อมูล Timeline ของนักศึกษา
 * @access  Private (Student, Teacher, Admin)
 */
router.get(
  "/student/:studentId",
  authenticateToken,
  authorize("timeline", "readStudent"),
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
  authorize("timeline", "initStudent"),
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
  authorize("timeline", "updateStep"),
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
  authorize("timeline", "readAll"),
  timelineController.getAllTimelines
);

module.exports = router;
