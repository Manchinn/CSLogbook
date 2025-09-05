const request = require('supertest');

/**
 * Integration: ส่ง payload legacy (deadlineDate + deadlineTime) และ relatedTo alias
 * ตรวจว่าถูกสร้างและตอบกลับ deadlineDate/time + deadlineAt (UTC) ได้
 * NOTE: ต้อง mock auth ก่อน require app เพื่อให้ route ใช้ mock
 */

describe('ImportantDeadlines legacy create API', () => {
  let app;
  beforeAll(() => {
    jest.resetModules();
    jest.doMock('../../middleware/authMiddleware', () => ({
      authenticateToken: (req,res,next)=>{ req.user={ userId:1, role:'teacher'}; next(); },
  checkRole: ()=> (req,res,next)=> next(),
  checkTeacherType: ()=> (req,res,next)=> next(),
  checkTeacherPosition: ()=> (req,res,next)=> next(),
  checkTeacherTypeOrPosition: ()=> (req,res,next)=> next()
    }));
    app = require('../../app');
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
