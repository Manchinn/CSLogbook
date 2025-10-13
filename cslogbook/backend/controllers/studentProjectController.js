const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

/**
 * StudentProjectController - Controller สำหรับนักศึกษาจัดการข้อมูลโครงงานพิเศษของตนเอง
 */
class StudentProjectController {

  /**
   * ดึงข้อมูลโครงงานพิเศษของนักศึกษา
   * GET /api/students/projects/mine
   */
  async getMyProjects(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'อนุญาตเฉพาะนักศึกษา'
        });
      }

      const projects = await projectDocumentService.getMyProjects(req.user.studentId);

      logger.info('StudentProjectController: ดึงข้อมูลโครงงานของนักศึกษาสำเร็จ', {
        studentId: req.user.studentId,
        projectCount: projects.length
      });

      res.json({
        success: true,
        data: projects
      });

    } catch (error) {
      logger.error('StudentProjectController: เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน', {
        error: error.message,
        studentId: req.user.studentId
      });

      res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลโครงงานได้'
      });
    }
  }

  /**
   * ดึงข้อมูลโครงงานพิเศษตาม ID
   * GET /api/students/projects/:projectId
   */
  async getProjectById(req, res) {
    try {
      const { projectId } = req.params;

      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'อนุญาตเฉพาะนักศึกษา'
        });
      }

      const project = await projectDocumentService.getProjectById(projectId);

      // ตรวจสอบว่านักศึกษาเป็นสมาชิกของโครงงานนี้หรือไม่
      const isMember = project.members.some(member => member.studentId === req.user.studentId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึงโครงงานนี้'
        });
      }

      logger.info('StudentProjectController: ดึงข้อมูลโครงงานตาม ID สำเร็จ', {
        projectId,
        studentId: req.user.studentId
      });

      res.json({
        success: true,
        data: project
      });

    } catch (error) {
      logger.error('StudentProjectController: เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน', {
        error: error.message,
        projectId: req.params.projectId,
        studentId: req.user.studentId
      });

      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * อัปเดตข้อมูลโครงงานพิเศษ (เฉพาะหัวหน้าโครงงาน)
   * PUT /api/students/projects/:projectId
   */
  async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const updateData = req.body;

      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'อนุญาตเฉพาะนักศึกษา'
        });
      }

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต'
        });
      }

      const updatedProject = await projectDocumentService.updateMetadata(
        projectId,
        req.user.studentId,
        updateData
      );

      logger.info('StudentProjectController: อัปเดตข้อมูลโครงงานสำเร็จ', {
        projectId,
        studentId: req.user.studentId,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'อัปเดตข้อมูลโครงงานเรียบร้อยแล้ว',
        data: updatedProject
      });

    } catch (error) {
      logger.error('StudentProjectController: เกิดข้อผิดพลาดในการอัปเดตโครงงาน', {
        error: error.message,
        projectId: req.params.projectId,
        studentId: req.user.studentId
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * เพิ่มสมาชิกในโครงงาน (เฉพาะหัวหน้าโครงงาน)
   * POST /api/students/projects/:projectId/members
   */
  async addMember(req, res) {
    try {
      const { projectId } = req.params;
      const { studentCode } = req.body;

      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'อนุญาตเฉพาะหัวหน้าโครงงาน'
        });
      }

      if (!studentCode) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }

      const updatedProject = await projectDocumentService.addMember(
        projectId,
        req.user.studentId,
        studentCode
      );

      logger.info('StudentProjectController: เพิ่มสมาชิกโครงงานสำเร็จ', {
        projectId,
        leaderStudentId: req.user.studentId,
        newMemberCode: studentCode
      });

      res.json({
        success: true,
        message: 'เพิ่มสมาชิกโครงงานเรียบร้อยแล้ว',
        data: updatedProject
      });

    } catch (error) {
      logger.error('StudentProjectController: เกิดข้อผิดพลาดในการเพิ่มสมาชิก', {
        error: error.message,
        projectId: req.params.projectId,
        studentId: req.user.studentId
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * เปิดใช้งานโครงงาน (เปลี่ยนสถานะจาก draft เป็น in_progress)
   * POST /api/students/projects/:projectId/activate
   */
  async activateProject(req, res) {
    try {
      const { projectId } = req.params;

      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'อนุญาตเฉพาะหัวหน้าโครงงาน'
        });
      }

      const activatedProject = await projectDocumentService.activateProject(
        projectId,
        req.user.studentId
      );

      logger.info('StudentProjectController: เปิดใช้งานโครงงานสำเร็จ', {
        projectId,
        studentId: req.user.studentId
      });

      res.json({
        success: true,
        message: 'เปิดใช้งานโครงงานเรียบร้อยแล้ว',
        data: activatedProject
      });

    } catch (error) {
      logger.error('StudentProjectController: เกิดข้อผิดพลาดในการเปิดใช้งานโครงงาน', {
        error: error.message,
        projectId: req.params.projectId,
        studentId: req.user.studentId
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new StudentProjectController();