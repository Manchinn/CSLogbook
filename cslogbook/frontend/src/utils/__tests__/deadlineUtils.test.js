import { computeDeadlineStatus } from '../deadlineUtils';
import dayjs from 'dayjs';

describe('computeDeadlineStatus', () => {
  test('คืน none เมื่อไม่มี deadline', () => {
    expect(computeDeadlineStatus(null, null)).toEqual({ code: 'none', label: 'ไม่มี', color: 'default' });
  });

  test('สถานะ overdue เมื่อเลยวัน', () => {
    const past = dayjs().subtract(2, 'day').toISOString();
    const res = computeDeadlineStatus(past, null);
    expect(res.code).toBe('overdue');
  });

  test('สถานะ dueSoon เมื่อเหลือน้อยกว่า 24h', () => {
    const soon = dayjs().add(5, 'hour').toISOString();
    const res = computeDeadlineStatus(soon, null);
    expect(res.code).toBe('dueSoon');
  });
});
