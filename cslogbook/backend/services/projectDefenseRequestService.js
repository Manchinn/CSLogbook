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

      const memberStudentIds = (project.members || []).map(member => member.studentId).filter(Boolean);
      const students = memberStudentIds.length
        ? await Student.findAll({ where: { studentId: memberStudentIds }, transaction: t })
        : [];
      const meetingMetrics = await projectDocumentService.buildProjectMeetingMetrics(projectId, students, { transaction: t });
      const requiredApprovedLogs = projectDocumentService.getRequiredApprovedMeetingLogs();
      const leaderMetrics = meetingMetrics.perStudent?.[leader.studentId] || { approvedLogs: 0 };
      // ถ้าบันทึกการพบที่ได้รับอนุมัติยังไม่ครบตามเกณฑ์ ให้บล็อกการส่งคำขอสอบไว้ก่อน
      if ((leaderMetrics.approvedLogs || 0) < requiredApprovedLogs) {
        throw new Error(`ยังไม่สามารถยื่นคำขอสอบได้ ต้องมีบันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย ${requiredApprovedLogs} ครั้ง`);
      }

      const cleanedPayload = this.normalizeProject1Payload(payload, project);
      this.validateProject1Payload(cleanedPayload, {
        rawStudentsCount: Array.isArray(payload?.students) ? payload.students.length : 0
      });

      let record = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType: DEFENSE_TYPE_PROJECT1 },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (record && ['scheduled', 'completed'].includes(record.status)) {
        throw new Error('ไม่สามารถแก้ไขคำขอหลังจากมีการนัดสอบแล้ว');
      }

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

    // รวมข้อมูลติดต่อจาก payload เดิม โดยต้องจับคู่กับสมาชิกที่อยู่ในโครงงานจริงเท่านั้น
    const contactsFromPayload = Array.isArray(safePayload.students) ? safePayload.students : [];
    const studentContacts = membersSnapshot.map(member => {
      const matched = contactsFromPayload.find(item => Number(item.studentId) === Number(member.studentId)) || {};
      return {
        studentId: member.studentId,
        studentCode: member.studentCode,
        name: member.name,
        phone: typeof matched.phone === 'string' ? matched.phone.trim() : '',
        email: typeof matched.email === 'string' ? matched.email.trim() : ''
      };
    });

    const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
    // ตัดข้อมูลที่ไม่ต้องการ และเก็บเฉพาะฟิลด์ที่ยังใช้ในระบบคพ.02
    const normalizedPayload = {
      requestDate: normalizeText(safePayload.requestDate) || new Date().toISOString().slice(0, 10),
      advisorName: normalizeText(safePayload.advisorName),
      coAdvisorName: normalizeText(safePayload.coAdvisorName),
      additionalNotes: normalizeText(safePayload.additionalNotes),
      students: studentContacts
    };

    if (safePayload.projectSnapshotOverride && typeof safePayload.projectSnapshotOverride === 'object') {
      normalizedPayload.projectSnapshotOverride = { ...safePayload.projectSnapshotOverride };
    }

    normalizedPayload.projectSnapshot = {
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectNameTh: project.projectNameTh,
      projectNameEn: project.projectNameEn,
      advisorId: project.advisorId,
      coAdvisorId: project.coAdvisorId
    };
    normalizedPayload.membersSnapshot = membersSnapshot;
    return normalizedPayload;
  }

  /**
   * Validation พื้นฐานของข้อมูลคพ.02 (minimal requirement – ปรับเพิ่มได้ภายหลัง)
   */
  validateProject1Payload(payload, { rawStudentsCount = 0 } = {}) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('กรุณากรอกข้อมูลคำขอสอบก่อนบันทึก');
    }
    if (!payload.requestDate) {
      throw new Error('กรุณาระบุวันที่ยื่นคำขอ');
    }
    if (!Array.isArray(payload.students) || !payload.students.length) {
      throw new Error('กรุณากรอกข้อมูลช่องติดต่อของสมาชิกโครงงาน');
    }
    if (rawStudentsCount === 0) {
      throw new Error('กรุณากรอกข้อมูลช่องติดต่อของสมาชิกโครงงาน');
    }
    const invalidStudent = payload.students.find(item => !item.studentId);
    if (invalidStudent) {
      throw new Error('ข้อมูลสมาชิกไม่ครบถ้วน');
    }
  }

  async scheduleProject1Defense(projectId, { scheduledAt, location, note } = {}, actorUser = {}) {
    const t = await sequelize.transaction();
    try {
      const scheduleDate = scheduledAt ? new Date(scheduledAt) : null;
      if (!scheduleDate || Number.isNaN(scheduleDate.getTime())) {
        throw new Error('กรุณาระบุวันและเวลานัดสอบให้ถูกต้อง');
      }

      const locationText = typeof location === 'string' ? location.trim() : '';
      if (!locationText) {
        throw new Error('กรุณาระบุสถานที่สอบ');
      }

      const request = await ProjectDefenseRequest.findOne({
        where: {
          projectId,
          defenseType: DEFENSE_TYPE_PROJECT1,
          status: { [Op.ne]: 'cancelled' }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!request) {
        throw new Error('ยังไม่มีคำขอสอบโครงงานพิเศษ 1 สำหรับโครงงานนี้');
      }
      if (request.status === 'completed') {
        throw new Error('ไม่สามารถเปลี่ยนแปลงกำหนดการหลังบันทึกผลสอบแล้ว');
      }

      await request.update({
        status: 'scheduled',
        defenseScheduledAt: scheduleDate,
        defenseLocation: locationText,
        defenseNote: typeof note === 'string' && note.trim() ? note.trim() : null,
        scheduledByUserId: actorUser?.userId || null,
        scheduledAt: new Date()
      }, { transaction: t });

      await request.reload({ transaction: t });
      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();

      logger.info('scheduleProject1Defense success', { projectId, scheduledAt: scheduleDate.toISOString() });
      return request.get({ plain: true });
    } catch (error) {
      await this.safeRollback(t);
      logger.error('scheduleProject1Defense failed', { projectId, error: error.message });
      throw error;
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
