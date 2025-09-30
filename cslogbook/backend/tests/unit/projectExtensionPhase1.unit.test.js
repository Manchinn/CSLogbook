/**
 * Tests เบื้องต้นสำหรับ Phase Extended (Milestones + Proposal Artifacts)
 * โฟกัส validation create milestone และ version proposal upload
 */
const { Sequelize, DataTypes } = require('sequelize');

// In-memory
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUpdateWorkflowActivity = jest.fn().mockResolvedValue(null);

// Models simplified
const Student = sequelize.define('Student', {
  studentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'student_id' },
  studentCode: { type: DataTypes.STRING, unique: true, allowNull: false, field: 'student_code' },
  userId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'user_id' },
  isEligibleProject: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_eligible_project' }
}, { tableName: 'students', underscored: true, timestamps: false });

const ProjectDocument = sequelize.define('ProjectDocument', {
  projectId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'project_id' },
  projectCode: { type: DataTypes.STRING, field: 'project_code' },
  projectNameTh: { type: DataTypes.STRING, field: 'project_name_th' },
  projectNameEn: { type: DataTypes.STRING, field: 'project_name_en' },
  projectType: { type: DataTypes.STRING, field: 'project_type' },
  track: { type: DataTypes.STRING },
  advisorId: { type: DataTypes.INTEGER, field: 'advisor_id' },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  examResult: { type: DataTypes.STRING, field: 'exam_result' },
  studentAcknowledgedAt: { type: DataTypes.DATE, field: 'student_acknowledged_at' }
}, { tableName: 'project_documents', underscored: true, timestamps: false, hooks: {
  beforeCreate(inst){ if(!inst.projectCode) inst.projectCode = `PRJX-${Date.now()}`; }
}});

const ProjectMember = sequelize.define('ProjectMember', {
  projectId: { type: DataTypes.INTEGER, primaryKey: true, field: 'project_id' },
  studentId: { type: DataTypes.INTEGER, primaryKey: true, field: 'student_id' },
  role: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'project_members', underscored: true, timestamps: false });

const ProjectMilestone = sequelize.define('ProjectMilestone', {
  milestoneId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'milestone_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  title: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
}, { tableName: 'project_milestones', underscored: true, timestamps: false });

const ProjectArtifact = sequelize.define('ProjectArtifact', {
  artifactId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'artifact_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  type: { type: DataTypes.STRING },
  filePath: { type: DataTypes.STRING },
  originalName: { type: DataTypes.STRING },
  mimeType: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  uploadedByStudentId: { type: DataTypes.INTEGER }
}, { tableName: 'project_artifacts', underscored: true, timestamps: false });

const ProjectDefenseRequest = sequelize.define('ProjectDefenseRequest', {
  requestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'request_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  defenseType: { type: DataTypes.STRING, field: 'defense_type' },
  status: { type: DataTypes.STRING }
}, { tableName: 'project_defense_requests', underscored: true, timestamps: true });

const ProjectDefenseRequestAdvisorApproval = sequelize.define('ProjectDefenseRequestAdvisorApproval', {
  approvalId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'approval_id' },
  requestId: { type: DataTypes.INTEGER, allowNull: false, field: 'request_id' },
  teacherId: { type: DataTypes.INTEGER, allowNull: false, field: 'teacher_id' },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }
}, { tableName: 'project_defense_request_approvals', underscored: true, timestamps: true });

const Academic = sequelize.define('Academic', {
  academicYear: { type: DataTypes.INTEGER, field: 'academic_year' },
  currentSemester: { type: DataTypes.INTEGER, field: 'current_semester' },
  isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_current' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
}, { tableName: 'academics', underscored: true, timestamps: false });

const User = sequelize.define('User', {
  userId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'user_id' },
  firstName: { type: DataTypes.STRING, field: 'first_name' },
  lastName: { type: DataTypes.STRING, field: 'last_name' }
}, { tableName: 'users', underscored: true, timestamps: false });

const Teacher = sequelize.define('Teacher', {
  teacherId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'teacher_id' },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  teacherCode: { type: DataTypes.STRING, allowNull: true, field: 'teacher_code' }
}, { tableName: 'teachers', underscored: true, timestamps: false });

const ProjectTrack = sequelize.define('ProjectTrack', {
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  trackCode: { type: DataTypes.STRING, field: 'track_code' }
}, { tableName: 'project_tracks', underscored: true, timestamps: false });

ProjectDocument.hasMany(ProjectMember, { as: 'members', foreignKey: 'project_id' });
ProjectMember.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
ProjectMember.belongsTo(Student, { as: 'student', foreignKey: 'student_id' });
ProjectDocument.hasMany(ProjectTrack, { as: 'tracks', foreignKey: 'project_id' });
Student.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Teacher.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
ProjectDocument.belongsTo(Teacher, { as: 'advisor', foreignKey: 'advisor_id', constraints: false });
ProjectDocument.belongsTo(Teacher, { as: 'coAdvisor', foreignKey: 'co_advisor_id', constraints: false });
ProjectDocument.hasMany(ProjectDefenseRequest, { as: 'defenseRequests', foreignKey: 'project_id' });
ProjectDefenseRequest.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id', constraints: false });
ProjectDefenseRequest.hasMany(ProjectDefenseRequestAdvisorApproval, { as: 'advisorApprovals', foreignKey: 'request_id' });
ProjectDefenseRequestAdvisorApproval.belongsTo(ProjectDefenseRequest, { as: 'request', foreignKey: 'request_id', constraints: false });
ProjectDefenseRequestAdvisorApproval.belongsTo(Teacher, { as: 'teacher', foreignKey: 'teacher_id', constraints: false });

let projectDocumentService;
let milestoneService;
let artifactService;

async function bootstrap() {
  await sequelize.sync({ force: true });
  // create leader
  const user = await User.create({ firstName: 'Leader', lastName: 'One' });
  const leader = await Student.create({ studentCode: '650000000001', userId: user.userId, isEligibleProject: true });
    const proj = await projectDocumentService.createProject(leader.studentId, { projectNameTh: 'x', projectNameEn:'y' });
  return { leader, proj };
}

describe('Milestone + Proposal basic', () => {
  let leader, proj;
  beforeAll(async () => {
    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock('../../config/database', () => ({ sequelize }), { virtual: true });
      jest.doMock('../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }), { virtual: true });
      jest.doMock('../../services/workflowService', () => ({
        updateStudentWorkflowActivity: mockUpdateWorkflowActivity
      }), { virtual: true });
      jest.doMock('../../models', () => ({
        sequelize,
        ProjectDocument,
        ProjectMember,
        ProjectMilestone,
        ProjectArtifact,
        User,
        ProjectTrack,
        Academic,
        Student,
        ProjectDefenseRequest,
        ProjectDefenseRequestAdvisorApproval,
        Teacher
      }), { virtual: true });
      projectDocumentService = require('../../services/projectDocumentService');
      milestoneService = require('../../services/projectMilestoneService');
      artifactService = require('../../services/projectArtifactService');
      const models = require('../../models');
      expect(models.Student).toBe(Student);
    });
    ({ leader, proj } = await bootstrap());
  });

  test('create milestone success', async () => {
    const m = await milestoneService.createMilestone(proj.projectId, leader.studentId, { title: 'ส่ง Proposal' });
    expect(m.milestoneId).toBeDefined();
    expect(m.title).toBe('ส่ง Proposal');
  });

  test('reject empty milestone title', async () => {
    await expect(milestoneService.createMilestone(proj.projectId, leader.studentId, { title: '   ' }))
      .rejects.toThrow(/ชื่อ Milestone/);
  });

  test('proposal upload version increments', async () => {
    // mock file objects (เฉพาะ field ที่ใช้)
    const file1 = { originalname:'p1.pdf', mimetype:'application/pdf', size:100, path: 'uploads/tmp/p1.pdf' };
    const file2 = { originalname:'p2.pdf', mimetype:'application/pdf', size:120, path: 'uploads/tmp/p2.pdf' };
    const a1 = await artifactService.uploadProposal(proj.projectId, leader.studentId, file1);
    const a2 = await artifactService.uploadProposal(proj.projectId, leader.studentId, file2);
    expect(a1.version).toBe(1);
    expect(a2.version).toBe(2);
  });
});
