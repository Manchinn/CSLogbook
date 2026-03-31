const { sequelize } = require('../../config/database');
const {
  Meeting,
  MeetingParticipant,
  MeetingLog,
  MeetingAttachment,
  MeetingActionItem,
  User
} = require('../../models');
const logger = require('../../utils/logger');
const { ensureMeetingAccess } = require('./meetingCoreService');
const { serializeLog } = require('./meetingSerializer');

async function createMeetingLog(projectId, meetingId, actor, payload = {}) {
  const context = await ensureMeetingAccess(meetingId, actor, { includeMembers: true });
  if (context.project.projectId !== Number(projectId)) {
    const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
    error.statusCode = 400;
    throw error;
  }

  const meeting = await Meeting.findByPk(meetingId, {
    include: [{ model: MeetingParticipant, as: 'participants' }]
  });

  const isParticipant = meeting.participants.some(p => p.userId === actor.userId);
  if (!isParticipant && actor.role !== 'admin') {
    const error = new Error('เฉพาะผู้เข้าร่วมประชุมหรือผู้ดูแลระบบเท่านั้นที่บันทึกการพบได้');
    error.statusCode = 403;
    throw error;
  }

  if (!payload.discussionTopic || !payload.discussionTopic.trim()) {
    const error = new Error('กรุณาระบุหัวข้อที่สนทนา');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.currentProgress || !payload.currentProgress.trim()) {
    const error = new Error('กรุณาระบุความคืบหน้าปัจจุบัน');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.nextActionItems || !payload.nextActionItems.trim()) {
    const error = new Error('กรุณาระบุงานถัดไป');
    error.statusCode = 400;
    throw error;
  }

  const t = await sequelize.transaction();
  let log;
  try {
    log = await MeetingLog.create({
      meetingId,
      discussionTopic: payload.discussionTopic.trim(),
      currentProgress: payload.currentProgress.trim(),
      problemsIssues: payload.problemsIssues ? payload.problemsIssues.trim() : null,
      nextActionItems: payload.nextActionItems.trim(),
      advisorComment: payload.advisorComment ? payload.advisorComment.trim() : null,
      recordedBy: actor.userId,
      approvalStatus: 'pending'
    }, { transaction: t });

    if (Array.isArray(payload.actionItems) && payload.actionItems.length) {
      const items = payload.actionItems
        .map(item => {
          if (!item || !item.actionDescription || !item.dueDate) return null;
          return {
            logId: log.logId,
            actionDescription: item.actionDescription.trim(),
            assignedTo: item.assignedTo || actor.userId,
            dueDate: item.dueDate,
            status: item.status || 'pending'
          };
        })
        .filter(Boolean);
      if (items.length) {
        await MeetingActionItem.bulkCreate(items, { transaction: t });
      }
    }

    await t.commit();
  } catch (error) {
    // ป้องกัน error rollback หลัง commit โดยตรวจสอบสถานะ transaction ก่อนเสมอ
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.createMeetingLog failed', { message: error.message, meetingId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  const created = await MeetingLog.findByPk(log.logId, {
    include: [
      { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: MeetingAttachment, as: 'attachments' },
      { model: MeetingActionItem, as: 'actionItems' }
    ]
  });

  logger.info('meetingService.createMeetingLog success', { meetingId, logId: log.logId, actorId: actor.userId });
  return serializeLog(created);
}

async function updateMeetingLog(projectId, meetingId, logId, actor, payload = {}) {
  const context = await ensureMeetingAccess(meetingId, actor, { includeMembers: true });
  if (context.project.projectId !== Number(projectId)) {
    const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
    error.statusCode = 400;
    throw error;
  }

  const log = await MeetingLog.findByPk(logId, {
    include: [{ model: Meeting, as: 'meeting' }]
  });

  if (!log || log.meeting.meetingId !== Number(meetingId)) {
    const error = new Error('ไม่พบบันทึกการพบที่ระบุ');
    error.statusCode = 404;
    throw error;
  }

  // ตรวจสอบสิทธิ์ในการแก้ไข
  // นักศึกษาสามารถแก้ไขได้เมื่อ: ยังไม่ได้อนุมัติ หรือ ถูก rejected (ขอปรับปรุง)
  const canEdit = actor.role === 'admin' ||
                 (actor.userId === log.recordedBy &&
                  (log.approvalStatus !== 'approved' || log.approvalStatus === 'rejected'));

  if (!canEdit) {
    const error = new Error('ไม่สามารถแก้ไขบันทึกการพบที่อนุมัติแล้วได้');
    error.statusCode = 403;
    throw error;
  }

  // Validation
  if (!payload.discussionTopic || !payload.discussionTopic.trim()) {
    const error = new Error('กรุณาระบุหัวข้อที่สนทนา');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.currentProgress || !payload.currentProgress.trim()) {
    const error = new Error('กรุณาระบุความคืบหน้าปัจจุบัน');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.nextActionItems || !payload.nextActionItems.trim()) {
    const error = new Error('กรุณาระบุงานถัดไป');
    error.statusCode = 400;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {
      discussionTopic: payload.discussionTopic.trim(),
      currentProgress: payload.currentProgress.trim(),
      problemsIssues: payload.problemsIssues ? payload.problemsIssues.trim() : null,
      nextActionItems: payload.nextActionItems.trim(),
      advisorComment: payload.advisorComment ? payload.advisorComment.trim() : null
    };

    // หากบันทึกถูก rejected และนักศึกษาแก้ไข ให้รีเซ็ตสถานะเป็น pending
    if (log.approvalStatus === 'rejected' && actor.userId === log.recordedBy) {
      updateData.approvalStatus = 'pending';
      updateData.approvedBy = null;
      updateData.approvedAt = null;
      updateData.rejectionReason = null;
    }

    await log.update(updateData, { transaction: t });

    await t.commit();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.updateMeetingLog failed', { message: error.message, logId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  const updated = await MeetingLog.findByPk(logId, {
    include: [
      { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
      { model: MeetingAttachment, as: 'attachments' },
      { model: MeetingActionItem, as: 'actionItems' }
    ]
  });

  logger.info('meetingService.updateMeetingLog success', { meetingId, logId, actorId: actor.userId });
  return serializeLog(updated);
}

async function deleteMeetingLog(projectId, meetingId, logId, actor) {
  const context = await ensureMeetingAccess(meetingId, actor, { includeMembers: true });
  if (context.project.projectId !== Number(projectId)) {
    const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
    error.statusCode = 400;
    throw error;
  }

  const log = await MeetingLog.findByPk(logId, {
    include: [{ model: Meeting, as: 'meeting' }]
  });

  if (!log || log.meeting.meetingId !== Number(meetingId)) {
    const error = new Error('ไม่พบบันทึกการพบที่ระบุ');
    error.statusCode = 404;
    throw error;
  }

  // ตรวจสอบสิทธิ์ในการลบ
  // นักศึกษาสามารถลบได้เมื่อ: ยังไม่ได้อนุมัติ หรือ ถูก rejected (ขอปรับปรุง)
  const canDelete = actor.role === 'admin' ||
                   (actor.userId === log.recordedBy &&
                    (log.approvalStatus !== 'approved' || log.approvalStatus === 'rejected'));

  if (!canDelete) {
    const error = new Error('ไม่สามารถลบบันทึกการพบที่อนุมัติแล้วได้');
    error.statusCode = 403;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    // ลบ action items ที่เกี่ยวข้อง
    await MeetingActionItem.destroy({
      where: { logId },
      transaction: t
    });

    // ลบ attachments ที่เกี่ยวข้อง
    await MeetingAttachment.destroy({
      where: { logId },
      transaction: t
    });

    // ลบ log
    await log.destroy({ transaction: t });

    await t.commit();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    logger.error('meetingService.deleteMeetingLog failed', { message: error.message, logId });
    if (!error.statusCode) error.statusCode = 400;
    throw error;
  }

  logger.info('meetingService.deleteMeetingLog success', { meetingId, logId, actorId: actor.userId });
  return { success: true, message: 'ลบบันทึกการพบสำเร็จ' };
}

module.exports = {
  createMeetingLog,
  updateMeetingLog,
  deleteMeetingLog
};
