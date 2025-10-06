const { ProjectDocument, ProjectTrack, ProjectMember, Student } = require('../models');
const logger = require('../utils/logger');

const CODE_TO_LABEL = {
  NETSEC: 'Network & Cyber Security',
  WEBMOBILE: 'Mobile and Web Technology (Web / Mobile Application)',
  SMART: 'Smart Technology',
  AI: 'Artificial Intelligence',
  GAMEMEDIA: 'Games & Multimedia'
};

module.exports = {
  async list(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectDocument.findByPk(id, { include: [{ model: ProjectTrack, as: 'tracks' }] });
      if (!project) return res.status(404).json({ success: false, message: 'ไม่พบโครงงาน' });

      // ตรวจสิทธิ์นักศึกษา ต้องเป็นสมาชิก
      if (req.user.role === 'student') {
        const members = await ProjectMember.findAll({ where: { projectId: project.projectId } });
        if (!members.some(m => m.studentId === req.user.studentId)) {
          return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
        }
      }

      const data = (project.tracks || []).map(t => ({ code: t.trackCode, label: CODE_TO_LABEL[t.trackCode] || t.trackCode }));
      return res.json({ success: true, data });
    } catch (error) {
      logger.error('projectTracks.list error', { error: error.message });
      return res.status(500).json({ success: false, message: 'ไม่สามารถดึง tracks ได้' });
    }
  },

  async replace(req, res) {
    try {
      const { id } = req.params;
      const { tracks } = req.body || {};
      if (!Array.isArray(tracks)) return res.status(400).json({ success: false, message: 'ต้องระบุ tracks เป็น array' });

      const project = await ProjectDocument.findByPk(id);
      if (!project) return res.status(404).json({ success: false, message: 'ไม่พบโครงงาน' });

      // เฉพาะ leader ที่ปรับได้ (ก่อน in_progress)
      if (req.user.role !== 'student' || !req.user.studentId) return res.status(403).json({ success: false, message: 'เฉพาะนักศึกษา' });
      const leader = await ProjectMember.findOne({ where: { projectId: project.projectId, role: 'leader' } });
      if (!leader || leader.studentId !== req.user.studentId) return res.status(403).json({ success: false, message: 'ไม่ใช่หัวหน้าโครงงาน' });
      if (['in_progress','completed','archived'].includes(project.status)) {
        return res.status(400).json({ success: false, message: 'สถานะนี้ไม่สามารถปรับ tracks ได้' });
      }

      const validCodes = Object.keys(CODE_TO_LABEL);
      const uniq = [...new Set(tracks.filter(c => validCodes.includes(c)))];

      await ProjectTrack.destroy({ where: { projectId: project.projectId } });
      if (uniq.length) {
        await ProjectTrack.bulkCreate(uniq.map(code => ({ projectId: project.projectId, trackCode: code })));
      }

      const data = uniq.map(code => ({ code, label: CODE_TO_LABEL[code] }));
      return res.json({ success: true, data });
    } catch (error) {
      logger.error('projectTracks.replace error', { error: error.message });
      return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดต tracks ได้' });
    }
  }
};
