const { Sequelize } = require('sequelize');

// จะใช้ in-memory sqlite + mock models module ให้ service ใช้ instance นี้

describe('importantDeadlineService.create / updatePolicy / getStats', () => {
  let sequelize, models, service;

  beforeAll(async () => {
    jest.resetModules();
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    const ImportantDeadlineFactory = require('../../models/ImportantDeadline');
    const DocumentFactory = require('../../models/Document');
    const ImportantDeadline = ImportantDeadlineFactory(sequelize);
    const Document = DocumentFactory(sequelize); // ใช้ Sequelize model จริงเพื่อให้ count ทำงาน
    models = { ImportantDeadline, Document };
    jest.doMock('../../models', () => models);
    service = require('../../services/importantDeadlineService');
    await sequelize.sync({ force: true });
  });

  afterAll(async () => { await sequelize.close(); });

  test('create validation: missing name', async () => {
    await expect(service.create({ date: '2025-09-01', relatedTo: 'internship', academicYear: '2025', semester: 1 }))
      .rejects.toThrow('ต้องระบุชื่อกำหนดการ');
  });

  test('create validation: invalid relatedTo', async () => {
    await expect(service.create({ name:'X', date:'2025-09-01', relatedTo:'xxx', academicYear:'2025', semester:1 }))
      .rejects.toThrow('ค่า relatedTo ไม่ถูกต้อง');
  });

  test('create success (submission, window fallback)', async () => {
    const d = await service.create({
      name: 'ส่งใบสมัคร',
      relatedTo: 'internship',
      academicYear: '2025',
      semester: 1,
      deadlineDate: '2025-09-10',
      deadlineTime: '12:30',
      deadlineType: 'SUBMISSION',
      allowLate: true,
      gracePeriodMinutes: 30
    });
    expect(d.id).toBeTruthy();
    expect(d.acceptingSubmissions).toBe(true);
    expect(d.allowLate).toBe(true);
  });

  test('create announcement auto force policy off', async () => {
    const a = await service.create({
      name: 'ประกาศผล',
      relatedTo: 'internship',
      academicYear: '2025',
      semester: 1,
      deadlineDate: '2025-09-15',
      deadlineType: 'ANNOUNCEMENT',
      allowLate: true,
      lockAfterDeadline: true
    });
    expect(a.deadlineType).toBe('ANNOUNCEMENT');
    expect(a.acceptingSubmissions).toBe(false);
    expect(a.allowLate).toBe(false);
    expect(a.lockAfterDeadline).toBe(false);
  });

  test('updatePolicy whitelist only', async () => {
    const d = await service.create({
      name: 'ไฟนอลรีพอร์ต', relatedTo:'internship', academicYear:'2025', semester:1, deadlineDate:'2025-10-01', deadlineType:'SUBMISSION'
    });
    const updated = await service.updatePolicy(d.id, { acceptingSubmissions:false, allowLate:false, gracePeriodMinutes:10, unrelatedField:true });
    expect(updated.acceptingSubmissions).toBe(false);
    expect(updated.allowLate).toBe(false);
    expect(updated.gracePeriodMinutes).toBe(10);
    expect(updated.unrelatedField).toBeUndefined();
  });

  test('getStats counts total & late', async () => {
  const d = await service.create({ name:'สเต็ปส่งเอกสาร', relatedTo:'internship', academicYear:'2025', semester:1, deadlineDate:'2025-11-01', deadlineType:'SUBMISSION' });
  // mock Document.count (เรียก 2 ครั้ง)
  const spy = jest.spyOn(models.Document, 'count');
  spy.mockResolvedValueOnce(2); // total
  spy.mockResolvedValueOnce(1); // late
  const stats = await service.getStats(d.id);
  expect(spy).toHaveBeenCalledTimes(2);
    expect(stats.total).toBe(2);
  expect(stats.late).toBe(1);
  expect(stats.onTime).toBe(1);
  spy.mockRestore();
  });
});
