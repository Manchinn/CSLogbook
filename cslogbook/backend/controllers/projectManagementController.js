const projectManagementService = require('../services/projectManagementService');
const logger = require('../utils/logger');

/**
 * ProjectManagementController - Controller สำหรับจัดการโครงงานพิเศษโดยเจ้าหน้าที่ภาควิชา
 */
class ProjectManagementController {

  /**
   * เพิ่มโครงงานพิเศษใหม่โดยเจ้าหน้าที่ภาควิชา
   * POST /api/admin/projects/manual
   */
  async createProjectManually(req, res) {
    try {
      const {
        studentCode,
        student2Code,
        projectNameTh,
        projectNameEn,
        projectType,
        advisorId,
        coAdvisorId,
        trackCodes
      } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!studentCode) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }

      const projectData = {
        studentCode,
        student2Code,
        projectNameTh,
        projectNameEn,
        projectType,
        advisorId: advisorId ? parseInt(advisorId) : null,
        coAdvisorId: coAdvisorId ? parseInt(coAdvisorId) : null,
        trackCodes: trackCodes || []
      };

      const result = await projectManagementService.createProjectManually(
        projectData,
        req.user.userId
      );

      logger.info('ProjectManagementController: สร้างโครงงานพิเศษสำเร็จ', {
        projectId: result.data.projectId,
        studentCode,
        student2Code,
        createdBy: req.user.userId
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการสร้างโครงงานพิเศษ', {
        error: error.message,
        body: req.body,
        user: req.user.userId
      });

      res.status(400).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างโครงงานพิเศษ'
      });
    }
  }

  /**
   * ดึงรายการโครงงานทั้งหมด
   * GET /api/admin/projects
   */
  async getAllProjects(req, res) {
    try {
      const {
        status,
        academicYear,
        semester,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        status,
        academicYear,
        semester: semester ? parseInt(semester) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await projectManagementService.getAllProjects(filters);

      res.json({
        success: true,
        message: 'ดึงรายการโครงงานสำเร็จ',
        data: result
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการดึงรายการโครงงาน', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงรายการโครงงาน'
      });
    }
  }

  /**
   * ดึงข้อมูลโครงงานตาม ID
   * GET /api/admin/projects/:projectId
   */
  async getProjectById(req, res) {
    try {
      const { projectId } = req.params;

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ ID โครงงานที่ถูกต้อง'
        });
      }

      const project = await projectManagementService.getProjectById(parseInt(projectId));

      res.json({
        success: true,
        message: 'ดึงข้อมูลโครงงานสำเร็จ',
        data: project
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน', {
        error: error.message,
        projectId: req.params.projectId
      });

      if (error.message.includes('ไม่พบโครงงาน')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน'
      });
    }
  }

  /**
   * อัปเดตข้อมูลโครงงาน
   * PUT /api/admin/projects/:projectId
   */
  async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const updateData = req.body;

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ ID โครงงานที่ถูกต้อง'
        });
      }

      // แปลงค่า advisorId และ coAdvisorId เป็น integer ถ้ามี
      if (updateData.advisorId) {
        updateData.advisorId = parseInt(updateData.advisorId);
      }
      if (updateData.coAdvisorId) {
        updateData.coAdvisorId = parseInt(updateData.coAdvisorId);
      }

      const result = await projectManagementService.updateProject(
        parseInt(projectId),
        updateData,
        req.user.userId
      );

      logger.info('ProjectManagementController: อัปเดตโครงงานสำเร็จ', {
        projectId,
        updatedBy: req.user.userId
      });

      res.json(result);

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการอัปเดตโครงงาน', {
        error: error.message,
        projectId: req.params.projectId,
        body: req.body,
        user: req.user.userId
      });

      if (error.message.includes('ไม่พบโครงงาน')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตโครงงาน'
      });
    }
  }

  /**
   * ค้นหานักศึกษาตามรหัสนักศึกษา
   * GET /api/admin/students/search/:studentCode
   */
  async findStudentByCode(req, res) {
    try {
      const { studentCode } = req.params;

      if (!studentCode) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }

      const student = await projectManagementService.findStudentByCode(studentCode);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `ไม่พบนักศึกษารหัส ${studentCode} ในระบบ`
        });
      }

      res.json({
        success: true,
        message: 'พบข้อมูลนักศึกษา',
        data: student
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการค้นหานักศึกษา', {
        error: error.message,
        studentCode: req.params.studentCode
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหานักศึกษา'
      });
    }
  }

  /**
   * ดึงรายการอาจารย์ที่สามารถเป็นที่ปรึกษาได้
   * GET /api/admin/advisors
   */
  async getAvailableAdvisors(req, res) {
    try {
      const advisors = await projectManagementService.getAvailableAdvisors();

      res.json({
        success: true,
        message: 'ดึงรายการอาจารย์สำเร็จ',
        data: advisors
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการดึงรายการอาจารย์', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงรายการอาจารย์'
      });
    }
  }

  /**
   * ดึงรายการ tracks ที่มีอยู่ในระบบ
   * GET /api/admin/tracks
   */
  async getAvailableTracks(req, res) {
    try {
      // รายการ tracks ที่มีในระบบตามที่กำหนดใน ProjectTrack model
      const tracks = [
        { code: 'NETSEC', name: 'Network and Security', nameTh: 'เครือข่ายและความปลอดภัย' },
        { code: 'WEBMOBILE', name: 'Web and Mobile Development', nameTh: 'การพัฒนาเว็บและมือถือ' },
        { code: 'SMART', name: 'Smart Technology', nameTh: 'เทคโนโลยีอัจฉริยะ' },
        { code: 'AI', name: 'Artificial Intelligence', nameTh: 'ปัญญาประดิษฐ์' },
        { code: 'GAMEMEDIA', name: 'Game and Media', nameTh: 'เกมและสื่อ' }
      ];

      res.json({
        success: true,
        message: 'ดึงรายการ tracks สำเร็จ',
        data: tracks
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการดึงรายการ tracks', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงรายการ tracks'
      });
    }
  }

  /**
   * ยกเลิกโครงงานพิเศษ
   * POST /api/admin/projects/:projectId/cancel
   */
  async cancelProject(req, res) {
    try {
      const { projectId } = req.params;
      const { reason } = req.body;

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุ ID โครงงานที่ถูกต้อง'
        });
      }

      const result = await projectManagementService.cancelProject(
        parseInt(projectId),
        req.user.userId,
        reason
      );

      logger.info('ProjectManagementController: ยกเลิกโครงงานสำเร็จ', {
        projectId,
        cancelledBy: req.user.userId,
        studentIds: result.studentIds
      });

      res.json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error) {
      logger.error('ProjectManagementController: เกิดข้อผิดพลาดในการยกเลิกโครงงาน', {
        error: error.message,
        projectId: req.params.projectId,
        user: req.user.userId
      });

      if (error.message.includes('ไม่พบโครงงาน') || 
          error.message.includes('ถูกยกเลิกไปแล้ว') ||
          error.message.includes('ไม่สามารถยกเลิก')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการยกเลิกโครงงาน'
      });
    }
  }
}

module.exports = new ProjectManagementController();