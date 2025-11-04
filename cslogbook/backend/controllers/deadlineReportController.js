// controllers/deadlineReportController.js
const deadlineReportService = require('../services/deadlineReportService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/reports/deadlines/compliance:
 *   get:
 *     summary: ดึงรายงานการปฏิบัติตาม deadline
 *     tags: [Deadline Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *       - in: query
 *         name: relatedTo
 *         schema:
 *           type: string
 *           enum: [internship, project, project1, project2, general]
 */
exports.getDeadlineCompliance = async (req, res, next) => {
  try {
    const { academicYear, semester, relatedTo } = req.query;
    
    const data = await deadlineReportService.getDeadlineCompliance({
      academicYear,
      semester: semester ? parseInt(semester) : undefined,
      relatedTo
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getDeadlineCompliance:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/deadlines/upcoming:
 *   get:
 *     summary: ดึง deadline ที่กำลังจะถึง (7 วันถัดไป)
 */
exports.getUpcomingDeadlines = async (req, res, next) => {
  try {
    const { academicYear, semester, relatedTo } = req.query;
    
    const data = await deadlineReportService.getDeadlineCompliance({
      academicYear,
      semester: semester ? parseInt(semester) : undefined,
      relatedTo
    });

    res.json({
      success: true,
      data: data.upcoming
    });
  } catch (error) {
    logger.error('Error in getUpcomingDeadlines:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/deadlines/overdue:
 *   get:
 *     summary: ดึง deadline ที่พ้นแล้ว
 */
exports.getOverdueDeadlines = async (req, res, next) => {
  try {
    const { academicYear, semester, relatedTo } = req.query;
    
    const data = await deadlineReportService.getDeadlineCompliance({
      academicYear,
      semester: semester ? parseInt(semester) : undefined,
      relatedTo
    });

    res.json({
      success: true,
      data: data.overdue
    });
  } catch (error) {
    logger.error('Error in getOverdueDeadlines:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/deadlines/late-submissions:
 *   get:
 *     summary: ดึงรายชื่อนักศึกษาที่ส่งช้า/เลยกำหนด
 *     tags: [Deadline Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *       - in: query
 *         name: relatedTo
 *         schema:
 *           type: string
 */
exports.getLateSubmissions = async (req, res, next) => {
  try {
    const { academicYear, semester, relatedTo } = req.query;
    
    const data = await deadlineReportService.getDeadlineCompliance({
      academicYear,
      semester: semester ? parseInt(semester) : undefined,
      relatedTo
    });

    res.json({
      success: true,
      data: data.lateSubmissions || []
    });
  } catch (error) {
    logger.error('Error in getLateSubmissions:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/students/:studentId/deadline-history:
 *   get:
 *     summary: ดึงประวัติการส่งงานตาม deadline ของนักศึกษา
 */
exports.getStudentDeadlineHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;

    const data = await deadlineReportService.getStudentDeadlineHistory(
      parseInt(studentId),
      { academicYear, semester: semester ? parseInt(semester) : undefined }
    );

    if (data.error) {
      return res.status(404).json({
        success: false,
        error: data.error
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getStudentDeadlineHistory:', error);
    next(error);
  }
};
