import dayjs from './dayjs'; // ใช้ wrapper กลางที่ตั้งค่า locale + timezone + พ.ศ.

export function formatDeadlineThai(dateStr, timeStr, withTime = true) {
  if (!dateStr) return '-';
  const base = dayjs(`${dateStr}${timeStr?` ${timeStr}`:''}`, 'YYYY-MM-DD HH:mm:ss');
  return withTime && timeStr
    ? base.format('D MMM BBBB เวลา HH:mm น.')
    : base.format('D MMM BBBB');
}

export function computeDeadlineStatus(deadlineAtLocal, submittedAtLocal, { isLate, isSubmitted, locked } = {}) {
  // ลำดับความสำคัญ: submitted -> submitted-late -> locked -> overdue -> dueSoon -> pending
  const now = dayjs();
  const deadline = deadlineAtLocal ? dayjs(deadlineAtLocal) : null;
  if (!deadline) return { code:'none', label:'ไม่มี', color:'default' };
  if (isSubmitted) {
    if (isLate) return { code:'late', label:'ส่งช้า', color:'orange' };
    return { code:'submitted', label:'ส่งแล้ว', color:'green' };
  }
  if (locked) {
    return { code:'locked', label:'ปิดรับแล้ว', color:'purple' };
  }
  if (now.isAfter(deadline)) {
    const diffDays = now.diff(deadline,'day');
    return { code:'overdue', label:`เกินกำหนด ${diffDays} วัน`, color:'red' };
  }
  const hoursLeft = deadline.diff(now,'hour');
  if (hoursLeft < 24) return { code:'dueSoon', label:`เหลือ ${hoursLeft} ชม.`, color:'gold' };
  const daysLeft = deadline.diff(now,'day');
  return { code:'pending', label:`เหลือ ${daysLeft} วัน`, color:'blue' };
}
