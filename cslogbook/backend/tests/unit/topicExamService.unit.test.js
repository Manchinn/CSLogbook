const { Sequelize, DataTypes, Op } = require('sequelize');

describe('topicExamService.getTopicOverview (unit)', () => {
  let sequelize; let ProjectDocument; let ProjectMember; let Student; let Teacher; let User; let service;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });

    // Define minimal models needed (fields accessed in service)
    ProjectDocument = sequelize.define('ProjectDocument', {
      projectId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      projectCode: DataTypes.STRING,
      projectNameTh: DataTypes.STRING,
      projectNameEn: DataTypes.STRING,
      status: DataTypes.STRING,
      advisorId: DataTypes.INTEGER,
      objective: DataTypes.TEXT,
      expectedOutcome: DataTypes.TEXT
    }, { tableName: 'project_documents' });

    ProjectMember = sequelize.define('ProjectMember', {
      projectId: { type: DataTypes.INTEGER },
      studentId: { type: DataTypes.INTEGER },
      role: DataTypes.STRING
    }, { tableName: 'project_members' });

    Student = sequelize.define('Student', {
      studentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      studentCode: DataTypes.STRING,
      userId: DataTypes.INTEGER
    }, { tableName: 'students' });

    Teacher = sequelize.define('Teacher', {
      teacherId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: DataTypes.INTEGER
    }, { tableName: 'teachers' });

    User = sequelize.define('User', {
      userId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING
    }, { tableName: 'users' });

    // Associations (matching names used in real service)
    ProjectDocument.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
    ProjectMember.belongsTo(ProjectDocument, { foreignKey: 'projectId', as: 'project' });
    ProjectMember.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
    Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ProjectDocument.belongsTo(Teacher, { foreignKey: 'advisorId', as: 'advisor' });
    ProjectDocument.belongsTo(Teacher, { foreignKey: 'coAdvisorId', as: 'coAdvisor' });
    Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    await sequelize.sync();

    // Seed minimal data
    const u1 = await User.create({ firstName: 'Somchai', lastName: 'Dee' });
    const u2 = await User.create({ firstName: 'Rak', lastName: 'Rakdee' });
    const t1 = await Teacher.create({ userId: u1.userId });
    const s1 = await Student.create({ userId: u2.userId, studentCode: '640400000001' });
    const pd = await ProjectDocument.create({ projectCode: 'PRJTEST-0001', projectNameTh: 'ตัวอย่าง', projectNameEn: 'Example', status: 'draft', advisorId: t1.teacherId });
    await ProjectMember.create({ projectId: pd.projectId, studentId: s1.studentId, role: 'leader' });

    // Mock ../models export structure used by service
    jest.doMock('../../models', () => ({
      ProjectDocument,
      ProjectMember,
      Student,
      Teacher,
      User,
      Op
    }));

    service = require('../../services/topicExamService');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns array with mapped fields', async () => {
    const data = await service.getTopicOverview({});
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    const row = data[0];
    expect(row.projectCode).toBe('PRJTEST-0001');
    expect(row.advisor.name).toContain('Somchai');
    expect(row.members[0].name).toContain('Rak');
  });

  test('readyOnly filter returns only ready (requires title + advisor)', async () => {
    const data = await service.getTopicOverview({ readyOnly: true });
    expect(data.length).toBe(1); // row มี title + advisor → readyFlag true
    expect(data[0].readiness.readyFlag).toBe(true);
  });
});
