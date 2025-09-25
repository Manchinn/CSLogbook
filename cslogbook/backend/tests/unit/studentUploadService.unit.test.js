const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../models', () => ({
  User: { findOrCreate: jest.fn() },
  Student: { findOrCreate: jest.fn() },
  UploadHistory: { create: jest.fn() }
}));

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password'))
}));

const { User, Student, UploadHistory } = require('../../models');
const { sequelize } = require('../../config/database');
const bcrypt = require('bcrypt');
const { processStudentCsvUpload } = require('../../services/studentUploadService');

const createTempCsv = (content) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'student-upload-'));
  const filePath = path.join(tempDir, 'students.csv');
  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath, tempDir };
};

describe('processStudentCsvUpload', () => {
  let commitMock;
  let rollbackMock;

  beforeEach(() => {
    jest.clearAllMocks();
    commitMock = jest.fn();
    rollbackMock = jest.fn();
    sequelize.transaction.mockImplementation(() =>
      Promise.resolve({ commit: commitMock, rollback: rollbackMock })
    );
  });

  const cleanup = ({ filePath, tempDir }) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('[TEST_LOG] cleanup error', err);
    }
  };

  it('ควรเพิ่มนักศึกษาใหม่และสรุปผลได้ถูกต้อง', async () => {
    const csv = 'Student ID,Name,Surname\n6404062630295,สมชาย,ใจดี\n';
    const temp = createTempCsv(csv);

    const userInstance = { userId: 101, update: jest.fn() };
    const studentInstance = { userId: 101, update: jest.fn() };

    User.findOrCreate.mockResolvedValue([userInstance, true]);
    Student.findOrCreate.mockResolvedValue([studentInstance, true]);
    UploadHistory.create.mockResolvedValue();

    try {
      const result = await processStudentCsvUpload({
        filePath: temp.filePath,
        originalName: 'students.csv',
        uploader: { userId: 999 }
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('6404062630295', 10);
      expect(User.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: 's6404062630295' }
        })
      );
      expect(Student.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 101 }
        })
      );
      expect(UploadHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 999,
          fileName: 'students.csv',
          uploadType: 'students'
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(result.summary).toEqual({ total: 1, added: 1, updated: 0, invalid: 0, errors: 0 });
      expect(result.results[0].status).toBe('Added');
      expect(commitMock).toHaveBeenCalledTimes(1);
      expect(rollbackMock).not.toHaveBeenCalled();
    } finally {
      cleanup(temp);
    }
  });

  it('ควรข้ามแถวที่ไม่ถูกต้องและรายงานสถานะ Invalid', async () => {
    const csv = 'Student ID,Name,Surname\n123,สมชาย,ใจดี\n';
    const temp = createTempCsv(csv);

    try {
      const result = await processStudentCsvUpload({
        filePath: temp.filePath,
        originalName: 'invalid.csv',
        uploader: { userId: 1 }
      });

      expect(User.findOrCreate).not.toHaveBeenCalled();
      expect(Student.findOrCreate).not.toHaveBeenCalled();
      expect(UploadHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 1,
          fileName: 'invalid.csv',
          totalRecords: 1,
          successfulUpdates: 0,
          failedUpdates: 1
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(result.summary).toEqual({ total: 1, added: 0, updated: 0, invalid: 1, errors: 0 });
      expect(result.results[0].status).toBe('Invalid');
      expect(commitMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanup(temp);
    }
  });

  it('ควรรายงานสถานะ Error เมื่อเกิดข้อผิดพลาดระหว่างประมวลผล', async () => {
    const csv = 'Student ID,Name,Surname\n6404062630295,สมชาย,ใจดี\n';
    const temp = createTempCsv(csv);

    User.findOrCreate.mockRejectedValueOnce(new Error('DB error'));

    try {
      const result = await processStudentCsvUpload({
        filePath: temp.filePath,
        originalName: 'students.csv',
        uploader: { userId: 500 }
      });

      expect(result.summary).toEqual({ total: 1, added: 0, updated: 0, invalid: 0, errors: 1 });
      expect(result.results[0]).toMatchObject({ status: 'Error', error: 'DB error' });
      expect(UploadHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 500,
          fileName: 'students.csv',
          totalRecords: 1,
          successfulUpdates: 0,
          failedUpdates: 1
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(commitMock).toHaveBeenCalledTimes(1);
      expect(rollbackMock).not.toHaveBeenCalled();
    } finally {
      cleanup(temp);
    }
  });
});
