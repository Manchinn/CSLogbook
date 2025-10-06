// Controller สำหรับบันทึกผลสอบหัวข้อ (เจ้าหน้าที่ / admin)
const { Teacher } = require('../models');
const projectDocumentService = require('../services/projectDocumentService');
const logger = require('../utils/logger');

module.exports = {
  async recordResult(req, res) {
    try {
      // อนุญาตเฉพาะ admin หรือ teacher support
      if (!['admin','teacher'].includes(req.user.role) || (req.user.role === 'teacher' && req.user.teacherType !== 'support')) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์บันทึกผลสอบหัวข้อ' });
      }
      const { result, reason, advisorId } = req.body || {};
      if (!['passed','failed'].includes(result)) {
        return res.status(400).json({ success: false, message: 'result ต้องเป็น passed หรือ failed' });
      }
      if (result === 'failed' && (!reason || reason.trim().length < 5)) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกเหตุผลไม่ผ่านอย่างน้อย 5 ตัวอักษร' });
      }

      let validatedAdvisorId;
      if (advisorId !== undefined) {
        const parsedAdvisorId = Number(advisorId);
        if (!Number.isInteger(parsedAdvisorId) || parsedAdvisorId <= 0) {
          return res.status(400).json({ success: false, message: 'advisorId ต้องเป็นเลขจำนวนเต็มบวก' });
        }

        const advisor = await Teacher.findByPk(parsedAdvisorId);
        if (!advisor) {
          return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอาจารย์ที่ปรึกษาที่เลือก' });
        }

        validatedAdvisorId = parsedAdvisorId;
      }

      const projectId = req.params.id;
      const project = await projectDocumentService.setExamResult(projectId, {
        result,
        reason: result === 'failed' ? reason.trim() : null,
        advisorId: validatedAdvisorId,
        actorUser: req.user
      });
      return res.json({ success: true, data: project });
    } catch (error) {
      logger.error('recordResult error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  ,
  async acknowledgeFailed(req, res) {
    try {
      // นักศึกษาเท่านั้นที่ acknowledge ได้ (อนุญาต member ใดก็ได้)
      if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, message: 'เฉพาะนักศึกษาที่เกี่ยวข้องเท่านั้น' });
      }
      const projectId = req.params.id;
      const project = await projectDocumentService.acknowledgeExamResult(projectId, req.user.studentId);
      return res.json({ success: true, data: project });
    } catch (error) {
      logger.error('acknowledgeFailed error', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
