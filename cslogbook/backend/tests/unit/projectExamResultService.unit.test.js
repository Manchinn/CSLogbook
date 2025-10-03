/**
 * Unit tests สำหรับ projectExamResultService
 */

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

const mockSyncProjectWorkflowState = jest.fn();
const mockUnlockNextPhase = jest.fn();

let projectExamResultService;
let modelMocks;
let transactions;

function createModelMocks() {
  transactions = [];

  const sequelize = {
    transaction: jest.fn().mockImplementation(async () => {
      const tx = {
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: { UPDATE: 'UPDATE' }
      };
      transactions.push(tx);
      return tx;
    })
  };

  return {
    ProjectExamResult: {
      hasExamResult: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      getExamResult: jest.fn()
    },
    ProjectDocument: {
      findByPk: jest.fn(),
      findAll: jest.fn()
    },
    ProjectMember: {
      findOne: jest.fn()
    },
    ProjectDefenseRequest: {},
    Student: {
      findAll: jest.fn().mockResolvedValue([])
    },
    User: {},
    Teacher: {},
    Academic: {
      findOne: jest.fn()
    },
    sequelize
  };
}

function loadService() {
  jest.isolateModules(() => {
    jest.doMock('../../utils/logger', () => mockLogger);
    jest.doMock('../../services/projectDocumentService', () => ({
      syncProjectWorkflowState: mockSyncProjectWorkflowState
    }));
    jest.doMock('../../services/projectWorkflowService', () => ({
      unlockNextPhase: mockUnlockNextPhase
    }));
    jest.doMock('../../models', () => modelMocks);
    projectExamResultService = require('../../services/projectExamResultService');
  });
  projectExamResultService._sendExamResultNotifications = jest.fn().mockResolvedValue();
}

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
  jest.unmock('../../models');
  jest.unmock('../../services/projectDocumentService');
  jest.unmock('../../services/projectWorkflowService');
  jest.unmock('../../utils/logger');
});

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  modelMocks = createModelMocks();
  loadService();
  jest.setSystemTime(new Date('2025-12-15T00:00:00Z'));
});

afterEach(() => {
  jest.resetModules();
});

describe('recordExamResult', () => {
  test('บันทึกผล PASS และปลดล็อก Phase 2 เมื่อเข้าสู่ภาคเรียนถัดไปแล้ว', async () => {
    const defenseRequest = {
      defenseType: 'PROJECT1',
      status: 'staff_verified',
      update: jest.fn().mockResolvedValue()
    };

    const project = {
      projectId: 1,
      semester: 1,
      academicYear: 2567,
      members: [{ studentId: 101 }],
      defenseRequests: [defenseRequest],
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue()
    };

    modelMocks.ProjectExamResult.hasExamResult.mockResolvedValue(false);
    modelMocks.ProjectDocument.findByPk.mockResolvedValue(project);
    modelMocks.ProjectExamResult.create.mockResolvedValue({
      examType: 'PROJECT1',
      result: 'PASS'
    });

    const academicSetting = {
      semester2Range: {
        start: '2025-11-01T00:00:00Z',
        end: '2026-03-01T00:00:00Z'
      }
    };

    modelMocks.Academic.findOne.mockImplementation(async ({ where }) => {
      if (where && where.academicYear === 2567) return academicSetting;
      if (where && where.isCurrent) return academicSetting;
      return null;
    });

    await projectExamResultService.recordExamResult(1, {
      examType: 'PROJECT1',
      result: 'PASS'
    }, 999);

    expect(modelMocks.ProjectExamResult.create).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 1,
      examType: 'PROJECT1',
      result: 'PASS',
      recordedByUserId: 999
    }), expect.objectContaining({ transaction: expect.any(Object) }));

    expect(project.update).toHaveBeenCalledWith(expect.objectContaining({
      examResult: 'passed',
      status: 'in_progress'
    }), expect.objectContaining({ transaction: expect.any(Object) }));

    expect(defenseRequest.update).toHaveBeenCalledWith({ status: 'completed' }, expect.objectContaining({ transaction: expect.any(Object) }));
    expect(mockSyncProjectWorkflowState).toHaveBeenCalledWith(1, expect.objectContaining({ transaction: expect.any(Object) }));
    expect(mockUnlockNextPhase).toHaveBeenCalledWith(101, 'PROJECT1_DEFENSE_RESULT', expect.any(Object));
    expect(transactions[0].commit).toHaveBeenCalled();
  });

  test('ไม่ปลดล็อก Phase 2 หากยังไม่ถึงช่วงภาคเรียนถัดไป', async () => {
    jest.setSystemTime(new Date('2025-09-01T00:00:00Z'));

    const defenseRequest = {
      defenseType: 'PROJECT1',
      status: 'staff_verified',
      update: jest.fn().mockResolvedValue()
    };

    const project = {
      projectId: 2,
      semester: 1,
      academicYear: 2567,
      members: [{ studentId: 102 }],
      defenseRequests: [defenseRequest],
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue()
    };

    modelMocks.ProjectExamResult.hasExamResult.mockResolvedValue(false);
    modelMocks.ProjectDocument.findByPk.mockResolvedValue(project);
    modelMocks.ProjectExamResult.create.mockResolvedValue({
      examType: 'PROJECT1',
      result: 'PASS'
    });

    const academicSetting = {
      semester2Range: {
        start: '2025-11-01T00:00:00Z',
        end: '2026-03-01T00:00:00Z'
      }
    };

    modelMocks.Academic.findOne.mockImplementation(async ({ where }) => {
      if (where && where.academicYear === 2567) return academicSetting;
      if (where && where.isCurrent) return academicSetting;
      return null;
    });

    await projectExamResultService.recordExamResult(2, {
      examType: 'PROJECT1',
      result: 'PASS'
    }, 888);

    expect(mockUnlockNextPhase).not.toHaveBeenCalled();
    expect(transactions[0].commit).toHaveBeenCalled();
  });

  test('บันทึกผล FAIL และให้นักศึกษารับทราบ', async () => {
    const member = { projectId: 3, studentId: 201 };
    const examResult = {
      projectId: 3,
      examType: 'PROJECT1',
      result: 'FAIL',
      studentAcknowledgedAt: null,
      update: jest.fn().mockResolvedValue()
    };

    const project = {
      projectId: 3,
      semester: 1,
      academicYear: 2567,
      members: [{ studentId: 201 }],
      defenseRequests: [],
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue()
    };

    modelMocks.ProjectMember.findOne.mockResolvedValue(member);
    modelMocks.ProjectExamResult.findOne.mockResolvedValue(examResult);
    modelMocks.ProjectDocument.findByPk.mockResolvedValue(project);

    const ackResult = await projectExamResultService.acknowledgeExamResult(3, 'PROJECT1', 201);

    expect(examResult.update).toHaveBeenCalledWith(expect.objectContaining({
      studentAcknowledgedAt: expect.any(Date)
    }), expect.objectContaining({ transaction: expect.any(Object) }));

    expect(project.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'archived',
      studentAcknowledgedAt: expect.any(Date)
    }), expect.objectContaining({ transaction: expect.any(Object) }));

    expect(mockSyncProjectWorkflowState).toHaveBeenCalledWith(3, expect.objectContaining({ transaction: expect.any(Object) }));
    expect(transactions[0].commit).toHaveBeenCalled();
    expect(mockUnlockNextPhase).not.toHaveBeenCalled();
    expect(ackResult).toBe(examResult);
  });
});

describe('getProject1PendingResults', () => {
  test('กรองตามสถานะและจัดเรียงผลสอบล่าสุด', async () => {
    const noResultProject = {
      toJSON: () => ({
        projectId: 10,
        projectNameTh: 'Pending Project',
        examResults: []
      })
    };

    const passedProject = {
      toJSON: () => ({
        projectId: 11,
        projectNameTh: 'Passed Project',
        examResults: [
          { result: 'PASS', recordedAt: '2025-01-02T00:00:00Z' },
          { result: 'PASS', recordedAt: '2025-02-01T00:00:00Z' }
        ]
      })
    };

    const failedProject = {
      toJSON: () => ({
        projectId: 12,
        projectNameTh: 'Failed Project',
        examResults: [
          { result: 'FAIL', recordedAt: '2025-01-10T00:00:00Z' }
        ]
      })
    };

    modelMocks.ProjectDocument.findAll.mockResolvedValue([noResultProject, passedProject, failedProject]);

    const passedList = await projectExamResultService.getProject1PendingResults({ status: 'passed' });
    expect(passedList).toHaveLength(1);
    expect(passedList[0].projectId).toBe(11);
    expect(passedList[0].examResults[0].recordedAt).toBe('2025-02-01T00:00:00Z');

    const allList = await projectExamResultService.getProject1PendingResults({ status: 'all' });
    expect(allList).toHaveLength(3);
  });
});
