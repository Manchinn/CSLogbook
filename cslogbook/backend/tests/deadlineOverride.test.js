/**
 * Deadline Override — Service + Wrapper Tests (Phase 1)
 *
 * Pure unit tests with mocked models (ไม่ต้องใช้ DB จริง)
 * ครอบคลุม:
 *   - resolveOverride: no row / no grant / revoked / valid
 *   - grantOverride / revokeOverride: validation + ผลลัพธ์
 *   - checkDeadlineStatusForStudent: pass-through, extension, bypassLock
 */

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const mockStudentDeadlineStatus = {
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
  findAll: jest.fn()
};

const mockStudent = {
  findOne: jest.fn()
};

const mockSystemLog = {
  create: jest.fn()
};

jest.mock('../models', () => ({
  StudentDeadlineStatus: mockStudentDeadlineStatus,
  Student: mockStudent,
  User: {},
  SystemLog: mockSystemLog
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper สร้าง row ที่มี get() เลียนแบบ Sequelize instance
function makeRow(fields) {
  return {
    get: (key) => fields[key],
    update: jest.fn(async function (patch) {
      Object.assign(fields, patch);
    }),
    ...fields
  };
}

// ───────────────────────── resolveOverride ─────────────────────────
describe('resolveOverride', () => {
  const { resolveOverride } = require('../services/deadlineOverrideService');

  test('returns null when deadlineId missing', async () => {
    const result = await resolveOverride({ studentId: 1 });
    expect(result).toBeNull();
    expect(mockStudentDeadlineStatus.findOne).not.toHaveBeenCalled();
  });

  test('returns null when no studentId/userId', async () => {
    const result = await resolveOverride({ deadlineId: 10 });
    expect(result).toBeNull();
  });

  test('returns null when row not found', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(null);
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toBeNull();
  });

  test('returns null when grantedAt is missing', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      studentDeadlineStatusId: 1,
      grantedAt: null,
      revokedAt: null,
      extendedUntil: new Date(),
      bypassLock: false
    }));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toBeNull();
  });

  test('returns null when revoked', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date('2026-01-01'),
      revokedAt: new Date('2026-02-01'),
      extendedUntil: new Date('2026-12-31'),
      bypassLock: true
    }));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toBeNull();
  });

  test('returns null when neither extendedUntil nor bypassLock set', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: null,
      bypassLock: false
    }));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toBeNull();
  });

  test('returns override when valid (extendedUntil only)', async () => {
    const grantedAt = new Date('2026-04-01');
    const extendedUntil = new Date('2026-05-15');
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      studentDeadlineStatusId: 42,
      studentId: 1,
      importantDeadlineId: 10,
      grantedAt,
      revokedAt: null,
      extendedUntil,
      bypassLock: false,
      grantedBy: 99,
      reason: 'special case'
    }));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toMatchObject({
      studentDeadlineStatusId: 42,
      studentId: 1,
      importantDeadlineId: 10,
      extendedUntil,
      bypassLock: false,
      grantedBy: 99,
      reason: 'special case'
    });
  });

  test('returns override when valid (bypassLock only)', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: null,
      bypassLock: true,
      studentId: 1,
      importantDeadlineId: 10
    }));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result.bypassLock).toBe(true);
    expect(result.extendedUntil).toBeNull();
  });

  test('looks up studentId via Student.findOne when only userId provided', async () => {
    mockStudent.findOne.mockResolvedValue({ get: () => 7 });
    mockStudentDeadlineStatus.findOne.mockResolvedValue(null);
    await resolveOverride({ userId: 100, deadlineId: 10 });
    expect(mockStudent.findOne).toHaveBeenCalledWith({
      where: { userId: 100 },
      attributes: ['studentId']
    });
    expect(mockStudentDeadlineStatus.findOne).toHaveBeenCalledWith({
      where: { studentId: 7, importantDeadlineId: 10 }
    });
  });

  test('returns null when query throws (fail-open)', async () => {
    mockStudentDeadlineStatus.findOne.mockRejectedValue(new Error('table missing'));
    const result = await resolveOverride({ studentId: 1, deadlineId: 10 });
    expect(result).toBeNull();
  });
});

// ───────────────────────── grantOverride / revokeOverride ─────────────────────────
describe('grantOverride', () => {
  const { grantOverride } = require('../services/deadlineOverrideService');

  test('throws when required args missing', async () => {
    await expect(grantOverride({ deadlineId: 10, grantedBy: 1, extendedUntil: new Date() }))
      .rejects.toThrow(/studentId is required/);
    await expect(grantOverride({ studentId: 1, grantedBy: 1, extendedUntil: new Date() }))
      .rejects.toThrow(/deadlineId is required/);
    await expect(grantOverride({ studentId: 1, deadlineId: 10, extendedUntil: new Date() }))
      .rejects.toThrow(/grantedBy is required/);
  });

  test('throws when neither extendedUntil nor bypassLock provided', async () => {
    await expect(grantOverride({ studentId: 1, deadlineId: 10, grantedBy: 99 }))
      .rejects.toThrow(/extendedUntil or bypassLock/);
  });

  test('creates row and applies override', async () => {
    const fields = { studentId: 1, importantDeadlineId: 10, status: 'pending' };
    const row = makeRow(fields);
    mockStudentDeadlineStatus.findOrCreate.mockResolvedValue([row, true]);

    const ext = new Date('2026-12-31');
    await grantOverride({
      studentId: 1, deadlineId: 10, grantedBy: 99,
      extendedUntil: ext, reason: 'sick leave'
    });

    expect(row.update).toHaveBeenCalledWith(expect.objectContaining({
      extendedUntil: ext,
      bypassLock: false,
      grantedBy: 99,
      revokedAt: null,
      reason: 'sick leave'
    }));
  });
});

describe('revokeOverride', () => {
  const { revokeOverride } = require('../services/deadlineOverrideService');

  test('returns null when row not found', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(null);
    const result = await revokeOverride({ studentId: 1, deadlineId: 10, revokedBy: 99 });
    expect(result).toBeNull();
  });

  test('returns null when never granted', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: null, revokedAt: null
    }));
    const result = await revokeOverride({ studentId: 1, deadlineId: 10, revokedBy: 99 });
    expect(result).toBeNull();
  });

  test('sets revokedAt and appends reason', async () => {
    const row = makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      reason: 'original'
    });
    mockStudentDeadlineStatus.findOne.mockResolvedValue(row);

    await revokeOverride({ studentId: 1, deadlineId: 10, revokedBy: 99, reason: 'mistake' });

    expect(row.update).toHaveBeenCalledWith(expect.objectContaining({
      revokedAt: expect.any(Date),
      reason: 'original | revoked: mistake'
    }));
  });
});

// ───────────────────────── checkDeadlineStatusForStudent ─────────────────────────
describe('checkDeadlineStatusForStudent', () => {
  // Reset module registry to avoid override mock leaking between describe blocks
  let checkDeadlineStatusForStudent;
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../utils/logger', () => ({
      info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn()
    }));
    jest.doMock('../models', () => ({
      StudentDeadlineStatus: mockStudentDeadlineStatus,
      Student: mockStudent,
      User: {},
      SystemLog: mockSystemLog
    }));
    ({ checkDeadlineStatusForStudent } = require('../utils/deadlineChecker'));
  });

  function makeDeadline(overrides = {}) {
    return {
      id: 10,
      name: 'ส่งคำร้องขอสอบ',
      deadlineAt: new Date('2026-04-01T00:00:00Z'),
      gracePeriodMinutes: 60,
      windowStartAt: null,
      windowEndAt: null,
      lockAfterDeadline: true,
      allowLate: false,
      ...overrides
    };
  }

  test('passes through when no student identification', async () => {
    const deadline = makeDeadline();
    const result = await checkDeadlineStatusForStudent(deadline, {}, {});
    expect(result.allowed).toBeDefined();
    expect(mockStudentDeadlineStatus.findOne).not.toHaveBeenCalled();
  });

  test('passes through when no override exists', async () => {
    mockStudentDeadlineStatus.findOne.mockResolvedValue(null);
    const deadline = makeDeadline({
      deadlineAt: new Date(Date.now() + 86400000) // tomorrow
    });
    const result = await checkDeadlineStatusForStudent(deadline, { studentId: 1 }, {});
    expect(result.allowed).toBe(true);
    expect(result.metadata.override).toBeUndefined();
  });

  test('extends deadline when extendedUntil > original+grace', async () => {
    // original deadline ผ่านไปแล้ว 1 วัน, grace 60 นาที → ตอนนี้ควรโดน lock
    const past = new Date(Date.now() - 86400000);
    const future = new Date(Date.now() + 86400000);
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: future,
      bypassLock: false,
      studentId: 1,
      importantDeadlineId: 10,
      grantedBy: 99,
      reason: 'extended'
    }));

    const deadline = makeDeadline({ deadlineAt: past });
    const result = await checkDeadlineStatusForStudent(deadline, { studentId: 1 }, {});

    expect(result.allowed).toBe(true);
    expect(result.metadata.override).toMatchObject({
      extendedUntil: future,
      bypassLock: false
    });
  });

  test('bypassLock prevents block even after deadline', async () => {
    const past = new Date(Date.now() - 86400000);
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: null,
      bypassLock: true,
      studentId: 1,
      importantDeadlineId: 10,
      grantedBy: 99
    }));

    const deadline = makeDeadline({ deadlineAt: past, lockAfterDeadline: true, allowLate: false });
    const result = await checkDeadlineStatusForStudent(deadline, { studentId: 1 }, {});

    expect(result.allowed).toBe(true);
    expect(result.metadata.override.bypassLock).toBe(true);
  });

  test('extension shorter than original+grace is ignored (does not shrink window)', async () => {
    const past = new Date(Date.now() - 86400000); // yesterday
    const earlierThanGrace = new Date(past.getTime() + 30 * 60 * 1000); // +30min < grace 60min
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: earlierThanGrace,
      bypassLock: false,
      studentId: 1,
      importantDeadlineId: 10
    }));

    const deadline = makeDeadline({ deadlineAt: past });
    const result = await checkDeadlineStatusForStudent(deadline, { studentId: 1 }, {});

    // extension น้อยกว่า base+grace → ใช้ของเดิม → ยัง lock อยู่
    expect(result.allowed).toBe(false);
  });

  test('null deadline passes through', async () => {
    const result = await checkDeadlineStatusForStudent(null, { studentId: 1 }, {});
    expect(result.allowed).toBe(true);
    expect(mockStudentDeadlineStatus.findOne).not.toHaveBeenCalled();
  });
});

// ───────────────────────── applyOverrideToDeadline ─────────────────────────
describe('applyOverrideToDeadline', () => {
  const { applyOverrideToDeadline } = require('../services/deadlineOverrideService');

  test('returns plain copy when override is null', () => {
    const d = { id: 1, deadlineAt: new Date('2026-01-01'), gracePeriodMinutes: 60, lockAfterDeadline: true, allowLate: false };
    const out = applyOverrideToDeadline(d, null);
    expect(out).not.toBe(d);
    expect(out.deadlineAt).toEqual(d.deadlineAt);
    expect(out.lockAfterDeadline).toBe(true);
  });

  test('extends deadline when override is later than base+grace', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const ext = new Date('2026-02-01T00:00:00Z');
    const d = { id: 1, deadlineAt: base, gracePeriodMinutes: 60, lockAfterDeadline: true, allowLate: false };
    const out = applyOverrideToDeadline(d, { extendedUntil: ext, bypassLock: false });
    expect(out.deadlineAt).toEqual(ext);
    expect(out.gracePeriodMinutes).toBe(0);
  });

  test('does not shrink when override is earlier than base+grace', () => {
    const base = new Date('2026-01-01T10:00:00Z');
    const earlier = new Date('2026-01-01T10:30:00Z'); // < base + 60min
    const d = { id: 1, deadlineAt: base, gracePeriodMinutes: 60, lockAfterDeadline: true, allowLate: false };
    const out = applyOverrideToDeadline(d, { extendedUntil: earlier, bypassLock: false });
    expect(out.deadlineAt).toEqual(base);
    expect(out.gracePeriodMinutes).toBe(60);
  });

  test('bypassLock unsets lockAfterDeadline and sets allowLate', () => {
    const d = { id: 1, deadlineAt: new Date(), gracePeriodMinutes: 0, lockAfterDeadline: true, allowLate: false };
    const out = applyOverrideToDeadline(d, { bypassLock: true });
    expect(out.lockAfterDeadline).toBe(false);
    expect(out.allowLate).toBe(true);
  });

  test('null deadline returns null', () => {
    expect(applyOverrideToDeadline(null, { bypassLock: true })).toBeNull();
  });
});

// ───────────────────────── listOverridesByDeadline ─────────────────────────
describe('listOverridesByDeadline', () => {
  const { listOverridesByDeadline } = require('../services/deadlineOverrideService');

  test('returns empty when deadlineId missing', async () => {
    const result = await listOverridesByDeadline(null);
    expect(result).toEqual([]);
  });

  test('filters out rows without grantedAt and computes isActive', async () => {
    mockStudentDeadlineStatus.findAll.mockResolvedValue([
      makeRow({
        studentDeadlineStatusId: 1,
        studentId: 10,
        importantDeadlineId: 5,
        grantedAt: new Date(),
        revokedAt: null,
        extendedUntil: new Date('2026-12-31'),
        bypassLock: false
      }),
      makeRow({
        studentDeadlineStatusId: 2,
        grantedAt: null  // never granted — should be filtered out
      }),
      makeRow({
        studentDeadlineStatusId: 3,
        grantedAt: new Date(),
        revokedAt: new Date(),  // revoked → isActive=false
        extendedUntil: new Date('2026-12-31'),
        bypassLock: false
      })
    ]);

    const result = await listOverridesByDeadline(5);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.studentDeadlineStatusId === 1).isActive).toBe(true);
    expect(result.find((r) => r.studentDeadlineStatusId === 3).isActive).toBe(false);
  });
});

// ───────────────────────── audit logging ─────────────────────────
describe('audit logging via SystemLog', () => {
  const { grantOverride, revokeOverride } = require('../services/deadlineOverrideService');

  test('grantOverride writes DEADLINE_OVERRIDE_GRANTED', async () => {
    const fields = { studentDeadlineStatusId: 7, studentId: 1, importantDeadlineId: 10 };
    const row = makeRow(fields);
    mockStudentDeadlineStatus.findOrCreate.mockResolvedValue([row, true]);
    mockSystemLog.create.mockResolvedValue({});

    await grantOverride({
      studentId: 1, deadlineId: 10, grantedBy: 99,
      bypassLock: true, reason: 'audit-test'
    });

    expect(mockSystemLog.create).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'DEADLINE_OVERRIDE_GRANTED',
      userId: 99
    }));
    const payload = JSON.parse(mockSystemLog.create.mock.calls[0][0].actionDescription);
    expect(payload).toMatchObject({ studentId: 1, deadlineId: 10, bypassLock: true, reason: 'audit-test' });
  });

  test('revokeOverride writes DEADLINE_OVERRIDE_REVOKED', async () => {
    const row = makeRow({
      studentDeadlineStatusId: 7,
      grantedAt: new Date(),
      revokedAt: null,
      reason: null
    });
    mockStudentDeadlineStatus.findOne.mockResolvedValue(row);
    mockSystemLog.create.mockClear();
    mockSystemLog.create.mockResolvedValue({});

    await revokeOverride({ studentId: 1, deadlineId: 10, revokedBy: 99, reason: 'mistake' });

    expect(mockSystemLog.create).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'DEADLINE_OVERRIDE_REVOKED',
      userId: 99
    }));
  });

  test('audit failure does not throw from grantOverride', async () => {
    const row = makeRow({ studentDeadlineStatusId: 7 });
    mockStudentDeadlineStatus.findOrCreate.mockResolvedValue([row, true]);
    mockSystemLog.create.mockRejectedValue(new Error('db down'));

    await expect(grantOverride({
      studentId: 1, deadlineId: 10, grantedBy: 99, bypassLock: true
    })).resolves.toBeDefined();
  });
});

// ───────────────────────── lateSubmissionHelper override integration ─────────────────────────
describe('lateSubmissionHelper with override', () => {
  let calculateTopicSubmissionLate;
  let mockImportantDeadline;

  beforeEach(() => {
    jest.resetModules();
    mockImportantDeadline = {
      findOne: jest.fn()
    };
    jest.doMock('../utils/logger', () => ({
      info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn()
    }));
    jest.doMock('../models', () => ({
      ImportantDeadline: mockImportantDeadline,
      StudentDeadlineStatus: mockStudentDeadlineStatus,
      Student: mockStudent,
      User: {},
      SystemLog: mockSystemLog
    }));
    ({ calculateTopicSubmissionLate } = require('../utils/lateSubmissionHelper'));
  });

  test('without studentId behaves as before (no override applied)', async () => {
    const past = new Date(Date.now() - 7 * 86400000);
    mockImportantDeadline.findOne.mockResolvedValue({
      id: 1,
      deadlineAt: past,
      gracePeriodMinutes: 0,
      allowLate: true,
      lockAfterDeadline: false,
      relatedTo: 'project1',
      academicYear: '2568',
      semester: 1,
      isPublished: true,
      name: 'บันทึกหัวข้อโครงงานพิเศษ'
    });

    const submittedAt = new Date();
    const result = await calculateTopicSubmissionLate(submittedAt, { academicYear: '2568', semester: 1 });

    expect(result.submitted_late).toBe(true);
    expect(result.important_deadline_id).toBe(1);
    expect(mockStudentDeadlineStatus.findOne).not.toHaveBeenCalled();
  });

  test('with studentId + active extension treats submission as on-time', async () => {
    const past = new Date(Date.now() - 7 * 86400000);
    const future = new Date(Date.now() + 86400000);
    mockImportantDeadline.findOne.mockResolvedValue({
      id: 1,
      deadlineAt: past,
      gracePeriodMinutes: 0,
      allowLate: true,
      lockAfterDeadline: false,
      relatedTo: 'project1',
      academicYear: '2568',
      semester: 1,
      isPublished: true,
      name: 'บันทึกหัวข้อโครงงานพิเศษ'
    });
    mockStudentDeadlineStatus.findOne.mockResolvedValue(makeRow({
      grantedAt: new Date(),
      revokedAt: null,
      extendedUntil: future,
      bypassLock: false,
      studentId: 42,
      importantDeadlineId: 1
    }));

    const submittedAt = new Date();
    const result = await calculateTopicSubmissionLate(
      submittedAt,
      { academicYear: '2568', semester: 1 },
      42
    );

    // override extends deadline → not late
    expect(result.submitted_late).toBe(false);
    expect(result.submission_delay_minutes).toBeNull();
  });
});
