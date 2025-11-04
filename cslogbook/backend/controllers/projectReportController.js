const projectReportService = require('../services/projectReportService');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: ProjectReport
 *   description: API สำหรับรายงานโครงงานพิเศษและปริญญานิพนธ์สำหรับงานธุรการ
 */

class ProjectReportController {
  /**
   * @swagger
   * /api/admin/reports/project/administrative:
   *   get:
   *     summary: ดึงรายงานโครงงานพิเศษและปริญญานิพนธ์แบบครบถ้วนสำหรับงานธุรการ
   *     tags: [ProjectReport]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: academicYear
   *         schema:
   *           type: integer
   *       - in: query
   *         name: semester
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: รายงานสถิติครบถ้วน
   */
  async getAdministrativeReport(req, res) {
    try {
      const { academicYear, semester } = req.query;
      
      const report = await projectReportService.getAdministrativeReport({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error in getAdministrativeReport:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงรายงาน',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/reports/project/project1:
   *   get:
   *     summary: ดึงสถิติโครงงานพิเศษ (Project 1)
   *     tags: [ProjectReport]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: academicYear
   *         schema:
   *           type: integer
   *       - in: query
   *         name: semester
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: สถิติ Project 1
   */
  async getProject1Statistics(req, res) {
    try {
      const { academicYear, semester } = req.query;
      
      const stats = await projectReportService.getProject1Statistics({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getProject1Statistics:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถิติ Project 1',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/reports/project/project2:
   *   get:
   *     summary: ดึงสถิติปริญญานิพนธ์ (Project 2)
   *     tags: [ProjectReport]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: academicYear
   *         schema:
   *           type: integer
   *       - in: query
   *         name: semester
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: สถิติ Project 2
   */
  async getProject2Statistics(req, res) {
    try {
      const { academicYear, semester } = req.query;
      
      const stats = await projectReportService.getProject2Statistics({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getProject2Statistics:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถิติ Project 2',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/reports/project/students-by-status:
   *   get:
   *     summary: ดึงรายชื่อนักศึกษาแยกตามสถานะ
   *     tags: [ProjectReport]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [topic_pending, topic_passed, topic_failed, in_progress, thesis_pending, thesis_passed, thesis_failed, completed, overdue, blocked]
   *       - in: query
   *         name: academicYear
   *         schema:
   *           type: integer
   *       - in: query
   *         name: semester
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: รายชื่อนักศึกษา
   */
  async getStudentsByStatus(req, res) {
    try {
      const { status, academicYear, semester, limit, offset } = req.query;
      
      const result = await projectReportService.getStudentsByStatus({
        status,
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.items.length < result.total
        }
      });
    } catch (error) {
      logger.error('Error in getStudentsByStatus:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงรายชื่อนักศึกษา',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/reports/project/exam-trends:
   *   get:
   *     summary: ดึงสถิติแนวโน้มการสอบผ่าน/ไม่ผ่านเปรียบเทียบรายปี
   *     tags: [ProjectReport]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startYear
   *         schema:
   *           type: integer
   *       - in: query
   *         name: endYear
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: แนวโน้มสถิติการสอบ
   */
  async getExamTrends(req, res) {
    try {
      const { startYear, endYear } = req.query;
      
      const trends = await projectReportService.getExamTrends({
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined
      });

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      logger.error('Error in getExamTrends:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงแนวโน้มสถิติ',
        details: error.message
      });
    }
  }
}

module.exports = new ProjectReportController();

