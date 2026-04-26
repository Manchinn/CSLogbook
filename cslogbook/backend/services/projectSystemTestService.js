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
const notificationService = require('./notificationService');
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

async function notifyProjectMembers(projectId, notification) {
  try {
    const members = await ProjectMember.findAll({
      where: { projectId },
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['userId'] }] }]
    });
    const userIds = members.map(m => m.student?.user?.userId).filter(Boolean);
    if (userIds.length > 0) {
      await notificationService.createAndNotifyMany(userIds, notification);
    }
  } catch (err) {
    logger.error('Failed to send rejection notification', { projectId, error: err.message });
  }
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
      evidenceDriveLink: data.evidenceDriveLink || null,
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
      if (durationDays < 30) {
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
      }, actor?.studentId || null);
      
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

      if (decision === 'reject') {
        await notifyProjectMembers(project.projectId, {
          type: 'APPROVAL',
          title: 'คำขอทดสอบระบบถูกส่งกลับ',
          message: payload.note || 'กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่',
          metadata: { projectId: project.projectId, action: 'rejected', rejectedBy: 'advisor', targetUrl: '/project/phase2/system-test' }
        });
      }

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

      if (decision === 'reject') {
        await notifyProjectMembers(project.projectId, {
          type: 'APPROVAL',
          title: 'คำขอทดสอบระบบถูกส่งกลับจากเจ้าหน้าที่',
          message: payload.note || 'กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่',
          metadata: { projectId: project.projectId, action: 'rejected', rejectedBy: 'staff', targetUrl: '/project/phase2/system-test' }
        });
      }

      return this.serialize(await this.findLatest(project.projectId));
    } catch (error) {
      await t.rollback();
      logger.error('staff decision failed', { projectId, error: error.message });
      throw error;
    }
  }

  async uploadEvidence(projectId, actor, fileMeta, { evidenceDriveLink } = {}) {
    if ((!fileMeta || !fileMeta.path) && !evidenceDriveLink) {
      throw new Error('กรุณาอัปโหลดไฟล์หลักฐานการประเมิน (PDF) หรือระบุลิงก์ Google Drive');
    }
    if (evidenceDriveLink && !/^https?:\/\//.test(evidenceDriveLink)) {
      throw new Error('ลิงก์ Google Drive ต้องเริ่มต้นด้วย http:// หรือ https://');
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

      const relativePath = fileMeta?.path ? buildRelativePath(fileMeta.path) : null;
      const updateData = {
        status: 'evidence_submitted',
        evidenceSubmittedAt: new Date()
      };
      if (relativePath) {
        updateData.evidenceFilePath = relativePath;
        updateData.evidenceFileName = fileMeta.originalname || null;
      }
      if (evidenceDriveLink) {
        updateData.evidenceDriveLink = evidenceDriveLink;
      }
      await record.update(updateData, { transaction: t });

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

    const where = {
      [Op.or]: [
        { advisorTeacherId: teacherId },
        { coAdvisorTeacherId: teacherId }
      ]
    };

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : String(options.status).split(',');
      where.status = { [Op.in]: statuses };
    }

    const records = await ProjectTestRequest.findAll({
      where,
      order: [['submittedAt', 'DESC']],
      include
    });
    const items = records.map(record => this.serialize(record));

    // Summary counts (unfiltered — count all statuses for this teacher)
    const summaryRows = await ProjectTestRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('request_id')), 'count']
      ],
      where: {
        [Op.or]: [
          { advisorTeacherId: teacherId },
          { coAdvisorTeacherId: teacherId }
        ]
      },
      group: ['status'],
      raw: true
    });

    const summary = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const row of summaryRows) {
      const s = row.status;
      const count = Number(row.count || 0);
      if (s === 'pending_advisor') summary.pending += count;
      else if (s === 'pending_staff' || s === 'staff_approved' || s === 'evidence_submitted') summary.approved += count;
      else if (s === 'advisor_rejected') summary.rejected += count;
    }
    summary.total = summary.pending + summary.approved + summary.rejected;

    return { items, summary };
  }

  async staffQueue(options = {}) {
    const where = {};
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : String(options.status).split(',');
      where.status = { [Op.in]: statuses };
    } else {
      where.status = { [Op.in]: ['pending_staff', 'staff_approved', 'evidence_submitted'] };
    }

    const projectWhere = {};
    if (options.academicYear) {
      const year = Number(options.academicYear);
      if (Number.isInteger(year)) {
        projectWhere.academicYear = year;
      }
    }
    if (options.semester) {
      const sem = Number(options.semester);
      if ([1, 2, 3].includes(sem)) {
        projectWhere.semester = sem;
      }
    }

    const include = [
      { 
        model: ProjectDocument, 
        as: 'project',
        where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
        required: false
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

    // Pagination params
    const limit = options.limit ? parseInt(options.limit, 10) : undefined;
    const offset = options.offset ? parseInt(options.offset, 10) : undefined;

    let records;
    let total = 0;

    if (limit !== undefined || offset !== undefined) {
      // ใช้ findAndCountAll สำหรับ pagination
      const { rows, count } = await ProjectTestRequest.findAndCountAll({
        where,
        include,
        order: [['submittedAt', 'DESC']],
        limit,
        offset,
        distinct: true, // สำคัญ: ใช้ distinct เพื่อนับแถวที่ถูกต้องเมื่อมี join
      });
      records = rows;
      total = count;
    } else {
      // ไม่มี pagination ใช้ findAll
      records = await ProjectTestRequest.findAll({
        where,
        include,
        order: [['submittedAt', 'DESC']]
      });
      total = records.length;
    }

    // เพิ่มการตรวจสอบ deadline status
    const serializedList = [];
    for (const record of records) {
      // ตรวจสอบ deadline status
      const deadlineStatus = await checkSystemTestRequestDeadline(
        this.serialize(record)
      );

      const deadlineTag = createDeadlineTag(deadlineStatus, record.submittedLate, record.submissionDelayMinutes);

      // Attach deadline status to record data before serialization
      record._deadlineStatus = {
        ...deadlineStatus,
        tag: deadlineTag
      };

      const serialized = this.serialize(record, { includeDeadlineStatus: true });

      // Filter ด้วย search ถ้ามี
      if (options.search && typeof options.search === 'string' && options.search.trim()) {
        const keyword = options.search.trim().toLowerCase();
        const project = serialized.projectSnapshot || {};
        const applicant = serialized.submittedBy || {};
        const advisor = serialized.advisorDecision || {};
        const candidates = [
          project.projectNameTh,
          project.projectNameEn,
          project.projectCode,
          applicant.studentCode,
          applicant.name,
          advisor.name
        ].filter(Boolean);
        
        const matches = candidates.some((text) => String(text).toLowerCase().includes(keyword));
        if (!matches) {
          continue; // ข้ามรายการที่ไม่ตรงกับ search
        }
      }

      serializedList.push(serialized);
    }

    // ถ้ามี pagination และมีการ filter ด้วย search ต้องคำนวณ total ใหม่ทั้งหมด
    let filteredTotal = total;
    if ((limit !== undefined || offset !== undefined) && options.search && typeof options.search === 'string' && options.search.trim()) {
      // Query ทั้งหมดใหม่เพื่อนับ total หลัง filter ด้วย search
      const allRecords = await ProjectTestRequest.findAll({
        where,
        include,
        order: [['submittedAt', 'DESC']]
      });

      const allSerialized = [];
      for (const record of allRecords) {
        const deadlineStatus = await checkSystemTestRequestDeadline(
          this.serialize(record)
        );
        const deadlineTag = createDeadlineTag(deadlineStatus, record.submittedLate, record.submissionDelayMinutes);
        record._deadlineStatus = {
          ...deadlineStatus,
          tag: deadlineTag
        };
        const serialized = this.serialize(record, { includeDeadlineStatus: true });

        const keyword = options.search.trim().toLowerCase();
        const project = serialized.projectSnapshot || {};
        const applicant = serialized.submittedBy || {};
        const advisor = serialized.advisorDecision || {};
        const candidates = [
          project.projectNameTh,
          project.projectNameEn,
          project.projectCode,
          applicant.studentCode,
          applicant.name,
          advisor.name
        ].filter(Boolean);
        
        const matches = candidates.some((text) => String(text).toLowerCase().includes(keyword));
        if (matches) {
          allSerialized.push(serialized);
        }
      }
      filteredTotal = allSerialized.length;
    }
    
    // ถ้ามี pagination ส่ง total กลับไปด้วย
    if (limit !== undefined || offset !== undefined) {
      return { data: serializedList, total: filteredTotal };
    }

    return serializedList;
  }
}

module.exports = new ProjectSystemTestService();
