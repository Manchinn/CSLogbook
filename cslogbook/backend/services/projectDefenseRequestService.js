const { sequelize } = require('../config/database');
const {
  ProjectDefenseRequest,
  ProjectDefenseRequestAdvisorApproval,
  ProjectDocument,
  ProjectMember,
  ProjectTestRequest,
  Student,
  Teacher,
  User
} = require('../models');
const projectDocumentService = require('./projectDocumentService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const buddhistEra = require('dayjs/plugin/buddhistEra');
require('dayjs/locale/th');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.tz.setDefault('Asia/Bangkok');

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';
const STAFF_QUEUE_DEFAULT_STATUSES = ['advisor_approved', 'staff_verified', 'scheduled'];

const STAFF_STATUS_LABELS_TH = {
  advisor_in_review: 'รออาจารย์อนุมัติครบ',
  advisor_approved: 'รอเจ้าหน้าที่ตรวจสอบ',
  staff_verified: 'ตรวจสอบแล้ว (ประกาศผ่านปฏิทิน)',
  scheduled: 'นัดสอบแล้ว (ระบบเดิม)',
  completed: 'บันทึกผลสอบแล้ว'
};

const formatThaiDateTime = (value) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '-';
  return parsed.locale('th').tz().format('D MMM BBBB เวลา HH:mm น.');
};

class ProjectDefenseRequestService {
  buildProjectInclude({ projectWhere } = {}) {
    const projectInclude = {
      model: ProjectDocument,
      as: 'project',
      include: [
        {
          model: ProjectMember,
          as: 'members',
          include: [
            {
              model: Student,
              as: 'student',
              include: [{ association: Student.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
            }
          ]
        },
        {
          model: Teacher,
          as: 'advisor',
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName'] }]
        },
        {
          model: Teacher,
          as: 'coAdvisor',
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName'] }]
        }
      ]
    };

    if (projectWhere && Object.keys(projectWhere).length) {
      projectInclude.where = projectWhere;
    }

    return projectInclude;
  }

  buildRequestInclude(options = {}) {
    const include = [
      this.buildProjectInclude({ projectWhere: options.projectWhere }),
      {
        model: Student,
        as: 'submittedBy',
        include: [{ association: Student.associations.user, attributes: ['userId', 'firstName', 'lastName'] }]
      },
      {
        association: ProjectDefenseRequest.associations.advisorApprovals,
        include: [
          {
            model: Teacher,
            as: 'teacher',
            include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName'] }]
          }
        ]
      },
      {
        association: ProjectDefenseRequest.associations.scheduledBy,
        attributes: ['userId', 'firstName', 'lastName']
      },
      {
        association: ProjectDefenseRequest.associations.staffVerifiedBy,
        attributes: ['userId', 'firstName', 'lastName']
      }
    ];

    return include;
  }

  serializeProject(projectInstance) {
    if (!projectInstance) return null;
    const project = projectInstance.get ? projectInstance.get({ plain: true }) : projectInstance;

    const buildTeacher = (teacher) => {
      if (!teacher) return null;
      const name = [`${teacher.user?.firstName || ''}`.trim(), `${teacher.user?.lastName || ''}`.trim()].filter(Boolean).join(' ').trim();
      return {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        name
      };
    };

    return {
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectNameTh: project.projectNameTh,
      projectNameEn: project.projectNameEn,
      status: project.status,
      academicYear: project.academicYear,
      semester: project.semester,
      advisorId: project.advisorId,
      coAdvisorId: project.coAdvisorId,
      advisor: buildTeacher(project.advisor),
      coAdvisor: buildTeacher(project.coAdvisor),
      members: (project.members || []).map((member) => {
        const student = member.student || {};
        const user = student.user || {};
        const name = [`${user.firstName || ''}`.trim(), `${user.lastName || ''}`.trim()].filter(Boolean).join(' ').trim();
        return {
          studentId: member.studentId,
          role: member.role,
          studentCode: student.studentCode || null,
          name: name || null
        };
      })
    };
  }

  serializeRequest(instance) {
    if (!instance) return null;
    const data = instance.get ? instance.get({ plain: true }) : instance;
    const buildUser = (user) => {
      if (!user) return null;
      return {
        userId: user.userId,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        fullName: [`${user.firstName || ''}`.trim(), `${user.lastName || ''}`.trim()].filter(Boolean).join(' ').trim() || null
      };
    };

    const buildStudent = (student) => {
      if (!student) return null;
      const user = student.user || {};
      const fullName = [`${user.firstName || ''}`.trim(), `${user.lastName || ''}`.trim()].filter(Boolean).join(' ').trim();
      return {
        studentId: student.studentId,
        studentCode: student.studentCode || null,
        name: fullName || null
      };
    };

    return {
      requestId: data.requestId,
      projectId: data.projectId,
      defenseType: data.defenseType,
      status: data.status,
      formPayload: data.formPayload,
      submittedByStudentId: data.submittedByStudentId,
      submittedAt: data.submittedAt,
      advisorApprovedAt: data.advisorApprovedAt,
      defenseScheduledAt: data.defenseScheduledAt,
      defenseLocation: data.defenseLocation,
      defenseNote: data.defenseNote,
      scheduledAt: data.scheduledAt,
  scheduledByUserId: data.scheduledByUserId || null,
      staffVerifiedAt: data.staffVerifiedAt,
  staffVerifiedByUserId: data.staffVerifiedByUserId || null,
      staffVerificationNote: data.staffVerificationNote,
      project: this.serializeProject(data.project),
      submittedBy: buildStudent(data.submittedBy),
      scheduledBy: buildUser(data.scheduledBy),
      staffVerifiedBy: buildUser(data.staffVerifiedBy),
      advisorApprovals: (data.advisorApprovals || []).map((approval) => {
        const teacher = approval.teacher || {};
        const user = teacher.user || {};
        const name = [`${user.firstName || ''}`.trim(), `${user.lastName || ''}`.trim()].filter(Boolean).join(' ').trim();
        return {
          approvalId: approval.approvalId,
          requestId: approval.requestId,
          teacherId: approval.teacherId,
          teacherRole: approval.teacherRole || null,
          status: approval.status,
          note: approval.note || null,
          approvedAt: approval.approvedAt,
          teacher: teacher.teacherId ? {
            teacherId: teacher.teacherId,
            teacherCode: teacher.teacherCode,
            name: name || null
          } : null
        };
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  async attachMeetingMetrics(serializedRequest, { transaction } = {}) {
    if (!serializedRequest || !serializedRequest.project) {
      return serializedRequest;
    }
    const memberStudentIds = (serializedRequest.project.members || []).map((member) => member.studentId).filter(Boolean);
    if (!memberStudentIds.length) {
      return serializedRequest;
    }

    try {
      const students = await Student.findAll({ where: { studentId: memberStudentIds }, transaction });
      const metrics = await projectDocumentService.buildProjectMeetingMetrics(serializedRequest.project.projectId, students, { transaction });
      const requiredApprovedLogs = projectDocumentService.getRequiredApprovedMeetingLogs();

      serializedRequest.meetingMetrics = {
        requiredApprovedLogs,
        totalMeetings: metrics.totalMeetings || 0,
        totalApprovedLogs: metrics.totalApprovedLogs || 0,
        lastApprovedLogAt: metrics.lastApprovedLogAt || null,
        perStudent: memberStudentIds.map((studentId) => ({
          studentId,
          approvedLogs: metrics.perStudent?.[studentId]?.approvedLogs || 0,
          attendedMeetings: metrics.perStudent?.[studentId]?.attendedMeetings || 0
        }))
      };
    } catch (error) {
      logger.warn('attachMeetingMetrics failed', { projectId: serializedRequest.project.projectId, error: error.message });
    }

    return serializedRequest;
  }

  getAdvisorAssignments(project) {
    if (!project) return [];
    const assignments = [];
    if (project.advisorId) {
      assignments.push({ teacherId: Number(project.advisorId), role: 'advisor' });
    }
    if (project.coAdvisorId && Number(project.coAdvisorId) !== Number(project.advisorId)) {
      assignments.push({ teacherId: Number(project.coAdvisorId), role: 'co_advisor' });
    }
    return assignments;
  }

  normalizeProject1Payload(payload, project) {
    const safePayload = payload && typeof payload === 'object' ? { ...payload } : {};
    const membersSnapshot = (project.members || []).map(member => ({
      studentId: member.studentId,
      role: member.role,
      studentCode: member.student?.studentCode || null,
      name: member.student?.user ? `${member.student.user.firstName || ''} ${member.student.user.lastName || ''}`.trim() : null
    }));

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

      const members = project.members || [];
      const leader = members.find(member => member.role === 'leader');
      if (!leader || leader.studentId !== Number(actorStudentId)) {
        throw new Error('อนุญาตเฉพาะหัวหน้าโครงงานในการยื่นคำขอนี้');
      }

      if (!['in_progress', 'completed'].includes(project.status)) {
        throw new Error('โครงงานต้องอยู่ในสถานะ in_progress ก่อนยื่นคำขอสอบ');
      }

      const memberStudentIds = members.map(member => member.studentId).filter(Boolean);
      const students = memberStudentIds.length
        ? await Student.findAll({ where: { studentId: memberStudentIds }, transaction: t })
        : [];
      const meetingMetrics = await projectDocumentService.buildProjectMeetingMetrics(projectId, students, { transaction: t });
      const requiredApprovedLogs = projectDocumentService.getRequiredApprovedMeetingLogs();
      const leaderMetrics = meetingMetrics.perStudent?.[leader.studentId] || { approvedLogs: 0 };
      if ((leaderMetrics.approvedLogs || 0) < requiredApprovedLogs) {
        throw new Error(`ยังไม่สามารถยื่นคำขอสอบได้ ต้องมีบันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย ${requiredApprovedLogs} ครั้ง`);
      }

      const latestSystemTest = await ProjectTestRequest.findOne({
        where: { projectId },
        order: [['submittedAt', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!latestSystemTest || latestSystemTest.status !== 'staff_approved') {
        throw new Error('กรุณาส่งคำขอทดสอบระบบและได้รับการอนุมัติจากเจ้าหน้าที่ก่อนยื่นสอบโครงงานพิเศษ 1');
      }
      if (!latestSystemTest.evidenceSubmittedAt || !latestSystemTest.evidenceFilePath) {
        throw new Error('ยังไม่มีการอัปโหลดใบประเมินผลการทดสอบระบบ กรุณาอัปโหลดให้เรียบร้อยก่อนยื่นสอบ');
      }

      const dueDay = dayjs(latestSystemTest.testDueDate);
      if (dueDay.isValid()) {
        const evidenceDay = dayjs(latestSystemTest.evidenceSubmittedAt);
        if (evidenceDay.isValid() && evidenceDay.isBefore(dueDay)) {
          throw new Error('ระยะเวลาทดสอบระบบยังไม่ครบ 30 วัน กรุณารอให้ครบกำหนดก่อนยื่นสอบ');
        }
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
      const basePayload = {
        formPayload: cleanedPayload,
        status: 'advisor_in_review',
        submittedByStudentId: actorStudentId,
        submittedAt: now,
        advisorApprovedAt: null,
        staffVerifiedAt: null,
        staffVerifiedByUserId: null,
        staffVerificationNote: null
      };

      if (record) {
        await record.update(basePayload, { transaction: t });
      } else {
        record = await ProjectDefenseRequest.create({
          projectId,
          defenseType: DEFENSE_TYPE_PROJECT1,
          ...basePayload
        }, { transaction: t });
      }

      const advisorAssignments = this.getAdvisorAssignments(project);
      await ProjectDefenseRequestAdvisorApproval.destroy({ where: { requestId: record.requestId }, transaction: t });

      if (advisorAssignments.length) {
        const approvalRows = advisorAssignments.map(({ teacherId, role }) => ({
          requestId: record.requestId,
          teacherId,
          teacherRole: role,
          status: 'pending',
          note: null,
          approvedAt: null
        }));
        await ProjectDefenseRequestAdvisorApproval.bulkCreate(approvalRows, { transaction: t });
      } else {
        await record.update({ status: 'advisor_approved', advisorApprovedAt: now }, { transaction: t });
      }

      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t, projectInstance: project });
      await t.commit();

      logger.info('submitProject1Request success', { projectId });
      return this.getProject1Request(projectId, { withMetrics: true });
    } catch (error) {
      await this.safeRollback(t);
      logger.error('submitProject1Request failed', { projectId, error: error.message });
      throw error;
    }
  }

  async getProject1Request(projectId, { withMetrics = false, transaction } = {}) {
    const request = await ProjectDefenseRequest.findOne({
      where: {
        projectId,
        defenseType: DEFENSE_TYPE_PROJECT1,
        status: { [Op.ne]: 'cancelled' }
      },
      order: [['submitted_at', 'DESC']],
      include: this.buildRequestInclude(),
      transaction
    });

    if (!request) {
      return null;
    }

    const serialized = this.serializeRequest(request);
    if (withMetrics) {
      await this.attachMeetingMetrics(serialized, { transaction });
    }
    return serialized;
  }

  async getLatestProject1Request(projectId) {
    return this.getProject1Request(projectId, { withMetrics: true });
  }

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

  async scheduleProject1Defense() {
    throw new Error('ระบบนัดสอบโครงงานพิเศษ 1 ถูกย้ายไปจัดการผ่านปฏิทินภาควิชาแล้ว เจ้าหน้าที่ไม่ต้องบันทึกวันและสถานที่ในระบบนี้');
  }

  async verifyProject1Request(projectId, { note } = {}, actorUser = {}) {
    const t = await sequelize.transaction();
    try {
      const request = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType: DEFENSE_TYPE_PROJECT1 },
        include: this.buildRequestInclude(),
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!request) {
        throw new Error('ไม่พบคำขอสอบสำหรับโครงงานนี้');
      }
      if (['completed', 'scheduled'].includes(request.status)) {
        throw new Error('ไม่สามารถแก้ไขคำขอหลังจากมีการนัดสอบแล้ว');
      }
      if (request.status !== 'advisor_approved' && request.status !== 'staff_verified') {
        throw new Error('คำขอยังไม่ได้รับการอนุมัติจากอาจารย์ครบถ้วน');
      }

      const updatePayload = {
        status: 'staff_verified',
        staffVerifiedAt: new Date(),
        staffVerifiedByUserId: actorUser?.userId || null,
        staffVerificationNote: typeof note === 'string' && note.trim() ? note.trim() : null
      };

      await request.update(updatePayload, { transaction: t });
      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();

      logger.info('verifyProject1Request success', { projectId, staffUserId: actorUser?.userId || null });

      const serialized = this.serializeRequest(await request.reload({ include: this.buildRequestInclude() }));
      return serialized;
    } catch (error) {
      await this.safeRollback(t);
      logger.error('verifyProject1Request failed', { projectId, error: error.message });
      throw error;
    }
  }

  async getAdvisorApprovalQueue(teacherId, { status = ['pending'], withMetrics = false } = {}) {
    const statusFilter = Array.isArray(status) ? status : [status];
    const approvals = await ProjectDefenseRequestAdvisorApproval.findAll({
      where: {
        teacherId,
        status: { [Op.in]: statusFilter }
      },
      include: [{
        model: ProjectDefenseRequest,
        as: 'request',
        include: this.buildRequestInclude()
      }],
      order: [[{ model: ProjectDefenseRequest, as: 'request' }, 'submitted_at', 'ASC']]
    });

    const results = [];
    for (const approval of approvals) {
      if (!approval.request) continue;
      let serialized = this.serializeRequest(approval.request);
      serialized = await this.attachMeetingMetrics(serialized, {});
      serialized.myApproval = {
        approvalId: approval.approvalId,
        status: approval.status,
        note: approval.note || null,
        approvedAt: approval.approvedAt,
        teacherRole: approval.teacherRole || null
      };
      if (!withMetrics) {
        delete serialized.meetingMetrics;
      }
      results.push(serialized);
    }
    return results;
  }

  async submitAdvisorDecision(projectId, teacherId, { decision, note } = {}) {
    const normalizedDecision = String(decision || '').toLowerCase();
    if (!['approved', 'rejected'].includes(normalizedDecision)) {
      throw new Error('รูปแบบการตัดสินใจไม่ถูกต้อง');
    }
    if (normalizedDecision === 'rejected') {
      const trimmedNote = typeof note === 'string' ? note.trim() : '';
      if (trimmedNote.length < 5) {
        throw new Error('กรุณาระบุหมายเหตุอย่างน้อย 5 ตัวอักษรเมื่อปฏิเสธคำขอ');
      }
    }

    const t = await sequelize.transaction();
    try {
      const request = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType: DEFENSE_TYPE_PROJECT1 },
        include: this.buildRequestInclude(),
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!request) {
        throw new Error('ไม่พบคำขอสอบสำหรับโครงงานนี้');
      }
      if (['scheduled', 'completed'].includes(request.status)) {
        throw new Error('ไม่สามารถเปลี่ยนแปลงคำขอหลังนัดสอบแล้ว');
      }

      const approval = await ProjectDefenseRequestAdvisorApproval.findOne({
        where: { requestId: request.requestId, teacherId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!approval) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงคำขอสอบนี้');
      }

      await approval.update({
        status: normalizedDecision,
        note: typeof note === 'string' && note.trim() ? note.trim() : null,
        approvedAt: new Date()
      }, { transaction: t });

      const approvals = await ProjectDefenseRequestAdvisorApproval.findAll({ where: { requestId: request.requestId }, transaction: t });
      const hasRejected = approvals.some(item => item.status === 'rejected');
      const allApproved = approvals.length > 0 && approvals.every(item => item.status === 'approved');

      const statusUpdate = {
        staffVerifiedAt: null,
        staffVerifiedByUserId: null,
        staffVerificationNote: null
      };

      if (hasRejected) {
        statusUpdate.status = 'advisor_in_review';
        statusUpdate.advisorApprovedAt = null;
      } else if (allApproved) {
        statusUpdate.status = 'advisor_approved';
        statusUpdate.advisorApprovedAt = new Date();
      } else {
        statusUpdate.status = 'advisor_in_review';
        statusUpdate.advisorApprovedAt = null;
      }

      await request.update(statusUpdate, { transaction: t });
      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();

      logger.info('submitAdvisorDecision success', {
        projectId,
        teacherId,
        decision: normalizedDecision
      });

      const refreshed = await ProjectDefenseRequest.findByPk(request.requestId, { include: this.buildRequestInclude() });
      const serialized = this.serializeRequest(refreshed);
      await this.attachMeetingMetrics(serialized, {});
      return serialized;
    } catch (error) {
      await this.safeRollback(t);
      logger.error('submitAdvisorDecision failed', { projectId, teacherId, error: error.message });
      throw error;
    }
  }

  async getStaffVerificationQueue(filters = {}) {
    const {
      status,
      academicYear,
      semester,
      search,
      withMetrics = false
    } = filters;

    let statuses = STAFF_QUEUE_DEFAULT_STATUSES;
    if (status) {
      statuses = Array.isArray(status) ? status : [status];
    }

    const where = {
      defenseType: DEFENSE_TYPE_PROJECT1,
      status: { [Op.in]: statuses }
    };

    const projectWhere = {};
    if (academicYear) {
      const year = Number(academicYear);
      if (Number.isInteger(year)) {
        projectWhere.academicYear = year;
      }
    }
    if (semester) {
      const sem = Number(semester);
      if ([1, 2, 3].includes(sem)) {
        projectWhere.semester = sem;
      }
    }
    if (search && typeof search === 'string' && search.trim()) {
      const like = { [Op.like]: `%${search.trim()}%` };
      projectWhere[Op.or] = [
        { projectCode: like },
        { projectNameTh: like },
        { projectNameEn: like }
      ];
    }

    const include = this.buildRequestInclude({ projectWhere });
    const requests = await ProjectDefenseRequest.findAll({
      where,
      include,
      order: [['submitted_at', 'ASC']]
    });

    const serializedList = [];
    for (const request of requests) {
      const serialized = this.serializeRequest(request);
      if (withMetrics) {
        await this.attachMeetingMetrics(serialized, {});
      }
      serializedList.push(serialized);
    }
    return serializedList;
  }

  async exportStaffVerificationList(filters = {}) {
    const records = await this.getStaffVerificationQueue({ ...filters, withMetrics: true });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KP02 Eligible');

    worksheet.columns = [
      { header: 'ลำดับ', key: 'index', width: 8 },
      { header: 'ชื่อโครงงานพิเศษ', key: 'titleTh', width: 40 },
      { header: 'สมาชิก', key: 'members', width: 40 },
      { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 28 },
      { header: 'สถานะคำขอ', key: 'status', width: 18 },
      { header: 'ยื่นคำขอเมื่อ', key: 'submittedAt', width: 20 },
      { header: 'อนุมัติอาจารย์เมื่อ', key: 'advisorApprovedAt', width: 20 },
      { header: 'ตรวจโดยเจ้าหน้าที่เมื่อ', key: 'staffVerifiedAt', width: 20 },
      { header: 'เจ้าหน้าที่ผู้ตรวจ', key: 'staffVerifiedBy', width: 24 },
      { header: 'วันสอบที่นัด', key: 'defenseScheduledAt', width: 22 },
      { header: 'หมายเหตุเจ้าหน้าที่', key: 'staffNote', width: 28 },
    ];

    records.forEach((record, index) => {
      const project = record.project || {};
      const members = (project.members || []).map((member) => `${member.studentCode || '-'} ${member.name || ''}`.trim()).join('\n');
      const advisorName = project.advisor?.name || '-';
      const staffName = record.staffVerifiedBy?.fullName || '-';
      const leaderStudentId = project.members?.find((member) => member.role === 'leader')?.studentId;
      const leaderMetrics = record.meetingMetrics?.perStudent?.find((item) => item.studentId === leaderStudentId) || { approvedLogs: 0 };
      worksheet.addRow({
        index: index + 1,
        projectCode: project.projectCode || '-',
        titleTh: project.projectNameTh || '-',
        members: members || '-',
        advisor: advisorName,
        status: STAFF_STATUS_LABELS_TH[record.status] || record.status,
        submittedAt: formatThaiDateTime(record.submittedAt),
        advisorApprovedAt: formatThaiDateTime(record.advisorApprovedAt),
        staffVerifiedAt: formatThaiDateTime(record.staffVerifiedAt),
        staffVerifiedBy: staffName || '-',
        defenseScheduledAt: formatThaiDateTime(record.defenseScheduledAt),
        staffNote: record.staffVerificationNote || '-',
        leaderLogs: leaderMetrics.approvedLogs || 0,
        requiredLogs: record.meetingMetrics?.requiredApprovedLogs || projectDocumentService.getRequiredApprovedMeetingLogs()
      });
    });

    worksheet.eachRow((row) => {
      row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `รายชื่อสอบโครงงานพิเศษ1_${Date.now()}.xlsx`;
    logger.info('exportStaffVerificationList success', { rowCount: records.length });
    return { buffer, filename };
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

