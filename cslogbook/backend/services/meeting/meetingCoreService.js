const { sequelize } = require('../../config/database');
const {
  Meeting,
  MeetingParticipant,
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
const logger = require('../../utils/logger');
const { buildSummary } = require('../meetingSummaryHelper');
const { serializeMeeting, sendMeetingScheduledNotifications } = require('./meetingSerializer');

const MEETING_PHASES = ['phase1', 'phase2'];
const DEFAULT_MEETING_PHASE = 'phase1';

async function ensureProjectAccess(projectId, actor, options = {}) {
  const project = await ProjectDocument.findByPk(projectId);
  if (!project) {
    const error = new Error('ไม่พบโครงงานที่ระบุ');
    error.statusCode = 404;
    throw error;
  }

  const context = { project };

  if (options.includeMembers) {
    context.members = await ProjectMember.findAll({
      where: { projectId },
      include: [{
        model: Student,
        as: 'student',
        include: [{ model: User, as: 'user' }]
      }]
    });
  }

  if (!actor || !actor.role) {
    const error = new Error('ไม่สามารถระบุตัวผู้ใช้งานได้');
    error.statusCode = 401;
    throw error;
  }

  if (actor.role === 'admin') {
    return context;
  }

  if (actor.role === 'student') {
    if (!actor.studentId) {
      const error = new Error('ไม่พบข้อมูลนักศึกษาสำหรับผู้ใช้นี้');
      error.statusCode = 403;
      throw error;
    }
    const membership = await ProjectMember.findOne({ where: { projectId, studentId: actor.studentId } });
    if (!membership) {
      const error = new Error('คุณไม่มีสิทธิ์เข้าถึงโครงงานนี้');
      error.statusCode = 403;
      throw error;
    }
    context.studentMembership = membership;
    return context;
  }

  if (actor.role === 'teacher') {
    const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
    if (!teacher) {
      const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
      error.statusCode = 403;
      throw error;
    }
    const isAdvisor = [project.advisorId, project.coAdvisorId].filter(Boolean).includes(teacher.teacherId);
    if (!isAdvisor) {
      const error = new Error('อาจารย์ไม่ได้รับมอบหมายให้ดูแลโครงงานนี้');
      error.statusCode = 403;
      throw error;
    }
    context.teacher = teacher;
    return context;
  }

  const error = new Error('บทบาทผู้ใช้นี้ยังไม่รองรับสำหรับการเข้าถึงโครงงาน');
  error.statusCode = 403;
  throw error;
}

async function ensureMeetingAccess(meetingId, actor, options = {}) {
  const meeting = await Meeting.findByPk(meetingId);
  if (!meeting) {
    const error = new Error('ไม่พบการประชุมที่ระบุ');
    error.statusCode = 404;
    throw error;
  }
  const context = await ensureProjectAccess(meeting.projectId, actor, options);
  context.meeting = meeting;
  return context;
}

async function listProjectMeetings(projectId, actor) {
  const context = await ensureProjectAccess(projectId, actor, { includeMembers: true });

  const meetings = await Meeting.findAll({
    where: { projectId },
    include: [
      {
        model: MeetingParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
      },
      {
        model: MeetingLog,
        as: 'logs',
        include: [
          { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: MeetingAttachment, as: 'attachments' },
          { model: MeetingActionItem, as: 'actionItems' }
        ]
      }
    ],
    order: [
      ['meeting_date', 'DESC'],
      [{ model: MeetingLog, as: 'logs' }, 'created_at', 'DESC']
    ]
  });

  const serializedMeetings = meetings.map(m => serializeMeeting(m));
  const stats = buildSummary(serializedMeetings, context.members || []);

  return { meetings: serializedMeetings, stats };
}

async function createMeeting(projectId, actor, payload = {}) {
  const context = await ensureProjectAccess(projectId, actor, { includeMembers: true });

  if (!payload.meetingTitle || !payload.meetingTitle.trim()) {
    const error = new Error('กรุณาระบุหัวข้อการประชุม');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.meetingDate) {
    const error = new Error('กรุณาระบุวันและเวลาการประชุม');
    error.statusCode = 400;
    throw error;
  }

  if (!['onsite', 'online', 'hybrid'].includes(payload.meetingMethod)) {
    const error = new Error('รูปแบบการประชุมไม่ถูกต้อง');
    error.statusCode = 400;
    throw error;
  }

  const meetingDate = new Date(payload.meetingDate);
  if (Number.isNaN(meetingDate.valueOf())) {
    const error = new Error('รูปแบบวันที่ของการประชุมไม่ถูกต้อง');
    error.statusCode = 400;
    throw error;
  }

  const requestedPhaseRaw = typeof payload.phase === 'string' ? payload.phase.toLowerCase() : DEFAULT_MEETING_PHASE;
  const meetingPhase = MEETING_PHASES.includes(requestedPhaseRaw) ? requestedPhaseRaw : DEFAULT_MEETING_PHASE;

  if (meetingPhase === 'phase2') {
    const status = context.project?.status || null;
    if (context.project?.examResult !== 'passed') {
      const error = new Error('ยังไม่สามารถสร้างการพบสำหรับโครงงานพิเศษ 2 ได้');
      error.statusCode = 400;
      throw error;
    }
    if (!['in_progress', 'completed'].includes(status)) {
      const error = new Error('โครงงานยังไม่อยู่ในสถานะที่รองรับการบันทึกการพบของโครงงานพิเศษ 2');
      error.statusCode = 400;
      throw error;
    }
  }

  const t = await sequelize.transaction();
  let meeting;
  try {
    meeting = await Meeting.create({
      meetingTitle: payload.meetingTitle.trim(),
      meetingDate,
      meetingMethod: payload.meetingMethod,
      meetingLocation: payload.meetingLocation || null,
      meetingLink: payload.meetingLink || null,
      status: payload.status || 'scheduled',
      projectId,
      createdBy: actor.userId,
      phase: meetingPhase
    }, { transaction: t });

    const participants = await buildParticipants({
      meetingId: meeting.meetingId,
      project: context.project,
      members: context.members || [],
      actor,
      additionalParticipantIds: payload.additionalParticipantIds || []
    });

    if (!participants.length) {
      const error = new Error('ต้องมีผู้เข้าร่วมประชุมอย่างน้อยหนึ่งคน');
      error.statusCode = 400;
      throw error;
    }

    await MeetingParticipant.bulkCreate(participants, {
      transaction: t,
      ignoreDuplicates: true
    });

    await t.commit();
  } catch (error) {
    // หาก transaction ยังไม่ถูกปิด (finished) ให้ rollback เพื่อคืนสถานะ
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.createMeeting failed', { message: error.message, projectId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  const created = await Meeting.findByPk(meeting.meetingId, {
    include: [
      {
        model: MeetingParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
      },
      {
        model: MeetingLog,
        as: 'logs',
        include: [
          { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: MeetingAttachment, as: 'attachments' },
          { model: MeetingActionItem, as: 'actionItems' }
        ]
      }
    ]
  });

  const serialized = serializeMeeting(created);

  logger.info('meetingService.createMeeting success', { projectId, meetingId: meeting.meetingId, actorId: actor.userId });

  if (payload.suppressNotifications !== true) {
    const notificationNote = typeof payload.notificationMessage === 'string' && payload.notificationMessage.trim()
      ? payload.notificationMessage.trim()
      : typeof payload.notificationNote === 'string' && payload.notificationNote.trim()
        ? payload.notificationNote.trim()
        : null;
    // fire-and-forget: ไม่ block user response
    sendMeetingScheduledNotifications({
      project: context.project,
      meeting: serialized,
      actor,
      members: context.members || [],
      note: notificationNote
    }).catch(notificationError => {
      logger.error('meetingService.createMeeting notification error', {
        message: notificationError.message,
        projectId,
        meetingId: meeting?.meetingId || null,
        actorId: actor.userId,
        stack: notificationError.stack
      });
    });
  }

  return serialized;
}

async function updateMeeting(projectId, meetingId, actor, payload = {}) {
  const context = await ensureProjectAccess(projectId, actor, { includeMembers: true });

  const meeting = await Meeting.findByPk(meetingId, {
    include: [
      { model: MeetingLog, as: 'logs' }
    ]
  });

  if (!meeting || meeting.projectId !== Number(projectId)) {
    const error = new Error('ไม่พบการประชุมที่ระบุ');
    error.statusCode = 404;
    throw error;
  }

  // ตรวจสอบสิทธิ์ในการแก้ไข
  let canEdit = false;

  if (actor.role === 'admin') {
    canEdit = true;
  } else if (actor.role === 'student') {
    // ตรวจสอบว่าเป็นสมาชิกโครงงานหรือไม่
    const membership = await ProjectMember.findOne({
      where: { projectId, studentId: actor.studentId }
    });
    canEdit = !!membership;
  } else if (actor.role === 'teacher') {
    // ตรวจสอบว่าเป็นอาจารย์ที่ปรึกษาหรือไม่
    const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
    if (teacher) {
      const isAdvisor = [context.project.advisorId, context.project.coAdvisorId]
        .filter(Boolean)
        .includes(teacher.teacherId);
      canEdit = isAdvisor;
    }
  }

  if (!canEdit) {
    const error = new Error('ไม่มีสิทธิ์ในการแก้ไขการประชุมนี้');
    error.statusCode = 403;
    throw error;
  }

  // Validation
  if (payload.meetingPhase && !MEETING_PHASES.includes(payload.meetingPhase)) {
    const error = new Error('ระยะการประชุมไม่ถูกต้อง');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.meetingTitle || !payload.meetingTitle.trim()) {
    const error = new Error('กรุณาระบุหัวข้อการประชุม');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.meetingDate) {
    const error = new Error('กรุณาระบุวันที่ประชุม');
    error.statusCode = 400;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    await meeting.update({
      meetingPhase: payload.meetingPhase || meeting.meetingPhase,
      meetingTitle: payload.meetingTitle.trim(),
      meetingDate: payload.meetingDate,
      meetingMethod: payload.meetingMethod || meeting.meetingMethod,
      meetingLocation: payload.meetingLocation ? payload.meetingLocation.trim() : null,
      meetingLink: payload.meetingLink ? payload.meetingLink.trim() : null
    }, { transaction: t });

    await t.commit();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.updateMeeting failed', { message: error.message, meetingId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  const updated = await Meeting.findByPk(meetingId, {
    include: [
      {
        model: MeetingParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
      },
      {
        model: MeetingLog,
        as: 'logs',
        include: [
          { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
          { model: MeetingAttachment, as: 'attachments' },
          { model: MeetingActionItem, as: 'actionItems' }
        ]
      }
    ]
  });

  logger.info('meetingService.updateMeeting success', { projectId, meetingId, actorId: actor.userId });
  return serializeMeeting(updated);
}

async function deleteMeeting(projectId, meetingId, actor) {
  const context = await ensureProjectAccess(projectId, actor, { includeMembers: true });

  const meeting = await Meeting.findByPk(meetingId, {
    include: [
      { model: MeetingLog, as: 'logs' }
    ]
  });

  if (!meeting || meeting.projectId !== Number(projectId)) {
    const error = new Error('ไม่พบการประชุมที่ระบุ');
    error.statusCode = 404;
    throw error;
  }

  // ตรวจสอบสิทธิ์ในการลบ
  let canDelete = false;

  if (actor.role === 'admin') {
    canDelete = true;
  } else if (actor.role === 'student') {
    // ตรวจสอบว่าเป็นสมาชิกโครงงานหรือไม่
    const membership = await ProjectMember.findOne({
      where: { projectId, studentId: actor.studentId }
    });
    canDelete = !!membership;
  } else if (actor.role === 'teacher') {
    // ตรวจสอบว่าเป็นอาจารย์ที่ปรึกษาหรือไม่
    const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
    if (teacher) {
      const isAdvisor = [context.project.advisorId, context.project.coAdvisorId]
        .filter(Boolean)
        .includes(teacher.teacherId);
      canDelete = isAdvisor;
    }
  }

  if (!canDelete) {
    const error = new Error('ไม่มีสิทธิ์ในการลบการประชุมนี้');
    error.statusCode = 403;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    // ลบ action items ที่เกี่ยวข้องกับ logs ทั้งหมด
    const logIds = meeting.logs.map(log => log.logId);
    if (logIds.length > 0) {
      await MeetingActionItem.destroy({
        where: { logId: { [Op.in]: logIds } },
        transaction: t
      });

      // ลบ attachments ที่เกี่ยวข้องกับ logs ทั้งหมด
      await MeetingAttachment.destroy({
        where: { logId: { [Op.in]: logIds } },
        transaction: t
      });

      // ลบ logs ทั้งหมด
      await MeetingLog.destroy({
        where: { meetingId },
        transaction: t
      });
    }

    // ลบ participants
    await MeetingParticipant.destroy({
      where: { meetingId },
      transaction: t
    });

    // ลบ meeting
    await meeting.destroy({ transaction: t });

    await t.commit();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.deleteMeeting failed', { message: error.message, meetingId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  logger.info('meetingService.deleteMeeting success', { projectId, meetingId, actorId: actor.userId });
  return { success: true, message: 'ลบการประชุมสำเร็จ' };
}

async function buildParticipants({ meetingId, project, members, actor, additionalParticipantIds }) {
  const participants = new Map();

  const addParticipant = (userId, role, overrides = {}) => {
    if (!userId) return;
    if (!participants.has(userId)) {
      participants.set(userId, {
        meetingId,
        userId,
        role,
        attendanceStatus: overrides.attendanceStatus || 'present',
        joinTime: overrides.joinTime || null,
        leaveTime: overrides.leaveTime || null
      });
    }
  };

  // เพิ่มสมาชิกโครงงานทุกคนเป็น participants อัตโนมัติ
  if (Array.isArray(members)) {
    members.forEach(member => {
      const studentUserId = member.student?.user?.userId;
      if (studentUserId) {
        addParticipant(studentUserId, 'student');
      }
    });
  }

  // เพิ่มอาจารย์ที่ปรึกษา
  const teacherIds = [project.advisorId, project.coAdvisorId].filter(Boolean);
  if (teacherIds.length) {
    const teachers = await Teacher.findAll({ where: { teacherId: { [Op.in]: teacherIds } } });
    teachers.forEach(teacher => {
      addParticipant(teacher.userId, teacher.teacherId === project.advisorId ? 'advisor' : 'co_advisor');
    });
  }

  // เพิ่มผู้เข้าร่วมเพิ่มเติม
  if (Array.isArray(additionalParticipantIds)) {
    additionalParticipantIds
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id))
      .forEach(userId => addParticipant(userId, 'guest'));
  }

  // เพิ่มผู้สร้างการประชุม (ถ้ายังไม่ได้เป็น participant)
  addParticipant(actor.userId, actor.role === 'teacher' ? 'advisor' : actor.role === 'student' ? 'student' : 'guest');

  return Array.from(participants.values());
}

module.exports = {
  MEETING_PHASES,
  DEFAULT_MEETING_PHASE,
  ensureProjectAccess,
  ensureMeetingAccess,
  listProjectMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  buildParticipants
};
