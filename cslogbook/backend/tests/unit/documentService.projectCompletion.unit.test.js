const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

const mockProjectDocumentService = {
  syncProjectWorkflowState: jest.fn()
};

const mockDocumentModel = {
  findByPk: jest.fn(),
  create: jest.fn()
};

const mockProjectDocumentModel = {
  findOne: jest.fn(),
  findByPk: jest.fn()
};

const mockProjectMemberModel = {
  findOne: jest.fn()
};

const mockStudentModel = {
  findByPk: jest.fn()
};

let documentService;

function loadService() {
  jest.isolateModules(() => {
    jest.doMock('../../utils/logger', () => mockLogger);
    jest.doMock('../../services/projectDocumentService', () => mockProjectDocumentService);
    jest.doMock('../../models', () => ({
      Document: mockDocumentModel,
      ProjectDocument: mockProjectDocumentModel,
      ProjectMember: mockProjectMemberModel,
      ProjectExamResult: {},
      User: {},
      Student: mockStudentModel,
      InternshipDocument: {},
      StudentWorkflowActivity: {},
      Notification: {},
      DocumentLog: {}
    }));

    documentService = require('../../services/documentService');
  });
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockDocumentModel.findByPk.mockReset();
  mockDocumentModel.create.mockReset();
  mockProjectDocumentModel.findOne.mockReset();
  mockProjectDocumentModel.findByPk.mockReset();
  mockProjectMemberModel.findOne.mockReset();
  mockStudentModel.findByPk.mockReset();
  mockProjectDocumentService.syncProjectWorkflowState.mockReset();
  loadService();
});

describe('documentService.updateDocumentStatus – project completion sync', () => {
  test('เล่มอนุมัติหลังสอบผ่านทำให้สถานะโปรเจ็กต์ถูกปิดเป็น completed', async () => {
    const documentInstance = {
      documentId: 55,
      documentType: 'PROJECT',
      category: 'final',
      status: 'pending',
      update: jest.fn().mockImplementation(async function update(values) {
        Object.assign(this, values);
        return this;
      })
    };

    const projectInstance = {
      projectId: 77,
      status: 'in_progress',
      examResults: [{ examType: 'THESIS', result: 'PASS' }],
      update: jest.fn().mockResolvedValue()
    };

    mockDocumentModel.findByPk.mockResolvedValue(documentInstance);
    mockProjectDocumentModel.findOne.mockResolvedValue(projectInstance);

    await documentService.updateDocumentStatus(55, 'completed', 500, 'ok');

    expect(documentInstance.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed',
      reviewerId: 500
    }));
    expect(projectInstance.update).toHaveBeenCalledWith({ status: 'completed' });
    expect(mockProjectDocumentService.syncProjectWorkflowState).toHaveBeenCalledWith(77);
  });

  test('เล่มถูกปรับกลับเป็น pending หลังปิดโครงงานทำให้สถานะ revert เป็น in_progress', async () => {
    const documentInstance = {
      documentId: 56,
      documentType: 'PROJECT',
      category: 'final',
      status: 'completed',
      update: jest.fn().mockImplementation(async function update(values) {
        Object.assign(this, values);
        return this;
      })
    };

    const projectInstance = {
      projectId: 78,
      status: 'completed',
      examResults: [{ examType: 'THESIS', result: 'PASS' }],
      update: jest.fn().mockResolvedValue()
    };

    mockDocumentModel.findByPk.mockResolvedValue(documentInstance);
    mockProjectDocumentModel.findOne.mockResolvedValue(projectInstance);

    await documentService.updateDocumentStatus(56, 'pending', 501, null);

    expect(documentInstance.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      reviewerId: 501
    }));
    expect(projectInstance.update).toHaveBeenCalledWith({ status: 'in_progress' });
    expect(mockProjectDocumentService.syncProjectWorkflowState).toHaveBeenCalledWith(78);
  });
});

describe('documentService.updateProjectFinalDocumentStatus', () => {
  test('สร้างเล่มออฟไลน์และอัปเดตสถานะเมื่อยังไม่มีเอกสาร', async () => {
    const projectInstance = {
      projectId: 101,
      projectNameTh: 'ระบบทดสอบ',
      createdByStudentId: 201,
      document: null,
      update: jest.fn().mockResolvedValue()
    };

    mockProjectDocumentModel.findByPk.mockResolvedValue(projectInstance);
    mockStudentModel.findByPk.mockResolvedValue({ studentId: 201, userId: 301 });
    mockDocumentModel.create.mockResolvedValue({ documentId: 401 });

    const updateStatusSpy = jest.spyOn(documentService, 'updateDocumentStatus').mockResolvedValue({ message: 'ok' });

    await documentService.updateProjectFinalDocumentStatus(101, 'approved', 999, 'หมายเหตุ');

    expect(mockDocumentModel.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 301,
      documentType: 'PROJECT',
      category: 'final'
    }));
    expect(projectInstance.update).toHaveBeenCalledWith({ documentId: 401 });
    expect(updateStatusSpy).toHaveBeenCalledWith(401, 'approved', 999, 'หมายเหตุ');

    updateStatusSpy.mockRestore();
  });

  test('ใช้งานเล่มเดิมที่มีอยู่โดยไม่สร้างใหม่', async () => {
    const documentInstance = { documentId: 555 };
    const projectInstance = {
      projectId: 202,
      projectNameTh: 'ระบบตัวอย่าง',
      createdByStudentId: 302,
      document: documentInstance,
      update: jest.fn()
    };

    mockProjectDocumentModel.findByPk.mockResolvedValue(projectInstance);

    const updateStatusSpy = jest.spyOn(documentService, 'updateDocumentStatus').mockResolvedValue({ message: 'ok' });

    await documentService.updateProjectFinalDocumentStatus(202, 'completed', 888, null);

    expect(mockDocumentModel.create).not.toHaveBeenCalled();
    expect(projectInstance.update).not.toHaveBeenCalled();
    expect(updateStatusSpy).toHaveBeenCalledWith(555, 'completed', 888, null);

    updateStatusSpy.mockRestore();
  });
});
