// Utilities สำหรับคำนวณสถานะ deadline และ daysLeft (production ใช้ร่วมกับ controller + tests)
// ตรรกะต้องสอดคล้องกับสเปก Important Deadlines (submitted, submitted_late, overdue, locked, in_window, upcoming, announcement)

function computeStatus(deadline, submission, now = new Date()) {
  const nowMs = now.getTime();
  const effective = deadline.windowEndAt || deadline.deadlineAt || null;
  if (deadline.deadlineType === 'ANNOUNCEMENT') {
    return { status: 'announcement', locked: false };
  }
  if (!effective) return { status: 'upcoming', locked: false };
  const effMs = new Date(effective).getTime();
  let graceEndMs = effMs;
  if (deadline.allowLate && deadline.gracePeriodMinutes) {
    graceEndMs = effMs + deadline.gracePeriodMinutes * 60 * 1000;
  }
  if (submission?.submitted) {
    return { status: submission.late ? 'submitted_late' : 'submitted', locked: false };
  }
  if (nowMs > graceEndMs && deadline.lockAfterDeadline) {
    return { status: 'locked', locked: true };
  }
  if (nowMs > effMs && nowMs <= graceEndMs) {
    return { status: 'overdue', locked: false };
  }
  if (deadline.windowStartAt) {
    const ws = new Date(deadline.windowStartAt).getTime();
    if (ws <= nowMs && nowMs <= effMs) return { status: 'in_window', locked: false };
    if (nowMs < ws) return { status: 'upcoming', locked: false };
  }
  if (nowMs < effMs) return { status: 'upcoming', locked: false };
  return { status: 'upcoming', locked: false }; // fallback
}

function computeDaysLeft(deadline, now = new Date()) {
  const effective = deadline.windowEndAt || deadline.deadlineAt || null;
  if (!effective) return 0;
  const effMs = new Date(effective).getTime();
  const nowMs = now.getTime();
  if (nowMs > effMs) return 0;
  return Math.ceil((effMs - nowMs) / (24 * 60 * 60 * 1000));
}

module.exports = { computeStatus, computeDaysLeft };