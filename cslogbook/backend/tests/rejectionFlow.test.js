/**
 * Rejection Flow Tests (R1-R8)
 *
 * ทดสอบ rejection flow ทั้ง service layer และ controller validation
 * ใช้ jest.mock เพื่อ mock dependencies ทั้งหมด — ไม่ต้องการ DB
 */

// ─── Mock notificationService ────────────────────────────────────────────────
const mockCreateAndNotify = jest.fn().mockResolvedValue(null);
const mockCreateAndNotifyMany = jest.fn().mockResolvedValue([]);

jest.mock('../services/notificationService', () => ({
  createAndNotify: mockCreateAndNotify,
  createAndNotifyMany: mockCreateAndNotifyMany,
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
  finished: undefined,
};

jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
}));

// ─── Mock models ────────────────────────────────────────────────────────────
const mockDocumentFindByPk = jest.fn();
const mockDocumentFindOne = jest.fn();
const mockDocumentCreate = jest.fn();
const mockDocumentLogCreate = jest.fn().mockResolvedValue({});
const mockCertRequestFindByPk = jest.fn();
const mockNotificationCreate = jest.fn().mockResolvedValue({});

jest.mock('../utils/auditLog', () => ({
  logAction: jest.fn(),
}));

jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    User: {},
    Student: {
      findOne: jest.fn().mockResolvedValue({ currentAcademicYear: 2568, currentSemester: 1 }),
    },
    Document: {
      findByPk: mockDocumentFindByPk,
      findOne: mockDocumentFindOne,
      create: mockDocumentCreate,
    },
    DocumentLog: {
      create: mockDocumentLogCreate,
    },
    InternshipDocument: {},
    StudentWorkflowActivity: {},
    SystemLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    Notification: {
      create: mockNotificationCreate,
    },
    InternshipCertificateRequest: {
      findByPk: mockCertRequestFindByPk,
    },
    ProjectDocument: {},
    ProjectExamResult: {},
    ProjectMember: {
      findAll: jest.fn().mockResolvedValue([]),
    },
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
jest.mock('../config/uploadConfig', () => ({
  UPLOAD_CONFIG: {
    DOCUMENT_TYPES: {
      INTERNSHIP: { maxSize: 10 * 1024 * 1024 },
      PROJECT: { maxSize: 10 * 1024 * 1024 },
    },
  },
}));

jest.mock('../services/projectDocumentService', () => ({
  buildProjectMeetingMetrics: jest.fn().mockResolvedValue({ perStudent: {} }),
  getRequiredApprovedMeetingLogs: jest.fn().mockReturnValue(4),
  syncProjectWorkflowState: jest.fn(),
}));

jest.mock('../services/deadlineAutoAssignService', () => ({
  findMatchingDeadline: jest.fn().mockResolvedValue(null),
}));

jest.mock('../utils/studentUtils', () => ({
  getCurrentAcademicYear: jest.fn().mockReturnValue(2568),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockTransaction.finished = undefined;
  mockTransaction.commit.mockResolvedValue(undefined);
  mockTransaction.rollback.mockResolvedValue(undefined);
});

// ─── R1: Reject document with reason ────────────────────────────────────────
describe('R1: rejectDocument — ปฏิเสธเอกสารพร้อมเหตุผล', () => {
  test('should update status to rejected, send notification, return notificationSent: true', async () => {
    const documentService = require('../services/documentService');

    const mockDoc = {
      documentId: 1,
      userId: 101,
      status: 'pending',
      fileName: 'test.pdf',
      documentType: 'PROJECT',
      update: jest.fn().mockResolvedValue(true),
      get: function () { return this; },
    };
    mockDocumentFindByPk.mockResolvedValue(mockDoc);

    const result = await documentService.rejectDocument(1, 5, 'เอกสารไม่ครบถ้วน');

    // Document updated to rejected
    expect(mockDoc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'rejected',
        reviewComment: 'เอกสารไม่ครบถ้วน',
        reviewerId: 5,
      }),
      expect.objectContaining({ transaction: mockTransaction })
    );

    // DocumentLog created
    expect(mockDocumentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 1,
        actionType: 'reject',
        previousStatus: 'pending',
        newStatus: 'rejected',
        comment: 'เอกสารไม่ครบถ้วน',
      }),
      expect.objectContaining({ transaction: mockTransaction })
    );

    // Transaction committed
    expect(mockTransaction.commit).toHaveBeenCalled();

    // Notification sent
    expect(mockCreateAndNotify).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        type: 'DOCUMENT',
        metadata: expect.objectContaining({ action: 'rejected' }),
      })
    );

    expect(result.notificationSent).toBe(true);
    expect(result.message).toBe('ปฏิเสธเอกสารเรียบร้อยแล้ว');
  });

  test('should throw 404 when document not found', async () => {
    const documentService = require('../services/documentService');
    mockDocumentFindByPk.mockResolvedValue(null);

    await expect(
      documentService.rejectDocument(999, 5, 'เหตุผลปฏิเสธ')
    ).rejects.toThrow('ไม่พบเอกสาร');
  });
});

// ─── R2: Reject without reason (controller validation) ──────────────────────
describe('R2: statusController.rejectDocument — ปฏิเสธโดยไม่มีเหตุผล', () => {
  test('should return 400 when reason is empty', async () => {
    const statusController = require('../controllers/documents/statusController');

    const req = {
      params: { id: '1' },
      body: { reason: '' },
      user: { userId: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await statusController.rejectDocument(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'กรุณาระบุเหตุผลการปฏิเสธ',
      })
    );
  });

  test('should return 400 when reason is undefined', async () => {
    const statusController = require('../controllers/documents/statusController');

    const req = {
      params: { id: '1' },
      body: {},
      user: { userId: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await statusController.rejectDocument(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'กรุณาระบุเหตุผลการปฏิเสธ',
      })
    );
  });
});

// ─── R3: Reason too short (controller validation) ───────────────────────────
describe('R3: statusController.rejectDocument — เหตุผลสั้นเกินไป', () => {
  test('should return 400 when reason is 3 characters', async () => {
    const statusController = require('../controllers/documents/statusController');

    const req = {
      params: { id: '1' },
      body: { reason: 'abc' },
      user: { userId: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await statusController.rejectDocument(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'เหตุผลการปฏิเสธต้องมีความยาว 5-1000 ตัวอักษร',
      })
    );
  });

  test('should accept reason with exactly 5 characters', async () => {
    const statusController = require('../controllers/documents/statusController');
    const documentService = require('../services/documentService');

    // Mock the service call to succeed
    jest.spyOn(documentService, 'rejectDocument').mockResolvedValue({
      message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว',
      reviewComment: 'abcde',
      notificationSent: true,
    });

    const req = {
      params: { id: '1' },
      body: { reason: 'abcde' },
      user: { userId: 5 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await statusController.rejectDocument(req, res, next);

    // Should NOT return 400 — should call service
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );

    documentService.rejectDocument.mockRestore();
  });
});

// ─── R4: Double rejection (idempotency) ─────────────────────────────────────
describe('R4: rejectDocument — double rejection (idempotency)', () => {
  test('should throw error when document already rejected', async () => {
    const documentService = require('../services/documentService');

    const mockDoc = {
      documentId: 1,
      userId: 101,
      status: 'rejected',
      fileName: 'test.pdf',
      update: jest.fn(),
      get: function () { return this; },
    };
    mockDocumentFindByPk.mockResolvedValue(mockDoc);

    await expect(
      documentService.rejectDocument(1, 5, 'ปฏิเสธซ้ำ')
    ).rejects.toThrow('เอกสารนี้ถูกปฏิเสธแล้ว');

    // Should NOT update document
    expect(mockDoc.update).not.toHaveBeenCalled();

    // Transaction should be rolled back
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});

// ─── R5: Double certificate rejection ───────────────────────────────────────
describe('R5: rejectCertificateRequest — double rejection', () => {
  test('should throw error when certificate request already rejected', async () => {
    const documentService = require('../services/documentService');

    const mockRequest = {
      id: 10,
      status: 'rejected',
      requestedBy: 101,
      update: jest.fn(),
    };
    mockCertRequestFindByPk.mockResolvedValue(mockRequest);

    await expect(
      documentService.rejectCertificateRequest(10, 5, 'ปฏิเสธซ้ำ')
    ).rejects.toThrow('คำขอนี้ถูกปฏิเสธแล้ว');

    // Should NOT update
    expect(mockRequest.update).not.toHaveBeenCalled();
  });
});

// ─── R6: Resubmit after rejection ───────────────────────────────────────────
describe('R6: uploadDocument — resubmit after rejection', () => {
  test('should update existing rejected document instead of creating new one', async () => {
    const documentService = require('../services/documentService');

    const mockRejectedDoc = {
      documentId: 1,
      userId: 101,
      documentType: 'INTERNSHIP',
      category: 'general',
      documentName: 'report.pdf',
      status: 'rejected',
      update: jest.fn().mockResolvedValue(true),
    };

    // findOne finds the rejected document
    mockDocumentFindOne.mockResolvedValue(mockRejectedDoc);

    const fileData = {
      path: 'uploads/new-report.pdf',
      filename: 'new-report.pdf',
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      size: 12345,
    };

    const documentData = {
      documentType: 'INTERNSHIP',
      category: 'general',
      documentName: 'report.pdf',
    };

    const result = await documentService.uploadDocument(101, fileData, documentData);

    // Should update existing doc, NOT create new
    expect(mockRejectedDoc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: 'uploads/new-report.pdf',
        status: 'pending',
      })
    );
    expect(mockDocumentCreate).not.toHaveBeenCalled();

    // DocumentLog created for resubmission audit trail
    expect(mockDocumentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 1,
        actionType: 'update',
        previousStatus: 'rejected',
        newStatus: 'pending',
      })
    );

    expect(result.message).toBe('ส่งเอกสารใหม่สำเร็จ');
  });

  test('should create new document when no rejected document exists', async () => {
    const documentService = require('../services/documentService');

    // No rejected document found
    mockDocumentFindOne.mockResolvedValue(null);
    mockDocumentCreate.mockResolvedValue({
      documentId: 2,
      id: 2,
    });

    const fileData = {
      path: 'uploads/first-report.pdf',
      filename: 'first-report.pdf',
      originalname: 'first-report.pdf',
      mimetype: 'application/pdf',
      size: 12345,
    };

    const documentData = {
      documentType: 'PROJECT',
      category: 'general',
    };

    const result = await documentService.uploadDocument(101, fileData, documentData);

    expect(mockDocumentCreate).toHaveBeenCalled();
    expect(result.message).toBe('อัปโหลดไฟล์สำเร็จ');
  });
});

// ─── R8: NotificationSent flag ──────────────────────────────────────────────
describe('R8: rejectDocument — notificationSent flag', () => {
  test('should return notificationSent: true when notification succeeds', async () => {
    const documentService = require('../services/documentService');

    const mockDoc = {
      documentId: 1,
      userId: 101,
      status: 'pending',
      fileName: 'test.pdf',
      documentType: 'PROJECT',
      update: jest.fn().mockResolvedValue(true),
      get: function () { return this; },
    };
    mockDocumentFindByPk.mockResolvedValue(mockDoc);
    mockCreateAndNotify.mockResolvedValue(null);

    const result = await documentService.rejectDocument(1, 5, 'ข้อมูลไม่ครบ');

    expect(result.notificationSent).toBe(true);
  });

  test('should return notificationSent: false when notification fails', async () => {
    const documentService = require('../services/documentService');

    const mockDoc = {
      documentId: 1,
      userId: 101,
      status: 'pending',
      fileName: 'test.pdf',
      documentType: 'PROJECT',
      update: jest.fn().mockResolvedValue(true),
      get: function () { return this; },
    };
    mockDocumentFindByPk.mockResolvedValue(mockDoc);
    mockCreateAndNotify.mockRejectedValueOnce(new Error('Socket.io down'));

    const result = await documentService.rejectDocument(1, 5, 'ข้อมูลไม่ครบ');

    // Should NOT throw — rejection itself succeeded
    expect(result.notificationSent).toBe(false);
    expect(result.message).toBe('ปฏิเสธเอกสารเรียบร้อยแล้ว');

    // Transaction should have committed (rejection succeeded)
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});
