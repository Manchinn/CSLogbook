/**
 * Academic Year Filter Tests (BUG-01)
 *
 * ทดสอบว่า getAllProjects / getDocuments ใช้ academicYear filter ถูกต้อง
 * - ถ้าไม่ส่ง academicYear → default ไปปีปัจจุบัน (สำหรับ admin/teacher)
 * - ถ้าส่ง academicYear → ใช้ค่าที่ส่งมา
 * - student ไม่ default academicYear (เห็นเอกสารตัวเองทั้งหมด)
 */

// ─── Mock getCurrentAcademicYear ────────────────────────────────────────────
const mockGetCurrentAcademicYear = jest.fn().mockResolvedValue('2568');

jest.mock('../utils/studentUtils', () => ({
  getCurrentAcademicYear: mockGetCurrentAcademicYear,
  CONSTANTS: {},
  reloadDynamicConstants: jest.fn(),
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

// ─── Mock models ────────────────────────────────────────────────────────────
const mockFindAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
const mockDocumentFindAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    ProjectDocument: {
      findAndCountAll: mockFindAndCountAll,
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findByPk: jest.fn(),
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
    Document: {
      findAndCountAll: mockDocumentFindAndCountAll,
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    ProjectTrack: {},
    ProjectDefenseRequest: {
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    ProjectWorkflowState: {
      findOne: jest.fn(),
      upsert: jest.fn(),
    },
    InternshipDocument: {},
    StudentWorkflowActivity: {},
    Notification: {},
    DocumentLog: { create: jest.fn() },
    ProjectExamResult: {},
    ProjectMember: { findAll: jest.fn() },
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
      fn: actualSequelize.fn,
      col: actualSequelize.col,
      literal: actualSequelize.literal,
    },
    Sequelize: actualSequelize.Sequelize,
    Op: actualSequelize.Op,
  };
});

// ─── Mock other service dependencies ────────────────────────────────────────
jest.mock('../services/workflowService', () => ({}));
jest.mock('../services/notificationService', () => ({
  createAndNotify: jest.fn(),
  createAndNotifyMany: jest.fn(),
}));
jest.mock('../services/projectDocumentService', () => ({
  buildProjectMeetingMetrics: jest.fn(),
  getRequiredApprovedMeetingLogs: jest.fn(),
  syncProjectWorkflowState: jest.fn(),
}));
jest.mock('../services/deadlineAutoAssignService', () => ({
  autoAssignDeadlines: jest.fn(),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProjectManagementService — academicYear filter', () => {
  test('Y4: getAllProjects without academicYear defaults to current year', async () => {
    const service = require('../services/projectManagementService');

    await service.getAllProjects({});

    // Should call getCurrentAcademicYear
    expect(mockGetCurrentAcademicYear).toHaveBeenCalled();

    // Should query with the default year
    expect(mockFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          academicYear: '2568',
        }),
      })
    );
  });

  test('Y4b: getAllProjects with explicit academicYear uses provided value', async () => {
    const service = require('../services/projectManagementService');

    await service.getAllProjects({ academicYear: '2567' });

    // Should NOT call getCurrentAcademicYear
    expect(mockGetCurrentAcademicYear).not.toHaveBeenCalled();

    // Should query with the explicit year
    expect(mockFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          academicYear: '2567',
        }),
      })
    );
  });
});

describe('DocumentService — academicYear filter', () => {
  test('Y4c: getDocuments without academicYear for admin defaults to current year', async () => {
    const service = require('../services/documentService');

    await service.getDocuments({}, {}, 1, 'admin');

    // Admin without academicYear → should call getCurrentAcademicYear
    expect(mockGetCurrentAcademicYear).toHaveBeenCalled();
  });

  test('Y4d: getDocuments for student without academicYear does NOT default', async () => {
    const service = require('../services/documentService');

    await service.getDocuments({}, {}, 100, 'student');

    // Student → should NOT call getCurrentAcademicYear
    expect(mockGetCurrentAcademicYear).not.toHaveBeenCalled();
  });
});
