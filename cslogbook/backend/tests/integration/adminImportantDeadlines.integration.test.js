const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');

// Integration: admin important-deadlines CRUD/policy/stats (เฉพาะเส้นทางใหม่)
// Mock auth -> admin teacher support
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req,res,next)=>{ req.user={ userId:99, role:'teacher', teacherType:'support' }; next(); },
  checkRole: () => (req,res,next)=> next(),
  checkTeacherType: () => (req,res,next)=> next()
}));

let app, sequelize, models;

beforeAll(async () => {
  jest.resetModules();
  sequelize = new Sequelize('sqlite::memory:', { logging:false });
  const ImportantDeadlineFactory = require('../../models/ImportantDeadline');
  const ImportantDeadline = ImportantDeadlineFactory(sequelize);
  models = { ImportantDeadline, Document: { count: jest.fn() } }; // Document.count mock for stats
  jest.doMock('../../models', () => models);
  await sequelize.sync({ force:true });
  app = express();
  app.use(express.json());
  const adminRoutes = require('../../routes/adminRoutes');
  app.use('/api/admin', adminRoutes);
});

afterAll(async () => { await sequelize.close(); });

function basePayload(overrides={}){
  return {
    name: 'Test DL',
    relatedTo: 'internship',
    academicYear: '2025',
    semester: 1,
    deadlineDate: '2025-09-20',
    deadlineType: 'SUBMISSION',
    ...overrides
  };
}

describe('Admin Important Deadlines API', () => {
  test('POST create returns 201 with payload', async () => {
    const res = await request(app).post('/api/admin/important-deadlines').send(basePayload());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
  });

  test('PATCH policy updates subset fields only', async () => {
    const createRes = await request(app).post('/api/admin/important-deadlines').send(basePayload({ name:'Policy DL' }));
    const id = createRes.body.data.id;
    const patch = await request(app).patch(`/api/admin/important-deadlines/${id}/policy`).send({ acceptingSubmissions:false, allowLate:false, gracePeriodMinutes:15, bogus:true });
    expect(patch.status).toBe(200);
    expect(patch.body.data.acceptingSubmissions).toBe(false);
    expect(patch.body.data.allowLate).toBe(false);
    expect(patch.body.data.gracePeriodMinutes).toBe(15);
    expect(patch.body.data.bogus).toBeUndefined();
  });

  test('GET stats returns counts (Document.count mocked)', async () => {
    const createRes = await request(app).post('/api/admin/important-deadlines').send(basePayload({ name:'Stats DL' }));
    const id = createRes.body.data.id;
    models.Document.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2); // total=5, late=2
    const statsRes = await request(app).get(`/api/admin/important-deadlines/${id}/stats`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.total).toBe(5);
    expect(statsRes.body.data.late).toBe(2);
    expect(statsRes.body.data.onTime).toBe(3);
  });
});
