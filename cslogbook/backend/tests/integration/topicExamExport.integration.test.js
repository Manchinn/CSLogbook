const request = require('supertest');
const express = require('express');

describe('GET /api/projects/topic-exam/export (integration XLSX only)', () => {
  let app;
  let teacherFindOne;
  let exportMock;

  beforeAll(() => {
    jest.resetModules();

    teacherFindOne = jest.fn(async ({ where }) => {
      if ([500, 501].includes(where.userId)) {
        return { teacherType: 'support', canAccessTopicExam: true };
      }
      return null;
    });

    jest.doMock('../../middleware/authMiddleware', () => ({
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

    jest.doMock('../../models', () => ({
      Teacher: { findOne: teacherFindOne }
    }));

    exportMock = jest.fn((req, res) => {
      res
        .status(200)
        .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .send('FAKE_XLSX_CONTENT');
    });

    jest.doMock('../../controllers/topicExamController', () => ({
      getOverview: jest.fn(),
      exportOverview: exportMock
    }));

    const topicExamRoutes = require('../../routes/topicExamRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/projects/topic-exam', topicExamRoutes);
  });

  afterAll(() => {
    jest.resetModules();
  });

  beforeEach(() => {
    teacherFindOne.mockClear();
    teacherFindOne.mockImplementation(async ({ where }) => {
      if ([500, 501].includes(where.userId)) {
        return { teacherType: 'support', canAccessTopicExam: true };
      }
      return null;
    });
    exportMock.mockClear();
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
    expect(exportMock).toHaveBeenCalled();
  });
});
