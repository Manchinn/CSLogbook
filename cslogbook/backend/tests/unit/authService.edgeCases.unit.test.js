const jwt = require('jsonwebtoken');

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockMailer = { sendLoginNotification: jest.fn().mockResolvedValue({ sent: false }) };
const mockBcrypt = { compare: jest.fn() };

const fakeUser = { userId: 7, username: 'u1', password: 'hash', role: 'student', email: 'a@b', firstName: 'A', lastName: 'B', activeStatus: true };
const fakeTeacher = { userId: 11, username: 'teacher1', password: 'hash', role: 'teacher', email: 't@x', firstName: 'Teach', lastName: 'Er', activeStatus: true };

const mockModels = {
  User: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  Student: {
    findOne: jest.fn()
  },
  Admin: {},
  Teacher: {
    findOne: jest.fn()
  }
};

jest.mock('../../utils/logger', () => mockLogger);
jest.mock('../../utils/mailer', () => mockMailer);
jest.mock('bcrypt', () => mockBcrypt);
jest.mock('../../models', () => mockModels);

const authService = require('../../services/authService');

const resetModelImplementations = () => {
  mockModels.User.findOne.mockImplementation(({ where }) => {
    if (!where) return null;
    if (where.username === 'missing') return null;
    if (where.username === 'u1') return fakeUser;
    if (where.username === 'teacher1') return fakeTeacher;
    if (where.userId === 7) return fakeUser;
    if (where.userId === 11) return fakeTeacher;
    return null;
  });
  mockModels.User.update.mockResolvedValue([1]);
  mockModels.Student.findOne.mockResolvedValue({
    studentCode: '6401',
    totalCredits: 100,
    majorCredits: 60,
    isEligibleInternship: true,
    isEligibleProject: false
  });
  mockModels.Teacher.findOne.mockImplementation(({ where } = {}) => {
    if (where?.userId === 11) {
      return { teacherId: 3, teacherCode: 'T003', teacherType: 'academic', canAccessTopicExam: false, canExportProject1: true };
    }
    if (where?.userId === 7) {
      return { teacherId: 2, teacherCode: 'T002', teacherType: 'academic', canAccessTopicExam: false, canExportProject1: false };
    }
    return null;
  });
};

describe('authService edge cases', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-jest';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  beforeEach(() => {
    mockLogger.info.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.error.mockReset();
    mockMailer.sendLoginNotification.mockReset().mockResolvedValue({ sent: false });
    mockBcrypt.compare.mockReset().mockResolvedValue(false);
    resetModelImplementations();
  });

  test('return 401 when user not found', async () => {
    const result = await authService.authenticateUser('missing', 'x');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  test('return 401 when password invalid', async () => {
    mockBcrypt.compare.mockResolvedValue(false);
    const result = await authService.authenticateUser('u1', 'bad');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  test('success path returns token + role data', async () => {
    mockBcrypt.compare.mockResolvedValue(true);
    const result = await authService.authenticateUser('u1', 'correct');
    expect(result.success).toBe(true);
    expect(result.data.token).toBeTruthy();
    const decoded = jwt.verify(result.data.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(7);
  });

  test('teacher token carries export permission flag', async () => {
    mockBcrypt.compare.mockResolvedValue(true);
    const result = await authService.authenticateUser('teacher1', 'correct');
    expect(result.success).toBe(true);
    const decoded = jwt.verify(result.data.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(11);
    expect(decoded.teacherType).toBe('academic');
    expect(decoded.canExportProject1).toBe(true);
  });
});
