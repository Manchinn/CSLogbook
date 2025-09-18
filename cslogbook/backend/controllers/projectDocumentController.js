const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

// Controller สำหรับ ProjectDocument (Phase 2)
module.exports = {
  async createProject(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา' });
      }
      const project = await projectDocumentService.createProject(req.user.studentId, req.body || {});
      return res.status(201).json({ success: true, project });
    } catch (error) {
      logger.error('createProject error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  async getMyProjects(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา' });
      }
      const projects = await projectDocumentService.getMyProjects(req.user.studentId);
      return res.json({ success: true, projects });
    } catch (error) {
      logger.error('getMyProjects error', { error: error.message });
      return res.status(500).json({ success: false, message: 'ไม่สามารถดึงรายการโครงงานได้' });
    }
  },

  async getProject(req, res) {
    try {
      const project = await projectDocumentService.getProjectById(req.params.id);
      // ตรวจสิทธิ์เบื้องต้น: ถ้าเป็น student ต้องเป็นสมาชิก; ถ้า admin/teacher ผ่าน
      if (req.user.role === 'student') {
        const isMember = project.members.some(m => m.studentId === req.user.studentId);
        if (!isMember) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงโครงงานนี้' });
      }
      return res.json({ success: true, project });
    } catch (error) {
      logger.error('getProject error', { error: error.message });
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  async updateProject(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา (leader)' });
      }
      const project = await projectDocumentService.updateMetadata(req.params.id, req.user.studentId, req.body || {});
      return res.json({ success: true, project });
    } catch (error) {
      logger.error('updateProject error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  async addMember(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะหัวหน้าโครงงาน' });
      }
      const { studentCode } = req.body || {};
      if (!studentCode) return res.status(400).json({ success: false, message: 'กรุณาระบุ studentCode' });
      const project = await projectDocumentService.addMember(req.params.id, req.user.studentId, studentCode);
      return res.json({ success: true, project });
    } catch (error) {
      logger.error('addMember error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  async activateProject(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะหัวหน้าโครงงาน' });
      }
      const project = await projectDocumentService.activateProject(req.params.id, req.user.studentId);
      return res.json({ success: true, project });
    } catch (error) {
      logger.error('activateProject error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  async archiveProject(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะผู้ดูแลระบบ' });
      }
      const project = await projectDocumentService.archiveProject(req.params.id, req.user);
      return res.json({ success: true, project });
    } catch (error) {
      logger.error('archiveProject error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
