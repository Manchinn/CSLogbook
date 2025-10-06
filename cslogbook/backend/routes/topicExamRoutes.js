// topicExamRoutes.js
// เส้นทางสำหรับระบบรวมข้อมูลการเสนอหัวข้อ (Topic Exam Overview)
const router = require("express").Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { Teacher } = require("../models");
const controller = require("../controllers/topicExamController");
const logger = require("../utils/logger");

// Simple role guard เฉพาะครู/แอดมิน (ถ้าระบบมี middleware checkRole ใช้แทนได้)
function requireTeacherLike(req, res, next) {
  const role = req.user?.role;
  // รองรับทั้งตัวพิมพ์เล็ก/ใหญ่
  const norm = role ? role.toString().toLowerCase() : "";
  if (!["teacher", "admin", "staff"].includes(norm)) {
    return res.status(403).json({ success: false, error: "FORBIDDEN_ROLE" });
  }
  next();
}

async function ensureTopicExamAccess(req, res, next) {
  const role = req.user?.role?.toString().toLowerCase();

  if (role === "admin") {
    return next();
  }

  if (role !== "teacher") {
    return res.status(403).json({ success: false, error: "FORBIDDEN_ROLE" });
  }

  try {
    const teacher = await Teacher.findOne({
      where: { userId: req.user.userId },
    });
    if (teacher.teacherType === "support" || teacher.canAccessTopicExam) {
      return next();
    }
    if (!teacher || !teacher.canAccessTopicExam) {
      return res.status(403).json({
        success: false,
        error: "TOPIC_EXAM_ACCESS_DENIED",
        message: "ยังไม่มีสิทธิ์เข้าถึง Topic Exam Overview",
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

// GET /api/projects/topic-exam/overview
router.get(
  "/overview",
  authenticateToken,
  requireTeacherLike,
  ensureTopicExamAccess,
  async (req, res, next) => {
    const start = Date.now();
    logger.info(
      `[TopicExam] overview request start user=${req.user?.userId} role=${req.user?.role}`
    );
    try {
      await controller.getOverview(req, res, (err) => {
        if (err) throw err;
      });
      logger.info(
        `[TopicExam] overview request success user=${req.user?.userId} ms=${
          Date.now() - start
        }`
      );
    } catch (e) {
      logger.error(
        `[TopicExam] overview request error user=${req.user?.userId} err=${e.message}`
      );
      next(e);
    }
  }
);

// GET /api/projects/topic-exam/export?format=csv|xlsx ใช้ query เดียวกับ overview
router.get(
  "/export",
  authenticateToken,
  requireTeacherLike,
  ensureTopicExamAccess,
  async (req, res, next) => {
    const start = Date.now();
    logger.info(
      `[TopicExam] export request start user=${req.user?.userId} role=${req.user?.role} format=${req.query.format}`
    );
    try {
      await controller.exportOverview(req, res, (err) => {
        if (err) throw err;
      });
      logger.info(
        `[TopicExam] export request success user=${req.user?.userId} ms=${
          Date.now() - start
        }`
      );
    } catch (e) {
      logger.error(
        `[TopicExam] export request error user=${req.user?.userId} err=${e.message}`
      );
      next(e);
    }
  }
);

module.exports = router;
