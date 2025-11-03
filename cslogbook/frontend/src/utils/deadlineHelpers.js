/**
 * Deadline Helper Utilities
 * 
 * Helper functions สำหรับจัดการกับ deadline
 * - Format deadline text
 * - Calculate time remaining
 * - Get deadline status/color
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('th');

/**
 * Format deadline เป็นข้อความแสดงผล
 * @param {string|Date} deadlineAt - Deadline date
 * @param {Object} options - { format, showRelative }
 * @returns {string} Formatted deadline text
 */
export const formatDeadline = (deadlineAt, options = {}) => {
  const {
    format = 'DD MMMM YYYY HH:mm',
    showRelative = true
  } = options;

  if (!deadlineAt) return '-';

  const deadline = dayjs(deadlineAt);
  const formatted = deadline.format(format);

  if (showRelative) {
    const relative = deadline.fromNow();
    return `${formatted} (${relative})`;
  }

  return formatted;
};

/**
 * คำนวณเวลาที่เหลือจนถึง deadline
 * @param {string|Date} deadlineAt - Deadline date
 * @param {number} gracePeriodMinutes - Grace period in minutes
 * @returns {Object} { days, hours, minutes, isOverdue, isPast }
 */
export const calculateTimeRemaining = (deadlineAt, gracePeriodMinutes = 0) => {
  if (!deadlineAt) {
    return { days: 0, hours: 0, minutes: 0, isOverdue: false, isPast: true };
  }

  const now = dayjs();
  let deadline = dayjs(deadlineAt);

  // เพิ่ม grace period
  if (gracePeriodMinutes > 0) {
    deadline = deadline.add(gracePeriodMinutes, 'minute');
  }

  const diff = deadline.diff(now);
  const isPast = diff < 0;
  const duration = dayjs.duration(Math.abs(diff));

  return {
    days: Math.floor(duration.asDays()),
    hours: duration.hours(),
    minutes: duration.minutes(),
    totalMinutes: Math.floor(duration.asMinutes()),
    isOverdue: isPast,
    isPast
  };
};

/**
 * ดึงสถานะและสีของ deadline
 * @param {string|Date} deadlineAt - Deadline date
 * @param {number} gracePeriodMinutes - Grace period
 * @param {number} warningDays - จำนวนวันที่เริ่มแสดง warning (default: 7)
 * @returns {Object} { status, color, tagColor, severity }
 */
export const getDeadlineStatus = (deadlineAt, gracePeriodMinutes = 0, warningDays = 7) => {
  const { days, isOverdue } = calculateTimeRemaining(deadlineAt, gracePeriodMinutes);

  if (isOverdue) {
    return {
      status: 'overdue',
      color: '#ff4d4f',
      tagColor: 'red',
      severity: 'error',
      label: 'เลยกำหนด'
    };
  }

  if (days === 0) {
    return {
      status: 'urgent',
      color: '#fa8c16',
      tagColor: 'orange',
      severity: 'warning',
      label: 'ใกล้ครบกำหนด (วันนี้)'
    };
  }

  if (days <= 3) {
    return {
      status: 'critical',
      color: '#faad14',
      tagColor: 'gold',
      severity: 'warning',
      label: `เหลือ ${days} วัน`
    };
  }

  if (days <= warningDays) {
    return {
      status: 'warning',
      color: '#52c41a',
      tagColor: 'lime',
      severity: 'info',
      label: `เหลือ ${days} วัน`
    };
  }

  return {
    status: 'normal',
    color: '#1890ff',
    tagColor: 'blue',
    severity: 'info',
    label: `เหลือ ${days} วัน`
  };
};

/**
 * สร้างข้อความ countdown แบบละเอียด
 * @param {string|Date} deadlineAt - Deadline date
 * @param {number} gracePeriodMinutes - Grace period
 * @returns {string} Countdown text
 */
export const getCountdownText = (deadlineAt, gracePeriodMinutes = 0) => {
  const { days, hours, minutes, isOverdue } = calculateTimeRemaining(deadlineAt, gracePeriodMinutes);

  if (isOverdue) {
    if (days > 0) return `เลยกำหนดแล้ว ${days} วัน`;
    if (hours > 0) return `เลยกำหนดแล้ว ${hours} ชั่วโมง`;
    return `เลยกำหนดแล้ว ${minutes} นาที`;
  }

  if (days > 0) {
    return `เหลือ ${days} วัน ${hours} ชั่วโมง`;
  }

  if (hours > 0) {
    return `เหลือ ${hours} ชั่วโมง ${minutes} นาที`;
  }

  return `เหลือ ${minutes} นาที`;
};

/**
 * ตรวจสอบว่าอยู่ใน submission window หรือไม่
 * @param {string|Date} windowStartAt - Window start date
 * @param {string|Date} windowEndAt - Window end date
 * @returns {Object} { isOpen, canSubmit, reason }
 */
export const checkSubmissionWindow = (windowStartAt, windowEndAt) => {
  const now = dayjs();

  // ไม่มี window = เปิดตลอด
  if (!windowStartAt && !windowEndAt) {
    return {
      isOpen: true,
      canSubmit: true,
      reason: null
    };
  }

  // มี start date - ตรวจสอบว่าถึงเวลาแล้วหรือยัง
  if (windowStartAt && now.isBefore(dayjs(windowStartAt))) {
    return {
      isOpen: false,
      canSubmit: false,
      reason: `เปิดรับยื่นเอกสารตั้งแต่ ${formatDeadline(windowStartAt, { showRelative: false })}`
    };
  }

  // มี end date - ตรวจสอบว่าปิดแล้วหรือยัง
  if (windowEndAt && now.isAfter(dayjs(windowEndAt))) {
    return {
      isOpen: false,
      canSubmit: false,
      reason: `หมดช่วงเวลายื่นเอกสารแล้ว (ปิดรับเมื่อ ${formatDeadline(windowEndAt, { showRelative: false })})`
    };
  }

  return {
    isOpen: true,
    canSubmit: true,
    reason: null
  };
};

/**
 * จัดเรียง deadlines ตามความใกล้
 * @param {Array} deadlines - Array of deadline objects
 * @returns {Array} Sorted deadlines (ใกล้ที่สุดก่อน)
 */
export const sortDeadlinesByUrgency = (deadlines) => {
  if (!deadlines || !Array.isArray(deadlines)) return [];

  return [...deadlines].sort((a, b) => {
    const aTime = dayjs(a.deadlineAt);
    const bTime = dayjs(b.deadlineAt);
    return aTime.diff(bTime);
  });
};

/**
 * กรอง deadlines ที่ยังไม่เลยกำหนด
 * @param {Array} deadlines - Array of deadline objects
 * @returns {Array} Active deadlines
 */
export const getActiveDeadlines = (deadlines) => {
  if (!deadlines || !Array.isArray(deadlines)) return [];

  const now = dayjs();
  return deadlines.filter(deadline => {
    const deadlineTime = dayjs(deadline.deadlineAt);
    const gracePeriod = deadline.gracePeriodMinutes || 0;
    const effectiveDeadline = deadlineTime.add(gracePeriod, 'minute');
    return now.isBefore(effectiveDeadline);
  });
};

/**
 * หา deadline ถัดไปที่ใกล้ที่สุด
 * @param {Array} deadlines - Array of deadline objects
 * @returns {Object|null} Next deadline
 */
export const getNextDeadline = (deadlines) => {
  const active = getActiveDeadlines(deadlines);
  const sorted = sortDeadlinesByUrgency(active);
  return sorted.length > 0 ? sorted[0] : null;
};

/**
 * สร้างข้อความแจ้งเตือนตาม deadline policy
 * @param {Object} deadline - Deadline object
 * @returns {string} Alert message
 */
export const getDeadlineAlertMessage = (deadline) => {
  if (!deadline) return '';

  const { name, deadlineAt, lockAfterDeadline, allowLate, gracePeriodMinutes } = deadline;
  const status = getDeadlineStatus(deadlineAt, gracePeriodMinutes);

  let message = `${name}: ${formatDeadline(deadlineAt)}`;

  if (status.status === 'overdue') {
    if (lockAfterDeadline) {
      message += ' - ❌ ปิดรับยื่นเอกสารแล้ว';
    } else if (allowLate) {
      message += ' - ⚠️ เลยกำหนดแล้ว แต่ยังยื่นได้ (อาจมีข้อจำกัด)';
    } else {
      message += ' - ⚠️ เลยกำหนดแล้ว';
    }
  } else if (status.status === 'urgent' || status.status === 'critical') {
    message += ` - 🔔 ${status.label}`;
  }

  return message;
};

const deadlineHelpers = {
  formatDeadline,
  calculateTimeRemaining,
  getDeadlineStatus,
  getCountdownText,
  checkSubmissionWindow,
  sortDeadlinesByUrgency,
  getActiveDeadlines,
  getNextDeadline,
  getDeadlineAlertMessage
};

export default deadlineHelpers;
