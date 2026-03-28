/**
 * Drive Link Upload Tests (FEATURE-01)
 *
 * ทดสอบ uploadEvidence ใน projectSystemTestService
 * รองรับทั้ง file upload, drive link, หรือทั้งสองอย่าง
 */

// ─── Mock notificationService ────────────────────────────────────────────────
jest.mock('../services/notificationService', () => ({
  createAndNotify: jest.fn().mockResolvedValue(null),
  createAndNotifyMany: jest.fn().mockResolvedValue([]),
}));

// ─── Mock logger (suppress output) ──────────────────────────────────────────
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// ─── Mock database/sequelize ────────────────────────────────────────────────
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
}));

// ─── Mock record returned by findLatest ─────────────────────────────────────
const mockRecordUpdate = jest.fn().mockResolvedValue(true);

// ─── Mock models ────────────────────────────────────────────────────────────
jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    ProjectTestRequest: {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
    },
    ProjectDocument: {
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    ProjectMember: {
      findAll: jest.fn().mockResolvedValue([]),
    },
    Student: {
      findAll: jest.fn(),
      associations: { user: {} },
    },
    Teacher: {
      findOne: jest.fn(),
      associations: { user: {} },
    },
    User: {},
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
      fn: actualSequelize.fn,
      col: actualSequelize.col,
      literal: actualSequelize.literal,
    },
    Sequelize: actualSequelize.Sequelize,
  };
});

// ─── Mock other service dependencies ────────────────────────────────────────
jest.mock('../services/projectDocumentService', () => ({
  buildProjectMeetingMetrics: jest.fn().mockResolvedValue({ perStudent: {} }),
  getRequiredApprovedMeetingLogs: jest.fn().mockReturnValue(4),
  syncProjectWorkflowState: jest.fn(),
}));

jest.mock('../utils/lateSubmissionHelper', () => ({
  calculateSystemTestRequestLate: jest.fn().mockResolvedValue({
    submitted_late: false,
    submission_delay_minutes: 0,
    important_deadline_id: null,
  }),
}));

jest.mock('../utils/requestDeadlineChecker', () => ({
  checkSystemTestRequestDeadline: jest.fn().mockReturnValue(null),
  createDeadlineTag: jest.fn().mockReturnValue(null),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockRecordUpdate.mockClear();
});

function setupServiceMocks(service) {
  service.ensureProjectAccess = jest.fn().mockResolvedValue({
    project: {
      projectId: 10,
      advisorId: 5,
      coAdvisorId: null,
      members: [{ studentId: 1 }],
      status: 'in_progress',
    },
  });

  service.findLatest = jest.fn()
    .mockResolvedValueOnce({
      requestId: 1,
      status: 'staff_approved',
      evidenceSubmittedAt: null,
      testDueDate: '2030-12-31',
      update: mockRecordUpdate,
    })
    // second call after update — for serialize
    .mockResolvedValueOnce({
      requestId: 1,
      status: 'evidence_submitted',
      evidenceFilePath: null,
      evidenceDriveLink: null,
    });

  service.serialize = jest.fn().mockReturnValue({ requestId: 1 });
}

const studentActor = { role: 'student', studentId: 1 };

describe('uploadEvidence — drive link support', () => {
  test('D1: file only → success', async () => {
    const service = require('../services/projectSystemTestService');
    setupServiceMocks(service);

    const fileMeta = { path: '/tmp/uploads/evidence.pdf', originalname: 'evidence.pdf' };

    const result = await service.uploadEvidence(10, studentActor, fileMeta, {});

    expect(result).toBeDefined();
    expect(mockRecordUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'evidence_submitted',
        evidenceFileName: 'evidence.pdf',
      }),
      expect.any(Object)
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  test('D2: link only → success, evidenceDriveLink saved', async () => {
    const service = require('../services/projectSystemTestService');
    setupServiceMocks(service);

    const result = await service.uploadEvidence(10, studentActor, null, {
      evidenceDriveLink: 'https://drive.google.com/file/abc123',
    });

    expect(result).toBeDefined();
    expect(mockRecordUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'evidence_submitted',
        evidenceDriveLink: 'https://drive.google.com/file/abc123',
      }),
      expect.any(Object)
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  test('D3: both file + link → success, both saved', async () => {
    const service = require('../services/projectSystemTestService');
    setupServiceMocks(service);

    const fileMeta = { path: '/tmp/uploads/evidence.pdf', originalname: 'evidence.pdf' };

    const result = await service.uploadEvidence(10, studentActor, fileMeta, {
      evidenceDriveLink: 'https://drive.google.com/file/abc123',
    });

    expect(result).toBeDefined();
    expect(mockRecordUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'evidence_submitted',
        evidenceDriveLink: 'https://drive.google.com/file/abc123',
        evidenceFileName: 'evidence.pdf',
      }),
      expect.any(Object)
    );
  });

  test('D4: invalid URL → validation error', async () => {
    const service = require('../services/projectSystemTestService');
    setupServiceMocks(service);

    await expect(
      service.uploadEvidence(10, studentActor, null, { evidenceDriveLink: 'abc123' })
    ).rejects.toThrow('ลิงก์ Google Drive ต้องเริ่มต้นด้วย http:// หรือ https://');
  });

  test('D5: no file and no link → error', async () => {
    const service = require('../services/projectSystemTestService');
    setupServiceMocks(service);

    await expect(
      service.uploadEvidence(10, studentActor, null, {})
    ).rejects.toThrow('กรุณาอัปโหลดไฟล์หลักฐานการประเมิน');
  });
});
