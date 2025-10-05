const request = require('supertest');
const express = require('express');

const mockTeacherFindOne = jest.fn(async ({ where }) => {
  if ([500, 501].includes(where.userId)) {
    return { teacherType: 'support', canAccessTopicExam: true };
  }
  return null;
});

jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    const role = req.headers['x-test-role'];
    if (!role) {
      return res.status(401).json({ success: false, error: 'NO_AUTH' });
    }
    req.user = {
      userId: Number(req.headers['x-test-userid']) || 0,
      role
    };
    next();
  }
}));

jest.mock('../../models', () => ({
  Teacher: { findOne: (...args) => mockTeacherFindOne(...args) }
}));

const mockExportOverview = jest.fn((req, res) => {
  res
    .status(200)
    .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .send('FAKE_XLSX_CONTENT');
});

jest.mock('../../controllers/topicExamController', () => ({
  getOverview: jest.fn(),
  exportOverview: mockExportOverview
}));

const topicExamRoutes = require('../../routes/topicExamRoutes');

describe('GET /api/projects/topic-exam/export (integration XLSX only)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects/topic-exam', topicExamRoutes);
  });

  beforeEach(() => {
    mockTeacherFindOne.mockClear();
    mockTeacherFindOne.mockImplementation(async ({ where }) => {
      if ([500, 501].includes(where.userId)) {
        return { teacherType: 'support', canAccessTopicExam: true };
      }
      return null;
    });
    mockExportOverview.mockClear();
  });

  test('403 when role=student', async () => {
    const res = await request(app)
      .get('/api/projects/topic-exam/export')
      .set('x-test-role', 'student')
      .set('x-test-userid', '601');

    expect(res.status).toBe(403);
  });

  test('200 XLSX สำหรับ teacher ที่มีสิทธิ์', async () => {
    const res = await request(app)
      .get('/api/projects/topic-exam/export?format=csv')
      .set('x-test-role', 'teacher')
      .set('x-test-userid', '501');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml\.sheet/);
    expect(mockExportOverview).toHaveBeenCalled();
  });
});
