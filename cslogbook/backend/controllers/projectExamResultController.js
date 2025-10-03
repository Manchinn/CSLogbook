const projectExamResultService = require('../services/projectExamResultService');
const logger = require('../utils/logger');

/**
 * Controller: ProjectExamResultController
 * จัดการ API สำหรับผลการสอบโครงงานพิเศษ
 */
class ProjectExamResultController {
  /**
   * GET /api/projects/exam-results/project1/pending
   * ดึงรายการโครงงานที่พร้อมบันทึกผลสอบ PROJECT1
   */
  async getProject1PendingResults(req, res) {
    try {
      const { academicYear, semester, search, status } = req.query;

      const projects = await projectExamResultService.getProject1PendingResults({
        academicYear,
        semester,
        search,
        status
      });

      res.status(200).json({
        success: true,
        message: 'ดึงรายการโครงงานที่พร้อมบันทึกผลสำเร็จ',
        data: projects,
        count: projects.length
      });
    } catch (error) {
      logger.error('Error in getProject1PendingResults:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงรายการโครงงาน',
        error: error.message
      });
    }
  }

  /**
   * POST /api/projects/:projectId/exam-result
   * บันทึกผลสอบโครงงานพิเศษ
   */
  async recordExamResult(req, res) {
    try {
  const projectId = req.params.projectId ?? req.params.id;
      const { examType, result, score, notes, requireScopeRevision } = req.body;
      const recordedByUserId = req.user.userId;

      if (
        !['admin', 'teacher'].includes(req.user.role) ||
        (req.user.role === 'teacher' && req.user.teacherType !== 'support')
      ) {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์บันทึกผลสอบ'
        });
      }

      // Validation
      if (!examType || !result) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุประเภทการสอบและผลสอบ'
        });
      }

      if (!['PROJECT1', 'THESIS'].includes(examType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภทการสอบไม่ถูกต้อง'
        });
      }

      if (!['PASS', 'FAIL'].includes(result)) {
        return res.status(400).json({
          success: false,
          message: 'ผลสอบไม่ถูกต้อง'
        });
      }

      const examData = {
        examType,
        result,
        score,
        notes,
        requireScopeRevision: result === 'PASS' ? requireScopeRevision : false
      };

      const examResult = await projectExamResultService.recordExamResult(
        projectId,
        examData,
        recordedByUserId
      );

      res.status(201).json({
        success: true,
        message: 'บันทึกผลสอบสำเร็จ',
        data: examResult
      });
    } catch (error) {
      logger.error('Error in recordExamResult:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกผลสอบ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/projects/:projectId/exam-result
   * ดึงผลสอบของโครงงาน
   */
  async getExamResult(req, res) {
    try {
  const projectId = req.params.projectId ?? req.params.id;
      const { examType = 'PROJECT1' } = req.query;

      const examResult = await projectExamResultService.getExamResult(projectId, examType);

      if (!examResult) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผลสอบ'
        });
      }

      res.status(200).json({
        success: true,
        message: 'ดึงผลสอบสำเร็จ',
        data: examResult
      });
    } catch (error) {
      logger.error('Error in getExamResult:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงผลสอบ',
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/projects/:projectId/exam-result/acknowledge
   * นักศึกษารับทราบผลสอบ (กรณีไม่ผ่าน)
   */
  async acknowledgeExamResult(req, res) {
    try {
  const projectId = req.params.projectId ?? req.params.id;
      const { examType = 'PROJECT1' } = req.body;
      const studentId = req.user.studentId;

      if (!studentId) {
        return res.status(403).json({
          success: false,
          message: 'เฉพาะนักศึกษาเท่านั้นที่สามารถรับทราบผลสอบได้'
        });
      }

      const examResult = await projectExamResultService.acknowledgeExamResult(
        projectId,
        examType,
        studentId
      );

      res.status(200).json({
        success: true,
        message: 'รับทราบผลสอบสำเร็จ',
        data: examResult
      });
    } catch (error) {
      logger.error('Error in acknowledgeExamResult:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการรับทราบผลสอบ',
        error: error.message
      });
    }
  }

  /**
   * GET /api/projects/exam-results/statistics
   * ดึงสถิติผลสอบ
   */
  async getExamStatistics(req, res) {
    try {
      const { academicYear, semester, examType = 'PROJECT1' } = req.query;

      const stats = await projectExamResultService.getExamStatistics({
        academicYear,
        semester,
        examType
      });

      res.status(200).json({
        success: true,
        message: 'ดึงสถิติสำเร็จ',
        data: stats
      });
    } catch (error) {
      logger.error('Error in getExamStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงสถิติ',
        error: error.message
      });
    }
  }
}

module.exports = new ProjectExamResultController();
