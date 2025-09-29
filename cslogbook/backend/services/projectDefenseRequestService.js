const { sequelize } = require('../config/database');
const { ProjectDefenseRequest, ProjectDocument, ProjectMember, Student } = require('../models');
const projectDocumentService = require('./projectDocumentService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';

class ProjectDefenseRequestService {
  /**
   * บันทึก/อัปเดตคำขอสอบโครงงานพิเศษ 1 (คพ.02)
   * - อนุญาตเฉพาะหัวหน้าโครงงาน
   * - ตรวจให้โครงงานอยู่ในสถานะ in_progress (หรือ later stage)
   * - เก็บ payload (JSON) พร้อม snapshot ข้อมูลโครงงานและสมาชิก ณ เวลายื่น
   */
  async submitProject1Request(projectId, actorStudentId, payload = {}) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, {
        include: [{
          model: ProjectMember,
          as: 'members',
          include: [{
            model: Student,
            as: 'student',
            include: [{ association: Student.associations.user }]
          }]
        }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!project) {
        throw new Error('ไม่พบโครงงาน');
      }

      const leader = (project.members || []).find(member => member.role === 'leader');
      if (!leader || leader.studentId !== Number(actorStudentId)) {
        throw new Error('อนุญาตเฉพาะหัวหน้าโครงงานในการยื่นคำขอนี้');
      }

      if (!['in_progress', 'completed'].includes(project.status)) {
        throw new Error('โครงงานต้องอยู่ในสถานะ in_progress ก่อนยื่นคำขอสอบ');
      }

      const cleanedPayload = this.normalizeProject1Payload(payload, project);
      this.validateProject1Payload(cleanedPayload);

      let record = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType: DEFENSE_TYPE_PROJECT1 },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      const now = new Date();
      if (record) {
        await record.update({
          formPayload: cleanedPayload,
          status: 'submitted',
          submittedByStudentId: actorStudentId,
          submittedAt: now
        }, { transaction: t });
      } else {
        record = await ProjectDefenseRequest.create({
          projectId,
          defenseType: DEFENSE_TYPE_PROJECT1,
          status: 'submitted',
          formPayload: cleanedPayload,
          submittedByStudentId: actorStudentId,
          submittedAt: now
        }, { transaction: t });
      }

      await project.reload({
        include: [{
          model: ProjectMember,
          as: 'members',
          include: [{
            model: Student,
            as: 'student',
            include: [{ association: Student.associations.user }]
          }]
        }, {
          model: ProjectDefenseRequest,
          as: 'defenseRequests'
        }],
        transaction: t
      });

      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t, projectInstance: project });
      await t.commit();

      logger.info('submitProject1Request success', { projectId });
      return record.get({ plain: true });
    } catch (error) {
      await this.safeRollback(t);
      logger.error('submitProject1Request failed', { projectId, error: error.message });
      throw error;
    }
  }

  /**
   * ดึงคำขอสอบโครงงานพิเศษ 1 ล่าสุด
   */
  async getLatestProject1Request(projectId) {
    const record = await ProjectDefenseRequest.findOne({
      where: { projectId, defenseType: DEFENSE_TYPE_PROJECT1 },
      order: [['submitted_at', 'DESC']]
    });
    return record ? record.get({ plain: true }) : null;
  }

  /**
   * ตรวจสอบว่ามีการส่งคำขอแล้วหรือไม่ (ใช้กับ workflow state)
   */
  async hasSubmittedProject1Request(projectId, { transaction } = {}) {
    const count = await ProjectDefenseRequest.count({
      where: {
        projectId,
        defenseType: DEFENSE_TYPE_PROJECT1,
        status: { [Op.ne]: 'cancelled' }
      },
      transaction
    });
    return count > 0;
  }

  /**
   * tidy payload (เติม snapshot ข้อมูลโครงงาน/สมาชิก)
   */
  normalizeProject1Payload(payload, project) {
    const safePayload = payload && typeof payload === 'object' ? { ...payload } : {};
    const membersSnapshot = (project.members || []).map(member => ({
      studentId: member.studentId,
      role: member.role,
      studentCode: member.student?.studentCode || null,
      name: member.student?.user ? `${member.student.user.firstName || ''} ${member.student.user.lastName || ''}`.trim() : null
    }));

    safePayload.projectSnapshot = {
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectNameTh: project.projectNameTh,
      projectNameEn: project.projectNameEn,
      advisorId: project.advisorId,
      coAdvisorId: project.coAdvisorId
    };
    safePayload.membersSnapshot = membersSnapshot;
    return safePayload;
  }

  /**
   * Validation พื้นฐานของข้อมูลคพ.02 (minimal requirement – ปรับเพิ่มได้ภายหลัง)
   */
  validateProject1Payload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('กรุณากรอกข้อมูลคำขอสอบก่อนบันทึก');
    }
    const requiredFields = ['examDate', 'examTime', 'examLocation'];
    const missing = requiredFields.filter(field => !payload[field]);
    if (missing.length) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(', ')}`);
    }
    if (payload.committee && !Array.isArray(payload.committee)) {
      throw new Error('ข้อมูลคณะกรรมการต้องอยู่ในรูปแบบรายการ');
    }
  }

  async safeRollback(transaction) {
    if (!transaction || transaction.finished) return;
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.warn('transaction rollback failed (projectDefenseRequestService)', { error: rollbackError.message });
    }
  }
}

module.exports = new ProjectDefenseRequestService();
