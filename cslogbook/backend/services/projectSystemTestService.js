const path = require('path');
const { sequelize } = require('../config/database');
const {
  ProjectTestRequest,
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User
} = require('../models');
const projectDocumentService = require('./projectDocumentService');
const logger = require('../utils/logger');
const { calculateSystemTestRequestLate } = require('../utils/lateSubmissionHelper');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const buddhistEra = require('dayjs/plugin/buddhistEra');
const { Op } = require('sequelize');
const { checkSystemTestRequestDeadline, createDeadlineTag } = require('../utils/requestDeadlineChecker');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.tz.setDefault('Asia/Bangkok');

const PUBLIC_UPLOAD_BASE = (process.env.PUBLIC_UPLOAD_BASE_URL || '/uploads').replace(/\/$/, '');

const STAFF_ROLES = new Set(['admin']);

function isSupportTeacher(user = {}) {
  return user.role === 'teacher' && (user.teacherType === 'support' || user.canExportProject1);
}

function buildRelativePath(filePath) {
  if (!filePath) return null;
  const uploadsRoot = path.join(__dirname, '..', 'uploads');
  const relative = path.relative(uploadsRoot, filePath);
  return relative.replace(/\\/g, '/');
}

function buildFileInfo(filePath, fileName) {
  if (!filePath) return null;
  const relative = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const url = `${PUBLIC_UPLOAD_BASE}/${relative}`;
  return {
    path: relative,
    url,
    name: fileName || path.basename(relative)
  };
}

function normalizeDateInput(value, { asEnd = false } = {}) {
  if (!value) return null;
  const parsed = dayjs(value).tz();
  if (!parsed.isValid()) return null;
  return asEnd ? parsed.endOf('day') : parsed.startOf('day');
}

function ensureStudentMember(project, studentId) {
  if (!project) return false;
  return (project.members || []).some(member => Number(member.studentId) === Number(studentId));
}

function ensureLeader(project, studentId) {
  if (!project) return false;
  return (project.members || []).some(member => member.role === 'leader' && Number(member.studentId) === Number(studentId));
}

function ensureAdvisor(project, teacherId) {
  if (!project) return false;
  const ids = [project.advisorId, project.coAdvisorId].filter(Boolean).map(Number);
  return ids.includes(Number(teacherId));
}

class ProjectSystemTestService {
  serialize(instance, options = {}) {
    if (!instance) return null;
    const data = instance.get ? instance.get({ plain: true }) : instance;
    const project = data.project || {};
    const advisor = data.advisor || {};
    const advisorUser = advisor.user || {};
    const coAdvisor = data.coAdvisor || {};
    const coAdvisorUser = coAdvisor.user || {};
    const submittedBy = data.submittedBy || {};
    const submittedUser = submittedBy.user || {};
    const staffUser = data.staffUser || {};

    const serialized = {
      requestId: data.requestId,
      projectId: data.projectId,
      status: data.status,
      studentNote: data.studentNote || null,
      testStartDate: data.testStartDate,
      testDueDate: data.testDueDate,
      submittedAt: data.submittedAt,
      requestFile: buildFileInfo(data.requestFilePath, data.requestFileName),
      advisorDecision: {
        teacherId: data.advisorTeacherId,
        name: advisorUser.userId ? `${advisorUser.firstName || ''} ${advisorUser.lastName || ''}`.trim() : null,
        decidedAt: data.advisorDecidedAt,
        note: data.advisorDecisionNote || null
      },
      coAdvisorDecision: {
        teacherId: data.coAdvisorTeacherId,
        name: coAdvisorUser.userId ? `${coAdvisorUser.firstName || ''} ${coAdvisorUser.lastName || ''}`.trim() : null,
        decidedAt: data.coAdvisorDecidedAt,
        note: data.coAdvisorDecisionNote || null
      },
      staffDecision: {
        userId: data.staffUserId,
        name: staffUser.userId ? `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() : null,
        decidedAt: data.staffDecidedAt,
        note: data.staffDecisionNote || null
      },
      evidence: buildFileInfo(data.evidenceFilePath, data.evidenceFileName),
      evidenceSubmittedAt: data.evidenceSubmittedAt,
      submittedBy: submittedBy.studentId ? {
        studentId: submittedBy.studentId,
        studentCode: submittedBy.studentCode || null,
        name: `${submittedUser.firstName || ''} ${submittedUser.lastName || ''}`.trim() || null
      } : null,
      projectSnapshot: project.projectId ? {
        projectId: project.projectId,
        projectCode: project.projectCode,
        projectNameTh: project.projectNameTh,
        advisorId: project.advisorId,
        coAdvisorId: project.coAdvisorId
      } : null,
      timeline: {
        submittedAt: data.submittedAt,
        advisorDecidedAt: data.advisorDecidedAt,
        coAdvisorDecidedAt: data.coAdvisorDecidedAt,
        staffDecidedAt: data.staffDecidedAt,
        evidenceSubmittedAt: data.evidenceSubmittedAt
      }
    };

    // เพิ่มข้อมูล deadline status (ถ้าต้องการ)
    if (options.includeDeadlineStatus && data._deadlineStatus) {
      serialized.deadlineStatus = data._deadlineStatus;
    }

    return serialized;
  }

  async findLatest(projectId, options = {}) {
    const include = [
      {
        model: ProjectDocument,
        as: 'project'
      },
      {
        model: Student,
        as: 'submittedBy',
        include: [{ association: Student.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'advisor',
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'coAdvisor',
        required: false,
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: User,
        as: 'staffUser',
        attributes: ['userId', 'firstName', 'lastName']
      }
    ];

    const record = await ProjectTestRequest.findOne({
      where: { projectId },
      order: [['submittedAt', 'DESC']],
      include,
      transaction: options.transaction
    });
    return record;
  }

  async getLatest(projectId, actor, options = {}) {
    const { project } = await this.ensureProjectAccess(projectId, actor, { transaction: options.transaction });
    const record = await this.findLatest(project.projectId, options);
    return this.serialize(record);
  }

  async ensureProjectAccess(projectId, actor = {}, { transaction } = {}) {
    const project = await ProjectDocument.findByPk(projectId, {
      include: [{
        model: ProjectMember,
        as: 'members'
      }],
      transaction
    });
    if (!project) {
      throw new Error('ไม่พบโครงงาน');
    }

    const role = actor.role;
    if (role === 'student') {
      if (!ensureStudentMember(project, actor.studentId)) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลคำขอทดสอบระบบ');
      }
    } else if (role === 'teacher') {
      if (!(isSupportTeacher(actor) || ensureAdvisor(project, actor.teacherId))) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลคำขอทดสอบระบบ');
      }
    } else if (!STAFF_ROLES.has(role)) {
      throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลคำขอทดสอบระบบ');
    }

    return { project };
  }

  async submitRequest(projectId, actor, payload = {}, fileMeta) {
    const t = await sequelize.transaction();
    try {
      const { project } = await this.ensureProjectAccess(projectId, actor, { transaction: t });
      if (actor.role !== 'student') {
        throw new Error('อนุญาตเฉพาะนักศึกษาที่เป็นสมาชิกโครงงานในการส่งคำขอทดสอบระบบ');
      }
      // ✅ เปลี่ยนจากเฉพาะ leader เป็นอนุญาตสมาชิกทุกคนส่งคำขอได้
      if (!['in_progress', 'completed'].includes(project.status)) {
        throw new Error('โครงงานต้องอยู่ในสถานะกำลังดำเนินการก่อนส่งคำขอทดสอบระบบ');
      }

      const latest = await this.findLatest(project.projectId, { transaction: t });
      if (latest && ['pending_advisor', 'pending_staff'].includes(latest.status)) {
        throw new Error('มีคำขอทดสอบระบบที่อยู่ระหว่างการพิจารณาอยู่แล้ว');
      }
      if (latest && latest.status === 'staff_approved' && !latest.evidenceSubmittedAt) {
        throw new Error('กรุณาอัปโหลดหลักฐานการประเมินทดสอบระบบให้คำขอเดิมก่อน');
      }

      const startDay = normalizeDateInput(payload.testPeriodStart || payload.testStartDate);
      const endDayRaw = normalizeDateInput(payload.testPeriodEnd || payload.testDueDate, { asEnd: true });
      if (!startDay || !endDayRaw) {
        throw new Error('กรุณาระบุช่วงเวลาเริ่มและสิ้นสุดการทดสอบระบบให้ครบถ้วน');
      }
      if (endDayRaw.isBefore(startDay)) {
        throw new Error('วันสิ้นสุดต้องอยู่หลังวันเริ่มทดสอบระบบ');
      }

      const durationDays = endDayRaw.diff(startDay, 'day');
      if (durationDays < 29) {
        throw new Error('ช่วงเวลาทดสอบระบบต้องไม่น้อยกว่า 30 วัน');
      }
      const dueDay = endDayRaw;
      const now = dayjs().tz();
      if (startDay.isAfter(now.add(30, 'day'))) {
        throw new Error('วันเริ่มทดสอบระบบต้องอยู่ภายใน 30 วันนับจากปัจจุบัน');
      }

      const memberStudentIds = (project.members || []).map(member => member.studentId).filter(Boolean);
      const students = memberStudentIds.length
        ? await Student.findAll({ where: { studentId: memberStudentIds }, transaction: t })
        : [];
  const meetingMetrics = await projectDocumentService.buildProjectMeetingMetrics(project.projectId, students, { transaction: t, phase: 'phase1' });
      const requiredLogs = projectDocumentService.getRequiredApprovedMeetingLogs();
      // ตรวจสอบ meeting logs ของสมาชิกที่ส่งคำร้อง (ไม่จำเป็นต้องเป็น leader)
      const actorMetrics = meetingMetrics.perStudent?.[actor.studentId] || { approvedLogs: 0 };
      if ((actorMetrics.approvedLogs || 0) < requiredLogs) {
        throw new Error(`ยังไม่ครบเกณฑ์บันทึกการพบอาจารย์: ต้องมีอย่างน้อย ${requiredLogs} รายการที่ได้รับอนุมัติ`);
      }

      const relativePath = fileMeta?.path ? buildRelativePath(fileMeta.path) : null;
      const submittedAt = new Date();
      
      // 🆕 คำนวณสถานะการส่งช้า (Google Classroom style)
      const lateStatus = await calculateSystemTestRequestLate(submittedAt, {
        academicYear: project.academicYear,
        semester: project.semester
      });
      
      const record = await ProjectTestRequest.create({
        projectId: project.projectId,
        submittedByStudentId: actor.studentId,
        status: 'pending_advisor',
        requestFilePath: relativePath,
        requestFileName: fileMeta?.originalname || null,
        studentNote: payload.studentNote || null,
        submittedAt,
        testStartDate: startDay.toDate(),
        testDueDate: dueDay.toDate(),
        advisorTeacherId: project.advisorId || null,
        coAdvisorTeacherId: project.coAdvisorId || null,
        // 🆕 เพิ่มข้อมูลการส่งช้า
        submittedLate: lateStatus.submitted_late,
        submissionDelayMinutes: lateStatus.submission_delay_minutes,
        importantDeadlineId: lateStatus.important_deadline_id
      }, { transaction: t });

      await t.commit();
      logger.info('submit system test request', {
        projectId: project.projectId,
        studentId: actor.studentId,
        hasRequestFile: Boolean(relativePath)
      });
      return this.serialize(await this.findLatest(project.projectId));
    } catch (error) {
      await t.rollback();
      logger.error('submit system test request failed', { projectId, error: error.message });
      throw error;
    }
  }

  async submitAdvisorDecision(projectId, actor, payload = {}) {
    const t = await sequelize.transaction();
    try {
      const { project } = await this.ensureProjectAccess(projectId, actor, { transaction: t });
      if (actor.role !== 'teacher' || !ensureAdvisor(project, actor.teacherId)) {
        throw new Error('เฉพาะอาจารย์ที่ปรึกษาเท่านั้นที่สามารถอนุมัติคำขอนี้');
      }
      const record = await this.findLatest(project.projectId, { transaction: t });
      if (!record) {
        throw new Error('ยังไม่มีคำขอทดสอบระบบในโครงงานนี้');
      }
      if (record.status !== 'pending_advisor') {
        throw new Error('คำขอนี้ไม่อยู่ในสถานะรออาจารย์อนุมัติ');
      }

      const decision = (payload.decision || '').toLowerCase();
      if (!['approve', 'reject'].includes(decision)) {
        throw new Error('กรุณาเลือกผลการพิจารณาให้ถูกต้อง');
      }

      const isAdvisor = Number(project.advisorId) === Number(actor.teacherId);
      const isCoAdvisor = Number(project.coAdvisorId) === Number(actor.teacherId);

      // ตรวจสอบว่ามี co-advisor หรือไม่
      const hasCoAdvisor = !!project.coAdvisorId;
      
      // อัปเดต decision ตาม role
      const update = {};
      if (isAdvisor) {
        update.advisorTeacherId = actor.teacherId;
        update.advisorDecidedAt = new Date();
        update.advisorDecisionNote = payload.note || null;
      } else if (isCoAdvisor) {
        update.coAdvisorTeacherId = actor.teacherId;
        update.coAdvisorDecidedAt = new Date();
        update.coAdvisorDecisionNote = payload.note || null;
      }

      // ตรวจสอบสถานะการอนุมัติ
      if (decision === 'reject') {
        // ถ้าปฏิเสธ ให้ status เป็น advisor_rejected ทันที
        update.status = 'advisor_rejected';
      } else {
        // ถ้าอนุมัติ ให้ตรวจสอบว่าทั้ง 2 คนอนุมัติแล้วหรือยัง
        // ตรวจสอบจาก record ที่มีอยู่ (ก่อน update) หรือจาก update ที่กำลังจะทำ
        const advisorApproved = isAdvisor ? true : (!!record.advisorDecidedAt);
        const coAdvisorApproved = isCoAdvisor ? true : (!!record.coAdvisorDecidedAt);
        
        // ถ้ามี co-advisor ต้องรอทั้ง 2 คนอนุมัติ ถ้าไม่มี co-advisor แค่ advisor อนุมัติก็พอ
        if (hasCoAdvisor) {
          if (advisorApproved && coAdvisorApproved) {
            update.status = 'pending_staff';
          } else {
            update.status = 'pending_advisor'; // ยังรออีกคนอนุมัติ
          }
        } else {
          // ไม่มี co-advisor แค่ advisor อนุมัติก็ส่งต่อไป staff
          update.status = 'pending_staff';
        }
      }

      await record.update(update, { transaction: t });
      await t.commit();
      return this.serialize(await this.findLatest(project.projectId));
    } catch (error) {
      await t.rollback();
      logger.error('advisor decision failed', { projectId, error: error.message });
      throw error;
    }
  }

  async submitStaffDecision(projectId, actor, payload = {}) {
    const t = await sequelize.transaction();
    try {
      const isStaff = STAFF_ROLES.has(actor.role) || isSupportTeacher(actor);
      if (!isStaff) {
        throw new Error('ไม่มีสิทธิ์ตรวจสอบคำขอทดสอบระบบนี้');
      }
      const { project } = await this.ensureProjectAccess(projectId, actor, { transaction: t });
      const record = await this.findLatest(project.projectId, { transaction: t });
      if (!record) {
        throw new Error('ยังไม่มีคำขอทดสอบระบบในโครงงานนี้');
      }
      if (record.status !== 'pending_staff') {
        throw new Error('คำขอนี้ไม่อยู่ในสถานะรอเจ้าหน้าที่อนุมัติ');
      }

      const decision = (payload.decision || '').toLowerCase();
      if (!['approve', 'reject'].includes(decision)) {
        throw new Error('กรุณาเลือกผลการพิจารณาให้ถูกต้อง');
      }

      const update = {
        staffUserId: actor.userId,
        staffDecidedAt: new Date(),
        staffDecisionNote: payload.note || null,
        status: decision === 'approve' ? 'staff_approved' : 'staff_rejected'
      };
      await record.update(update, { transaction: t });
      await t.commit();
      return this.serialize(await this.findLatest(project.projectId));
    } catch (error) {
      await t.rollback();
      logger.error('staff decision failed', { projectId, error: error.message });
      throw error;
    }
  }

  async uploadEvidence(projectId, actor, fileMeta) {
    if (!fileMeta || !fileMeta.path) {
      throw new Error('กรุณาอัปโหลดไฟล์หลักฐานการประเมิน (PDF)');
    }

    const t = await sequelize.transaction();
    try {
      const { project } = await this.ensureProjectAccess(projectId, actor, { transaction: t });
      if (actor.role !== 'student' || !ensureStudentMember(project, actor.studentId)) {
        throw new Error('จำกัดเฉพาะนักศึกษาสมาชิกโครงงานในการอัปโหลดหลักฐาน');
      }

      const record = await this.findLatest(project.projectId, { transaction: t });
      if (!record || record.status !== 'staff_approved') {
        throw new Error('ต้องได้รับการอนุมัติจากเจ้าหน้าที่ก่อนจึงจะอัปโหลดหลักฐานได้');
      }
      if (record.evidenceSubmittedAt) {
        throw new Error('มีการอัปโหลดหลักฐานเรียบร้อยแล้ว');
      }

      const dueDay = dayjs(record.testDueDate).tz();
      const now = dayjs().tz();
      if (dueDay.isValid() && now.isBefore(dueDay)) {
        // อนุญาตให้อัปโหลดก่อนครบกำหนด แต่เก็บ log ไว้เพื่อตรวจสอบย้อนหลังว่ามีการยื่นก่อนเวลา
        logger.warn('system test evidence uploaded before due date', {
          projectId: project.projectId,
          studentId: actor.studentId,
          dueDate: dueDay.format(),
          uploadedAt: now.format()
        });
      }

      const relativePath = buildRelativePath(fileMeta.path);
      await record.update({
        evidenceFilePath: relativePath,
        evidenceFileName: fileMeta.originalname || null,
        evidenceSubmittedAt: new Date()
      }, { transaction: t });

      await t.commit();
      logger.info('upload system test evidence', { projectId: project.projectId, studentId: actor.studentId });
      return this.serialize(await this.findLatest(project.projectId));
    } catch (error) {
      await t.rollback();
      logger.error('upload system test evidence failed', { projectId, error: error.message });
      throw error;
    }
  }

  async advisorQueue(teacherId, options = {}) {
    const include = [
      {
        model: ProjectDocument,
        as: 'project'
      },
      {
        model: Student,
        as: 'submittedBy',
        include: [{ association: Student.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'advisor',
        required: false,
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'coAdvisor',
        required: false,
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      }
    ];

    const records = await ProjectTestRequest.findAll({
      where: {
        [Op.or]: [
          { advisorTeacherId: teacherId },
          { coAdvisorTeacherId: teacherId }
        ],
        status: { [Op.in]: ['pending_advisor', 'pending_staff', 'staff_approved'] }
      },
      order: [['submittedAt', 'DESC']],
      include
    });
    return records.map(record => this.serialize(record));
  }

  async staffQueue(options = {}) {
    const where = {};
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : String(options.status).split(',');
      where.status = { [Op.in]: statuses };
    } else {
      where.status = { [Op.in]: ['pending_staff', 'staff_approved'] };
    }

    const include = [
      { model: ProjectDocument, as: 'project' },
      {
        model: Student,
        as: 'submittedBy',
        include: [{ association: Student.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'advisor',
        required: false,
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        model: Teacher,
        as: 'coAdvisor',
        required: false,
        include: [{ association: Teacher.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      }
    ];

    const records = await ProjectTestRequest.findAll({
      where,
      order: [['submittedAt', 'DESC']],
      include
    });

    // เพิ่มการตรวจสอบ deadline status
    const serializedList = [];
    for (const record of records) {
      // ตรวจสอบ deadline status
      const deadlineStatus = await checkSystemTestRequestDeadline(
        this.serialize(record)
      );
      
      const deadlineTag = createDeadlineTag(deadlineStatus);
      
      // Attach deadline status to record data before serialization
      record._deadlineStatus = {
        ...deadlineStatus,
        tag: deadlineTag
      };

      serializedList.push(this.serialize(record, { includeDeadlineStatus: true }));
    }
    
    return serializedList;
  }
}

module.exports = new ProjectSystemTestService();
