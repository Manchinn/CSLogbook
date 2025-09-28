const request = require('supertest');
const app = require('../../app');

jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 901, role: 'student', studentId: 1001 };
    next();
  },
  checkRole: () => (_req, _res, next) => next(),
  checkTeacherType: () => (_req, _res, next) => next(),
  checkTeacherPosition: () => (_req, _res, next) => next(),
  checkSelfOrAdmin: (_req, _res, next) => next(),
  checkEligibility: () => (_req, _res, next) => next()
}));

jest.mock('../../services/meetingService', () => ({
  createMeeting: jest.fn()
}));

const meetingService = require('../../services/meetingService');

describe('POST /api/projects/:id/meetings', () => {
  const validPayload = {
    meetingTitle: 'ติดตามความคืบหน้าครั้งที่ 1',
    meetingDate: new Date('2024-08-01T09:00:00.000Z').toISOString(),
    meetingMethod: 'onsite',
    meetingLocation: 'CS Building',
    meetingLink: null
  };

  beforeEach(() => {
    meetingService.createMeeting.mockResolvedValue({
      meetingId: 501,
      meetingTitle: validPayload.meetingTitle,
      meetingDate: validPayload.meetingDate,
      meetingMethod: validPayload.meetingMethod,
      participants: []
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('สร้างการประชุมสำเร็จและเรียก service ด้วย payload ที่ส่งมา', async () => {
    const res = await request(app)
      .post('/api/projects/42/meetings')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({
        meetingId: 501,
        meetingTitle: validPayload.meetingTitle
      })
    });
    expect(meetingService.createMeeting).toHaveBeenCalledWith('42', expect.objectContaining({ userId: 901, role: 'student', studentId: 1001 }), validPayload);
  });

  test('ส่งต่อ error จาก service พร้อม status code', async () => {
    const error = new Error('ข้อมูลไม่ถูกต้อง');
    error.statusCode = 422;
    meetingService.createMeeting.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/projects/42/meetings')
      .send(validPayload);

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ success: false, message: 'ข้อมูลไม่ถูกต้อง' });
  });
});
