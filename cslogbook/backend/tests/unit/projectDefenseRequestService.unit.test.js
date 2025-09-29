/**
 * Unit tests สำหรับ projectDefenseRequestService
 * โฟกัสการยื่นคำขอสอบโครงงานพิเศษ 1 (คพ.02)
 */

let SequelizeCtor;
let DataTypesCtor;
let sequelize;
let Student;
let User;
let ProjectDocument;
let ProjectMember;
let ProjectDefenseRequest;
let projectDefenseRequestService;
const mockSyncProjectWorkflowState = jest.fn().mockResolvedValue(null);

async function createStudent(code) {
  const user = await User.create({ firstName: 'Stu', lastName: code.slice(-3) });
  return Student.create({ studentCode: code, userId: user.userId });
}

let leader;
let member;
let project;

beforeAll(async () => {
  jest.resetModules();
  ({ Sequelize: SequelizeCtor, DataTypes: DataTypesCtor } = require('sequelize'));

  sequelize = new SequelizeCtor('sqlite::memory:', { logging: false });

  Student = sequelize.define('Student', {
    studentId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'student_id' },
    userId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'user_id' },
    studentCode: { type: DataTypesCtor.STRING, allowNull: false, unique: true, field: 'student_code' }
  }, { tableName: 'students', underscored: true, timestamps: false });

  User = sequelize.define('User', {
    userId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'user_id' },
    firstName: DataTypesCtor.STRING,
    lastName: DataTypesCtor.STRING
  }, { tableName: 'users', underscored: true, timestamps: false });

  Student.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  ProjectDocument = sequelize.define('ProjectDocument', {
    projectId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'project_id' },
    projectNameTh: DataTypesCtor.STRING,
    projectNameEn: DataTypesCtor.STRING,
    projectCode: DataTypesCtor.STRING,
    status: { type: DataTypesCtor.STRING, defaultValue: 'draft' },
    advisorId: DataTypesCtor.INTEGER,
    coAdvisorId: DataTypesCtor.INTEGER
  }, { tableName: 'project_documents', underscored: true, timestamps: false });

  ProjectMember = sequelize.define('ProjectMember', {
    projectId: { type: DataTypesCtor.INTEGER, field: 'project_id' },
    studentId: { type: DataTypesCtor.INTEGER, field: 'student_id' },
    role: DataTypesCtor.STRING
  }, { tableName: 'project_members', underscored: true, timestamps: false });

  ProjectDefenseRequest = sequelize.define('ProjectDefenseRequest', {
    requestId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'request_id' },
    projectId: { type: DataTypesCtor.INTEGER, field: 'project_id' },
    defenseType: { type: DataTypesCtor.STRING, field: 'defense_type' },
    status: { type: DataTypesCtor.STRING },
    formPayload: { type: DataTypesCtor.JSON, field: 'form_payload' },
    submittedByStudentId: { type: DataTypesCtor.INTEGER, field: 'submitted_by_student_id' },
    submittedAt: { type: DataTypesCtor.DATE, field: 'submitted_at' }
  }, { tableName: 'project_defense_requests', underscored: true, timestamps: true });

  ProjectDocument.hasMany(ProjectMember, { as: 'members', foreignKey: 'project_id' });
  ProjectMember.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
  ProjectMember.belongsTo(Student, { as: 'student', foreignKey: 'student_id' });
  ProjectDocument.hasMany(ProjectDefenseRequest, { as: 'defenseRequests', foreignKey: 'project_id' });

  jest.isolateModules(() => {
    jest.doMock('../../config/database', () => ({ sequelize }));
    jest.doMock('../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
    jest.doMock('../../services/projectDocumentService', () => ({
      syncProjectWorkflowState: mockSyncProjectWorkflowState,
      getProjectById: jest.fn()
    }));
    jest.doMock('../../models', () => ({
      sequelize,
      Student,
      User,
      ProjectDocument,
      ProjectMember,
      ProjectDefenseRequest
    }));
    projectDefenseRequestService = require('../../services/projectDefenseRequestService');
  });

  await sequelize.sync({ force: true });
  leader = await createStudent('640000001111');
  member = await createStudent('640000001112');
  project = await ProjectDocument.create({
    projectNameTh: 'ระบบทดสอบ',
    projectNameEn: 'Test System',
    projectCode: 'PRJTEST-001',
    status: 'in_progress',
    advisorId: 10
  });
  await ProjectMember.bulkCreate([
    { projectId: project.projectId, studentId: leader.studentId, role: 'leader' },
    { projectId: project.projectId, studentId: member.studentId, role: 'member' }
  ]);
});

afterEach(() => {
  mockSyncProjectWorkflowState.mockClear();
});

afterAll(async () => {
  await sequelize.close();
  jest.resetModules();
});

describe('submitProject1Request', () => {
  test('บันทึกคำขอใหม่สำเร็จและเรียก sync workflow', async () => {
    const payload = {
      examDate: '2025-10-01',
      examTime: '13:30',
      examLocation: 'ห้องประชุม 7',
      committee: [{ role: 'chair', name: 'Dr.A' }],
      advisorName: 'Dr.B'
    };

    const record = await projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, payload);
    expect(record).toBeDefined();
    expect(record.status).toBe('submitted');
    expect(record.formPayload.examLocation).toBe('ห้องประชุม 7');
    expect(mockSyncProjectWorkflowState).toHaveBeenCalled();
  });

  test('อนุญาตให้แก้ไขคำขอเดิมได้', async () => {
    const updated = await projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, {
      examDate: '2025-10-02',
      examTime: '09:00',
      examLocation: 'ห้องประชุมใหญ่'
    });
    expect(updated.formPayload.examDate).toBe('2025-10-02');
    expect(updated.formPayload.examLocation).toBe('ห้องประชุมใหญ่');
  });

  test('ห้ามนักศึกษาที่ไม่ใช่หัวหน้ายื่นคำขอ', async () => {
    await expect(projectDefenseRequestService.submitProject1Request(project.projectId, member.studentId, {
      examDate: '2025-10-05',
      examTime: '09:00',
      examLocation: 'ห้องประชุม'
    })).rejects.toThrow(/อนุญาตเฉพาะหัวหน้าโครงงาน/);
  });

  test('ตรวจสอบ validation ข้อมูลไม่ครบ', async () => {
    await expect(projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, {
      examDate: '2025-10-05',
      examLocation: ''
    })).rejects.toThrow(/ข้อมูลไม่ครบถ้วน/);
  });
});

describe('getLatestProject1Request', () => {
  test('ดึงคำขอล่าสุดกลับมาได้', async () => {
    const record = await projectDefenseRequestService.getLatestProject1Request(project.projectId);
    expect(record).toBeTruthy();
    expect(record.status).toBe('submitted');
  });
});
