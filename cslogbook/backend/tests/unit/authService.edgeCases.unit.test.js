const jwt = require('jsonwebtoken');
jest.mock('../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn(() => false) }));

describe('authService edge cases', () => {
  let authService;
  const fakeUser = { userId: 7, username: 'u1', password: 'hash', role: 'student', email: 'a@b', firstName: 'A', lastName: 'B', activeStatus: true };
  const fakeTeacher = { userId: 11, username: 'teacher1', password: 'hash', role: 'teacher', email: 't@x', firstName: 'Teach', lastName: 'Er', activeStatus: true };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-jest';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../utils/mailer', () => ({ sendLoginNotification: jest.fn().mockResolvedValue({ sent: false }) }), { virtual: true });
    jest.doMock('../../models', () => ({
      User: { findOne: jest.fn(({ where }) => {
        if (where.username === 'missing') return null;
        if (where.username === 'u1') return fakeUser;
        if (where.username === 'teacher1') return fakeTeacher;
        if (where.userId === 7) return fakeUser; // refresh path
        if (where.userId === 11) return fakeTeacher;
        return null;
      }), update: jest.fn() },
      Student: { findOne: jest.fn(() => ({ studentCode: '6401', totalCredits: 100, majorCredits: 60, isEligibleInternship: true, isEligibleProject: false })) },
      Admin: {},
      Teacher: { findOne: jest.fn(({ where }) => {
        if (where?.userId === 11) {
          return { teacherId: 3, teacherCode: 'T003', teacherType: 'academic', canAccessTopicExam: false, canExportProject1: true };
        }
        return { teacherId: 1, teacherCode: 'T001', teacherType: 'academic', canAccessTopicExam: false, canExportProject1: false };
      }) }
    }), { virtual: true });
    authService = require('../../services/authService');
  });

  test('return 401 when user not found', async () => {
    const result = await authService.authenticateUser('missing', 'x');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  test('return 401 when password invalid', async () => {
    const bcrypt = require('bcrypt');
    bcrypt.compare.mockResolvedValue(false);
    const result = await authService.authenticateUser('u1', 'bad');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  test('success path returns token + role data', async () => {
    const bcrypt = require('bcrypt');
    bcrypt.compare.mockResolvedValue(true);
    const result = await authService.authenticateUser('u1', 'correct');
    expect(result.success).toBe(true);
    expect(result.data.token).toBeTruthy();
    const decoded = jwt.verify(result.data.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(7);
  });

  test('teacher token carries export permission flag', async () => {
    const bcrypt = require('bcrypt');
    bcrypt.compare.mockResolvedValue(true);
    const result = await authService.authenticateUser('teacher1', 'correct');
    expect(result.success).toBe(true);
    const decoded = jwt.verify(result.data.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(11);
    expect(decoded.teacherType).toBe('academic');
    expect(decoded.canExportProject1).toBe(true);
  });
});
