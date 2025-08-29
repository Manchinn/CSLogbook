const { Sequelize } = require('sequelize');

// NOTE: ใช้กลยุทธ์ resetModules เพื่อไม่ให้ documentService ที่ถูก require จากไฟล์อื่นก่อนหน้า
// มาค้าง cache ด้วยโมเดลจริง ป้องกัน side-effect จาก integration tests
let sequelize, documentService;

beforeAll(async () => {
  jest.resetModules();
  // เตรียม mock container
  global.__TEST_MODELS = {};
  // สร้าง in-memory sequelize
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
  // โหลด factory (ไม่ผ่าน index models เพื่อหลีกเลี่ยง side effect config/database)
  const importantDeadlineFactory = require('../../models/ImportantDeadline');
  const documentFactory = require('../../models/Document');
  const ImportantDeadline = importantDeadlineFactory(sequelize);
  const Document = documentFactory(sequelize);
  // เติม stub โมเดลอื่น ๆ ที่ service อาจ reference
  Object.assign(global.__TEST_MODELS, {
    ImportantDeadline,
    Document,
    User: { findByPk: jest.fn() },
    Student: {},
    InternshipDocument: {},
    StudentWorkflowActivity: {},
    Notification: {},
    DocumentLog: { create: jest.fn() },
  });
  // ประกาศ mock models module (หลัง resetModules)
  jest.doMock('../../models', () => global.__TEST_MODELS, { virtual: true });
  await sequelize.sync({ force: true });
  // isolateModules เพื่อให้ require ใช้ mock ที่เพิ่ง doMock
  jest.isolateModules(() => {
    documentService = require('../../services/documentService');
  });
});

afterAll(async () => { await sequelize.close(); });

function fakeFile(){
  return { path: 'uploads/fake.txt', filename: 'fake.txt', mimetype: 'text/plain', size: 10 };
}

async function createDeadline(overrides){
  const baseDeadlineAt = overrides?.deadlineAt || new Date(Date.now() + 60*60000);
  const isoDate = new Date(baseDeadlineAt.getTime() + 7*60*60*1000).toISOString().slice(0,10); // date (Bangkok) for legacy 'date'
  return global.__TEST_MODELS.ImportantDeadline.create({
    name: 'Test', relatedTo: 'internship', academicYear: '2025', semester: 1,
    deadlineType: 'SUBMISSION', deadlineAt: baseDeadlineAt,
    date: isoDate,
    allowLate: true, gracePeriodMinutes: 30, lockAfterDeadline: true, acceptingSubmissions: true,
    ...overrides
  });
}

describe('documentService late logic', () => {
  test('on-time', async () => {
    const eff = new Date(Date.now() + 30*60000);
  const d = await createDeadline({ deadlineAt: eff });
  const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'T1', importantDeadlineId: d.id });
    expect(out.isLate).toBe(false);
  });

  test('late within grace', async () => {
    const now = Date.now();
    const eff = new Date(now - 5*60000); // 5 นาทีที่แล้ว
  const d = await createDeadline({ deadlineAt: eff, gracePeriodMinutes: 30 });
  const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'Late1', importantDeadlineId: d.id });
    expect(out.isLate).toBe(true);
  });

  test('locked after grace', async () => {
    const now = Date.now();
    const eff = new Date(now - 120*60000); // 2 ชม. ที่แล้ว
  const d = await createDeadline({ deadlineAt: eff, gracePeriodMinutes: 30, lockAfterDeadline: true });
  await expect(documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'Locked', importantDeadlineId: d.id }))
      .rejects.toThrow('หมดเขตรับเอกสารแล้ว');
  });

  test('allow late but not lock accepts after grace', async () => {
    const now = Date.now();
    const eff = new Date(now - 120*60000);
  const d = await createDeadline({ deadlineAt: eff, gracePeriodMinutes: 30, lockAfterDeadline: false });
  const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'AfterGrace', importantDeadlineId: d.id });
    expect(out.isLate).toBe(true);
  });

  test('allowLate=false reject when past effective', async () => {
    const now = Date.now();
    const eff = new Date(now - 10*60000);
  const d = await createDeadline({ deadlineAt: eff, allowLate: false, gracePeriodMinutes: null });
    await expect(documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'NoLate', importantDeadlineId: d.id }))
      .rejects.toThrow('ไม่อนุญาตให้ส่งช้า');
  });
});
