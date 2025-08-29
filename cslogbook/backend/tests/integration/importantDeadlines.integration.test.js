const request = require('supertest');
const { Sequelize } = require('sequelize');
const express = require('express');
const app = express();
app.use(express.json());

// Mock auth middleware ให้ผ่านและตั้ง req.user
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req,res,next)=> { req.user = { userId: 1, role: 'student' }; next(); },
  checkRole: ()=> (req,res,next)=> next()
}));

// Mock models (ใช้ global.__TEST_MODELS เพื่อเลี่ยง out-of-scope ใน factory)
jest.mock('../../models', () => (global.__TEST_MODELS || {}), { virtual: true });

let sequelize, ImportantDeadline, Document;

beforeAll(async () => {
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
  const importantDeadlineFactory = require('../../models/ImportantDeadline');
  const documentFactory = require('../../models/Document');
  ImportantDeadline = importantDeadlineFactory(sequelize);
  Document = documentFactory(sequelize);
  global.__TEST_MODELS = { ImportantDeadline, Document };
  await sequelize.sync({ force: true });
  // โหลด routes หลังตั้ง global models
  const studentRoutes = require('../../routes/studentRoutes');
  app.use('/api/students', studentRoutes);
});

afterAll(async () => { await sequelize.close(); });

function bangkokLegacyDate(dt){return new Date(dt.getTime()+7*3600000).toISOString().slice(0,10);}

async function seed({ type='SUBMISSION', offsetMinutes=30, grace=60, allowLate=true, lockAfterDeadline=true, window=false }) {
  const now = Date.now();
  let deadlineAt = new Date(now + offsetMinutes*60000);
  let windowStartAt = null, windowEndAt = null;
  if (window) {
    windowStartAt = new Date(now - 60*60000);
    windowEndAt = deadlineAt;
  }
  return ImportantDeadline.create({
    name: `DL-${type}-${offsetMinutes}`,
    relatedTo: 'internship', academicYear: '2025', semester: 1,
    deadlineType: type,
    deadlineAt,
    date: bangkokLegacyDate(deadlineAt),
    windowStartAt, windowEndAt,
    allowLate, gracePeriodMinutes: grace, lockAfterDeadline,
    acceptingSubmissions: type==='SUBMISSION', isPublished: true
  });
}

describe('GET /api/students/important-deadlines integration status', () => {
  test('returns announcement status', async () => {
    await seed({ type:'ANNOUNCEMENT', offsetMinutes:120, allowLate:false, grace:null, lockAfterDeadline:false });
    const res = await request(app).get('/api/students/important-deadlines');
    expect(res.status).toBe(200);
    const ann = res.body.data.find(d=> d.deadlineType==='ANNOUNCEMENT');
    expect(ann.status).toBe('announcement');
  });

  test('submitted_late vs submitted', async () => {
    const onTime = await seed({ type:'SUBMISSION', offsetMinutes:10 });
    const late = await seed({ type:'SUBMISSION', offsetMinutes:-5, grace:30 }); // already passed -> overdue now (no submission)
    // สร้างเอกสาร on-time
    await Document.create({
      userId:1, documentType:'INTERNSHIP', category:'proposal', documentName:'OnTime',
      status:'pending', importantDeadlineId:onTime.id, submittedAt:new Date(), isLate:false
    });
    // สร้างเอกสาร late (submitted 2 นาทีหลัง effective)
    const lateEff = new Date(Date.now() - 2*60000);
    await Document.create({
      userId:1, documentType:'INTERNSHIP', category:'proposal', documentName:'Late',
      status:'pending', importantDeadlineId:late.id, submittedAt:lateEff, isLate:true
    });
    const res = await request(app).get('/api/students/important-deadlines');
    expect(res.status).toBe(200);
    const data = res.body.data;
    const onTimeRow = data.find(d=> d.id===onTime.id);
    const lateRow = data.find(d=> d.id===late.id);
    expect(onTimeRow.status).toBe('submitted');
    expect(lateRow.status).toBe('submitted_late');
  });

  test('locked and overdue states', async () => {
    const overdue = await seed({ type:'SUBMISSION', offsetMinutes:-10, grace:30, lockAfterDeadline:true });
    const locked = await seed({ type:'SUBMISSION', offsetMinutes:-120, grace:30, lockAfterDeadline:true }); // passed grace
    // ปรับ deadline locked: offset -120 => eff = now-120m, grace=30 => locked now
    const res = await request(app).get('/api/students/important-deadlines');
    const o = res.body.data.find(d=> d.id===overdue.id);
    const l = res.body.data.find(d=> d.id===locked.id);
    expect(o.status).toBe('overdue');
    expect(l.status).toBe('locked');
  });
});
