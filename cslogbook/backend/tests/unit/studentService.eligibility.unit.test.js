const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

describe('studentService.checkStudentEligibility - project access override', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const setupScenario = ({
    projectStatus = 'completed',
    projectExamResult = 'passed',
    thesisResult = 'PASS',
    overrideProjectEligibility = false,
  } = {}) => {
    const mockStudentInstance = {
      studentId: 101,
      studentCode: '6404062630295',
      totalCredits: 120,
      majorCredits: 60,
      checkInternshipEligibility: jest.fn().mockResolvedValue({
        eligible: true,
        reason: 'ผ่านเกณฑ์หน่วยกิตฝึกงาน',
      }),
      checkProjectEligibility: jest.fn().mockResolvedValue({
        eligible: overrideProjectEligibility,
        canAccessFeature: overrideProjectEligibility,
        canRegister: overrideProjectEligibility,
        reason: overrideProjectEligibility
          ? 'ผ่านเกณฑ์หน่วยกิต'
          : 'หน่วยกิตไม่เพียงพอ',
      }),
    };

    const mockAcademicModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const mockCurriculumModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const mockStudentModel = {
      findByPk: jest.fn().mockResolvedValue(mockStudentInstance),
    };

    const mockProjectMemberships = [
      {
        project: {
          projectId: 9001,
          status: projectStatus,
          examResult: projectExamResult,
          examResults: [
            { examType: 'PROJECT1', result: projectExamResult?.toUpperCase?.() || 'PASS' },
            { examType: 'THESIS', result: thesisResult },
          ],
        },
      },
    ];

    const mockModels = {
      User: {},
      Teacher: {},
      Curriculum: mockCurriculumModel,
      StudentAcademicHistory: {},
      Academic: mockAcademicModel,
      Student: mockStudentModel,
      ProjectMember: {
        findAll: jest.fn().mockResolvedValue(mockProjectMemberships),
      },
      ProjectDocument: {},
      ProjectExamResult: {},
    };

    jest.doMock('../../utils/logger', () => mockLogger, { virtual: true });
    jest.doMock('../../models', () => mockModels, { virtual: true });
    jest.doMock('../../config/database', () => ({
      sequelize: {
        models: {
          Academic: mockAcademicModel,
          Curriculum: mockCurriculumModel,
        },
      },
    }), { virtual: true });

    let studentService;
    jest.isolateModules(() => {
      studentService = require('../../services/studentService');
    });

    return {
      studentService,
      mockStudentInstance,
      mockStudentModel,
      mockProjectMemberships,
      mockModels,
    };
  };

  it('ให้สิทธิ์เข้าถึงระบบโครงงานต่อเนื่องเมื่อโครงงานเสร็จสมบูรณ์แล้ว', async () => {
    const { studentService, mockStudentInstance } = setupScenario();

    const response = await studentService.checkStudentEligibility(101);

    expect(mockStudentInstance.checkProjectEligibility).toHaveBeenCalled();
    expect(response.status.project.canAccess).toBe(true);
    expect(response.eligibility.project.canAccessFeature).toBe(true);
    expect(response.eligibility.project.canRegister).toBe(false);
    expect(response.eligibility.project.reason).toMatch(/โครงงาน|ผ่านการสอบ/);
  });

  it('ไม่ override หากไม่มีข้อมูลโครงงานหรือผลสอบผ่านครบ', async () => {
    const { studentService, mockModels } = setupScenario({
      projectStatus: 'archived',
      projectExamResult: 'failed',
      thesisResult: 'FAIL',
    });

    mockModels.ProjectMember.findAll.mockResolvedValue([]);

    const response = await studentService.checkStudentEligibility(101);

    expect(response.status.project.canAccess).toBe(false);
    expect(response.eligibility.project.canAccessFeature).toBe(false);
    expect(response.eligibility.project.reason).toBe('หน่วยกิตไม่เพียงพอ');
  });
});