const milestoneService = require('../services/projectMilestoneService');
const logger = require('../utils/logger');
const projectDocumentService = require('../services/projectDocumentService');

module.exports = {
  async list(req, res) {
    try {
      const { id } = req.params;
      if (req.user.role !== 'student') {
        // อนุญาต admin/teacher (อ่านได้) -> ข้าม membership check โดยให้ service รับ studentId = null (แต่ service ตอนนี้ต้องการ member check)
        // ชั่วคราว: ถ้าไม่ใช่ student เรียก project เพื่อ validate exists แล้วคืน empty membership bypass
        const data = await milestoneService.listMilestones(id, req.user.studentId || 0); // ถ้าไม่ใช่ student และไม่มี studentId จะ fail membership
        return res.json({ success: true, data });
      }
      const data = await milestoneService.listMilestones(id, req.user.studentId);
      return res.json({ success: true, data });
    } catch (err) {
      logger.error('milestone list error', { error: err.message });
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async create(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะหัวหน้าโครงงาน' });
      }
      const { id } = req.params;
      const milestone = await milestoneService.createMilestone(id, req.user.studentId, req.body || {});
      return res.status(201).json({ success: true, data: milestone });
    } catch (err) {
      logger.error('milestone create error', { error: err.message });
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
