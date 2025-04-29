const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timelineController");
const {
  authenticateToken,
  checkRole,
} = require("../middleware/authMiddleware");

// เส้นทางชั่วคราวสำหรับช่วงเปลี่ยนผ่าน - จะส่งคำเตือนว่าเส้นทางนี้จะถูกยกเลิกในอนาคต
/**
 * @route   GET /api/timeline/public/student/:studentId
 * @desc    เส้นทางชั่วคราวที่จะเปลี่ยนเส้นทางไปยังเส้นทางที่มีการป้องกัน
 * @access  Transitional (จะถูกยกเลิกในอนาคต)
 */
router.get(
  "/public/student/:studentId",
  (req, res, next) => {
    console.warn('DEPRECATED: /api/timeline/public/student/:studentId is deprecated. Please use /api/timeline/student/:studentId instead.');
    req.isDeprecatedRoute = true;
    next();
  },
  timelineController.getStudentTimeline
);

/**
 * @route   POST /api/timeline/public/student/:studentId/init
 * @desc    เส้นทางชั่วคราวที่จะเปลี่ยนเส้นทางไปยังเส้นทางที่มีการป้องกัน
 * @access  Transitional (จะถูกยกเลิกในอนาคต)
 */
router.post(
  "/public/student/:studentId/init",
  (req, res, next) => {
    console.warn('DEPRECATED: /api/timeline/public/student/:studentId/init is deprecated. Please use /api/timeline/student/:studentId/init instead.');
    req.isDeprecatedRoute = true;
    next();
  },
  timelineController.initializeStudentTimeline
);

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