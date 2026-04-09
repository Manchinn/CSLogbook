/**
 * Rejection Notification Tests
 *
 * ทดสอบว่า rejection handlers ส่ง notification จริง
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
};

jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
}));

// ─── Mock models ────────────────────────────────────────────────────────────
const mockProjectMemberFindAll = jest.fn().mockResolvedValue([
  {
    student: {
      user: { userId: 101 },
    },
  },
  {
    student: {
      user: { userId: 102 },
    },
  },
]);

jest.mock('../utils/auditLog', () => ({
  logAction: jest.fn(),
}));

jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    ProjectTestRequest: {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
    },
    ProjectDefenseRequest: {
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    ProjectDefenseRequestAdvisorApproval: {
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    ProjectDocument: {
      findByPk: jest.fn().mockResolvedValue({
        projectId: 10,
        advisorId: 5,
        get: function() { return this; },
      }),
      findAll: jest.fn(),
    },
    SystemLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    ProjectMember: {
      findAll: mockProjectMemberFindAll,
    },
    ProjectExamResult: {
      create: jest.fn(),
      findOne: jest.fn(),
    },
    ProjectWorkflowState: {
      findOne: jest.fn(),
      upsert: jest.fn(),
    },
    Student: {
      findAll: jest.fn(),
      associations: { user: {} },
    },
    Teacher: {
      findOne: jest.fn().mockResolvedValue({ teacherId: 5, userId: 5 }),
      associations: { user: {} },
    },
    User: {},
    Meeting: {
      findByPk: jest.fn().mockResolvedValue({
        meetingId: 20,
        projectId: 10,
        get: function() { return this; },
      }),
    },
    MeetingLog: {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    },
    MeetingParticipant: {},
    MeetingAttachment: {},
    MeetingActionItem: {},
    Academic: { findOne: jest.fn() },
    Document: {},
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
});

describe('System Test Request — rejection notification', () => {
  test('advisor rejection sends notification to project members', async () => {
    // Import after mocks are set up
    const service = require('../services/projectSystemTestService');

    // Mock ensureProjectAccess + findLatest
    service.ensureProjectAccess = jest.fn().mockResolvedValue({
      project: {
        projectId: 10,
        advisorId: 5,
        coAdvisorId: null,
        members: [],
        status: 'in_progress',
      },
    });
    service.findLatest = jest.fn().mockResolvedValue({
      requestId: 1,
      status: 'pending_advisor',
      advisorTeacherId: null,
      coAdvisorTeacherId: null,
      advisorDecidedAt: null,
      coAdvisorDecidedAt: null,
      update: jest.fn(),
    });
    service.serialize = jest.fn().mockReturnValue({ requestId: 1 });

    await service.submitAdvisorDecision(10, { role: 'teacher', teacherId: 5 }, { decision: 'reject', note: 'ข้อมูลไม่ครบ' });

    // Should query project members
    expect(mockProjectMemberFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: 10 } })
    );

    // Should send notification to members
    expect(mockCreateAndNotifyMany).toHaveBeenCalledWith(
      [101, 102],
      expect.objectContaining({
        type: 'APPROVAL',
        title: expect.stringContaining('ทดสอบระบบ'),
        metadata: expect.objectContaining({
          action: 'rejected',
          rejectedBy: 'advisor',
        }),
      })
    );
  });

  test('approval does NOT send rejection notification', async () => {
    const service = require('../services/projectSystemTestService');

    service.ensureProjectAccess = jest.fn().mockResolvedValue({
      project: { projectId: 10, advisorId: 5, coAdvisorId: null, members: [], status: 'in_progress' },
    });
    service.findLatest = jest.fn().mockResolvedValue({
      requestId: 1,
      status: 'pending_advisor',
      advisorTeacherId: null,
      coAdvisorTeacherId: null,
      advisorDecidedAt: null,
      coAdvisorDecidedAt: null,
      update: jest.fn(),
    });
    service.serialize = jest.fn().mockReturnValue({ requestId: 1 });

    await service.submitAdvisorDecision(10, { role: 'teacher', teacherId: 5 }, { decision: 'approve' });

    expect(mockCreateAndNotifyMany).not.toHaveBeenCalled();
  });

  test('notification failure does NOT break rejection flow', async () => {
    const service = require('../services/projectSystemTestService');

    mockCreateAndNotifyMany.mockRejectedValueOnce(new Error('notification failed'));

    service.ensureProjectAccess = jest.fn().mockResolvedValue({
      project: { projectId: 10, advisorId: 5, coAdvisorId: null, members: [], status: 'in_progress' },
    });
    service.findLatest = jest.fn().mockResolvedValue({
      requestId: 1,
      status: 'pending_advisor',
      advisorTeacherId: null,
      coAdvisorTeacherId: null,
      advisorDecidedAt: null,
      coAdvisorDecidedAt: null,
      update: jest.fn(),
    });
    service.serialize = jest.fn().mockReturnValue({ requestId: 1 });

    // Should NOT throw even when notification fails
    await expect(
      service.submitAdvisorDecision(10, { role: 'teacher', teacherId: 5 }, { decision: 'reject', note: 'test' })
    ).resolves.toBeDefined();
  });
});

describe('Meeting Log — rejection notification', () => {
  test('rejection sends notification to log recorder', async () => {
    const { MeetingLog } = require('../models');

    const mockLog = {
      logId: 50,
      recordedBy: 101,
      meetingId: 20,
      approvalStatus: 'rejected',
      get: jest.fn().mockReturnValue({
        logId: 50,
        recordedBy: 101,
        meetingId: 20,
        approvalStatus: 'rejected',
      }),
    };
    MeetingLog.findOne.mockResolvedValue(mockLog);
    MeetingLog.update.mockResolvedValue([1]);
    MeetingLog.findByPk.mockResolvedValue({
      logId: 50,
      recordedBy: 101,
      meetingId: 20,
      approvalStatus: 'rejected',
      get: jest.fn().mockReturnValue({
        logId: 50,
        recordedBy: 101,
        meetingId: 20,
        approvalStatus: 'rejected',
      }),
    });

    const meetingService = require('../services/meetingService');

    // Mock internal methods
    meetingService.findMeetingByIdForProject = jest.fn().mockResolvedValue({
      meetingId: 20,
      projectId: 10,
    });
    meetingService.serializeLog = jest.fn().mockReturnValue({ logId: 50 });

    await meetingService.updateLogApproval(10, 20, 50, { userId: 5, role: 'teacher' }, {
      decision: 'rejected',
      approvalNote: 'บันทึกไม่ตรง',
    });

    expect(mockCreateAndNotify).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        type: 'MEETING',
        title: expect.stringContaining('บันทึกการพบอาจารย์'),
        metadata: expect.objectContaining({
          action: 'rejected',
          logId: 50,
        }),
      })
    );
  });

  test('approval does NOT send rejection notification', async () => {
    const { MeetingLog } = require('../models');

    const mockLog = {
      logId: 50,
      recordedBy: 101,
      meetingId: 20,
      approvalStatus: 'approved',
      get: jest.fn().mockReturnValue({
        logId: 50,
        recordedBy: 101,
        meetingId: 20,
        approvalStatus: 'approved',
      }),
    };
    MeetingLog.findOne.mockResolvedValue(mockLog);
    MeetingLog.update.mockResolvedValue([1]);
    MeetingLog.findByPk.mockResolvedValue({
      logId: 50,
      recordedBy: 101,
      meetingId: 20,
      approvalStatus: 'approved',
      get: jest.fn().mockReturnValue({
        logId: 50,
        recordedBy: 101,
        meetingId: 20,
        approvalStatus: 'approved',
      }),
    });

    const meetingService = require('../services/meetingService');
    meetingService.findMeetingByIdForProject = jest.fn().mockResolvedValue({ meetingId: 20, projectId: 10 });
    meetingService.serializeLog = jest.fn().mockReturnValue({ logId: 50 });

    await meetingService.updateLogApproval(10, 20, 50, { userId: 5, role: 'teacher' }, {
      decision: 'approved',
    });

    expect(mockCreateAndNotify).not.toHaveBeenCalled();
  });
});

describe('Exam Result — notification', () => {
  test('FAIL result sends notification to project members', async () => {
    const service = require('../services/projectExamResultService');

    const mockProject = {
      projectId: 10,
      projectNameTh: 'โครงงานทดสอบ',
      members: [
        { student: { user: { userId: 101, email: 'a@test.com' } } },
        { student: { user: { userId: 102, email: 'b@test.com' } } },
      ],
      advisor: { user: { email: 'adv@test.com' } },
      coAdvisor: null,
    };

    await service._sendExamResultNotifications(mockProject, {
      examType: 'PROJECT1',
      result: 'FAIL',
      notes: 'ต้องปรับปรุง scope',
    });

    expect(mockCreateAndNotifyMany).toHaveBeenCalledWith(
      [101, 102],
      expect.objectContaining({
        type: 'EVALUATION',
        title: expect.stringContaining('ไม่ผ่าน'),
        metadata: expect.objectContaining({
          result: 'FAIL',
          action: 'exam_failed',
        }),
      })
    );
  });

  test('PASS result sends notification with exam_passed action', async () => {
    const service = require('../services/projectExamResultService');

    const mockProject = {
      projectId: 10,
      projectNameTh: 'โครงงานทดสอบ',
      members: [{ student: { user: { userId: 101, email: 'a@test.com' } } }],
      advisor: null,
      coAdvisor: null,
    };

    await service._sendExamResultNotifications(mockProject, {
      examType: 'THESIS',
      result: 'PASS',
      notes: null,
    });

    expect(mockCreateAndNotifyMany).toHaveBeenCalledWith(
      [101],
      expect.objectContaining({
        type: 'EVALUATION',
        title: expect.stringContaining('ผ่าน'),
        metadata: expect.objectContaining({
          result: 'PASS',
          action: 'exam_passed',
        }),
      })
    );
  });
});
