// controllers/workflowReportController.js
const workflowReportService = require('../services/workflowReportService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/reports/workflow/progress:
 *   get:
 *     summary: ดึงรายงานความคืบหน้า workflow
 *     tags: [Workflow Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workflowType
 *         schema:
 *           type: string
 *           enum: [internship, project1, project2]
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 */
exports.getWorkflowProgress = async (req, res, next) => {
  try {
    const { workflowType, academicYear, semester } = req.query;
    
    const data = await workflowReportService.getWorkflowProgress({
      workflowType,
      academicYear: academicYear ? parseInt(academicYear) : undefined,
      semester: semester ? parseInt(semester) : undefined
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getWorkflowProgress:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/workflow/bottlenecks:
 *   get:
 *     summary: ดึงขั้นตอนที่นักศึกษาติดมากที่สุด
 */
exports.getBottlenecks = async (req, res, next) => {
  try {
    const { workflowType } = req.query;
    
    // Call main progress report and extract bottlenecks
    const data = await workflowReportService.getWorkflowProgress({ workflowType });

    res.json({
      success: true,
      data: data.bottlenecks
    });
  } catch (error) {
    logger.error('Error in getBottlenecks:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/workflow/student-timeline/:studentId:
 *   get:
 *     summary: ดึง timeline ของนักศึกษาคนหนึ่ง
 */
exports.getStudentTimeline = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { workflowType } = req.query;

    if (!workflowType) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุ workflowType'
      });
    }

    const data = await workflowReportService.getStudentTimeline(
      parseInt(studentId), 
      workflowType
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
    logger.error('Error in getStudentTimeline:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/reports/workflow/blocked-students:
 *   get:
 *     summary: ดึงรายชื่อนักศึกษาที่ติดขัด
 */
exports.getBlockedStudents = async (req, res, next) => {
  try {
    const { workflowType } = req.query;
    
    const data = await workflowReportService.getBlockedStudents(workflowType);

    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    logger.error('Error in getBlockedStudents:', error);
    next(error);
  }
};
