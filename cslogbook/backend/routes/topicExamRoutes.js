// topicExamRoutes.js
// เส้นทางสำหรับระบบรวมข้อมูลการเสนอหัวข้อ (Topic Exam Overview)
const router = require("express").Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const controller = require("../controllers/topicExamController");
const logger = require("../utils/logger");

// GET /api/projects/topic-exam/overview
router.get(
  "/overview",
  authenticateToken,
  authorize("topicExam", "access"),
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
  authorize("topicExam", "access"),
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
