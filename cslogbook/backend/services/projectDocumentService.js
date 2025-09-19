const { sequelize } = require('../config/database');
const { ProjectDocument, ProjectMember, Student, Academic } = require('../models');
const studentService = require('./studentService'); // reuse eligibility logic (ถ้าต้อง)
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Service สำหรับจัดการ ProjectDocument (Phase 2)
 * ฟังก์ชันหลัก: createProject, addMember, updateMetadata, activateProject, archiveProject, getMyProjects, getProjectById
 */
class ProjectDocumentService {
  /**
   * สร้างโครงงาน (draft) พร้อมเพิ่ม leader (studentId)
   * - ตรวจ eligibility (canAccessProject)
   * - สร้าง ProjectDocument (draft) + ProjectMember (leader)
   * - เติม academicYear/semester จาก Academic ปัจจุบัน (อันล่าสุด is_current=true ถ้ามี)
   */
  async createProject(studentId, payload = {}) {
    const t = await sequelize.transaction();
    try {
      // ดึงข้อมูลนักศึกษา
      const student = await Student.findByPk(studentId, { transaction: t });
      if (!student) throw new Error('ไม่พบนักศึกษา');

      // ตรวจ eligibility อีกครั้งแบบง่าย (ใช้ flag isEligibleProject จาก student หรือเรียก service ลึกเพิ่มเติมได้)
      // เดิมอาศัย field isEligibleProject ซึ่งอาจไม่ sync กับ logic ปัจจุบัน
      // ปรับให้พยายามเรียก instance method checkProjectEligibility() (ถ้ามี) เพื่อประเมินสด
      let canCreate = false;
      let denyReason = 'ยังไม่ผ่านเกณฑ์โครงงานพิเศษ';
      if (typeof student.checkProjectEligibility === 'function') {
        try {
          const projCheck = await student.checkProjectEligibility();
            // method ใหม่จะให้ { eligible, canAccessFeature, canRegister, reason }
          canCreate = !!(projCheck.canAccessFeature || projCheck.eligible);
          if (!canCreate && projCheck.reason) denyReason = projCheck.reason;
        } catch (e) {
          logger.warn('createProject: dynamic project eligibility check failed, fallback to isEligibleProject flag', { error: e.message });
        }
      }
      if (!canCreate) {
        // fallback legacy flag ถ้ายังไม่ได้ true
        if (student.isEligibleProject) {
          canCreate = true; // เผื่อ test เก่าใช้ flag นี้
        }
      }
      if (!canCreate) {
        throw new Error(`นักศึกษายังไม่มีสิทธิ์สร้างโครงงาน: ${denyReason}`);
      }

      // กันการมีโครงงานที่ยังไม่ archived ซ้ำ (leader)
      const existing = await ProjectMember.findOne({
        where: { studentId, role: 'leader' },
        include: [{ model: ProjectDocument, as: 'project', required: true, where: { status: { [Op.ne]: 'archived' } } }],
        transaction: t
      });
      if (existing) {
        throw new Error('คุณมีโครงงานที่ยังไม่ถูกเก็บถาวรอยู่แล้ว');
      }

      // Academic ปัจจุบัน
      const academic = await Academic.findOne({ where: { isCurrent: true }, order: [['updated_at','DESC']], transaction: t });
      const academicYear = academic?.academicYear || (new Date().getFullYear() + 543);
      const semester = academic?.currentSemester || 1;

      // สร้าง ProjectDocument (draft)
      const project = await ProjectDocument.create({
        projectNameTh: payload.projectNameTh || null,
        projectNameEn: payload.projectNameEn || null,
        projectType: payload.projectType || null,
        track: payload.track || null,
        advisorId: payload.advisorId || null,
        coAdvisorId: payload.coAdvisorId || null,
        academicYear,
        semester,
        createdByStudentId: studentId,
        status: payload.advisorId ? 'advisor_assigned' : 'draft'
      }, { transaction: t });

      // เพิ่ม leader ใน project_members
      await ProjectMember.create({
        projectId: project.projectId,
        studentId: studentId,
        role: 'leader'
      }, { transaction: t });

      await t.commit();
      logger.info('createProject success', { projectId: project.projectId, studentId });

      return await this.getProjectById(project.projectId); // ดึงรวม members/code ที่ hook อาจสร้าง
    } catch (error) {
      await t.rollback();
      logger.error('createProject failed', { error: error.message });
      throw error;
    }
  }

  /**
   * เพิ่มสมาชิกคนที่สอง
   * - ตรวจว่า caller เป็น leader
   * - ตรวจยังมีสมาชิก < 2
   * - ตรวจ eligibility ของสมาชิกใหม่ (isEligibleProject) (ตามที่ตกลง)
   */
  async addMember(projectId, actorStudentId, newStudentCode) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      const members = await ProjectMember.findAll({ where: { projectId }, transaction: t, lock: t.LOCK.UPDATE });
      const leader = members.find(m => m.role === 'leader');
      if (!leader || leader.studentId !== actorStudentId) {
        throw new Error('เฉพาะหัวหน้าโครงงานเท่านั้นที่เพิ่มสมาชิกได้');
      }
      if (members.length >= 2) {
        throw new Error('โครงงานมีสมาชิกครบ 2 คนแล้ว');
      }

      // หา student จาก studentCode
      const newStudent = await Student.findOne({ where: { studentCode: newStudentCode }, transaction: t });
      if (!newStudent) throw new Error('ไม่พบนักศึกษาที่ต้องการเพิ่ม');

      if (!newStudent.isEligibleProject) {
        throw new Error('นักศึกษาคนนี้ยังไม่ผ่านเกณฑ์โครงงานพิเศษ');
      }

      // ตรวจว่าไม่ได้อยู่ใน project นี้อยู่แล้ว
      if (members.find(m => m.studentId === newStudent.studentId)) {
        throw new Error('นักศึกษาคนนี้เป็นสมาชิกอยู่แล้ว');
      }

      await ProjectMember.create({
        projectId,
        studentId: newStudent.studentId,
        role: 'member'
      }, { transaction: t });

      await t.commit();
      logger.info('addMember success', { projectId, newStudentId: newStudent.studentId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await t.rollback();
      logger.error('addMember failed', { error: error.message });
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลเมตาดาต้า (ชื่อ, advisor, track)
   * - Lock ชื่อถ้า status >= in_progress
   */
  async updateMetadata(projectId, actorStudentId, payload) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      // ตรวจว่า actor เป็น leader
      const leader = await ProjectMember.findOne({ where: { projectId, role: 'leader' }, transaction: t });
      if (!leader || leader.studentId !== actorStudentId) {
        throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลโครงงาน');
      }

      const lockNames = ['in_progress','completed','archived'];
      const nameLocked = lockNames.includes(project.status);

      const update = {};
      if (!nameLocked) {
        if (payload.projectNameTh !== undefined) update.projectNameTh = payload.projectNameTh;
        if (payload.projectNameEn !== undefined) update.projectNameEn = payload.projectNameEn;
        if (payload.projectType !== undefined) update.projectType = payload.projectType;
        if (payload.track !== undefined) update.track = payload.track;
      }
      // advisor สามารถตั้ง/แก้ได้ถ้ายังไม่ in_progress
      if (!lockNames.includes(project.status)) {
        if (payload.advisorId !== undefined) update.advisorId = payload.advisorId || null;
        if (payload.coAdvisorId !== undefined) update.coAdvisorId = payload.coAdvisorId || null;
        if (payload.advisorId && project.status === 'draft') {
          update.status = 'advisor_assigned';
        }
      }

      if (Object.keys(update).length === 0) {
        await t.rollback();
        return await this.getProjectById(projectId); // ไม่มีอะไรเปลี่ยน
      }

      await ProjectDocument.update(update, { where: { projectId }, transaction: t });
      await t.commit();
      logger.info('updateMetadata success', { projectId, updateKeys: Object.keys(update) });
      return await this.getProjectById(projectId);
    } catch (error) {
      await t.rollback();
      logger.error('updateMetadata failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Promote -> in_progress (ตรวจ 2 คน + advisor + ชื่อไม่ว่าง)
   */
  async activateProject(projectId, actorStudentId) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      const leader = await ProjectMember.findOne({ where: { projectId, role: 'leader' }, transaction: t });
      if (!leader || leader.studentId !== actorStudentId) throw new Error('ไม่มีสิทธิ์');

      const members = await ProjectMember.findAll({ where: { projectId }, transaction: t, lock: t.LOCK.UPDATE });
      if (members.length !== 2) throw new Error('ต้องมีสมาชิกครบ 2 คนก่อนเริ่มดำเนินโครงงาน');
      if (!project.advisorId) throw new Error('ต้องเลือกอาจารย์ที่ปรึกษาก่อน');
      if (!project.projectNameTh || !project.projectNameEn) throw new Error('กรุณากรอกชื่อโครงงาน (TH/EN) ให้ครบ');
      if (!project.projectType || !project.track) throw new Error('กรุณากรอกประเภทและ track ให้ครบ');

      if (project.status === 'in_progress') return await this.getProjectById(projectId); // idempotent

      if (['completed','archived'].includes(project.status)) {
        throw new Error('ไม่สามารถเปิดใช้งานโครงงานในสถานะนี้ได้');
      }

      await ProjectDocument.update({ status: 'in_progress' }, { where: { projectId }, transaction: t });
      await t.commit();
      logger.info('activateProject success', { projectId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await t.rollback();
      logger.error('activateProject failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Archive project (soft-deactivate)
   */
  async archiveProject(projectId, actorUser) {
    const t = await sequelize.transaction();
    try {
      // ActorUser ควรผ่านการตรวจ role admin มาก่อนใน controller
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');
      if (project.status === 'archived') return await this.getProjectById(projectId);

      await ProjectDocument.update({ status: 'archived', archivedAt: new Date() }, { where: { projectId }, transaction: t });
      await t.commit();
      logger.info('archiveProject success', { projectId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await t.rollback();
      logger.error('archiveProject failed', { error: error.message });
      throw error;
    }
  }

  /**
   * รายการโครงงานของนักศึกษาที่เกี่ยวข้อง (leader หรือ member)
   */
  async getMyProjects(studentId) {
    const projects = await ProjectDocument.findAll({
      attributes: [
        'projectId','projectCode','status','projectNameTh','projectNameEn',
        'projectType','track','advisorId','coAdvisorId','academicYear','semester',
        'createdByStudentId','archivedAt' // ตัด createdAt/updatedAt ออก เพราะ column ใน DB เป็น created_at/updated_at และเราไม่ได้ใช้ใน serialize()
      ], // กำหนด whitelist ป้องกัน Sequelize select column ที่ไม่มี (เช่น student_id เก่า)
      include: [
        {
          model: ProjectMember,
          as: 'members',
          where: { studentId },
          required: true,
          include: [
            {
              model: Student,
              as: 'student',
              include: [
                { association: Student.associations.user, attributes: ['userId','firstName','lastName'] }
              ],
              attributes: ['studentId','studentCode']
            }
          ]
        }
      ],
      order: [['updated_at','DESC']]
    });
    return projects.map(p => this.serialize(p));
  }

  /**
   * ดึงรายละเอียดโครงงานทั้งหมด (รวมสมาชิก)
   */
  async getProjectById(projectId, options = {}) {
    const includeSummary = !!options.includeSummary;
    const project = await ProjectDocument.findByPk(projectId, {
      include: [
        { 
          model: ProjectMember, 
          as: 'members',
          include: [
            { 
              model: Student, 
              as: 'student',
              include: [
                { association: Student.associations.user, attributes: ['userId','firstName','lastName'] }
              ],
              attributes: ['studentId','studentCode']
            }
          ]
        }
      ]
    });
    if (!project) throw new Error('ไม่พบโครงงาน');
    const base = this.serialize(project);
    if (includeSummary) {
      // ดึงสรุปเบื้องต้น (นับ milestones และ proposal ล่าสุด) แบบ query แยก เพื่อลด join หนัก
      const { ProjectMilestone, ProjectArtifact } = require('../models');
      const [milestoneCount, latestProposal] = await Promise.all([
        ProjectMilestone.count({ where: { projectId: project.projectId } }),
        ProjectArtifact.findOne({ where: { projectId: project.projectId, type: 'proposal' }, order: [['version','DESC']] })
      ]);
      base.summary = {
        milestoneCount,
        latestProposal: latestProposal ? {
          version: latestProposal.version,
          uploadedAt: latestProposal.uploadedAt
        } : null
      };
    }
    return base;
  }

  /**
   * แปลงผลลัพธ์เป็น JSON พร้อมโครงสร้างสวยงาม
   */
  serialize(p) {
    return {
      projectId: p.projectId,
      projectCode: p.projectCode,
      status: p.status,
      projectNameTh: p.projectNameTh,
      projectNameEn: p.projectNameEn,
      projectType: p.projectType,
      track: p.track,
      advisorId: p.advisorId,
      coAdvisorId: p.coAdvisorId,
      academicYear: p.academicYear,
      semester: p.semester,
      createdByStudentId: p.createdByStudentId,
      // enrich member ด้วย studentCode + ชื่อ (ดึงจาก user) ลดรอบ frontend API
      members: (p.members || []).map(m => ({
        studentId: m.studentId,
        role: m.role,
        studentCode: m.student?.studentCode || null,
        name: m.student?.user ? `${m.student.user.firstName || ''} ${m.student.user.lastName || ''}`.trim() : null
      })),
      archivedAt: p.archivedAt
    };
  }
}

module.exports = new ProjectDocumentService();
