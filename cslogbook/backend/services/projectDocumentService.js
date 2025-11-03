const { sequelize } = require('../config/database');
let ProjectDocument;
let ProjectMember;
let ProjectWorkflowState;
let Student;
let Academic;
let ProjectTrack;
let Meeting;
let MeetingParticipant;
let MeetingLog;
let ProjectDefenseRequest;
let ProjectTestRequest;
let ProjectExamResult;
let Document;
let User;

const resolveModelsPath = () => require.resolve('../models');
const IS_JEST = Boolean(process.env.JEST_WORKER_ID);

const attachModels = () => {
  if (process.env.NODE_ENV === 'test') {
    // ลบ cache ของ require เพื่อให้ Jest ใช้ mock model ที่กำหนดในแต่ละเทสต์
    delete require.cache[resolveModelsPath()];
  }

  ({
    ProjectDocument,
    ProjectMember,
    ProjectWorkflowState,
    Student,
    Academic,
    ProjectTrack,
    Meeting,
    MeetingParticipant,
    MeetingLog,
    ProjectDefenseRequest,
    ProjectTestRequest,
    ProjectExamResult,
    Document,
    User
  } = require('../models'));
};

attachModels();

const ensureModels = () => {
  attachModels();
};
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const workflowService = require('./workflowService');

// กำหนดจำนวน log การพบอาจารย์ที่ต้องได้รับการอนุมัติขั้นต่ำก่อนถือว่า "พร้อมสอบ"
const REQUIRED_APPROVED_MEETING_LOGS = 4;
const THESIS_REQUIRED_APPROVED_MEETING_LOGS = 4;
const VALID_MEETING_PHASES = new Set(['phase1', 'phase2']);

const toPlainObject = (instance) => {
  if (!instance) return null;
  return typeof instance.toJSON === 'function' ? instance.toJSON() : instance;
};

const mapUserSummary = (userInstance) => {
  const user = toPlainObject(userInstance);
  if (!user) return null;
  return {
    userId: user.userId ?? user.user_id ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
    role: user.role ?? null
  };
};

const normalizeFinalDocument = (documentInstance) => {
  const doc = toPlainObject(documentInstance);
  if (!doc) return null;

  const resolveTimestamp = (primary, fallbackKey) => {
    if (primary) return primary;
    if (fallbackKey && doc[fallbackKey]) return doc[fallbackKey];
    return null;
  };

  return {
    documentId: doc.documentId ?? doc.document_id ?? null,
    documentName: doc.documentName ?? doc.document_name ?? null,
    status: doc.status ?? null,
    reviewComment: doc.reviewComment ?? doc.review_comment ?? null,
    reviewDate: resolveTimestamp(doc.reviewDate, 'review_date'),
    submittedAt:
      resolveTimestamp(doc.submittedAt, 'submitted_at') ||
      resolveTimestamp(doc.createdAt, 'created_at'),
    downloadCount: doc.downloadCount ?? doc.download_count ?? 0,
    downloadStatus: doc.downloadStatus ?? doc.download_status ?? null,
    owner: mapUserSummary(doc.owner),
    reviewer: mapUserSummary(doc.reviewer)
  };
};

const normalizeExamResult = (examResultInstance) => {
  const result = toPlainObject(examResultInstance);
  if (!result) return null;

  return {
    examResultId: result.examResultId ?? result.exam_result_id ?? null,
    projectId: result.projectId ?? result.project_id ?? null,
    examType: result.examType ?? result.exam_type ?? null,
    result: result.result ?? null,
    score: result.score ?? null,
    notes: result.notes ?? null,
    requireScopeRevision: Boolean(result.requireScopeRevision ?? result.require_scope_revision),
    recordedAt: result.recordedAt ?? result.recorded_at ?? null,
    recordedByUserId: result.recordedByUserId ?? result.recorded_by_user_id ?? null,
    recordedBy: mapUserSummary(result.recordedBy),
    studentAcknowledgedAt: result.studentAcknowledgedAt ?? result.student_acknowledged_at ?? null
  };
};

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
    ensureModels();
    const t = await sequelize.transaction();
    try {
      // ดึงข้อมูลนักศึกษา
      const student = await Student.findByPk(studentId, { transaction: t });
      if (!student) throw new Error('ไม่พบนักศึกษา');

      // Gating: ป้องกันสร้างหัวข้อใหม่ถ้ามีโครงงานที่สอบไม่ผ่านและเพิ่ง acknowledge รอรอบใหม่
      // เกณฑ์ง่ายเบื้องต้น: ยังมี project failed+archived ที่ยังไม่ถูก purge (studentAcknowledgedAt != null และ examResult='failed')
      // สามารถขยายเป็นตรวจ window จริงในอนาคต (เชื่อม ImportantDeadline หรือ Academic window)
      const blockExisting = await ProjectMember.findOne({
        where: { studentId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          required: true,
          where: { examResult: 'failed', status: 'archived', studentAcknowledgedAt: { [Op.ne]: null } }
        }],
        transaction: t
      });
      if (blockExisting) {
        throw new Error('คุณเพิ่งรับทราบผลสอบหัวข้อไม่ผ่าน กรุณารอรอบการยื่นหัวข้อถัดไปก่อนสร้างหัวข้อใหม่');
      }

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

      // กันการมีโครงงานที่ยังไม่ archived ซ้ำ (ไม่ว่าจะเป็น leader หรือ member)
      const existing = await ProjectMember.findOne({
        where: { studentId },
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

      // 🆕 เตรียม second member (REQUIRED - โครงงานพิเศษต้องมี 2 คน)
      let secondMember = null;
      if (!payload.secondMemberStudentCode) {
        throw new Error('โครงงานพิเศษต้องมีสมาชิก 2 คน กรุณาระบุรหัสนักศึกษาคนที่ 2');
      }

      const code = String(payload.secondMemberStudentCode).trim();
      if (!/^[0-9]{5,13}$/.test(code)) {
        throw new Error('รูปแบบรหัสนักศึกษาไม่ถูกต้อง');
      }
      // หา student
      secondMember = await Student.findOne({ where: { studentCode: code }, transaction: t });
      if (!secondMember) {
        throw new Error('ไม่พบนักศึกษาที่ต้องการเพิ่ม');
      }
      if (secondMember.studentId === studentId) {
        throw new Error('ไม่สามารถเพิ่มตัวเองซ้ำเป็นสมาชิกได้');
      }
      if (!secondMember.isEligibleProject) {
        throw new Error('นักศึกษาคนนี้ยังไม่ผ่านเกณฑ์โครงงานพิเศษ');
      }
      // ตรวจว่ามีสมาชิกในโครงงานที่ยังไม่ archived อยู่แล้วหรือไม่ (business rule: 1 active project ต่อ 1 นักศึกษา)
      const existingActiveMembership = await ProjectMember.findOne({
        where: { studentId: secondMember.studentId },
        include: [{ model: ProjectDocument, as: 'project', required: true, where: { status: { [Op.ne]: 'archived' } } }],
        transaction: t
      });
      if (existingActiveMembership) {
        throw new Error('นักศึกษาคนนี้มีโครงงานที่ยังไม่ถูกเก็บถาวรอยู่แล้ว');
      }

      // สร้าง ProjectDocument (draft) - ไม่บังคับ advisorId ในตอนสร้าง
      const project = await ProjectDocument.create({
        projectNameTh: payload.projectNameTh || null,
        projectNameEn: payload.projectNameEn || null,
        projectType: payload.projectType || null,
        advisorId: null, // 🆕 ไม่กำหนดอาจารย์ที่ปรึกษาในตอนยื่นหัวข้อ
        coAdvisorId: null, // 🆕 ไม่กำหนด co-advisor ในตอนยื่นหัวข้อ
        // ฟิลด์รายละเอียด (คพ.01) (optional ขณะ draft)
        objective: payload.objective || null,
        background: payload.background || null,
        scope: payload.scope || null,
        expectedOutcome: payload.expectedOutcome || null,
        benefit: payload.benefit || null,
        methodology: payload.methodology || null,
        tools: payload.tools || null,
        timelineNote: payload.timelineNote || null,
        risk: payload.risk || null,
        constraints: payload.constraints || null,
        academicYear,
        semester,
        createdByStudentId: studentId,
        status: 'draft' // 🆕 เริ่มต้นเป็น draft เสมอ (ไม่ขึ้นกับ advisorId)
      }, { transaction: t });

      // tracks array (payload.tracks: array ของ code เช่น NETSEC) -> สร้าง ProjectTrack
      if (Array.isArray(payload.tracks) && payload.tracks.length) {
        const uniqCodes = [...new Set(payload.tracks.filter(c => !!c))];
        await ProjectTrack.bulkCreate(uniqCodes.map(code => ({ projectId: project.projectId, trackCode: code })), { transaction: t });
      }

      // เพิ่ม leader ใน project_members
      await ProjectMember.create({
        projectId: project.projectId,
        studentId: studentId,
        role: 'leader'
      }, { transaction: t });

      // 🆕 เพิ่ม second member (required) ทันทีใน transaction เดียว
      await ProjectMember.create({
        projectId: project.projectId,
        studentId: secondMember.studentId,
        role: 'member'
      }, { transaction: t });

      await project.reload({
        include: [{
          model: ProjectMember,
          as: 'members',
          include: [{ model: Student, as: 'student' }]
        }, {
          model: ProjectTrack,
          as: 'tracks'
        }],
        transaction: t
      });

      // 🆕 สร้าง ProjectWorkflowState สำหรับโครงงานใหม่
      await ProjectWorkflowState.createForProject(project.projectId, {
        phase: 'DRAFT', // 🆕 เริ่มต้นเป็น DRAFT เสมอ
        userId: studentId,
        transaction: t
      });

      await this.syncProjectWorkflowState(project.projectId, { transaction: t, projectInstance: project });

      await t.commit();
      logger.info('createProject success', { projectId: project.projectId, studentId });

      return await this.getProjectById(project.projectId); // ดึงรวม members/code ที่ hook อาจสร้าง
    } catch (error) {
      await this.safeRollback(t);
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
    ensureModels();
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

      // ตรวจว่าไม่ได้อยู่ในโครงงาน active อื่น (non-archived)
      const existingActiveMembership = await ProjectMember.findOne({
        where: { studentId: newStudent.studentId },
        include: [{ model: ProjectDocument, as: 'project', required: true, where: { status: { [Op.ne]: 'archived' }, projectId: { [Op.ne]: projectId } } }],
        transaction: t
      });
      if (existingActiveMembership) {
        throw new Error('นักศึกษาคนนี้มีโครงงานที่ยังไม่ถูกเก็บถาวรอยู่แล้ว');
      }

      await ProjectMember.create({
        projectId,
        studentId: newStudent.studentId,
        role: 'member'
      }, { transaction: t });

      await this.syncProjectWorkflowState(projectId, { transaction: t });

      await t.commit();
      logger.info('addMember success', { projectId, newStudentId: newStudent.studentId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
      logger.error('addMember failed', { error: error.message });
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลเมตาดาต้า (ชื่อ, advisor, track)
   * - Lock ชื่อถ้า status >= in_progress
   */
  async updateMetadata(projectId, actorStudentId, payload) {
    ensureModels();
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      // ตรวจว่า actor เป็น leader
      const leader = await ProjectMember.findOne({ where: { projectId, role: 'leader' }, transaction: t });
      if (!leader || leader.studentId !== actorStudentId) {
        throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลโครงงาน');
      }

      const lockNames = ['advisor_assigned','in_progress','completed','archived'];
      const nameLocked = lockNames.includes(project.status);

      const update = {};
      if (!nameLocked) {
        if (payload.projectNameTh !== undefined) update.projectNameTh = payload.projectNameTh;
        if (payload.projectNameEn !== undefined) update.projectNameEn = payload.projectNameEn;
      }
      // projectType อนุญาตให้แก้ไขหลัง in_progress ตาม requirement ใหม่
      if (payload.projectType !== undefined) update.projectType = payload.projectType;
      // ฟิลด์รายละเอียด (เปิดให้แก้ไขเสมอ ไม่ล็อกหลัง in_progress ตาม requirement ใหม่)
      if (payload.objective !== undefined) update.objective = payload.objective;
      if (payload.background !== undefined) update.background = payload.background;
      if (payload.scope !== undefined) update.scope = payload.scope;
      if (payload.expectedOutcome !== undefined) update.expectedOutcome = payload.expectedOutcome;
      if (payload.benefit !== undefined) update.benefit = payload.benefit;
      if (payload.methodology !== undefined) update.methodology = payload.methodology;
      if (payload.tools !== undefined) update.tools = payload.tools;
      if (payload.timelineNote !== undefined) update.timelineNote = payload.timelineNote;
      if (payload.risk !== undefined) update.risk = payload.risk;
      if (payload.constraints !== undefined) update.constraints = payload.constraints;
      // 🆕 ไม่อนุญาตให้นักศึกษาแก้ไข advisor ผ่านฟังก์ชันนี้
      // advisor จะถูกกำหนดโดยเจ้าหน้าที่ภาควิชาผ่านฟังก์ชัน setExamResult เท่านั้น

      let trackCodesUpdate = null;
      if (Array.isArray(payload.tracks)) {
        trackCodesUpdate = [...new Set(payload.tracks.filter(c => !!c))];
      } else if (payload.track !== undefined) {
        const normalized = String(payload.track || '').trim();
        trackCodesUpdate = normalized ? [normalized] : [];
      }

      if (Object.keys(update).length === 0 && !trackCodesUpdate) {
        await t.rollback();
        return await this.getProjectById(projectId); // ไม่มีอะไรเปลี่ยน
      }

      if (trackCodesUpdate) {
        update.track = trackCodesUpdate[0] || null;
      }

      await ProjectDocument.update(update, { where: { projectId }, transaction: t });

      // อัปเดต tracks: simple replace strategy (ลบของเก่า แล้ว insert ใหม่)
      if (trackCodesUpdate) {
        await ProjectTrack.destroy({ where: { projectId }, transaction: t });
        if (trackCodesUpdate.length) {
          await ProjectTrack.bulkCreate(trackCodesUpdate.map(code => ({ projectId, trackCode: code })), { transaction: t });
        }
      }

      await this.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();
      logger.info('updateMetadata success', { projectId, updateKeys: Object.keys(update) });
      return await this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
      logger.error('updateMetadata failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Promote -> in_progress (ตรวจ 2 คน + advisor + ชื่อไม่ว่าง)
   */
  async activateProject(projectId, actorStudentId) {
    ensureModels();
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

  await this.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();
      logger.info('activateProject success', { projectId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
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

  await this.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();
      logger.info('archiveProject success', { projectId });
      return await this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
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
        'projectType','advisorId','coAdvisorId','academicYear','semester',
        'objective','background','scope','expected_outcome','benefit','methodology','tools','timeline_note','risk','constraints',
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
              // เพิ่ม attributes หน่วยกิตสำหรับนำไปแสดงผลหน้า Draft Detail
              attributes: ['studentId','studentCode','totalCredits','majorCredits']
            }
          ]
        },
        { model: ProjectTrack, as: 'tracks', attributes: ['trackCode'] }
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
    ensureModels();
    const includes = [
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
      },
      { model: ProjectTrack, as: 'tracks', attributes: ['trackCode'] },
      { model: ProjectDefenseRequest, as: 'defenseRequests' }
    ];

    if (Document) {
      const documentInclude = [];
      if (User) {
        documentInclude.push({ model: User, as: 'owner', attributes: ['userId', 'firstName', 'lastName', 'email'] });
        documentInclude.push({ model: User, as: 'reviewer', attributes: ['userId', 'firstName', 'lastName', 'email'] });
      }
      includes.push({
        model: Document,
        as: 'document',
        required: false,
        ...(documentInclude.length ? { include: documentInclude } : {})
      });
    }

    if (ProjectExamResult) {
      const examResultInclude = [];
      if (User) {
        examResultInclude.push({ model: User, as: 'recordedBy', attributes: ['userId', 'firstName', 'lastName', 'role'] });
      }
      includes.push({
        model: ProjectExamResult,
        as: 'examResults',
        required: false,
        ...(examResultInclude.length ? { include: examResultInclude } : {})
      });
    }

    const project = await ProjectDocument.findByPk(projectId, {
      include: includes
    });
    if (!project) throw new Error('ไม่พบโครงงาน');
    const base = this.serialize(project);
    const memberStudentIds = (base.members || []).map(member => member.studentId).filter(Boolean);
    const buildMetricsPayload = (metrics, requiredApprovedLogs) => ({
      requiredApprovedLogs,
      totalMeetings: metrics?.totalMeetings || 0,
      totalApprovedLogs: metrics?.totalApprovedLogs || 0,
      lastApprovedLogAt: metrics?.lastApprovedLogAt || null,
      perStudent: memberStudentIds.map(studentId => ({
        studentId,
        approvedLogs: metrics?.perStudent?.[studentId]?.approvedLogs || 0,
        attendedMeetings: metrics?.perStudent?.[studentId]?.attendedMeetings || 0
      }))
    });
    const cloneMetrics = (payload) => ({
      ...payload,
      perStudent: (payload.perStudent || []).map(entry => ({ ...entry }))
    });

    try {
      if (memberStudentIds.length) {
        const students = await Student.findAll({ where: { studentId: memberStudentIds } });
        // แยกนับบันทึกการพบตาม phase เพื่อให้ Phase 1 และ Phase 2 ใช้เกณฑ์คนละชุด
        const [phase1Metrics, phase2Metrics] = await Promise.all([
          this.buildProjectMeetingMetrics(project.projectId, students, { phase: 'phase1' }),
          this.buildProjectMeetingMetrics(project.projectId, students, { phase: 'phase2' })
        ]);
        const phase1Payload = buildMetricsPayload(phase1Metrics, REQUIRED_APPROVED_MEETING_LOGS);
        const phase2Payload = buildMetricsPayload(phase2Metrics, THESIS_REQUIRED_APPROVED_MEETING_LOGS);
        base.meetingMetrics = cloneMetrics(phase1Payload);
        base.meetingMetricsPhase1 = cloneMetrics(phase1Payload);
        base.meetingMetricsPhase2 = cloneMetrics(phase2Payload);
      } else {
        const emptyPhase1 = buildMetricsPayload(null, REQUIRED_APPROVED_MEETING_LOGS);
        const emptyPhase2 = buildMetricsPayload(null, THESIS_REQUIRED_APPROVED_MEETING_LOGS);
        base.meetingMetrics = cloneMetrics(emptyPhase1);
        base.meetingMetricsPhase1 = cloneMetrics(emptyPhase1);
        base.meetingMetricsPhase2 = cloneMetrics(emptyPhase2);
      }
    } catch (error) {
      logger.warn('getProjectById meeting metrics failed', { projectId, error: error.message });
      const fallbackPhase1 = buildMetricsPayload(null, REQUIRED_APPROVED_MEETING_LOGS);
      const fallbackPhase2 = buildMetricsPayload(null, THESIS_REQUIRED_APPROVED_MEETING_LOGS);
      base.meetingMetrics = cloneMetrics(fallbackPhase1);
      base.meetingMetricsPhase1 = cloneMetrics(fallbackPhase1);
      base.meetingMetricsPhase2 = cloneMetrics(fallbackPhase2);
    }
    try {
      const latestSystemTest = await ProjectTestRequest.findOne({
        where: { projectId: project.projectId },
        order: [['submittedAt', 'DESC']],
        attributes: ['requestId', 'status', 'submittedAt', 'testStartDate', 'testDueDate', 'evidenceSubmittedAt']
      });
      base.systemTestRequest = latestSystemTest ? {
        requestId: latestSystemTest.requestId,
        status: latestSystemTest.status,
        submittedAt: latestSystemTest.submittedAt,
        testStartDate: latestSystemTest.testStartDate,
        testDueDate: latestSystemTest.testDueDate,
        evidenceSubmittedAt: latestSystemTest.evidenceSubmittedAt
      } : null;
    } catch (error) {
      logger.warn('getProjectById system test summary failed', { projectId, error: error.message });
      base.systemTestRequest = null;
    }
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
    const finalDocument = normalizeFinalDocument(p.document);
    const examResults = Array.isArray(p.examResults)
      ? p.examResults
          .map(normalizeExamResult)
          .filter(Boolean)
          .sort((a, b) => {
            const aTime = a?.recordedAt ? new Date(a.recordedAt).getTime() : 0;
            const bTime = b?.recordedAt ? new Date(b.recordedAt).getTime() : 0;
            return bTime - aTime;
          })
      : [];

    return {
      projectId: p.projectId,
      projectCode: p.projectCode,
      status: p.status,
      projectNameTh: p.projectNameTh,
      projectNameEn: p.projectNameEn,
      projectType: p.projectType,
      createdAt: p.createdAt || p.created_at || null,
      updatedAt: p.updatedAt || p.updated_at || null,
      topicSubmittedAt: p.createdAt || p.created_at || null,
      tracks: (p.tracks || []).map(t => t.trackCode),
      advisorId: p.advisorId,
      coAdvisorId: p.coAdvisorId,
      objective: p.objective,
      background: p.background,
      scope: p.scope,
      expectedOutcome: p.expectedOutcome,
      benefit: p.benefit,
      methodology: p.methodology,
      tools: p.tools,
      timelineNote: p.timelineNote,
      risk: p.risk,
      constraints: p.constraints,
      academicYear: p.academicYear,
      semester: p.semester,
      createdByStudentId: p.createdByStudentId,
      examResult: p.examResult,
      examFailReason: p.examFailReason,
      examResultAt: p.examResultAt,
      studentAcknowledgedAt: p.studentAcknowledgedAt,
      // enrich member ด้วย studentCode + ชื่อ (ดึงจาก user) ลดรอบ frontend API
      members: (p.members || []).map(m => ({
        studentId: m.studentId,
        role: m.role,
        studentCode: m.student?.studentCode || null,
        name: m.student?.user ? `${m.student.user.firstName || ''} ${m.student.user.lastName || ''}`.trim() : null,
        totalCredits: m.student?.totalCredits ?? null,
        majorCredits: m.student?.majorCredits ?? null
      })),
      archivedAt: p.archivedAt,
      defenseRequests: (p.defenseRequests || []).map(req => ({
        requestId: req.requestId,
        defenseType: req.defenseType,
        status: req.status,
        formPayload: req.formPayload,
        submittedByStudentId: req.submittedByStudentId,
        submittedAt: req.submittedAt,
        defenseScheduledAt: req.defenseScheduledAt,
        defenseLocation: req.defenseLocation,
        defenseNote: req.defenseNote,
        scheduledByUserId: req.scheduledByUserId,
        scheduledAt: req.scheduledAt
      })),
      finalDocument,
      document: finalDocument,
      examResults
    };
  }

  getRequiredApprovedMeetingLogs() {
    // คืนค่ามาตรฐานจำนวนบันทึกการพบที่ต้องได้รับอนุมัติ เพื่อใช้เป็นเกณฑ์กลางทั้งฝั่ง UI และ Service อื่น
    return REQUIRED_APPROVED_MEETING_LOGS;
  }

  /**
   * บันทึกผลสอบหัวข้อโครงงาน
   */
  async setExamResult(projectId, { result, reason, advisorId, actorUser, allowOverwrite = false }) {
    ensureModels();
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!project) throw new Error('ไม่พบโครงงาน');
      // ป้องกันการบันทึกซ้ำ (อนุญาต overwrite เมื่อ allowOverwrite = true)
      if (project.examResult && !allowOverwrite) {
        throw new Error('มีการบันทึกผลสอบหัวข้อนี้แล้ว');
      }
      const updatePayload = {
        examResult: result,
        examFailReason: reason || null,
        examResultAt: new Date(),
        status: result === 'passed' ? 'in_progress' : project.status
      };

      if (advisorId !== undefined) {
        updatePayload.advisorId = advisorId;
      }

      await ProjectDocument.update(updatePayload, { where: { projectId }, transaction: t });
      await ProjectDefenseRequest.update({
        status: 'completed'
      }, {
        where: {
          projectId,
          defenseType: 'PROJECT1',
          status: { [Op.ne]: 'cancelled' }
        },
        transaction: t
      });
      await this.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();
      return this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
      throw error;
    }
  }

  /**
   * นักศึกษากด “รับทราบผล” (กรณีไม่ผ่าน) -> บันทึกเวลายืนยัน และ archive โครงงานเพื่อเตรียมยื่นรอบใหม่
   * Business rule:
   *  - ต้องเป็นสมาชิกโครงงาน (leader หรือ member)
   *  - examResult ต้องเป็น failed
   *  - ยังไม่ acknowledge มาก่อน
   *  - Archive โดยเปลี่ยน status='archived' + archivedAt=NOW() (ไม่ลบข้อมูลจริง เพื่อเก็บประวัติ)
   */
  async acknowledgeExamResult(projectId, studentId) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { include: [{ model: ProjectMember, as: 'members' }], transaction: t, lock: t.LOCK.UPDATE });
      if (!project) throw new Error('ไม่พบโครงงาน');
      if (project.examResult !== 'failed') {
        throw new Error('โครงงานนี้ไม่ได้อยู่ในสถานะผลสอบไม่ผ่าน');
      }
      if (project.studentAcknowledgedAt) {
        throw new Error('มีการรับทราบผลไปแล้ว');
      }
      const isMember = (project.members || []).some(m => m.studentId === Number(studentId));
      if (!isMember) {
        throw new Error('คุณไม่มีสิทธิ์รับทราบผลของโครงงานนี้');
      }
      await ProjectDocument.update({
        studentAcknowledgedAt: new Date(),
        status: 'archived',
        archivedAt: new Date()
      }, { where: { projectId }, transaction: t });
      await this.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();
      return this.getProjectById(projectId);
    } catch (error) {
      await this.safeRollback(t);
      throw error;
    }
  }

  async safeRollback(transaction) {
    if (!transaction || transaction.finished) {
      return;
    }
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.warn('transaction rollback failed', { error: rollbackError.message });
    }
  }

  async syncProjectWorkflowState(projectId, { transaction, projectInstance } = {}) {
    try {
      let project = projectInstance;
      if (!project) {
        const defenseRequestModel = sequelize.models.ProjectDefenseRequest;
        const includes = [{
          model: ProjectMember,
          as: 'members',
          include: [{ model: Student, as: 'student' }]
        }, {
          model: ProjectTrack,
          as: 'tracks'
        }];
        if (defenseRequestModel) {
          includes.push({ model: defenseRequestModel, as: 'defenseRequests' });
        }
        project = await ProjectDocument.findByPk(projectId, {
          include: includes,
          transaction
        });
      }

      if (!project) {
        logger.warn('syncProjectWorkflowState: ไม่พบโครงงาน', { projectId });
        return;
      }

      const memberStudentIds = (project.members || [])
        .map(member => member.studentId || member.student?.studentId)
        .filter(Boolean);

      if (!memberStudentIds.length) {
        return;
      }

      const students = await Student.findAll({
        where: { studentId: memberStudentIds },
        transaction
      });

  const meetingMetrics = await this.buildProjectMeetingMetrics(project.projectId, students, { transaction, phase: 'phase1' });

      // 🆕 อัปเดต meeting count ใน ProjectWorkflowState
      if (meetingMetrics.totalLogs !== undefined || meetingMetrics.approvedLogs !== undefined) {
        await ProjectWorkflowState.updateMeetingCount(
          project.projectId,
          meetingMetrics.totalLogs || 0,
          meetingMetrics.approvedLogs || 0,
          { userId: null, transaction }
        );
      }

      for (const student of students) {
        const state = this.computeProjectWorkflowState(project, student, meetingMetrics);

        await Student.update({
          isEnrolledProject: state.isEnrolledProject,
          projectStatus: state.studentProjectStatus
        }, {
          where: { studentId: student.studentId },
          transaction
        });

        await workflowService.updateStudentWorkflowActivity(
          student.studentId,
          'project1',
          state.currentStepKey,
          state.currentStepStatus,
          state.overallStatus,
          state.dataPayload,
          { transaction }
        );
      }
    } catch (error) {
      logger.error('syncProjectWorkflowState failed', { projectId, error: error.message });
      throw error;
    }
  }

  async syncStudentProjectsWorkflow(studentId, { transaction } = {}) {
    try {
      const projects = await ProjectDocument.findAll({
        include: [{
          model: ProjectMember,
          as: 'members',
          include: [{ model: Student, as: 'student' }],
          required: false
        }],
        where: { '$members.student_id$': studentId },
        transaction
      });

      for (const project of projects) {
        // รีโหลดข้อมูลโปรเจกต์เพื่อให้ได้สมาชิกครบทุกคนก่อนคำนวณ workflow
        await this.syncProjectWorkflowState(project.projectId, { transaction });
      }
    } catch (error) {
      logger.error('syncStudentProjectsWorkflow failed', { studentId, error: error.message });
      throw error;
    }
  }

  async buildProjectMeetingMetrics(projectId, students, { transaction, phase } = {}) {
    const metrics = {
      totalMeetings: 0,
      totalApprovedLogs: 0,
      lastApprovedLogAt: null,
      perStudent: {}
    };

    if (!Array.isArray(students) || !students.length) {
      return metrics;
    }

    try {
      const userToStudentId = {};
      const userIds = [];

      students.forEach(student => {
        if (!student) return;
        metrics.perStudent[student.studentId] = { approvedLogs: 0, attendedMeetings: 0 };
        if (student.userId) {
          userToStudentId[student.userId] = student.studentId;
          userIds.push(student.userId);
        }
      });

      const uniqueUserIds = [...new Set(userIds)];

      if (!uniqueUserIds.length) {
        return metrics;
      }

      const meetingWhere = { projectId };
      if (phase !== undefined && phase !== null) {
        const normalizedPhases = [];
        const pushPhase = (value) => {
          if (typeof value !== 'string') return;
          const trimmed = value.trim().toLowerCase();
          if (!trimmed) return;
          if (!VALID_MEETING_PHASES.has(trimmed)) return;
          if (!normalizedPhases.includes(trimmed)) {
            normalizedPhases.push(trimmed);
          }
        };

        if (Array.isArray(phase)) {
          phase.forEach(pushPhase);
        } else {
          pushPhase(phase);
        }

        if (normalizedPhases.length === 1) {
          meetingWhere.phase = normalizedPhases[0];
        } else if (normalizedPhases.length > 1) {
          meetingWhere.phase = { [Op.in]: normalizedPhases };
        }
      }

      const meetings = await Meeting.findAll({
        attributes: ['meetingId'],
        where: meetingWhere,
        transaction,
        raw: true
      });

      metrics.totalMeetings = meetings.length;
      if (!meetings.length) {
        return metrics;
      }

      const meetingIds = meetings.map(meeting => meeting.meetingId);

      const participantRows = await MeetingParticipant.findAll({
        attributes: ['meetingId', 'userId'],
        where: {
          meetingId: { [Op.in]: meetingIds },
          userId: { [Op.in]: uniqueUserIds },
          role: 'student',
          attendanceStatus: { [Op.ne]: 'absent' }
        },
        transaction,
        raw: true
      });

      const participantsByMeeting = new Map();
      const studentMeetingSets = new Map();

      participantRows.forEach(row => {
        const studentId = userToStudentId[row.userId];
        if (!studentId) return;

        if (!participantsByMeeting.has(row.meetingId)) {
          participantsByMeeting.set(row.meetingId, new Set());
        }
        participantsByMeeting.get(row.meetingId).add(studentId);

        if (!studentMeetingSets.has(studentId)) {
          studentMeetingSets.set(studentId, new Set());
        }
        studentMeetingSets.get(studentId).add(row.meetingId);
      });

      studentMeetingSets.forEach((meetingSet, studentId) => {
        metrics.perStudent[studentId].attendedMeetings = meetingSet.size;
      });

      const approvedLogs = await MeetingLog.findAll({
        attributes: ['meetingId', 'approvedAt'],
        where: {
          meetingId: { [Op.in]: meetingIds },
          approvalStatus: 'approved'
        },
        order: [['approved_at', 'DESC']],
        transaction,
        raw: true
      });

      metrics.totalApprovedLogs = approvedLogs.length;

      approvedLogs.forEach(log => {
        if (!metrics.lastApprovedLogAt && log.approvedAt) {
          metrics.lastApprovedLogAt = log.approvedAt;
        }

        const studentSet = participantsByMeeting.get(log.meetingId);
        if (!studentSet) return;

        studentSet.forEach(studentId => {
          const current = metrics.perStudent[studentId];
          if (!current) return;
          current.approvedLogs += 1;
        });
      });

      return metrics;
    } catch (error) {
      logger.warn('buildProjectMeetingMetrics failed', { projectId, error: error.message });
      return metrics;
    }
  }

  computeProjectWorkflowState(project, student, meetingMetrics = {}) {
    const members = project.members || [];
    const membersCount = members.length;
    const examResult = project.examResult;
    const status = project.status;
    const acknowledged = !!project.studentAcknowledgedAt;
    const hasAdvisor = !!project.advisorId;
    const isExamFailed = examResult === 'failed';
    const isExamFailedAcknowledged = isExamFailed && acknowledged;
    const defenseRequests = project.defenseRequests || [];
    const project1DefenseRequest = defenseRequests.find(request => request.defenseType === 'PROJECT1' && request.status !== 'cancelled') || null;
    const project1DefenseRequestSubmitted = !!project1DefenseRequest;
    const project1DefenseScheduleInfo = project1DefenseRequest && project1DefenseRequest.defenseScheduledAt
      ? {
        scheduledAt: project1DefenseRequest.defenseScheduledAt,
        location: project1DefenseRequest.defenseLocation,
        note: project1DefenseRequest.defenseNote
      }
      : null;
  const project1DefenseScheduled = project1DefenseRequestSubmitted && ['staff_verified', 'scheduled', 'completed'].includes(project1DefenseRequest.status);

    const studentMetrics = meetingMetrics.perStudent?.[student.studentId] || { approvedLogs: 0, attendedMeetings: 0 };
    const approvedMeetingLogs = studentMetrics.approvedLogs || 0;
    const attendedMeetings = studentMetrics.attendedMeetings || 0;
    const hasAnyApprovedMeetingLog = approvedMeetingLogs > 0;
  // readinessApproved จะเป็น true เมื่อมีบันทึกการพบที่ได้รับอนุมัติครบตามเกณฑ์ เพื่อสะท้อนสถานะ "พร้อมสอบ"
  const readinessApproved = approvedMeetingLogs >= REQUIRED_APPROVED_MEETING_LOGS;
    const hasTopicTitles = !!project.projectNameTh && !!project.projectNameEn;
  // topicSubmissionComplete บ่งบอกว่ามีทีมครบและกรอกข้อมูลสำหรับส่งหัวข้อแล้ว (ไม่บังคับเลือกอาจารย์ล่วงหน้า)
  const topicSubmissionComplete = !!student.isEligibleProject && membersCount >= 2 && hasTopicTitles;
    const projectInProgress = ['in_progress', 'completed', 'archived'].includes(status);

    const steps = [
      { key: 'PROJECT1_TEAM_READY', completed: topicSubmissionComplete },
      { key: 'PROJECT1_IN_PROGRESS', completed: projectInProgress },
      { key: 'PROJECT1_PROGRESS_CHECKINS', completed: projectInProgress && hasAnyApprovedMeetingLog },
      { key: 'PROJECT1_READINESS_REVIEW', completed: projectInProgress && readinessApproved },
      { key: 'PROJECT1_DEFENSE_REQUEST', completed: project1DefenseRequestSubmitted },
      { key: 'PROJECT1_DEFENSE_SCHEDULED', completed: project1DefenseScheduled },
      { key: 'PROJECT1_DEFENSE_RESULT', completed: examResult === 'passed' || (isExamFailed && acknowledged), blocked: isExamFailed && !acknowledged }
    ];

    let overallStatus = 'not_started';
    if (status === 'archived' && acknowledged) {
      overallStatus = 'archived';
    } else if (isExamFailed) {
      overallStatus = 'failed';
    } else if (examResult === 'passed' || status === 'completed') {
      overallStatus = 'completed';
    } else if (projectInProgress || topicSubmissionComplete) {
      overallStatus = 'in_progress';
    }

    let currentStepKey = steps[steps.length - 1].key;
    let currentStepStatus = 'completed';

    for (const step of steps) {
      if (step.blocked) {
        currentStepKey = step.key;
        currentStepStatus = 'blocked';
        break;
      }

      if (!step.completed) {
        currentStepKey = step.key;
        currentStepStatus = this.getProjectStepPendingStatus(step.key);
        break;
      }
    }

    const isEnrolledProject = status !== 'archived';
    let studentProjectStatus = 'in_progress';
    if (isExamFailed) {
      studentProjectStatus = 'failed';
    } else if (overallStatus === 'completed') {
      studentProjectStatus = 'completed';
    } else if (overallStatus === 'archived') {
      studentProjectStatus = 'not_started';
    }

    return {
      currentStepKey,
      currentStepStatus,
      overallStatus,
      isEnrolledProject,
      studentProjectStatus,
      dataPayload: {
        projectId: project.projectId,
        projectStatus: status,
        examResult,
        membersCount,
        advisorId: project.advisorId,
        archivedAt: project.archivedAt,
        studentAcknowledgedAt: project.studentAcknowledgedAt,
        topicSubmitted: topicSubmissionComplete,
        project1DefenseRequestSubmitted,
        project1DefenseScheduled,
        project1DefenseSchedule: project1DefenseScheduleInfo,
        failureAcknowledged: isExamFailedAcknowledged,
        meetingMetrics: {
          approvedLogs: approvedMeetingLogs,
          requiredApprovedLogs: REQUIRED_APPROVED_MEETING_LOGS,
          attendedMeetings,
          totalApprovedLogs: meetingMetrics.totalApprovedLogs || 0,
          totalMeetings: meetingMetrics.totalMeetings || 0,
          lastApprovedLogAt: meetingMetrics.lastApprovedLogAt || null
        }
      }
    };
  }

  getProjectStepPendingStatus(stepKey) {
    switch (stepKey) {
      case 'PROJECT1_TEAM_READY':
        return 'awaiting_student_action';
      case 'PROJECT1_IN_PROGRESS':
        return 'awaiting_student_action';
      case 'PROJECT1_PROGRESS_CHECKINS':
        return 'in_progress';
      case 'PROJECT1_READINESS_REVIEW':
        return 'pending';
      case 'PROJECT1_DEFENSE_REQUEST':
        return 'awaiting_student_action';
      case 'PROJECT1_DEFENSE_SCHEDULED':
        return 'pending';
      case 'PROJECT1_DEFENSE_RESULT':
        return 'pending';
      default:
        return 'in_progress';
    }
  }

  /**
   * Utility (เรียกใช้จาก scheduler) – คืนจำนวนนับของโครงงาน failed ที่ยังคงอยู่ (debug purpose)
   */
  async countFailedArchivedWaiting() {
    const { ProjectDocument } = require('../models');
    return ProjectDocument.count({ where: { examResult: 'failed', status: 'archived', studentAcknowledgedAt: { [Op.ne]: null } } });
  }
}

module.exports = new ProjectDocumentService();
