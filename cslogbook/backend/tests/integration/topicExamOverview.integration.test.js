const request = require('supertest');
const express = require('express');

describe('GET /api/projects/topic-exam/overview (integration)', () => {
  let app;
  let teacherFindOne;

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

    jest.doMock('../../controllers/topicExamController', () => ({
      getOverview: jest.fn((_req, res) => res.json({ success: true, data: [], meta: {} })),
      exportOverview: jest.fn()
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
  });

  test('403 when role=student', async () => {
    const res = await request(app)
      .get('/api/projects/topic-exam/overview')
      .set('x-test-role', 'student')
      .set('x-test-userid', '600');

    expect(res.status).toBe(403);
  });

  test('200 when teacher has access', async () => {
    const res = await request(app)
      .get('/api/projects/topic-exam/overview')
      .set('x-test-role', 'teacher')
      .set('x-test-userid', '500');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
