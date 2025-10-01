const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');

/**
 * Integration: ส่ง payload legacy (deadlineDate + deadlineTime) และ relatedTo alias
 * ตรวจว่าถูกสร้างและตอบกลับ deadlineDate/time + deadlineAt (UTC) ได้
 * NOTE: ต้อง mock auth และ models เพื่อไม่ให้เขียนข้อมูลทดลองลง MySQL จริง
 */

describe('ImportantDeadlines legacy create API', () => {
  let app;
  let sequelize;

  beforeAll(async () => {
    jest.resetModules();
    jest.doMock('../../middleware/authMiddleware', () => ({
      authenticateToken: (req,res,next)=>{ req.user={ userId:1, role:'teacher'}; next(); },
      checkRole: ()=> (req,res,next)=> next(),
      checkTeacherType: ()=> (req,res,next)=> next(),
      checkTeacherPosition: ()=> (req,res,next)=> next(),
      checkTeacherTypeOrPosition: ()=> (req,res,next)=> next()
    }));

    sequelize = new Sequelize('sqlite::memory:', { logging:false });
    const ImportantDeadlineFactory = require('../../models/ImportantDeadline');
    const ImportantDeadline = ImportantDeadlineFactory(sequelize);
    const mockModels = { ImportantDeadline };
    jest.doMock('../../models', () => mockModels);
    await sequelize.sync({ force:true });

    app = express();
    app.use(express.json());
    const adminRoutes = require('../../routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  test('POST /api/admin/important-deadlines legacy fields accepted', async () => {
    const payload = {
      name: 'Legacy Deadline', relatedTo: 'project', academicYear: '2025', semester: 1,
      deadlineDate: '2025-10-10', deadlineTime: '16:30', deadlineType: 'SUBMISSION'
    };
    const res = await request(app)
      .post('/api/admin/important-deadlines')
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.deadlineDate).toBe('2025-10-10');
    expect(d.deadlineTime.startsWith('16:30')).toBe(true);
    expect(d.deadlineAt).toBeTruthy();
  });
});
