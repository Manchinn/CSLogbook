const projectWorkflowStateService = require('../services/projectWorkflowStateService');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: ProjectWorkflowState
 *   description: API สำหรับจัดการสถานะ workflow ของโครงงาน
 */

class ProjectWorkflowStateController {
  /**
   * @swagger
   * /api/projects/workflow-states/statistics:
   *   get:
   *     summary: ดึงสถิติภาพรวมของโครงงาน
   *     tags: [ProjectWorkflowState]
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
   *         description: สถิติภาพรวม
   */
  async getStatistics(req, res) {
    try {
      const { academicYear, semester } = req.query;
      
      const stats = await projectWorkflowStateService.getStatistics({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถิติ',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/projects/:projectId/workflow-state:
   *   get:
   *     summary: ดึงสถานะของโครงงานเฉพาะ
   *     tags: [ProjectWorkflowState]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: สถานะโครงงาน
   *       404:
   *         description: ไม่พบโครงงาน
   */
  async getProjectState(req, res) {
    try {
      const projectId = req.params.id || req.params.projectId;
      
      // Validate projectId - ตรวจสอบให้ละเอียดขึ้น
      if (projectId === undefined || projectId === null || projectId === '') {
        logger.warn('getProjectState: Missing projectId', {
          params: req.params,
          url: req.url,
          method: req.method
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: 'ไม่พบรหัสโครงงานใน request'
        });
      }

      const parsedProjectId = parseInt(projectId, 10);
      if (isNaN(parsedProjectId) || parsedProjectId <= 0) {
        logger.warn('getProjectState: Invalid projectId format', {
          projectId,
          parsedProjectId,
          params: req.params,
          url: req.url
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: `projectId ต้องเป็นตัวเลขที่ valid (ได้รับ: ${projectId})`
        });
      }
      
      const state = await projectWorkflowStateService.getProjectState(parsedProjectId, {
        includeProject: true
      });

      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'ไม่พบข้อมูลสถานะของโครงงาน'
        });
      }

      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      logger.error('Error in getProjectState:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถานะโครงงาน',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/projects/{projectId}/workflow-state/deadlines:
   *   get:
   *     summary: ดึงสถานะโครงงานพร้อม deadline ที่เกี่ยวข้อง
   *     tags: [ProjectWorkflowState]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: สถานะโครงงานพร้อม deadlines
   *       400:
   *         description: projectId ไม่ถูกต้อง
   *       404:
   *         description: ไม่พบโครงงาน
   */
  async getProjectStateWithDeadlines(req, res) {
    try {
      const projectId = req.params.id || req.params.projectId;
      
      // Log สำหรับ debugging
      logger.debug('getProjectStateWithDeadlines: Request received', {
        projectId,
        params: req.params,
        url: req.url,
        userId: req.user?.userId,
        studentCode: req.student?.studentCode
      });
      
      // Validate projectId - ตรวจสอบให้ละเอียดขึ้น
      if (projectId === undefined || projectId === null || projectId === '') {
        logger.warn('getProjectStateWithDeadlines: Missing projectId', {
          params: req.params,
          url: req.url,
          method: req.method,
          userId: req.user?.userId,
          studentCode: req.student?.studentCode
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: 'ไม่พบรหัสโครงงานใน request'
        });
      }

      // ตรวจสอบว่า projectId เป็น string ที่ไม่ใช่ตัวเลข เช่น "undefined", "null", "NaN"
      const projectIdStr = String(projectId).trim();
      if (projectIdStr === 'undefined' || projectIdStr === 'null' || projectIdStr === 'NaN' || projectIdStr === '') {
        logger.warn('getProjectStateWithDeadlines: Invalid projectId string value', {
          projectId,
          projectIdStr,
          params: req.params,
          url: req.url,
          userId: req.user?.userId,
          studentCode: req.student?.studentCode
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: `projectId ต้องเป็นตัวเลขที่ valid (ได้รับ: ${projectId})`
        });
      }

      const parsedProjectId = parseInt(projectIdStr, 10);
      if (isNaN(parsedProjectId) || parsedProjectId <= 0) {
        logger.warn('getProjectStateWithDeadlines: Invalid projectId format', {
          projectId,
          projectIdStr,
          parsedProjectId,
          params: req.params,
          url: req.url,
          userId: req.user?.userId,
          studentCode: req.student?.studentCode
        });
        return res.status(400).json({
          success: false,
          error: 'projectId ไม่ถูกต้อง',
          details: `projectId ต้องเป็นตัวเลขที่ valid (ได้รับ: ${projectId})`
        });
      }

      const result = await projectWorkflowStateService.getProjectStateWithDeadlines(parsedProjectId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'ไม่พบข้อมูลสถานะของโครงงาน'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getProjectStateWithDeadlines:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถานะโครงงานพร้อม deadline',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/projects/workflow-states/attention:
   *   get:
   *     summary: ดึงโครงงานที่ต้องให้ความสนใจ
   *     tags: [ProjectWorkflowState]
   *     parameters:
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
   *           default: 50
   *     responses:
   *       200:
   *         description: รายการโครงงานที่ต้องให้ความสนใจ
   */
  async getAttentionRequired(req, res) {
    try {
      const { academicYear, semester, limit } = req.query;
      
      const projects = await projectWorkflowStateService.getAttentionRequired({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        limit: limit ? parseInt(limit) : 50
      });

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      logger.error('Error in getAttentionRequired:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงรายการโครงงาน',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/dashboard/project-statistics:
   *   get:
   *     summary: ดึงสถิติสำหรับ admin dashboard
   *     tags: [ProjectWorkflowState]
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
   *         description: สถิติสำหรับ dashboard
   */
  async getAdminDashboardStatistics(req, res) {
    try {
      const { academicYear, semester } = req.query;
      
      const stats = await projectWorkflowStateService.getAdminDashboardStatistics({
        academicYear: academicYear ? parseInt(academicYear) : undefined,
        semester: semester ? parseInt(semester) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getAdminDashboardStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงสถิติ',
        details: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/projects/workflow-states/filter:
   *   get:
   *     summary: ดึงโครงงานตาม filter
   *     tags: [ProjectWorkflowState]
   *     parameters:
   *       - in: query
   *         name: currentPhase
   *         schema:
   *           type: string
   *       - in: query
   *         name: isBlocked
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: isOverdue
   *         schema:
   *           type: boolean
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
   *         description: รายการโครงงาน
   */
  async getProjectsByFilter(req, res) {
    try {
      const { 
        currentPhase, 
        isBlocked, 
        isOverdue, 
        academicYear, 
        semester, 
        limit, 
        offset 
      } = req.query;

      const result = await projectWorkflowStateService.getProjectsByFilter({
        currentPhase,
        isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined,
        isOverdue: isOverdue !== undefined ? isOverdue === 'true' : undefined,
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
      logger.error('Error in getProjectsByFilter:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงรายการโครงงาน',
        details: error.message
      });
    }
  }
}

module.exports = new ProjectWorkflowStateController();
