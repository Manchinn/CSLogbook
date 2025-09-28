const request = require('supertest');
const app = require('../../app');

jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 3001, role: 'teacher' };
    next();
  },
  checkRole: () => (_req, _res, next) => next(),
  checkTeacherType: () => (_req, _res, next) => next(),
  checkTeacherPosition: () => (_req, _res, next) => next(),
  checkSelfOrAdmin: (_req, _res, next) => next(),
  checkEligibility: () => (_req, _res, next) => next()
}));

jest.mock('../../services/meetingService', () => ({
  listTeacherMeetingApprovals: jest.fn()
}));

const meetingService = require('../../services/meetingService');

describe('GET /api/teachers/meeting-approvals', () => {
  const mockResponse = {
    items: [],
    summary: { pending: 0, approved: 0, rejected: 0, total: 0 },
    teacher: { teacherId: 55, teacherType: 'academic' },
    meta: { totalItems: 0, appliedFilters: { status: 'pending', academicYear: null, semester: null, projectId: null, search: null } }
  };

  beforeEach(() => {
    meetingService.listTeacherMeetingApprovals.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ดึงคิวอนุมัติของอาจารย์สำเร็จ', async () => {
    const res = await request(app)
      .get('/api/teachers/meeting-approvals')
      .query({ status: 'pending', q: 'ระบบ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: mockResponse });
    expect(meetingService.listTeacherMeetingApprovals).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 3001, role: 'teacher' }),
      expect.objectContaining({ status: 'pending', q: 'ระบบ' })
    );
  });

  it('ส่งต่อ error จาก service พร้อม status code', async () => {
    const error = new Error('ไม่สามารถดึงคิวได้');
    error.statusCode = 422;
    meetingService.listTeacherMeetingApprovals.mockRejectedValueOnce(error);

    const res = await request(app).get('/api/teachers/meeting-approvals');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ success: false, message: 'ไม่สามารถดึงคิวได้' });
  });
});
