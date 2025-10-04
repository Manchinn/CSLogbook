const MEETING_PHASES = ['phase1', 'phase2'];
const DEFAULT_PHASE = 'phase1';

function summarize(meetings, members) {
  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const totalMeetings = safeMeetings.length;
  const logs = safeMeetings.flatMap(meeting => Array.isArray(meeting.logs) ? meeting.logs : []);
  const totalLogs = logs.length;
  const pendingLogs = logs.filter(log => log.approvalStatus === 'pending').length;
  const approvedLogs = logs.filter(log => log.approvalStatus === 'approved').length;

  const studentMap = new Map();
  safeMembers.forEach(member => {
    const student = member?.student;
    const user = student?.user;
    if (!student || !user) return;
    studentMap.set(user.userId, {
      userId: user.userId,
      studentId: student.studentId,
      studentCode: student.studentCode,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
      totalLogs: 0,
      approvedLogs: 0
    });
  });

  safeMeetings.forEach(meeting => {
    const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
    const studentParticipants = participants.filter(participant => participant.role === 'student' && participant.attendanceStatus !== 'absent');
    const participantIds = studentParticipants.map(participant => participant.userId);

    const meetingLogs = Array.isArray(meeting.logs) ? meeting.logs : [];
    meetingLogs.forEach(log => {
      participantIds.forEach(userId => {
        if (!studentMap.has(userId)) return;
        const summary = studentMap.get(userId);
        summary.totalLogs += 1;
        if (log.approvalStatus === 'approved') {
          summary.approvedLogs += 1;
        }
      });
    });
  });

  return {
    totalMeetings,
    totalLogs,
    approvedLogs,
    pendingLogs,
    approvalsByStudent: Array.from(studentMap.values())
  };
}

function buildSummary(meetings, members) {
  const overall = summarize(meetings, members);
  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  const phaseBreakdown = MEETING_PHASES.reduce((acc, phase) => {
    const subset = safeMeetings.filter(meeting => (meeting?.phase || DEFAULT_PHASE) === phase);
    acc[phase] = summarize(subset, members);
    return acc;
  }, {});

  return {
    ...overall,
    phaseBreakdown
  };
}

module.exports = {
  buildSummary
};
