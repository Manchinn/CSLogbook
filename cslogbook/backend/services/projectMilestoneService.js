const { sequelize } = require('../config/database');
const { ProjectDocument, ProjectMilestone, ProjectMember } = require('../models');
const logger = require('../utils/logger');

class ProjectMilestoneService {
  // สร้าง milestone (อนุญาตให้สมาชิกโครงงานทุกคนสร้างได้)
  async createMilestone(projectId, actorStudentId, payload) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      // ตรวจสอบว่าเป็นสมาชิกของโครงงานหรือไม่ (ทั้ง 2 คนมีสิทธิ์เท่ากัน)
      const member = await ProjectMember.findOne({ where: { projectId, studentId: actorStudentId }, transaction: t });
      if (!member) {
        throw new Error('อนุญาตเฉพาะสมาชิกโครงงานเท่านั้นที่สร้าง Milestone ได้');
      }

      if (!payload.title || !payload.title.trim()) {
        throw new Error('กรุณาระบุชื่อ Milestone');
      }

      let dueDate = payload.dueDate || null;
      if (dueDate && isNaN(Date.parse(dueDate))) {
        throw new Error('รูปแบบ dueDate ไม่ถูกต้อง');
      }

      const milestone = await ProjectMilestone.create({
        projectId,
        title: payload.title.trim(),
        dueDate: dueDate,
        progress: 0,
        status: 'pending'
      }, { transaction: t });

      await t.commit();
      logger.info('createMilestone success', { projectId, milestoneId: milestone.milestoneId });
      return this.serialize(milestone);
    } catch (err) {
      await t.rollback();
      logger.error('createMilestone failed', { error: err.message });
      throw err;
    }
  }

  async listMilestones(projectId, actorStudentId) {
    // ตรวจว่าเป็นสมาชิก
    const member = await ProjectMember.findOne({ where: { projectId, studentId: actorStudentId } });
    if (!member) throw new Error('ไม่มีสิทธิ์เข้าถึง Milestone ของโครงงานนี้');

    const milestones = await ProjectMilestone.findAll({ where: { projectId }, order: [['milestone_id','ASC']] });
    return milestones.map(m => this.serialize(m));
  }

  serialize(m) {
    return {
      milestoneId: m.milestoneId,
      projectId: m.projectId,
      title: m.title,
      dueDate: m.dueDate,
      progress: m.progress,
      status: m.status,
      feedback: m.feedback,
      submittedAt: m.submittedAt,
      reviewedAt: m.reviewedAt,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    };
  }
}

module.exports = new ProjectMilestoneService();
