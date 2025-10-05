const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockAcademicModel = { findOne: jest.fn() };
const mockCurriculumModel = { findOne: jest.fn() };
const mockStudentModel = { findByPk: jest.fn() };
const mockProjectMemberModel = { findAll: jest.fn() };

const mockModels = {
  User: {},
  Teacher: {},
  Curriculum: mockCurriculumModel,
  StudentAcademicHistory: {},
  Academic: mockAcademicModel,
  Student: mockStudentModel,
  ProjectMember: mockProjectMemberModel,
  ProjectDocument: {},
  ProjectExamResult: {},
};

const mockDatabaseModule = {
  Sequelize: require('sequelize').Sequelize,
  sequelize: {
    models: {
      Academic: mockAcademicModel,
      Curriculum: mockCurriculumModel,
    },
  },
};

jest.mock('../../utils/logger', () => mockLogger);
jest.mock('../../models', () => mockModels);
jest.mock('../../config/database', () => mockDatabaseModule);

const studentService = require('../../services/studentService');

describe('studentService.checkStudentEligibility - project access override', () => {
  const resetBaseMocks = () => {
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockLogger.warn.mockReset();
    mockAcademicModel.findOne.mockReset().mockResolvedValue(null);
    mockCurriculumModel.findOne.mockReset().mockResolvedValue(null);
    mockStudentModel.findByPk.mockReset();
    mockProjectMemberModel.findAll.mockReset();
  };

  const setupScenario = ({
    projectStatus = 'completed',
    projectExamResult = 'passed',
    thesisResult = 'PASS',
    overrideProjectEligibility = false,
  } = {}) => {
    resetBaseMocks();

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

    mockStudentModel.findByPk.mockResolvedValue(mockStudentInstance);

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

    mockProjectMemberModel.findAll.mockResolvedValue(mockProjectMemberships);

    return {
      mockStudentInstance,
      mockProjectMemberships,
    };
  };

  it('ให้สิทธิ์เข้าถึงระบบโครงงานต่อเนื่องเมื่อโครงงานเสร็จสมบูรณ์แล้ว', async () => {
    const { mockStudentInstance } = setupScenario();

    const response = await studentService.checkStudentEligibility(101);

    expect(mockStudentInstance.checkProjectEligibility).toHaveBeenCalled();
    expect(response.status.project.canAccess).toBe(true);
    expect(response.eligibility.project.canAccessFeature).toBe(true);
    expect(response.eligibility.project.canRegister).toBe(false);
    expect(response.eligibility.project.reason).toMatch(/โครงงาน|ผ่านการสอบ/);
  });

  it('ไม่ override หากไม่มีข้อมูลโครงงานหรือผลสอบผ่านครบ', async () => {
    setupScenario({
      projectStatus: 'archived',
      projectExamResult: 'failed',
      thesisResult: 'FAIL',
    });

    mockProjectMemberModel.findAll.mockResolvedValue([]);

    const response = await studentService.checkStudentEligibility(101);

    expect(response.status.project.canAccess).toBe(false);
    expect(response.eligibility.project.canAccessFeature).toBe(false);
    expect(response.eligibility.project.reason).toBe('หน่วยกิตไม่เพียงพอ');
  });
});