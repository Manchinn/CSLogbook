const path = require('path');
const { sequelize } = require('../config/database');
const {
  ProjectDefenseRequest,
  ProjectDefenseRequestAdvisorApproval,
  ProjectDocument,
  ProjectMember,
  ProjectExamResult,
  ProjectTestRequest,
  ProjectWorkflowState,
  Student,
  Teacher,
  User
} = require('../models');
const projectDocumentService = require('./projectDocumentService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { ExcelExportBuilder } = require('../utils/excelExportBuilder');
const { logAction } = require('../utils/auditLog');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { checkDefenseRequestDeadline, createDeadlineTag } = require('../utils/requestDeadlineChecker');
const { calculateDefenseRequestLate } = require('../utils/lateSubmissionHelper');
const timezone = require('dayjs/plugin/timezone');
const buddhistEra = require('dayjs/plugin/buddhistEra');
require('dayjs/locale/th');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.tz.setDefault('Asia/Bangkok');

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';
const DEFENSE_TYPE_THESIS = 'THESIS';
const THESIS_REQUIRED_APPROVED_MEETING_LOGS = 4;
const STAFF_QUEUE_DEFAULT_STATUSES = ['advisor_approved', 'staff_verified'];
const EXPORT_DEFAULT_STATUSES = ['completed']; // เฉพาะโครงงานที่พร้อมสอบแล้ว

const DEFENSE_TYPE_LABELS_TH = Object.freeze({
  [DEFENSE_TYPE_PROJECT1]: 'โครงงานพิเศษ 1',
  [DEFENSE_TYPE_THESIS]: 'ปริญญานิพนธ์'
});

const DEFENSE_EXPORT_PREFIX = Object.freeze({
  [DEFENSE_TYPE_PROJECT1]: 'รายชื่อสอบโครงงานพิเศษ1',
  [DEFENSE_TYPE_THESIS]: 'รายชื่อสอบปริญญานิพนธ์'
});

const STAFF_STATUS_LABELS_TH = {
  advisor_in_review: 'รออาจารย์อนุมัติครบ',
  advisor_approved: 'รอเจ้าหน้าที่ตรวจสอบ',
  staff_verified: 'ตรวจสอบแล้ว',
  scheduled: 'นัดสอบแล้ว (ระบบเดิม)',
  completed: 'บันทึกผลสอบแล้ว'
};

const PUBLIC_UPLOAD_BASE = (process.env.PUBLIC_UPLOAD_BASE_URL || '/uploads').replace(/\/?$/, '');

const buildFileInfo = (relativePath, fileName) => {
  if (!relativePath) {
    return null;
  }
  // แปลง path ในระบบเป็น URL ที่ client เข้าถึงได้ พร้อมบันทึกชื่อไฟล์เพื่อให้ UI แสดงผลครบถ้วน
  const normalized = String(relativePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const url = `${PUBLIC_UPLOAD_BASE}/${normalized}`;
  return {
    path: normalized,
    url,
    name: fileName || path.basename(normalized)
  };
};

const formatThaiDateTime = (value) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '-';
  return parsed.locale('th').tz().format('D MMM BBBB เวลา HH:mm น.');
};

class ProjectDefenseRequestService {
  buildProjectInclude({ projectWhere } = {}) {
    const pickExistingAttributes = (model, desired = []) => {
      if (!model || !Array.isArray(desired) || !desired.length) return undefined;
      const available = model.rawAttributes ? desired.filter((name) => model.rawAttributes[name]) : desired;
      return available.length ? available : undefined;
    };

    const projectInclude = {
      model: ProjectDocument,
      as: 'project',
      include: [
        {
          model: ProjectMember,
          as: 'members',
          attributes: pickExistingAttributes(ProjectMember, ['projectId', 'studentId', 'role', 'joinedAt']) || undefined,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: pickExistingAttributes(Student, ['studentId', 'studentCode']) || undefined,
              include: [{ association: Student.associations.user, attributes: pickExistingAttributes(User, ['userId', 'firstName', 'lastName']) || undefined }]
            }
          ]
        },
        {
          model: Teacher,
          as: 'advisor',
          attributes: pickExistingAttributes(Teacher, ['teacherId', 'teacherCode', 'userId', 'teacherType', 'canExportProject1']) || undefined,
          include: [{ model: User, as: 'user', attributes: pickExistingAttributes(User, ['userId', 'firstName', 'lastName']) || undefined }]
        },
        {
          model: Teacher,
          as: 'coAdvisor',
          attributes: pickExistingAttributes(Teacher, ['teacherId', 'teacherCode', 'userId', 'teacherType', 'canExportProject1']) || undefined,
          include: [{ model: User, as: 'user', attributes: pickExistingAttributes(User, ['userId', 'firstName', 'lastName']) || undefined }]
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

  serializeRequest(instance, options = {}) {
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

    const serialized = {
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      submittedLate: data.submittedLate,
      submissionDelayMinutes: data.submissionDelayMinutes
    };

    // เพิ่มข้อมูล deadline status (ถ้าต้องการ)
    if (options.includeDeadlineStatus && data._deadlineStatus) {
      serialized.deadlineStatus = data._deadlineStatus;
    }

    return serialized;
  }

  async attachMeetingMetrics(serializedRequest, { transaction, defenseType } = {}) {
    if (!serializedRequest || !serializedRequest.project) {
      return serializedRequest;
    }
    const memberStudentIds = (serializedRequest.project.members || []).map((member) => member.studentId).filter(Boolean);
    if (!memberStudentIds.length) {
      return serializedRequest;
    }

    try {
      const type = defenseType || serializedRequest.defenseType || DEFENSE_TYPE_PROJECT1;
      const meetingPhase = type === DEFENSE_TYPE_THESIS ? 'phase2' : 'phase1';
      const students = await Student.findAll({ where: { studentId: memberStudentIds }, transaction });
      const metrics = await projectDocumentService.buildProjectMeetingMetrics(
        serializedRequest.project.projectId,
        students,
        { transaction, phase: meetingPhase }
      );
      const requiredApprovedLogs = type === DEFENSE_TYPE_THESIS
        ? THESIS_REQUIRED_APPROVED_MEETING_LOGS
        : projectDocumentService.getRequiredApprovedMeetingLogs();

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

  normalizeThesisPayload(payload, project, latestSystemTest) {
    const base = this.normalizeProject1Payload(payload, project);
    const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

    const rawIntended = payload?.intendedDefenseDate || payload?.intendedDate;
    const intendedDay = rawIntended ? dayjs(rawIntended) : null;
    const intendedDefenseDate = intendedDay && intendedDay.isValid()
      ? intendedDay.format('YYYY-MM-DD')
      : null;

    const attachments = Array.isArray(payload?.attachments)
      ? payload.attachments
          .map((item) => {
            if (!item) return null;
            if (typeof item === 'string') {
              const trimmed = item.trim();
              return trimmed ? { label: null, value: trimmed } : null;
            }
            if (typeof item === 'object') {
              const value = normalizeText(item.value);
              if (!value) return null;
              return {
                label: normalizeText(item.label) || null,
                value
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const thesisPayload = {
      ...base,
      intendedDefenseDate,
      presentationFormat: normalizeText(payload?.presentationFormat),
      progressSummary: normalizeText(payload?.progressSummary),
      additionalMaterials: attachments,
      systemTestSnapshot: latestSystemTest
        ? {
            requestId: latestSystemTest.requestId,
            status: latestSystemTest.status,
            testStartDate: latestSystemTest.testStartDate,
            testDueDate: latestSystemTest.testDueDate,
            staffDecidedAt: latestSystemTest.staffDecidedAt,
            evidenceSubmittedAt: latestSystemTest.evidenceSubmittedAt,
            evidence: buildFileInfo(latestSystemTest.evidenceFilePath, latestSystemTest.evidenceFileName)
          }
        : null
    };

    return thesisPayload;
  }

  validateThesisPayload(payload, { rawStudentsCount = 0 } = {}) {
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
      // ตรวจสอบว่า actor เป็นสมาชิกของโครงงานหรือไม่ (ทั้ง 2 คนมีสิทธิ์เท่ากัน)
      const isMember = members.some(member => Number(member.studentId) === Number(actorStudentId));
      if (!isMember) {
        throw new Error('อนุญาตเฉพาะสมาชิกโครงงานในการยื่นคำขอนี้');
      }

      if (!['in_progress', 'completed'].includes(project.status)) {
        throw new Error('โครงงานต้องอยู่ในสถานะ in_progress ก่อนยื่นคำขอสอบ');
      }

      const memberStudentIds = members.map(member => member.studentId).filter(Boolean);
      const students = memberStudentIds.length
        ? await Student.findAll({ where: { studentId: memberStudentIds }, transaction: t })
        : [];
  const meetingMetrics = await projectDocumentService.buildProjectMeetingMetrics(projectId, students, { transaction: t, phase: 'phase1' });
      const requiredApprovedLogs = projectDocumentService.getRequiredApprovedMeetingLogs();
      // ตรวจสอบ meeting logs ของสมาชิกที่ส่งคำร้อง (ไม่จำเป็นต้องเป็น leader)
      const actorMetrics = meetingMetrics.perStudent?.[actorStudentId] || { approvedLogs: 0 };
      if ((actorMetrics.approvedLogs || 0) < requiredApprovedLogs) {
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

      // ตรวจสอบสถานะที่ไม่สามารถแก้ไขได้: 'completed' (บันทึกผลสอบแล้ว) และ 'scheduled' (legacy: ระบบเดิม)
      if (record && ['scheduled', 'completed'].includes(record.status)) {
        throw new Error('ไม่สามารถแก้ไขคำขอได้ เนื่องจากอยู่ในสถานะที่ดำเนินการเรียบร้อยแล้ว');
      }

      const now = new Date();
      
      // 🆕 คำนวณสถานะการส่งช้า (Google Classroom style)
      const lateStatus = await calculateDefenseRequestLate(now, DEFENSE_TYPE_PROJECT1, {
        academicYear: project.academicYear,
        semester: project.semester
      }, actorStudentId);
      
      const basePayload = {
        formPayload: cleanedPayload,
        status: 'advisor_in_review',
        submittedByStudentId: actorStudentId,
        submittedAt: now,
        advisorApprovedAt: null,
        staffVerifiedAt: null,
        staffVerifiedByUserId: null,
        staffVerificationNote: null,
        // 🆕 เพิ่มข้อมูลการส่งช้า
        submittedLate: lateStatus.submitted_late,
        submissionDelayMinutes: lateStatus.submission_delay_minutes,
        importantDeadlineId: lateStatus.important_deadline_id
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

      // 🆕 อัปเดต workflow state ทันทีเมื่อยื่นคำขอ
      await ProjectWorkflowState.updateFromDefenseRequest(
        projectId,
        DEFENSE_TYPE_PROJECT1,
        record.requestId,
        'submitted',
        { userId: actorStudentId, transaction: t }
      );

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

  async submitThesisRequest(projectId, actorStudentId, payload = {}) {
    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, {
        include: [
          {
            model: ProjectMember,
            as: 'members',
            include: [{
              model: Student,
              as: 'student',
              include: [{ association: Student.associations.user }]
            }]
          },
          {
            model: ProjectExamResult,
            as: 'examResults'
          }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!project) {
        throw new Error('ไม่พบโครงงาน');
      }

      const members = project.members || [];
      // ตรวจสอบว่า actor เป็นสมาชิกของโครงงานหรือไม่ (ทั้ง 2 คนมีสิทธิ์เท่ากัน)
      const isMember = members.some(member => Number(member.studentId) === Number(actorStudentId));
      if (!isMember) {
        throw new Error('อนุญาตเฉพาะสมาชิกโครงงานในการยื่นคำขอนี้');
      }

      if (!['in_progress', 'completed'].includes(project.status)) {
        throw new Error('โครงงานต้องอยู่ในสถานะ in_progress ก่อนยื่นคำขอสอบ');
      }

      const examResults = project.examResults || [];
      const project1Result = examResults.find((exam) => exam.examType === DEFENSE_TYPE_PROJECT1);
      const hasProject1Pass = (project1Result?.result || '').toString().trim().toUpperCase() === 'PASS';

      // รองรับข้อมูล legacy ที่ยังบันทึกผลสอบไว้ใน project_documents.exam_result = 'passed'
      const legacyExamResult = (project.examResult || '').toString().trim().toLowerCase();
      const legacyProject1Pass = legacyExamResult === 'passed';

      if (!hasProject1Pass && !legacyProject1Pass) {
        throw new Error('ต้องผ่านการสอบโครงงานพิเศษ 1 ก่อนจึงจะยื่นคำขอสอบโครงงานพิเศษ 2 ได้');
      }

      const memberStudentIds = members.map(member => member.studentId).filter(Boolean);
      const students = memberStudentIds.length
        ? await Student.findAll({ where: { studentId: memberStudentIds }, transaction: t })
        : [];
  const meetingMetrics = await projectDocumentService.buildProjectMeetingMetrics(projectId, students, { transaction: t, phase: 'phase2' });
      // ตรวจสอบ meeting logs ของสมาชิกที่ส่งคำร้อง (ไม่จำเป็นต้องเป็น leader)
      const actorMetrics = meetingMetrics.perStudent?.[actorStudentId] || { approvedLogs: 0 };
      if ((actorMetrics.approvedLogs || 0) < THESIS_REQUIRED_APPROVED_MEETING_LOGS) {
        throw new Error(`ยังไม่สามารถยื่นคำขอสอบได้ ต้องมีบันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย ${THESIS_REQUIRED_APPROVED_MEETING_LOGS} ครั้ง`);
      }

      const latestSystemTest = await ProjectTestRequest.findOne({
        where: { projectId },
        order: [['submitted_at', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!latestSystemTest || !['staff_approved', 'evidence_submitted'].includes(latestSystemTest.status)) {
        throw new Error('ยังไม่ได้รับการอนุมัติคำขอทดสอบระบบครบ 30 วัน');
      }
      if (!latestSystemTest.evidenceSubmittedAt) {
        throw new Error('กรุณาอัปโหลดหลักฐานการประเมินการทดสอบระบบให้ครบถ้วนก่อนยื่นคำขอสอบ');
      }

      const testDue = latestSystemTest.testDueDate ? dayjs(latestSystemTest.testDueDate) : null;
      if (testDue && testDue.isAfter(dayjs())) {
        throw new Error('ยังไม่ครบกำหนดระยะเวลาทดสอบระบบ 30 วัน');
      }

      const cleanedPayload = this.normalizeThesisPayload(payload, project, latestSystemTest);
      this.validateThesisPayload(cleanedPayload, {
        rawStudentsCount: Array.isArray(payload?.students) ? payload.students.length : 0
      });

      let record = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType: DEFENSE_TYPE_THESIS },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      // ตรวจสอบสถานะที่ไม่สามารถแก้ไขได้: 'completed' (บันทึกผลสอบแล้ว) และ 'scheduled' (legacy: ระบบเดิม)
      if (record && ['scheduled', 'completed'].includes(record.status)) {
        throw new Error('ไม่สามารถแก้ไขคำขอได้ เนื่องจากอยู่ในสถานะที่ดำเนินการเรียบร้อยแล้ว');
      }

      const now = new Date();
      
      // 🆕 คำนวณสถานะการส่งช้า (Google Classroom style)
      const lateStatus = await calculateDefenseRequestLate(now, DEFENSE_TYPE_THESIS, {
        academicYear: project.academicYear,
        semester: project.semester
      }, actorStudentId);
      
      const basePayload = {
        formPayload: cleanedPayload,
        status: 'advisor_in_review',
        submittedByStudentId: actorStudentId,
        submittedAt: now,
        advisorApprovedAt: null,
        staffVerifiedAt: null,
        staffVerifiedByUserId: null,
        staffVerificationNote: null,
        // 🆕 เพิ่มข้อมูลการส่งช้า
        submittedLate: lateStatus.submitted_late,
        submissionDelayMinutes: lateStatus.submission_delay_minutes,
        importantDeadlineId: lateStatus.important_deadline_id
      };

      if (record) {
        await record.update(basePayload, { transaction: t });
      } else {
        record = await ProjectDefenseRequest.create({
          projectId,
          defenseType: DEFENSE_TYPE_THESIS,
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

      // 🆕 อัปเดต workflow state ทันทีเมื่อยื่นคำขอ
      await ProjectWorkflowState.updateFromDefenseRequest(
        projectId,
        DEFENSE_TYPE_THESIS,
        record.requestId,
        'submitted',
        { userId: actorStudentId, transaction: t }
      );

      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t, projectInstance: project });
      await t.commit();

      logger.info('submitThesisRequest success', { projectId });
      return this.getThesisRequest(projectId, { withMetrics: true });
    } catch (error) {
      await this.safeRollback(t);
      logger.error('submitThesisRequest failed', { projectId, error: error.message });
      throw error;
    }
  }
  
  async attachSystemTestEvidence(serializedRequest, { transaction } = {}) {
    if (!serializedRequest || serializedRequest.defenseType !== DEFENSE_TYPE_THESIS) {
      return serializedRequest;
    }
    const snapshot = serializedRequest.formPayload?.systemTestSnapshot;
    if (!snapshot || (snapshot.evidence && snapshot.evidence.url)) {
      return serializedRequest;
    }

    if (!serializedRequest.projectId) {
      return serializedRequest;
    }

    const latestSystemTest = await ProjectTestRequest.findOne({
      where: { projectId: serializedRequest.projectId },
      order: [['submitted_at', 'DESC']],
      transaction
    });

    if (!latestSystemTest) {
      return serializedRequest;
    }

    const evidenceInfo = buildFileInfo(latestSystemTest.evidenceFilePath, latestSystemTest.evidenceFileName);
    if (!evidenceInfo) {
      return serializedRequest;
    }

    serializedRequest.formPayload = serializedRequest.formPayload || {};
    serializedRequest.formPayload.systemTestSnapshot = {
      ...snapshot,
      evidence: evidenceInfo,
      evidenceSubmittedAt: snapshot.evidenceSubmittedAt || latestSystemTest.evidenceSubmittedAt || null,
      staffDecidedAt: snapshot.staffDecidedAt || latestSystemTest.staffDecidedAt || null,
      testStartDate: snapshot.testStartDate || latestSystemTest.testStartDate || null,
      testDueDate: snapshot.testDueDate || latestSystemTest.testDueDate || null
    };

    return serializedRequest;
  }

  async getDefenseRequest(projectId, defenseType, { withMetrics = false, transaction } = {}) {
    const request = await ProjectDefenseRequest.findOne({
      where: {
        projectId,
        defenseType,
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
    await this.attachSystemTestEvidence(serialized, { transaction });
    if (withMetrics) {
      await this.attachMeetingMetrics(serialized, { transaction, defenseType });
    }
    return serialized;
  }

  async getProject1Request(projectId, options = {}) {
    return this.getDefenseRequest(projectId, DEFENSE_TYPE_PROJECT1, options);
  }

  async getLatestProject1Request(projectId) {
    return this.getDefenseRequest(projectId, DEFENSE_TYPE_PROJECT1, { withMetrics: true });
  }

  async getThesisRequest(projectId, options = {}) {
    return this.getDefenseRequest(projectId, DEFENSE_TYPE_THESIS, options);
  }

  async getLatestThesisRequest(projectId) {
    return this.getDefenseRequest(projectId, DEFENSE_TYPE_THESIS, { withMetrics: true });
  }

  async hasSubmittedDefenseRequest(projectId, defenseType, { transaction } = {}) {
    const count = await ProjectDefenseRequest.count({
      where: {
        projectId,
        defenseType,
        status: { [Op.ne]: 'cancelled' }
      },
      transaction
    });
    return count > 0;
  }

  async hasSubmittedProject1Request(projectId, options = {}) {
    return this.hasSubmittedDefenseRequest(projectId, DEFENSE_TYPE_PROJECT1, options);
  }

  async scheduleProject1Defense() {
    throw new Error('ระบบนัดสอบโครงงานพิเศษ 1 ถูกย้ายไปจัดการผ่านปฏิทินภาควิชาแล้ว เจ้าหน้าที่ไม่ต้องบันทึกวันและสถานที่ในระบบนี้');
  }

  async verifyDefenseRequest(projectId, { note } = {}, actorUser = {}, defenseType = DEFENSE_TYPE_PROJECT1) {
    const t = await sequelize.transaction();
    try {
      const request = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType },
        include: this.buildRequestInclude(),
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!request) {
        throw new Error('ไม่พบคำขอสอบสำหรับโครงงานนี้');
      }
      // ตรวจสอบสถานะที่ไม่สามารถแก้ไขได้: 'completed' (บันทึกผลสอบแล้ว) และ 'scheduled' (legacy: ระบบเดิม)
      if (['completed', 'scheduled'].includes(request.status)) {
        throw new Error('ไม่สามารถตรวจสอบคำขอได้ เนื่องจากอยู่ในสถานะที่ดำเนินการเรียบร้อยแล้ว');
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
      
      // 🆕 อัปเดต workflow state เมื่อ staff verify
      await ProjectWorkflowState.updateFromDefenseRequest(
        projectId,
        defenseType,
        request.requestId,
        'staff_verified',
        { userId: actorUser?.userId || null, transaction: t }
      );
      
      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();

      logger.info('verifyDefenseRequest success', { projectId, defenseType, staffUserId: actorUser?.userId || null });
      logAction('VERIFY_DEFENSE', `เจ้าหน้าที่ตรวจสอบคำขอสอบ projectId=${projectId}`, { userId: actorUser?.userId || null });

      const serialized = this.serializeRequest(await request.reload({ include: this.buildRequestInclude() }));
      return serialized;
    } catch (error) {
      await this.safeRollback(t);
      logger.error('verifyDefenseRequest failed', { projectId, defenseType, error: error.message });
      throw error;
    }
  }

  async verifyProject1Request(projectId, payload = {}, actorUser = {}) {
    return this.verifyDefenseRequest(projectId, payload, actorUser, DEFENSE_TYPE_PROJECT1);
  }

  async verifyThesisRequest(projectId, payload = {}, actorUser = {}) {
    return this.verifyDefenseRequest(projectId, payload, actorUser, DEFENSE_TYPE_THESIS);
  }

  async rejectDefenseRequest(projectId, { reason } = {}, actorUser = {}, defenseType = DEFENSE_TYPE_PROJECT1) {
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      const error = new Error('กรุณาระบุเหตุผลการปฏิเสธอย่างน้อย 10 ตัวอักษร');
      error.statusCode = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      const request = await ProjectDefenseRequest.findOne({
        where: { projectId, defenseType },
        include: this.buildRequestInclude(),
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!request) {
        throw new Error('ไม่พบคำขอสอบสำหรับโครงงานนี้');
      }
      if (!['advisor_approved', 'staff_verified'].includes(request.status)) {
        throw new Error('ไม่สามารถปฏิเสธคำขอนี้ได้ในสถานะปัจจุบัน');
      }

      await request.update({
        status: 'advisor_in_review',
        advisorApprovedAt: null,
        staffVerifiedAt: null,
        staffVerifiedByUserId: null,
        staffVerificationNote: reason.trim()
      }, { transaction: t });

      // Reset advisor approval rows เพื่อบังคับให้ advisor review ใหม่
      await ProjectDefenseRequestAdvisorApproval.update(
        { status: 'pending', approvedAt: null, note: null },
        { where: { requestId: request.requestId }, transaction: t }
      );

      await projectDocumentService.syncProjectWorkflowState(projectId, { transaction: t });
      await t.commit();

      logger.info('rejectDefenseRequest success', { projectId, defenseType, staffUserId: actorUser?.userId || null });
      logAction('REJECT_DEFENSE', `ส่งกลับคำขอสอบ projectId=${projectId}`, { userId: actorUser?.userId || null });

      return this.serializeRequest(await request.reload({ include: this.buildRequestInclude() }));
    } catch (error) {
      await this.safeRollback(t);
      logger.error('rejectDefenseRequest failed', { projectId, defenseType, error: error.message });
      throw error;
    }
  }

  async rejectProject1Request(projectId, payload = {}, actorUser = {}) {
    return this.rejectDefenseRequest(projectId, payload, actorUser, DEFENSE_TYPE_PROJECT1);
  }

  async rejectThesisRequest(projectId, payload = {}, actorUser = {}) {
    return this.rejectDefenseRequest(projectId, payload, actorUser, DEFENSE_TYPE_THESIS);
  }

  async getAdvisorApprovalQueue(teacherId, { status, withMetrics = false, defenseType = DEFENSE_TYPE_PROJECT1 } = {}) {
    const where = { teacherId };
    if (status) {
      const statusFilter = Array.isArray(status) ? status : [status];
      where.status = { [Op.in]: statusFilter };
    }
    const approvals = await ProjectDefenseRequestAdvisorApproval.findAll({
      where,
      include: [{
        model: ProjectDefenseRequest,
        as: 'request',
        where: { defenseType },
        include: this.buildRequestInclude()
      }],
      order: [[{ model: ProjectDefenseRequest, as: 'request' }, 'submitted_at', 'ASC']]
    });

    const results = [];
    for (const approval of approvals) {
      if (!approval.request) continue;
      let serialized = this.serializeRequest(approval.request);
      serialized = await this.attachMeetingMetrics(serialized, { defenseType });
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

    // Summary counts (unfiltered by status — always count all statuses for this teacher+defenseType)
    const summaryRows = await ProjectDefenseRequestAdvisorApproval.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('ProjectDefenseRequestAdvisorApproval.approval_id')), 'count']
      ],
      include: [{
        model: ProjectDefenseRequest,
        as: 'request',
        attributes: [],
        where: { defenseType },
        required: true
      }],
      where: { teacherId },
      group: ['ProjectDefenseRequestAdvisorApproval.status'],
      raw: true
    });

    const summary = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const row of summaryRows) {
      const s = row.status;
      const count = Number(row.count || 0);
      if (s === 'approved') summary.approved = count;
      else if (s === 'rejected') summary.rejected = count;
      else if (s === 'pending') summary.pending = count;
    }
    summary.total = summary.pending + summary.approved + summary.rejected;

    return { items: results, summary };
  }

  async submitAdvisorDecision(projectId, teacherId, { decision, note } = {}, { defenseType = DEFENSE_TYPE_PROJECT1 } = {}) {
    let normalizedDecision = String(decision || '').toLowerCase();
    // รองรับทั้ง "approve"/"reject" (frontend) และ "approved"/"rejected"
    if (normalizedDecision === 'approve') normalizedDecision = 'approved';
    if (normalizedDecision === 'reject') normalizedDecision = 'rejected';
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
        where: { projectId, defenseType },
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
        defenseType,
        decision: normalizedDecision
      });

      if (normalizedDecision === 'approved') {
        logAction('APPROVE_DEFENSE', `อาจารย์อนุมัติคำขอสอบ projectId=${projectId}`, { userId: teacherId });
      } else {
        logAction('REJECT_DEFENSE', `อาจารย์ส่งกลับคำขอสอบ projectId=${projectId}`, { userId: teacherId });
      }

      if (hasRejected) {
        try {
          const members = await ProjectMember.findAll({
            where: { projectId },
            include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['userId'] }] }]
          });
          const userIds = members.map(m => m.student?.user?.userId).filter(Boolean);
          const isThesis = defenseType === 'THESIS';
          if (userIds.length > 0) {
            await notificationService.createAndNotifyMany(userIds, {
              type: 'APPROVAL',
              title: isThesis ? 'คำขอสอบปริญญานิพนธ์ถูกส่งกลับ' : 'คำขอสอบโครงงานพิเศษถูกส่งกลับ',
              message: (typeof note === 'string' && note.trim()) || 'กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่',
              metadata: {
                projectId,
                requestId: request.requestId,
                defenseType,
                action: 'rejected',
                targetUrl: isThesis ? '/project/phase2/thesis-defense' : '/project/phase1/exam-submit'
              }
            });
          }
        } catch (notifErr) {
          logger.error('Failed to send defense rejection notification', { projectId, error: notifErr.message });
        }
      }

      const refreshed = await ProjectDefenseRequest.findByPk(request.requestId, { include: this.buildRequestInclude() });
      const serialized = this.serializeRequest(refreshed);
  await this.attachMeetingMetrics(serialized, { defenseType });
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
      withMetrics = false,
      defenseType = DEFENSE_TYPE_PROJECT1,
      limit,
      offset
    } = filters;

    let statuses = STAFF_QUEUE_DEFAULT_STATUSES;
    if (status) {
      statuses = Array.isArray(status) ? status : [status];
    }

    const where = {
      defenseType,
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
    
    // Pagination params
    const paginationLimit = limit ? parseInt(limit, 10) : undefined;
    const paginationOffset = offset ? parseInt(offset, 10) : undefined;

    let requests;
    let total = 0;

    if (paginationLimit !== undefined || paginationOffset !== undefined) {
      // ใช้ findAndCountAll สำหรับ pagination
      const { rows, count } = await ProjectDefenseRequest.findAndCountAll({
        where,
        include,
        order: [['submitted_at', 'ASC']],
        limit: paginationLimit,
        offset: paginationOffset,
        distinct: true, // สำคัญ: ใช้ distinct เพื่อนับแถวที่ถูกต้องเมื่อมี join
      });
      requests = rows;
      total = count;
    } else {
      // ไม่มี pagination ใช้ findAll
      requests = await ProjectDefenseRequest.findAll({
        where,
        include,
        order: [['submitted_at', 'ASC']]
      });
      total = requests.length;
    }

    const serializedList = [];
    for (const request of requests) {
      // ตรวจสอบ deadline status
      const deadlineStatus = await checkDefenseRequestDeadline({
        submittedAt: request.submittedAt,
        defenseType: request.defenseType,
        project: request.project
      });
      
      const deadlineTag = createDeadlineTag(deadlineStatus, request.submittedLate, request.submissionDelayMinutes);
      
      // Attach deadline status to request data before serialization
      request._deadlineStatus = {
        ...deadlineStatus,
        tag: deadlineTag
      };

      const serialized = this.serializeRequest(request, { includeDeadlineStatus: true });
      if (withMetrics) {
        await this.attachMeetingMetrics(serialized, { defenseType });
      }
      serializedList.push(serialized);
    }
    return { data: serializedList, total };
  }

  async exportStaffVerificationList(filters = {}) {
    const { defenseType = DEFENSE_TYPE_PROJECT1 } = filters;
    // ใช้ status จาก user filter — ถ้าไม่ส่งมาจะใช้ default ของ getStaffVerificationQueue
    const exportFilters = { ...filters, withMetrics: false };
    const { data: records = [] } = await this.getStaffVerificationQueue(exportFilters);
    const worksheetName = defenseType === DEFENSE_TYPE_THESIS ? 'รายชื่อสอบปริญญานิพนธ์' : 'รายชื่อสอบโครงงานพิเศษ 1';

    const columns = [
      { header: 'ลำดับ', key: 'index', width: 10 },
      { header: 'ชื่อโครงงานพิเศษ', key: 'titleTh', width: 50 },
      { header: 'สมาชิก', key: 'members', width: 45 },
      { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 30 }
    ];

    const dataRows = records.map((record, index) => {
      const project = record.project || {};
      const members = (project.members || [])
        .map((member) => {
          const code = member.studentCode || '-';
          const name = member.name || '';
          return `${code} ${name}`.trim();
        })
        .join('\n');
      const advisorName = project.advisor?.name || '-';
      return {
        index: index + 1,
        titleTh: project.projectNameTh || '-',
        members: members || '-',
        advisor: advisorName
      };
    });

    const filenamePrefix = DEFENSE_EXPORT_PREFIX[defenseType] || DEFENSE_EXPORT_PREFIX[DEFENSE_TYPE_PROJECT1];
    const builder = new ExcelExportBuilder(filenamePrefix)
      .setHeaderStyle({ bold: true, fill: 'FFE0E0E0' })
      .addSheet(worksheetName, columns, dataRows);

    const buffer = await builder.toBuffer();
    logger.info('exportStaffVerificationList success', { rowCount: records.length, defenseType });
    return { buffer, filename: builder.filename };
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

