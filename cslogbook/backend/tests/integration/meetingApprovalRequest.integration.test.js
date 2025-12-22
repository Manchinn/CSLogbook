const express = require('express');
const request = require('supertest');

jest.mock('../../services/meetingService', () => ({
  createMeeting: jest.fn()
}));

const meetingController = require('../../controllers/meetingController');
const meetingService = require('../../services/meetingService');

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  const fakeAuth = (req, _res, next) => {
    req.user = { userId: 901, role: 'student', studentId: 1001 };
    next();
  };
  const fakeEligibility = (_req, _res, next) => next();
  app.post('/api/projects/:id/meetings', fakeAuth, fakeEligibility, meetingController.create);
  return app;
};

describe('POST /api/projects/:id/meetings', () => {
  let app;
  const validPayload = {
    meetingTitle: 'ติดตามความคืบหน้าครั้งที่ 1',
    meetingDate: new Date('2024-08-01T09:00:00.000Z').toISOString(),
    meetingMethod: 'onsite',
    meetingLocation: 'CS Building',
    meetingLink: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildTestApp();
    meetingService.createMeeting.mockResolvedValue({
      meetingId: 501,
      meetingTitle: validPayload.meetingTitle,
      meetingDate: validPayload.meetingDate,
      meetingMethod: validPayload.meetingMethod,
      participants: []
    });
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
