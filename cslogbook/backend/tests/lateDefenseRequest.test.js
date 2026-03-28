/**
 * Late Defense Request — createDeadlineTag Tests (BUG-02)
 *
 * ทดสอบ createDeadlineTag function ใน requestDeadlineChecker.js
 * เป็น pure function (ไม่ต้องใช้ DB) — ทดสอบ logic การสร้าง tag
 */

// ─── Mock logger (suppress output) ──────────────────────────────────────────
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// ─── Mock models (required by module import but not used in createDeadlineTag) ─
jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    ImportantDeadline: {
      findOne: jest.fn(),
    },
    sequelize: {
      fn: actualSequelize.fn,
      col: actualSequelize.col,
    },
    Sequelize: actualSequelize.Sequelize,
    Op: actualSequelize.Op,
  };
});

// ─── Tests ──────────────────────────────────────────────────────────────────

const { createDeadlineTag } = require('../utils/requestDeadlineChecker');

describe('createDeadlineTag', () => {
  test('L1: deadline exists + late → returns late tag', () => {
    const deadlineStatus = {
      hasDeadline: true,
      isLate: true,
      isLocked: false,
      minutesLate: 180, // 3 hours
      deadlineInfo: {
        name: 'ส่งคำร้องขอสอบ (คพ.02)',
      },
    };

    const tag = createDeadlineTag(deadlineStatus);

    expect(tag).not.toBeNull();
    expect(tag.type).toBe('late');
    expect(tag.color).toBe('warning');
    expect(tag.text).toBe('ส่งช้า');
    expect(tag.tooltip).toContain('3 ชั่วโมง');
  });

  test('L2: no deadline but fallbackSubmittedLate=true → returns fallback late tag', () => {
    const deadlineStatus = {
      hasDeadline: false,
    };

    const tag = createDeadlineTag(deadlineStatus, true, 1500); // 25 hours = 1 day

    expect(tag).not.toBeNull();
    expect(tag.type).toBe('late');
    expect(tag.color).toBe('warning');
    expect(tag.text).toBe('ส่งล่าช้า');
    expect(tag.tooltip).toContain('1 วัน');
  });

  test('L3: no deadline + not late → returns null', () => {
    const deadlineStatus = {
      hasDeadline: false,
    };

    const tag = createDeadlineTag(deadlineStatus, false, null);

    expect(tag).toBeNull();
  });

  test('L4: deadline exists + on time → returns null', () => {
    const deadlineStatus = {
      hasDeadline: true,
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      deadlineInfo: {
        name: 'ส่งคำร้องขอสอบ (คพ.02)',
      },
    };

    const tag = createDeadlineTag(deadlineStatus);

    expect(tag).toBeNull();
  });
});
