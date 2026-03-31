const DEFAULT_MEETING_PHASE = 'phase1';

function serializeMeeting(meetingInstance) {
  if (!meetingInstance) return null;
  const meeting = typeof meetingInstance.toJSON === 'function'
    ? meetingInstance.toJSON()
    : meetingInstance;
  return {
    meetingId: meeting.meetingId,
    meetingTitle: meeting.meetingTitle,
    meetingDate: meeting.meetingDate,
    meetingMethod: meeting.meetingMethod,
    meetingLocation: meeting.meetingLocation,
    meetingLink: meeting.meetingLink,
    status: meeting.status,
    phase: meeting.phase || DEFAULT_MEETING_PHASE,
    projectId: meeting.projectId,
    createdBy: meeting.createdBy,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
    participants: Array.isArray(meeting.participants) ? meeting.participants.map(participant => serializeParticipant(participant)) : [],
    logs: Array.isArray(meeting.logs) ? meeting.logs.map(log => serializeLog(log)) : []
  };
}

function serializeParticipant(participantInstance) {
  if (!participantInstance) return null;
  const participant = typeof participantInstance.toJSON === 'function'
    ? participantInstance.toJSON()
    : participantInstance;
  if (!participant || typeof participant !== 'object') return null;
  return {
    meetingId: participant.meetingId,
    userId: participant.userId,
    role: participant.role,
    attendanceStatus: participant.attendanceStatus,
    joinTime: participant.joinTime,
    leaveTime: participant.leaveTime,
    user: participant.user ? {
      userId: participant.user.userId,
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      fullName: [participant.user.firstName, participant.user.lastName].filter(Boolean).join(' ').trim(),
      email: participant.user.email,
      role: participant.user.role
    } : null
  };
}

function serializeLog(logInstance) {
  if (!logInstance) return null;
  const log = typeof logInstance.toJSON === 'function'
    ? logInstance.toJSON()
    : logInstance;
  if (!log || typeof log !== 'object') return null;

  // แก้ไข: ใช้ชื่อ field ที่ถูกต้องตาม underscored convention
  // Sequelize จะแปลง created_at เป็น createdAt ใน JavaScript object
  const createdAt = log.createdAt || log.created_at || null;
  const updatedAt = log.updatedAt || log.updated_at || null;

  return {
    logId: log.logId,
    meetingId: log.meetingId,
    discussionTopic: log.discussionTopic,
    currentProgress: log.currentProgress,
    problemsIssues: log.problemsIssues,
    nextActionItems: log.nextActionItems,
    advisorComment: log.advisorComment,
    approvalStatus: log.approvalStatus,
    approvalNote: log.approvalNote,
    approvedBy: log.approvedBy,
    approvedAt: log.approvedAt,
    recordedBy: log.recordedBy,
    createdAt: createdAt,
    updatedAt: updatedAt,
    recorder: log.recorder ? {
      userId: log.recorder.userId,
      firstName: log.recorder.firstName,
      lastName: log.recorder.lastName,
      fullName: [log.recorder.firstName, log.recorder.lastName].filter(Boolean).join(' ').trim(),
      email: log.recorder.email,
      role: log.recorder.role
    } : null,
    approver: log.approver ? {
      userId: log.approver.userId,
      firstName: log.approver.firstName,
      lastName: log.approver.lastName,
      fullName: [log.approver.firstName, log.approver.lastName].filter(Boolean).join(' ').trim(),
      email: log.approver.email,
      role: log.approver.role
    } : null,
    attachments: Array.isArray(log.attachments) ? log.attachments.map(att => ({
      attachmentId: att.attachmentId,
      fileName: att.fileName,
      filePath: att.filePath,
      fileType: att.fileType,
      fileSize: att.fileSize,
      uploadDate: att.uploadDate,
      uploadedBy: att.uploadedBy
    })) : [],
    actionItems: Array.isArray(log.actionItems) ? log.actionItems.map(item => ({
      itemId: item.itemId,
      actionDescription: item.actionDescription,
      assignedTo: item.assignedTo,
      dueDate: item.dueDate,
      status: item.status,
      completionDate: item.completionDate
    })) : []
  };
}

async function sendMeetingScheduledNotifications({ project, meeting, actor, members = [], note = null } = {}) {
  const User = require('../../models').User;
  const mailer = require('../../utils/mailer');
  const logger = require('../../utils/logger');

  if (!project || !meeting) {
    return { recipients: [], totalRecipients: 0 };
  }

  const meetingData = typeof meeting === 'object' && typeof meeting.toJSON === 'function'
    ? serializeMeeting(meeting)
    : meeting;

  const participants = Array.isArray(meetingData.participants) ? meetingData.participants : [];
  if (!participants.length) {
    logger.warn('meetingService.sendMeetingScheduledNotifications skipped: no participants', {
      projectId: project.projectId,
      meetingId: meetingData.meetingId
    });
    return { recipients: [], totalRecipients: 0 };
  }

  const memberMap = new Map();
  if (Array.isArray(members)) {
    members.forEach(member => {
      const studentUserId = member.student?.user?.userId;
      if (studentUserId) {
        memberMap.set(studentUserId, {
          studentCode: member.student?.studentCode || null
        });
      }
    });
  }

  const roleLabels = {
    advisor: 'อาจารย์ที่ปรึกษา',
    co_advisor: 'อาจารย์ที่ปรึกษาร่วม',
    student: 'นักศึกษา',
    guest: 'ผู้เข้าร่วม'
  };

  const participantDetails = participants.map(participant => {
    const userInfo = participant.user || {};
    const fullName = userInfo.fullName || [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').trim();
    const fallbackName = memberMap.get(participant.userId)?.studentCode || userInfo.email || 'ผู้เข้าร่วม';
    return {
      userId: participant.userId,
      email: userInfo.email || null,
      name: fullName || fallbackName,
      role: participant.role || 'guest',
      roleLabel: roleLabels[participant.role] || 'ผู้เข้าร่วม',
      studentCode: memberMap.get(participant.userId)?.studentCode || null
    };
  });

  const recipientMap = new Map();
  participantDetails.forEach(detail => {
    if (!detail.email) return;
    if (!recipientMap.has(detail.email)) {
      recipientMap.set(detail.email, detail);
    }
  });

  if (!recipientMap.size) {
    logger.warn('meetingService.sendMeetingScheduledNotifications skipped: participant emails missing', {
      projectId: project.projectId,
      meetingId: meetingData.meetingId
    });
    return { recipients: [], totalRecipients: 0 };
  }

  let initiatorName = null;
  if (actor?.userId) {
    const initiator = participantDetails.find(detail => detail.userId === actor.userId && detail.name);
    if (initiator?.name) {
      initiatorName = initiator.name;
    } else {
      const initiatorUser = await User.findByPk(actor.userId, {
        attributes: ['firstName', 'lastName', 'email']
      });
      if (initiatorUser) {
        initiatorName = [initiatorUser.firstName, initiatorUser.lastName].filter(Boolean).join(' ').trim() || initiatorUser.email || null;
      }
    }
  }
  if (!initiatorName) {
    initiatorName = 'ผู้ใช้ระบบ';
  }

  const meetingMethodLabels = {
    onsite: 'onsite (พบกันที่สถานที่จริง)',
    online: 'online (ผ่านระบบออนไลน์)',
    hybrid: 'hybrid (ผสม onsite/online)'
  };

  const meetingDateValue = meetingData.meetingDate ? new Date(meetingData.meetingDate) : null;
  const meetingDateLabel = meetingDateValue
    ? meetingDateValue.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const noteText = typeof note === 'string' && note.trim().length ? note.trim() : null;

  const basePayload = {
    projectName: project.projectNameTh || project.projectNameEn || `Project ${project.projectId}`,
    meetingTitle: meetingData.meetingTitle || 'การประชุมโครงงาน',
    meetingDate: meetingData.meetingDate || null,
    meetingDateLabel,
    meetingMethod: meetingData.meetingMethod,
    meetingMethodLabel: meetingMethodLabels[meetingData.meetingMethod] || meetingData.meetingMethod || 'onsite',
    meetingLocation: meetingData.meetingLocation || null,
    meetingLink: meetingData.meetingLink || null,
    participants: participantDetails.map(({ name, studentCode, roleLabel }) => ({
      name,
      studentCode,
      roleLabel
    })),
    initiatorName,
    note: noteText
  };

  const recipients = [];
  for (const detail of recipientMap.values()) {
    try {
      const sendResult = await mailer.sendMeetingScheduledNotification({
        recipientEmail: detail.email,
        recipientName: detail.name,
        ...basePayload
      });
      recipients.push({
        email: detail.email,
        name: detail.name,
        sent: sendResult.sent !== false,
        reason: sendResult.reason || null,
        messageId: sendResult.messageId || null
      });
    } catch (error) {
      logger.error('meetingService.sendMeetingScheduledNotifications send failed', {
        message: error.message,
        stack: error.stack,
        projectId: project.projectId,
        meetingId: meetingData.meetingId,
        recipient: detail.email
      });
      recipients.push({
        email: detail.email,
        name: detail.name,
        sent: false,
        reason: error.message || 'email_error',
        messageId: null
      });
    }
  }

  logger.info('meetingService.sendMeetingScheduledNotifications completed', {
    projectId: project.projectId,
    meetingId: meetingData.meetingId,
    recipientCount: recipients.length
  });

  return { recipients, totalRecipients: recipients.length };
}

module.exports = {
  serializeMeeting,
  serializeParticipant,
  serializeLog,
  sendMeetingScheduledNotifications
};
