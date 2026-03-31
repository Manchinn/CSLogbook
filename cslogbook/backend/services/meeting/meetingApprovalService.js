const { sequelize } = require('../../config/database');
const {
  Meeting,
  MeetingLog,
  MeetingAttachment,
  MeetingActionItem,
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User
} = require('../../models');
const { Op } = require('sequelize');
const notificationService = require('../notificationService');
const logger = require('../../utils/logger');
const { ensureMeetingAccess } = require('./meetingCoreService');
const { serializeLog } = require('./meetingSerializer');

async function updateLogApproval(projectId, meetingId, logId, actor, payload = {}) {
  const context = await ensureMeetingAccess(meetingId, actor);
  if (context.project.projectId !== Number(projectId)) {
    const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
    error.statusCode = 400;
    throw error;
  }

  if (!['admin', 'teacher'].includes(actor.role)) {
    const error = new Error('เฉพาะอาจารย์ที่ปรึกษาหรือผู้ดูแลระบบเท่านั้นที่อนุมัติได้');
    error.statusCode = 403;
    throw error;
  }

  if (actor.role === 'teacher') {
    const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
    if (!teacher) {
      const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
      error.statusCode = 403;
      throw error;
    }
    const isAdvisor = [context.project.advisorId, context.project.coAdvisorId].filter(Boolean).includes(teacher.teacherId);
    if (!isAdvisor) {
      const error = new Error('อาจารย์ไม่ได้รับมอบหมายให้ดูแลโครงงานนี้');
      error.statusCode = 403;
      throw error;
    }
  }

  const log = await MeetingLog.findOne({ where: { logId, meetingId } });
  if (!log) {
    const error = new Error('ไม่พบบันทึกการประชุมที่ต้องการอนุมัติ');
    error.statusCode = 404;
    throw error;
  }

  const decision = payload.status || payload.decision || 'approved';
  if (!['pending', 'approved', 'rejected'].includes(decision)) {
    const error = new Error('สถานะการอนุมัติไม่ถูกต้อง');
    error.statusCode = 400;
    throw error;
  }

  let advisorComment = log.advisorComment;
  if (payload.advisorComment !== undefined) {
    advisorComment = typeof payload.advisorComment === 'string'
      ? payload.advisorComment.trim()
      : payload.advisorComment;
  }

  const update = {
    approvalStatus: decision,
    approvalNote: typeof payload.approvalNote === 'string' ? payload.approvalNote.trim() : null,
    advisorComment
  };

  if (decision === 'pending') {
    update.approvedBy = null;
    update.approvedAt = null;
  } else {
    update.approvedBy = actor.userId;
    update.approvedAt = new Date();
  }

  await MeetingLog.update(update, { where: { logId } });
  const updated = await MeetingLog.findByPk(logId, {
    include: [
      { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: MeetingAttachment, as: 'attachments' },
      { model: MeetingActionItem, as: 'actionItems' }
    ]
  });

  logger.info('meetingService.updateLogApproval success', { meetingId, logId, decision, actorId: actor.userId });

  if (decision === 'rejected' && updated?.recordedBy) {
    try {
      await notificationService.createAndNotify(updated.recordedBy, {
        type: 'MEETING',
        title: 'บันทึกการพบอาจารย์ถูกส่งกลับ',
        message: payload.approvalNote || 'กรุณาตรวจสอบและแก้ไขบันทึกการประชุม',
        metadata: { meetingId, logId, action: 'rejected', targetUrl: '/project/phase1/meeting-logbook' }
      });
    } catch (notifErr) {
      logger.error('Failed to send meeting log rejection notification', { logId, error: notifErr.message });
    }
  }

  return serializeLog(updated);
}

async function listTeacherMeetingApprovals(actor, filters = {}) {
  if (!actor || actor.role !== 'teacher') {
    const error = new Error('อนุญาตเฉพาะอาจารย์เท่านั้นในการดึงคิวอนุมัติ');
    error.statusCode = 403;
    throw error;
  }

  const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
  if (!teacher) {
    const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
    error.statusCode = 404;
    throw error;
  }

  if (teacher.teacherType && teacher.teacherType !== 'academic') {
    const error = new Error('ฟีเจอร์นี้เปิดเฉพาะอาจารย์ที่ปรึกษาสายวิชาการเท่านั้น');
    error.statusCode = 403;
    throw error;
  }

  const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'all']);
  const requestedStatusRaw = typeof filters.status === 'string' ? filters.status.trim().toLowerCase() : null;
  const requestedStatus = allowedStatuses.has(requestedStatusRaw) ? requestedStatusRaw : 'all';

  const logWhere = {};
  if (requestedStatus !== 'all') {
    logWhere.approvalStatus = requestedStatus;
  }

  const teacherConstraint = {
    [Op.or]: [
      { advisorId: teacher.teacherId },
      { coAdvisorId: teacher.teacherId }
    ]
  };

  const projectWhere = { ...teacherConstraint };
  const academicYear = filters.academicYear ? Number(filters.academicYear) : null;
  if (Number.isInteger(academicYear) && academicYear > 1900) {
    projectWhere.academicYear = academicYear;
  }
  const semester = filters.semester ? Number(filters.semester) : null;
  if ([1, 2, 3].includes(semester)) {
    projectWhere.semester = semester;
  }
  const projectId = filters.projectId ? Number(filters.projectId) : null;
  if (Number.isInteger(projectId) && projectId > 0) {
    projectWhere.projectId = projectId;
  }

  const metaWhere = { ...teacherConstraint };
  if (metaWhere.academicYear !== undefined) {
    delete metaWhere.academicYear;
  }
  if (metaWhere.semester !== undefined) {
    delete metaWhere.semester;
  }

  const searchTerm = typeof filters.q === 'string' ? filters.q.trim() : '';
  if (searchTerm) {
    const likeValue = `%${searchTerm.replace(/[%_]/g, '\\$&')}%`;
    logWhere[Op.or] = [
      { discussionTopic: { [Op.like]: likeValue } },
      { currentProgress: { [Op.like]: likeValue } },
      { problemsIssues: { [Op.like]: likeValue } },
      { nextActionItems: { [Op.like]: likeValue } }
    ];
  }

  const logs = await MeetingLog.findAll({
    where: logWhere,
    include: [
      {
        model: Meeting,
        as: 'meeting',
        attributes: ['meetingId', 'meetingTitle', 'meetingDate', 'meetingMethod', 'meetingLocation', 'meetingLink', 'projectId', 'phase'],
        required: true,
        include: [
          {
            model: ProjectDocument,
            as: 'project',
            attributes: ['projectId', 'projectCode', 'projectNameTh', 'projectNameEn', 'advisorId', 'coAdvisorId', 'academicYear', 'semester'],
            where: projectWhere,
            required: true,
            include: [
              {
                model: Teacher,
                as: 'advisor',
                attributes: ['teacherId', 'teacherCode', 'userId'],
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                  }
                ]
              },
              {
                model: Teacher,
                as: 'coAdvisor',
                attributes: ['teacherId', 'teacherCode', 'userId'],
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                  }
                ]
              }
            ]
          }
        ]
      },
      { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: MeetingAttachment, as: 'attachments', attributes: ['attachmentId', 'fileName', 'filePath', 'fileType', 'fileSize', 'uploadDate', 'uploadedBy'] },
      { model: MeetingActionItem, as: 'actionItems', attributes: ['itemId', 'actionDescription', 'assignedTo', 'dueDate', 'status', 'completionDate'] }
    ],
    order: [['created_at', 'DESC']]
  });

  const projectIds = Array.from(new Set(
    logs
      .map(log => log.meeting?.project?.projectId)
      .filter(id => Number.isInteger(id))
  ));

  const projectMemberMap = new Map();
  // รวมข้อมูลนักศึกษาในแต่ละโครงงานไว้ล่วงหน้า เพื่อให้เมธอดหลักสามารถนำไปแสดงผลได้สะดวก
  if (projectIds.length) {
    const memberships = await ProjectMember.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      attributes: ['projectId'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['studentId', 'studentCode', 'userId'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    memberships.forEach(member => {
      if (!projectMemberMap.has(member.projectId)) {
        projectMemberMap.set(member.projectId, []);
      }
      const student = member.student;
      if (!student) return;
      const user = student.user;
      const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : null;
      projectMemberMap.get(member.projectId).push({
        studentId: student.studentId,
        studentCode: student.studentCode,
        userId: student.userId,
        fullName: fullName || student.studentCode,
        email: user?.email || null
      });
    });
  }

  const now = Date.now();
  const items = logs.map(logInstance => {
    const serializedLog = serializeLog(logInstance);
    const meeting = logInstance.meeting;
    const project = meeting?.project;
    const projectIdValue = project?.projectId || null;
    const students = projectIdValue ? (projectMemberMap.get(projectIdValue) || []) : [];
    const pendingDurationMs = serializedLog.createdAt ? now - new Date(serializedLog.createdAt).getTime() : null;
    const pendingDurationDays = pendingDurationMs != null ? Math.max(0, Math.floor(pendingDurationMs / (24 * 60 * 60 * 1000))) : null;

    const advisorRole = project
      ? project.advisorId === teacher.teacherId
        ? 'advisor'
        : project.coAdvisorId === teacher.teacherId
          ? 'coAdvisor'
          : null
      : null;

    return {
      ...serializedLog,
      meeting: meeting ? {
        meetingId: meeting.meetingId,
        meetingTitle: meeting.meetingTitle,
        meetingDate: meeting.meetingDate,
        meetingMethod: meeting.meetingMethod,
        meetingLocation: meeting.meetingLocation,
        meetingLink: meeting.meetingLink,
        projectId: meeting.projectId,
        phase: meeting.phase || 'phase1'
      } : null,
      project: project ? {
        projectId: project.projectId,
        projectCode: project.projectCode,
        projectNameTh: project.projectNameTh,
        projectNameEn: project.projectNameEn,
        academicYear: project.academicYear,
        semester: project.semester,
        advisor: project.advisor ? {
          teacherId: project.advisor.teacherId,
          teacherCode: project.advisor.teacherCode,
          userId: project.advisor.userId,
          firstName: project.advisor.user?.firstName || null,
          lastName: project.advisor.user?.lastName || null,
          email: project.advisor.user?.email || null
        } : null,
        coAdvisor: project.coAdvisor ? {
          teacherId: project.coAdvisor.teacherId,
          teacherCode: project.coAdvisor.teacherCode,
          userId: project.coAdvisor.userId,
          firstName: project.coAdvisor.user?.firstName || null,
          lastName: project.coAdvisor.user?.lastName || null,
          email: project.coAdvisor.user?.email || null
        } : null
      } : null,
      students,
      advisorRole,
      pendingDurationDays
    };
  });

  // คำนวณสรุปจำนวนตามสถานะเพื่อใช้แสดงบน Dashboard ของอาจารย์
  const summaryRows = await MeetingLog.findAll({
    attributes: [
      'approvalStatus',
      [sequelize.fn('COUNT', sequelize.col('MeetingLog.log_id')), 'count']
    ],
    include: [{
      model: Meeting,
      as: 'meeting',
      attributes: [],
      required: true,
      include: [{
        model: ProjectDocument,
        as: 'project',
        attributes: [],
        required: true,
        where: projectWhere
      }]
    }],
    group: ['MeetingLog.approval_status'],
    raw: true
  });

  const summary = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  };
  summaryRows.forEach(row => {
    const status = row.approvalStatus || row['MeetingLog.approvalStatus'] || row.approval_status;
    const count = Number(row.count || 0);
    if (status === 'approved') summary.approved = count;
    else if (status === 'rejected') summary.rejected = count;
    else if (status === 'pending') summary.pending = count;
  });
  summary.total = summary.pending + summary.approved + summary.rejected;

  let availableAcademicYears = [];
  let availableSemestersByYear = {};
  let projectsByAcademicYear = {};
  try {
    const periodRows = await ProjectDocument.findAll({
      attributes: [
        [sequelize.col('academic_year'), 'academicYear'],
        [sequelize.col('semester'), 'semester']
      ],
      where: metaWhere,
      group: ['academic_year', 'semester'],
      order: [
        [sequelize.literal('academic_year IS NULL'), 'ASC'],
        [sequelize.literal('academic_year'), 'DESC'],
        [sequelize.literal('semester'), 'ASC']
      ],
      raw: true
    });

    availableAcademicYears = [];
    availableSemestersByYear = {};
    periodRows.forEach((row) => {
      const year = row.academicYear;
      const sem = row.semester;
      if (year == null) {
        return;
      }
      if (!availableAcademicYears.includes(year)) {
        availableAcademicYears.push(year);
      }
      if (!availableSemestersByYear[year]) {
        availableSemestersByYear[year] = [];
      }
      if (sem != null && !availableSemestersByYear[year].includes(sem)) {
        availableSemestersByYear[year].push(sem);
      }
    });
    availableAcademicYears.sort((a, b) => b - a);
    Object.values(availableSemestersByYear).forEach((list) => list.sort((a, b) => a - b));

    const projectRows = await ProjectDocument.findAll({
      attributes: [
        [sequelize.col('academic_year'), 'academicYear'],
        [sequelize.col('project_id'), 'projectId'],
        [sequelize.col('project_code'), 'projectCode'],
        [sequelize.col('project_name_th'), 'projectNameTh'],
        [sequelize.col('project_name_en'), 'projectNameEn'],
        [sequelize.col('semester'), 'semester']
      ],
      where: metaWhere,
      order: [
        [sequelize.literal('academic_year'), 'DESC'],
        [sequelize.literal('semester'), 'ASC'],
        ['project_name_th', 'ASC']
      ],
      raw: true
    });

    projectsByAcademicYear = projectRows.reduce((acc, row) => {
      const year = row.academicYear;
      if (year == null) return acc;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push({
        projectId: row.projectId,
        projectCode: row.projectCode,
        titleTh: row.projectNameTh,
        titleEn: row.projectNameEn,
        semester: row.semester
      });
      return acc;
    }, {});
  } catch (metaError) {
    logger.warn('meetingService.listTeacherMeetingApprovals meta build failed', { error: metaError.message });
  }

  const defaultAcademicYear = academicYear ?? (availableAcademicYears[0] ?? null);
  const defaultSemester = semester ?? (defaultAcademicYear ? (availableSemestersByYear[defaultAcademicYear]?.[0] ?? null) : null);

  return {
    items,
    summary,
    teacher: {
      teacherId: teacher.teacherId,
      teacherType: teacher.teacherType || null
    },
    meta: {
      totalItems: items.length,
      appliedFilters: {
        status: requestedStatus,
        academicYear: Number.isInteger(academicYear) ? academicYear : null,
        semester: [1, 2, 3].includes(semester) ? semester : null,
        projectId: Number.isInteger(projectId) ? projectId : null,
        search: searchTerm || null
      },
      availableAcademicYears,
      availableSemestersByYear,
      defaultAcademicYear,
      defaultSemester,
      projectsByAcademicYear
    }
  };
}

module.exports = {
  updateLogApproval,
  listTeacherMeetingApprovals
};
