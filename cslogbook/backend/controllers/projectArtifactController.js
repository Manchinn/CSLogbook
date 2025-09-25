const artifactService = require('../services/projectArtifactService');
const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.query;
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา (สมาชิกโครงงาน)' });
      }
      const artifacts = await artifactService.listArtifacts(id, req.user.studentId, type);
      return res.json({ success: true, data: artifacts });
    } catch (err) {
      logger.error('artifact list error', { error: err.message });
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async uploadProposal(req, res) {
    try {
      if (req.user.role !== 'student' || !req.user.studentId) {
        return res.status(403).json({ success: false, message: 'อนุญาตเฉพาะนักศึกษา' });
      }
      const { id } = req.params;
      const artifact = await artifactService.uploadProposal(id, req.user.studentId, req.file);
      return res.status(201).json({ success: true, data: artifact });
    } catch (err) {
      logger.error('proposal upload error', { error: err.message });
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
