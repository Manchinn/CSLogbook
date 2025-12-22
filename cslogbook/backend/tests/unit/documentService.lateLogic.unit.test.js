const { Sequelize } = require('sequelize');

// NOTE: ใช้กลยุทธ์ mock models in-memory (ตั้ง global ก่อน mock)
let sequelize, documentService;

beforeAll(async () => {
  jest.resetModules();
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
  const importantDeadlineFactory = require('../../models/ImportantDeadline');
  const documentFactory = require('../../models/Document');
  const ImportantDeadline = importantDeadlineFactory(sequelize);
  const Document = documentFactory(sequelize);
  global.__TEST_MODELS = {
    ImportantDeadline,
    Document,
    User: { update: jest.fn() },
    Student: {},
    InternshipDocument: {},
    StudentWorkflowActivity: {},
    Notification: {},
    DocumentLog: {},
  };
  // mock models module AFTER global models prepared
  jest.doMock('../../models', () => global.__TEST_MODELS);
  await sequelize.sync({ force: true });
  // ลบ cache documentService เพื่อให้ดึง models mock ชุดนี้
  const docServicePath = require.resolve('../../services/documentService');
  delete require.cache[docServicePath];
  documentService = require('../../services/documentService');
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

  test('locked after grace returns late flag', async () => {
    const now = Date.now();
    const eff = new Date(now - 120 * 60000); // 2 ชม. ที่แล้ว
    const d = await createDeadline({ deadlineAt: eff, gracePeriodMinutes: 30, lockAfterDeadline: true });
    const out = await documentService.uploadDocument(1, fakeFile(), {
      documentType: 'INTERNSHIP',
      category: 'proposal',
      documentName: 'Locked',
      importantDeadlineId: d.id,
    });
    expect(out.isLate).toBe(true);
    expect(out.message).toMatch(/อัปโหลดไฟล์สำเร็จ/);
  });

  test('allow late but not lock accepts after grace', async () => {
    const now = Date.now();
    const eff = new Date(now - 120*60000);
  const d = await createDeadline({ deadlineAt: eff, gracePeriodMinutes: 30, lockAfterDeadline: false });
  const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'AfterGrace', importantDeadlineId: d.id });
    expect(out.isLate).toBe(true);
  });

  test('allowLate=false still records late submission with warning', async () => {
    const now = Date.now();
    const eff = new Date(now - 10 * 60000);
    const d = await createDeadline({ deadlineAt: eff, allowLate: false, gracePeriodMinutes: null });
    const out = await documentService.uploadDocument(1, fakeFile(), {
      documentType: 'INTERNSHIP',
      category: 'proposal',
      documentName: 'NoLate',
      importantDeadlineId: d.id,
    });
    expect(out.isLate).toBe(true);
  });

  // --- Window based effectiveDeadlineAt cases ---
  test('window: submit inside window not late', async () => {
    const start = new Date(Date.now() - 30*60000); // เริ่ม 30 นาทีที่แล้ว
    const end = new Date(Date.now() + 30*60000);   // จบอีก 30 นาที
    const d = await createDeadline({ windowStartAt: start, windowEndAt: end, deadlineAt: end, date: new Date(end.getTime()+7*60*60*1000).toISOString().slice(0,10) });
    const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'WinOnTime', importantDeadlineId: d.id });
    expect(out.isLate).toBe(false);
  });
  test('window: submit after window but within grace -> late', async () => {
    const now = Date.now();
    const end = new Date(now - 5*60000); // window จบ 5 นาทีที่แล้ว
    const start = new Date(end.getTime() - 60*60000);
    const d = await createDeadline({ windowStartAt: start, windowEndAt: end, deadlineAt: end, gracePeriodMinutes: 30, date: new Date(end.getTime()+7*60*60*1000).toISOString().slice(0,10) });
    const out = await documentService.uploadDocument(1, fakeFile(), { documentType: 'INTERNSHIP', category: 'proposal', documentName: 'WinLate', importantDeadlineId: d.id });
    expect(out.isLate).toBe(true);
  });
  test('window: after grace & lock now returns late result object', async () => {
    const now = Date.now();
    const end = new Date(now - 120 * 60000); // 2 ชั่วโมงก่อน
    const start = new Date(end.getTime() - 60 * 60000);
    const d = await createDeadline({
      windowStartAt: start,
      windowEndAt: end,
      deadlineAt: end,
      gracePeriodMinutes: 30,
      lockAfterDeadline: true,
      date: new Date(end.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    const out = await documentService.uploadDocument(1, fakeFile(), {
      documentType: 'INTERNSHIP',
      category: 'proposal',
      documentName: 'WinLocked',
      importantDeadlineId: d.id,
    });
    expect(out.isLate).toBe(true);
  });
});
