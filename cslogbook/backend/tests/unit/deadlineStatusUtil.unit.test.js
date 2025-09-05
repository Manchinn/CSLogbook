const { computeStatus, computeDaysLeft } = require('../helpers/deadlineStatusUtil');

// ใช้เวลาอ้างอิงคงที่เพื่อความเสถียร
const BASE = new Date('2025-08-29T08:00:00Z'); // 15:00 น. ไทย
function addMinutes(dt, m){ return new Date(dt.getTime() + m*60000); }

describe('deadline status util', () => {
  test('announcement returns announcement', () => {
    const d = { deadlineType: 'ANNOUNCEMENT' };
    const st = computeStatus(d, { submitted:false }, BASE);
    expect(st.status).toBe('announcement');
    expect(st.locked).toBe(false);
  });

  test('on-time submission', () => {
    const eff = addMinutes(BASE, 60);
    const d = { deadlineType: 'SUBMISSION', deadlineAt: eff, allowLate:true, gracePeriodMinutes:30, lockAfterDeadline:true };
    const submission = { submitted:true, late:false };
    const st = computeStatus(d, submission, addMinutes(BASE, 10));
    expect(st.status).toBe('submitted');
  });

  test('submitted late within grace', () => {
    const eff = addMinutes(BASE, 60);
    const d = { deadlineType: 'SUBMISSION', deadlineAt: eff, allowLate:true, gracePeriodMinutes:30, lockAfterDeadline:true };
    const submission = { submitted:true, late:true };
    const st = computeStatus(d, submission, addMinutes(BASE, 70));
    expect(st.status).toBe('submitted_late');
  });

  test('overdue (no submission yet, inside grace)', () => {
    const eff = addMinutes(BASE, 60);
    const now = addMinutes(BASE, 70); // > eff, < eff+30
    const d = { deadlineType: 'SUBMISSION', deadlineAt: eff, allowLate:true, gracePeriodMinutes:30, lockAfterDeadline:true };
    const st = computeStatus(d, { submitted:false }, now);
    expect(st.status).toBe('overdue');
  });

  test('locked (after grace, lockAfterDeadline=true)', () => {
    const eff = addMinutes(BASE, 60);
    const now = addMinutes(BASE, 100); // eff+40 > grace(30)
    const d = { deadlineType: 'SUBMISSION', deadlineAt: eff, allowLate:true, gracePeriodMinutes:30, lockAfterDeadline:true };
    const st = computeStatus(d, { submitted:false }, now);
    expect(st.status).toBe('locked');
    expect(st.locked).toBe(true);
  });

  test('in_window before submit', () => {
    const ws = addMinutes(BASE, 10);
    const we = addMinutes(BASE, 100);
    const now = addMinutes(BASE, 50);
    const d = { deadlineType: 'SUBMISSION', windowStartAt: ws, windowEndAt: we, allowLate:true, gracePeriodMinutes:0, lockAfterDeadline:false };
    const st = computeStatus(d, { submitted:false }, now);
    expect(st.status).toBe('in_window');
  });

  test('daysLeft rounding up', () => {
    const eff = addMinutes(BASE, 24*60 + 10); // 1 day + 10m -> ceil = 2
    const d = { deadlineAt: eff };
    const days = computeDaysLeft(d, BASE);
    expect(days).toBe(2);
  });

  test('daysLeft zero after passed', () => {
    const eff = addMinutes(BASE, -5);
    const d = { deadlineAt: eff };
    const days = computeDaysLeft(d, BASE);
    expect(days).toBe(0);
  });
});
