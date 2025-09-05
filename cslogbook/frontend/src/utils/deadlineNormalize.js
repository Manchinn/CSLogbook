// Utility: แปลง payload ImportantDeadline (รวม legacy field) -> canonical object สำหรับ UI
// จุดประสงค์: ลดการกระจายตรรกะ (deadlineDate/deadlineTime/effectiveDeadlineAt/window*) ในหลาย hooks/components
import dayjs from './dayjs';

/**
 * normalizeDeadline(raw)
 * Input: raw object จาก backend (อาจมี deadlineDate/deadlineTime หรือ windowStartDate/windowEndDate หรือ deadlineAt/effectiveDeadlineAt)
 * Output: canonical:
 *  {
 *    id, name, relatedTo, deadlineType,
 *    isWindow, windowStartAt, windowEndAt,
 *    deadlineAt, effectiveDeadlineAt,
 *    deadline_at_local (dayjs) | null,
 *    effective_deadline_local (dayjs) | null,
 *    submittedAtLocal, isSubmitted, isLate, locked,
 *    legacy: { deadlineDate, deadlineTime, windowStartDate, windowEndDate, ...}
 *  }
 */
export function normalizeDeadline(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  // 1) ดึงค่า single deadline (legacy: deadlineDate + deadlineTime หรือ deadlineAt)
  let deadlineAt = raw.deadlineAt || null;
  if (!deadlineAt && raw.deadlineDate) {
    // สมมติ backend ส่ง deadlineDate/time เป็น local -> แปลงเป็น UTC โดย減 7 ชั่วโมงเพื่อให้ consistent กับ dayjs ใช้ local add(7)
    if (raw.deadlineTime) {
      deadlineAt = `${raw.deadlineDate}T${raw.deadlineTime}+07:00`;
    } else {
      deadlineAt = `${raw.deadlineDate}T23:59:59+07:00`;
    }
  }

  // 2) window start/end (raw windowStartAt หรือ legacy windowStartDate/time)
  let windowStartAt = raw.windowStartAt || null;
  let windowEndAt = raw.windowEndAt || null;
  if (!windowStartAt && raw.windowStartDate) {
    const stTime = raw.windowStartTime || '00:00:00';
    windowStartAt = `${raw.windowStartDate}T${stTime}+07:00`;
  }
  if (!windowEndAt && raw.windowEndDate) {
    const edTime = raw.windowEndTime || '23:59:59';
    windowEndAt = `${raw.windowEndDate}T${edTime}+07:00`;
  }

  const isWindow = !!(windowStartAt && windowEndAt);
  const effectiveDeadlineAt = raw.effectiveDeadlineAt || windowEndAt || deadlineAt || null;

  // 3) Local dayjs objects
  const toLocal = (isoLike) => (isoLike ? dayjs(isoLike).add(0, 'minute') : null); // backend บางจุดอาจส่งเป็น already offset
  const deadline_at_local = toLocal(deadlineAt);
  const effective_deadline_local = toLocal(effectiveDeadlineAt);

  // 4) Submission info
  const submission = raw.submission || {};
  const submittedAtLocal = submission.submittedAt ? dayjs(submission.submittedAt).add(7,'hour') : null;
  const isSubmitted = !!submission.submitted;
  const isLate = !!submission.late;
  const locked = !!raw.locked;

  return {
    ...raw,
    deadlineAt,
    windowStartAt,
    windowEndAt,
    effectiveDeadlineAt,
    isWindow,
    deadline_at_local,
    effective_deadline_local,
    submittedAtLocal,
    isSubmitted,
    isLate,
    locked,
    legacy: {
      deadlineDate: raw.deadlineDate,
      deadlineTime: raw.deadlineTime,
      windowStartDate: raw.windowStartDate,
      windowStartTime: raw.windowStartTime,
      windowEndDate: raw.windowEndDate,
      windowEndTime: raw.windowEndTime
    }
  };
}

export function normalizeList(list) {
  return Array.isArray(list) ? list.map(normalizeDeadline) : [];
}

export default normalizeDeadline;