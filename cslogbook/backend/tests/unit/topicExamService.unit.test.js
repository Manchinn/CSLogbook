const { Sequelize, DataTypes } = require('sequelize');

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });
const sequelize = mockSequelize;

const ProjectDocument = sequelize.define('ProjectDocument', {
  projectId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectCode: DataTypes.STRING,
  projectNameTh: DataTypes.STRING,
  projectNameEn: DataTypes.STRING,
  status: DataTypes.STRING,
  advisorId: DataTypes.INTEGER,
  objective: DataTypes.TEXT,
  expectedOutcome: DataTypes.TEXT
}, { tableName: 'project_documents' });

const ProjectMember = sequelize.define('ProjectMember', {
  projectId: { type: DataTypes.INTEGER },
  studentId: { type: DataTypes.INTEGER },
  role: DataTypes.STRING
}, { tableName: 'project_members' });

const Student = sequelize.define('Student', {
  studentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentCode: DataTypes.STRING,
  userId: DataTypes.INTEGER,
  classroom: DataTypes.STRING,
}, { tableName: 'students' });

const Teacher = sequelize.define('Teacher', {
  teacherId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: DataTypes.INTEGER
}, { tableName: 'teachers' });

const User = sequelize.define('User', {
  userId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING
}, { tableName: 'users' });

const Curriculum = sequelize.define('Curriculum', {
  curriculumId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'curriculum_id' },
  name: DataTypes.STRING
}, { tableName: 'curriculums', underscored: true, timestamps: false });

const Academic = sequelize.define('Academic', {
  academicId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'academic_id' },
  academicYear: DataTypes.INTEGER,
  currentSemester: DataTypes.INTEGER,
  curriculumId: { type: DataTypes.INTEGER, allowNull: true, field: 'active_curriculum_id' }
}, { tableName: 'academics', underscored: true, timestamps: false });

Academic.belongsTo(Curriculum, { as: 'activeCurriculum', foreignKey: 'curriculumId' });

ProjectDocument.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
ProjectMember.belongsTo(ProjectDocument, { foreignKey: 'projectId', as: 'project' });
ProjectMember.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectDocument.belongsTo(Teacher, { foreignKey: 'advisorId', as: 'advisor' });
ProjectDocument.belongsTo(Teacher, { foreignKey: 'coAdvisorId', as: 'coAdvisor' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockModels = {
  sequelize: mockSequelize,
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User,
  Academic,
  Curriculum
};

const mockDatabaseModule = { Sequelize, sequelize: mockSequelize };

jest.mock('../../config/database', () => mockDatabaseModule);
jest.mock('../../models', () => ({ ...mockModels }));
jest.mock('../../utils/logger', () => mockLogger);

const service = require('../../services/topicExamService');

describe('topicExamService.getTopicOverview (unit)', () => {
  beforeAll(async () => {
    await sequelize.sync();

    const u1 = await User.create({ firstName: 'Somchai', lastName: 'Dee' });
    const u2 = await User.create({ firstName: 'Rak', lastName: 'Rakdee' });
    const t1 = await Teacher.create({ userId: u1.userId });
    const s1 = await Student.create({ userId: u2.userId, studentCode: '640400000001' });
    const pd = await ProjectDocument.create({ projectCode: 'PRJTEST-0001', projectNameTh: 'ตัวอย่าง', projectNameEn: 'Example', status: 'draft', advisorId: t1.teacherId });
    await ProjectMember.create({ projectId: pd.projectId, studentId: s1.studentId, role: 'leader' });
  });

  beforeEach(() => {
    mockLogger.info.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.error.mockReset();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns array with mapped fields', async () => {
    const result = await service.getTopicOverview({});
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  expect(result.data.length).toBeGreaterThanOrEqual(1);
    const row = result.data[0];
    expect(row.projectCode).toBe('PRJTEST-0001');
    expect(row.advisor.name).toContain('Somchai');
    expect(row.members[0].name).toContain('Rak');
  });

  test('readyOnly filter (baseline=title only) returns record even if advisor present/absent', async () => {
    // First existing row has titles + advisor -> ready
    let result = await service.getTopicOverview({ readyOnly: true });
  expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0].readiness.titleCompleted).toBe(true);
    expect(result.data[0].readiness.readyFlag).toBe(true);

    // Create another project without advisor but with titles to confirm still ready
    const pd2 = await ProjectDocument.create({ projectCode: 'PRJTEST-0002', projectNameTh: 'หัวข้อสอง', projectNameEn: 'Second', status: 'draft', advisorId: null });
    // no members needed for readiness baseline
    result = await service.getTopicOverview({ readyOnly: true });
    // Should now have both rows (order may differ); ensure at least 2
    expect(result.data.length).toBeGreaterThanOrEqual(2);
    const hasSecond = result.data.some(r => r.projectCode === 'PRJTEST-0002' && r.readiness.readyFlag === true);
    expect(hasSecond).toBe(true);
  });
});
