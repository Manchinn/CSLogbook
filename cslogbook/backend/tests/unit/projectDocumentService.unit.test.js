/**
 * Unit tests สำหรับ projectDocumentService (Phase 2 core logic)
 * ใช้ in-memory sqlite + mock database module เพื่อทดสอบ transaction และ constraints
 */

const { Sequelize, DataTypes } = require('sequelize');

// สร้าง in-memory sequelize สำหรับเทสนี้
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });
const sequelize = mockSequelize;

// Mock workflowService เพื่อตัด side effect ของการ sync timeline ในเทส
const mockUpdateWorkflowActivity = jest.fn().mockResolvedValue(null);

// mock logger ใช้ตัวเดียวกันทั้งไฟล์เพื่อให้ jest.mock คืนอ็อบเจ็กต์เดิมทุกครั้ง
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
const mockProjectWorkflowState = {
  createForProject: jest.fn().mockResolvedValue(undefined),
  updateFromDefenseRequest: jest.fn().mockResolvedValue(undefined),
  updateFromExamResult: jest.fn().mockResolvedValue(undefined),
};

const mockDatabaseModule = { Sequelize, sequelize: mockSequelize };

// สร้าง simplified models (ตัด FK อื่นเพื่อลด complexity)
const Student = sequelize.define('Student', {
  studentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'student_id' },
  studentCode: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'student_code' },
  userId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'user_id' },
  phoneNumber: { type: DataTypes.STRING, allowNull: true, field: 'phone_number' },
  totalCredits: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_credits' },
  majorCredits: { type: DataTypes.INTEGER, defaultValue: 0, field: 'major_credits' },
  isEligibleProject: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_eligible_project' },
  isEligibleInternship: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_eligible_internship' },
  isEnrolledProject: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_enrolled_project' },
  projectStatus: { type: DataTypes.STRING, defaultValue: 'not_started', field: 'project_status' }
}, { tableName: 'students', underscored: true, timestamps: false });

let projectCodeCounter = 0; // นับเพื่อสร้างรหัสไม่ซ้ำง่ายๆ ในเทส

const ProjectDocument = sequelize.define('ProjectDocument', {
  projectId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'project_id' },
  documentId: { type: DataTypes.INTEGER, allowNull: true, field: 'document_id' },
  projectNameTh: { type: DataTypes.STRING, allowNull: true, field: 'project_name_th' },
  projectNameEn: { type: DataTypes.STRING, allowNull: true, field: 'project_name_en' },
  projectType: { type: DataTypes.STRING, allowNull: true, field: 'project_type' },
  track: { type: DataTypes.STRING, allowNull: true },
  advisorId: { type: DataTypes.INTEGER, allowNull: true, field: 'advisor_id' },
  coAdvisorId: { type: DataTypes.INTEGER, allowNull: true, field: 'co_advisor_id' },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
  academicYear: { type: DataTypes.INTEGER, allowNull: true, field: 'academic_year' },
  semester: { type: DataTypes.TINYINT, allowNull: true },
  createdByStudentId: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by_student_id' },
  projectCode: { type: DataTypes.STRING, allowNull: true, field: 'project_code' },
  archivedAt: { type: DataTypes.DATE, allowNull: true, field: 'archived_at' },
  examResult: { type: DataTypes.STRING, allowNull: true, field: 'exam_result' },
  examFailReason: { type: DataTypes.TEXT, allowNull: true, field: 'exam_fail_reason' },
  examResultAt: { type: DataTypes.DATE, allowNull: true, field: 'exam_result_at' },
  studentAcknowledgedAt: { type: DataTypes.DATE, allowNull: true, field: 'student_acknowledged_at' }
}, { tableName: 'project_documents', underscored: true, timestamps: false, hooks: {
  beforeCreate(instance) {
    if (!instance.projectCode) instance.projectCode = `PRJTEST-${++projectCodeCounter}`;
  }
}});

const ProjectMember = sequelize.define('ProjectMember', {
  projectId: { type: DataTypes.INTEGER, primaryKey: true, field: 'project_id' },
  studentId: { type: DataTypes.INTEGER, primaryKey: true, field: 'student_id' },
  role: { type: DataTypes.STRING, allowNull: false },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'joined_at' }
}, { tableName: 'project_members', underscored: true, timestamps: false });

const ProjectTrack = sequelize.define('ProjectTrack', {
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  trackCode: { type: DataTypes.STRING, field: 'track_code' }
}, { tableName: 'project_tracks', underscored: true, timestamps: false });

const ProjectDefenseRequest = sequelize.define('ProjectDefenseRequest', {
  requestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'request_id' },
  projectId: { type: DataTypes.INTEGER, field: 'project_id' },
  defenseType: { type: DataTypes.STRING, field: 'defense_type' },
  status: { type: DataTypes.STRING },
  advisorApprovedAt: { type: DataTypes.DATE, field: 'advisor_approved_at' },
  staffVerifiedAt: { type: DataTypes.DATE, field: 'staff_verified_at' },
  scheduledByUserId: { type: DataTypes.INTEGER, field: 'scheduled_by_user_id' }
}, { tableName: 'project_defense_requests', underscored: true, timestamps: true });

const ProjectDefenseRequestAdvisorApproval = sequelize.define('ProjectDefenseRequestAdvisorApproval', {
  approvalId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'approval_id' },
  requestId: { type: DataTypes.INTEGER, allowNull: false, field: 'request_id' },
  teacherId: { type: DataTypes.INTEGER, allowNull: false, field: 'teacher_id' },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }
}, { tableName: 'project_defense_request_approvals', underscored: true, timestamps: true });

const Meeting = sequelize.define('Meeting', {
  meetingId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'meeting_id' },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' }
}, { tableName: 'meetings', underscored: true, timestamps: false });

const MeetingParticipant = sequelize.define('MeetingParticipant', {
  meetingId: { type: DataTypes.INTEGER, primaryKey: true, field: 'meeting_id' },
  userId: { type: DataTypes.INTEGER, primaryKey: true, field: 'user_id' },
  role: { type: DataTypes.STRING, allowNull: false },
  attendanceStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'present', field: 'attendance_status' }
}, { tableName: 'meeting_participants', underscored: true, timestamps: false });

const MeetingLog = sequelize.define('MeetingLog', {
  logId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'log_id' },
  meetingId: { type: DataTypes.INTEGER, allowNull: false, field: 'meeting_id' },
  approvalStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending', field: 'approval_status' },
  approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' }
}, { tableName: 'meeting_logs', underscored: true, timestamps: false });

const Document = sequelize.define('Document', {
  documentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'document_id' },
  documentName: { type: DataTypes.STRING, allowNull: true, field: 'document_name' },
  status: { type: DataTypes.STRING, allowNull: true },
  reviewComment: { type: DataTypes.TEXT, allowNull: true, field: 'review_comment' },
  reviewDate: { type: DataTypes.DATE, allowNull: true, field: 'review_date' },
  submittedAt: { type: DataTypes.DATE, allowNull: true, field: 'submitted_at' }
}, { tableName: 'documents', underscored: true, timestamps: false });

const ProjectExamResult = sequelize.define('ProjectExamResult', {
  examResultId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'exam_result_id' },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  examType: { type: DataTypes.STRING, allowNull: true, field: 'exam_type' },
  result: { type: DataTypes.STRING, allowNull: true },
  score: { type: DataTypes.FLOAT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  requireScopeRevision: { type: DataTypes.BOOLEAN, allowNull: true, field: 'require_scope_revision' },
  recordedAt: { type: DataTypes.DATE, allowNull: true, field: 'recorded_at' },
  recordedByUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'recorded_by_user_id' },
  studentAcknowledgedAt: { type: DataTypes.DATE, allowNull: true, field: 'student_acknowledged_at' }
}, { tableName: 'project_exam_results', underscored: true, timestamps: false });

const ProjectTestRequest = sequelize.define('ProjectTestRequest', {
  requestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'request_id' },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  status: { type: DataTypes.STRING, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: true, field: 'submitted_at' },
  testStartDate: { type: DataTypes.DATE, allowNull: true, field: 'test_start_date' },
  testDueDate: { type: DataTypes.DATE, allowNull: true, field: 'test_due_date' },
  evidenceSubmittedAt: { type: DataTypes.DATE, allowNull: true, field: 'evidence_submitted_at' }
}, { tableName: 'project_test_requests', underscored: true, timestamps: false });

const Academic = sequelize.define('Academic', {
  academicYear: { type: DataTypes.INTEGER, allowNull: true, field: 'academic_year' },
  currentSemester: { type: DataTypes.INTEGER, allowNull: true, field: 'current_semester' },
  isCurrent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_current' },
  createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: true, field: 'updated_at' }
}, { tableName: 'academics', underscored: true, timestamps: false });

// Minimal User model เพื่อรองรับ association ที่ service include
const User = sequelize.define('User', {
  userId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'user_id' },
  firstName: { type: DataTypes.STRING, allowNull: true, field: 'first_name' },
  lastName: { type: DataTypes.STRING, allowNull: true, field: 'last_name' },
  email: { type: DataTypes.STRING, allowNull: true, field: 'email' },
  role: { type: DataTypes.STRING, allowNull: true, field: 'role' },
}, { tableName: 'users', underscored: true, timestamps: false });

const Teacher = sequelize.define('Teacher', {
  teacherId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'teacher_id' },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  teacherCode: { type: DataTypes.STRING, allowNull: true, field: 'teacher_code' }
}, { tableName: 'teachers', underscored: true, timestamps: false });

Student.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Teacher.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

ProjectDocument.hasMany(ProjectMember, { as: 'members', foreignKey: 'project_id' });
ProjectMember.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
ProjectMember.belongsTo(Student, { as: 'student', foreignKey: 'student_id' });
ProjectDocument.hasMany(ProjectTrack, { as: 'tracks', foreignKey: 'project_id' });
ProjectDocument.hasMany(ProjectDefenseRequest, { as: 'defenseRequests', foreignKey: 'project_id' });
ProjectDocument.hasMany(ProjectExamResult, { as: 'examResults', foreignKey: 'project_id' });
ProjectExamResult.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
ProjectExamResult.belongsTo(User, { as: 'recordedBy', foreignKey: 'recorded_by_user_id', constraints: false });
ProjectDocument.hasMany(ProjectTestRequest, { as: 'testRequests', foreignKey: 'project_id' });
ProjectTestRequest.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
ProjectDocument.belongsTo(Document, { as: 'document', foreignKey: 'document_id', constraints: false });
Document.belongsTo(User, { as: 'owner', foreignKey: 'owner_id', constraints: false });
Document.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewer_id', constraints: false });
ProjectDocument.belongsTo(Teacher, { as: 'advisor', foreignKey: 'advisor_id', constraints: false });
ProjectDocument.belongsTo(Teacher, { as: 'coAdvisor', foreignKey: 'co_advisor_id', constraints: false });
ProjectDefenseRequest.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id', constraints: false });
ProjectDefenseRequest.hasMany(ProjectDefenseRequestAdvisorApproval, { as: 'advisorApprovals', foreignKey: 'request_id' });
ProjectDefenseRequestAdvisorApproval.belongsTo(ProjectDefenseRequest, { as: 'request', foreignKey: 'request_id', constraints: false });
ProjectDefenseRequestAdvisorApproval.belongsTo(Teacher, { as: 'teacher', foreignKey: 'teacher_id', constraints: false });

// Helper สร้าง student + user (เพื่อให้ include user ทำงานและไม่โดน FK constraint)
async function createStudent({ code, eligibleProject = true }) {
  const user = await User.create({ firstName: 'Stu', lastName: code.slice(-3) });
  return Student.create({
    userId: user.userId,
    studentCode: code,
    totalCredits: 150,
    majorCredits: 90,
    isEligibleProject: eligibleProject,
    isEligibleInternship: true
  });
}

jest.mock('../../config/database', () => mockDatabaseModule);
jest.mock('../../utils/logger', () => mockLogger);
const mockModels = {
  sequelize: mockSequelize,
  Student,
  ProjectDocument,
  ProjectMember,
  Academic,
  User,
  ProjectTrack,
  ProjectDefenseRequest,
  ProjectDefenseRequestAdvisorApproval,
  Teacher,
  Meeting,
  MeetingParticipant,
  MeetingLog,
  Document,
  ProjectExamResult,
  ProjectTestRequest,
  ProjectWorkflowState: mockProjectWorkflowState,
};

jest.mock('../../services/workflowService', () => ({
  updateStudentWorkflowActivity: mockUpdateWorkflowActivity
}));
jest.mock('../../models', () => mockModels);

const projectDocumentService = require('../../services/projectDocumentService');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  // ไม่สร้าง Academic เพื่อทดสอบ fallback (service จะใช้ปีปัจจุบัน + ภาค 1)
});

beforeEach(() => {
  mockUpdateWorkflowActivity.mockClear();
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockProjectWorkflowState.createForProject.mockClear();
  mockProjectWorkflowState.updateFromDefenseRequest.mockClear();
  mockProjectWorkflowState.updateFromExamResult.mockClear();
});

afterAll(async () => {
  await sequelize.close();
});

describe('projectDocumentService.createProject', () => {
  test('สร้างโครงงาน draft สำเร็จ (ไม่มี advisor)', async () => {
    const s1 = await createStudent({ code: '640000000001' });
    const s2 = await createStudent({ code: '640000000101' });
    const result = await projectDocumentService.createProject(s1.studentId, {
      projectNameTh: 'ระบบจัดการ',
      projectNameEn: 'Management System',
      secondMemberStudentCode: s2.studentCode,
    });
    expect(result.projectId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.members).toHaveLength(2);
    const roles = result.members.map((m) => m.role).sort();
    expect(roles).toEqual(['leader', 'member']);
  });

  test('ป้องกันสร้างซ้ำเมื่อมี project ยังไม่ archived ในฐานะ leader', async () => {
    const s2 = await createStudent({ code: '640000000002' });
    const s2Member = await createStudent({ code: '640000000102' });
    await projectDocumentService.createProject(s2.studentId, {
      secondMemberStudentCode: s2Member.studentCode,
    });
    const s3Member = await createStudent({ code: '640000000103' });
    await expect(
      projectDocumentService.createProject(s2.studentId, {
        secondMemberStudentCode: s3Member.studentCode,
      })
    )
      .rejects.toThrow(/คุณมีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว/);
  });

  test('ห้ามสร้างถ้าไม่ผ่าน eligibility', async () => {
    const s3 = await createStudent({ code: '640000000003', eligibleProject: false });
    const partner = await createStudent({ code: '640000000104' });
    await expect(
      projectDocumentService.createProject(s3.studentId, {
        secondMemberStudentCode: partner.studentCode,
      })
    )
      .rejects.toThrow(/ยังไม่มีสิทธิ์/);
  });
});

describe('projectDocumentService.addMember', () => {
  let leader, memberCandidate, project;
  beforeAll(async () => {
    leader = await createStudent({ code: '640000000010' });
    memberCandidate = await createStudent({ code: '640000000011' });
    project = await ProjectDocument.create({
      projectNameTh: 'ทดสอบ',
      projectNameEn: 'Test',
      status: 'draft',
      createdByStudentId: leader.studentId,
    });
    await ProjectMember.create({ projectId: project.projectId, studentId: leader.studentId, role: 'leader' });
  });

  test('เพิ่มสมาชิกคนที่สองสำเร็จ', async () => {
    const updated = await projectDocumentService.addMember(project.projectId, leader.studentId, memberCandidate.studentCode);
    expect(updated.members).toHaveLength(2);
    const roles = updated.members.map(m => m.role).sort();
    expect(roles).toEqual(['leader','member']);
  });

  test('ห้ามเพิ่มเกิน 2 คน', async () => {
    const extra = await createStudent({ code: '640000000012' });
    await expect(projectDocumentService.addMember(project.projectId, leader.studentId, extra.studentCode))
      .rejects.toThrow(/ครบ 2 คน/);
  });

  test('ห้ามเพิ่มโดย non-leader', async () => {
    const otherLeader = await createStudent({ code: '640000000013' });
    const otherMember = await createStudent({ code: '640000000015' });
    const otherProject = await projectDocumentService.createProject(otherLeader.studentId, {
      secondMemberStudentCode: otherMember.studentCode,
    });
    const candidate = await createStudent({ code: '640000000014' });
    await expect(projectDocumentService.addMember(otherProject.projectId, candidate.studentId, candidate.studentCode))
      .rejects.toThrow(/อนุญาตเฉพาะสมาชิกโครงงานเท่านั้นที่เพิ่มสมาชิกได้/);
  });
});

describe('projectDocumentService.updateMetadata & activateProject', () => {
  let leader, second, projectId;
  beforeAll(async () => {
    leader = await createStudent({ code: '640000000020' });
    second = await createStudent({ code: '640000000021' });
    const proj = await projectDocumentService.createProject(leader.studentId, {
      projectNameTh: 'Draft',
      projectNameEn: 'Draft EN',
      secondMemberStudentCode: second.studentCode,
    });
    projectId = proj.projectId;
  });

  test('ไม่สามารถ activate ถ้ายังไม่ครบเงื่อนไข (ขาด advisor/metadata)', async () => {
    await expect(projectDocumentService.activateProject(projectId, leader.studentId))
      .rejects.toThrow(/ต้องเลือกอาจารย์ที่ปรึกษาก่อน/);
  });

  test('เติมสมาชิกและ metadata แล้ว activate สำเร็จ', async () => {
    // second member already added from createProject, ensure metadata update + activate
    await projectDocumentService.updateMetadata(projectId, leader.studentId, {
      projectType: 'private',
      track: 'SE'
    });
    await ProjectDocument.update({ advisorId: 99 }, { where: { projectId } });
    const activated = await projectDocumentService.activateProject(projectId, leader.studentId);
    expect(activated.status).toBe('in_progress');
  });

  test('ล็อคชื่อหลัง in_progress (updateMetadata ไม่ควรเปลี่ยนชื่อ)', async () => {
    const before = await projectDocumentService.getProjectById(projectId);
    await projectDocumentService.updateMetadata(projectId, leader.studentId, { projectNameTh: 'ชื่อใหม่ไม่ควรเปลี่ยน' });
    const after = await projectDocumentService.getProjectById(projectId);
    expect(after.projectNameTh).toBe(before.projectNameTh); // unchanged
  });
});

describe('projectDocumentService exam result lifecycle', () => {
  let leader, member, projectId;

  beforeAll(async () => {
    leader = await createStudent({ code: '640000000030' });
    member = await createStudent({ code: '640000000031' });
    const project = await projectDocumentService.createProject(leader.studentId, {
      projectNameTh: 'โครงงานทดสอบ',
      projectNameEn: 'Test Project',
      secondMemberStudentCode: member.studentCode,
    });
    projectId = project.projectId;
    await projectDocumentService.updateMetadata(projectId, leader.studentId, {
      projectType: 'internal',
      track: 'CS'
    });
    await ProjectDocument.update({ advisorId: 501 }, { where: { projectId } });
    await projectDocumentService.activateProject(projectId, leader.studentId);
  });

  beforeEach(() => {
    mockUpdateWorkflowActivity.mockClear();
  });

  test('บันทึกผลสอบไม่ผ่านทำให้สถานะ student เป็น failed', async () => {
    const updated = await projectDocumentService.setExamResult(projectId, {
      result: 'failed',
      reason: 'ขาดคุณสมบัติ',
      advisorId: 777,
      actorUser: { userId: 999 }
    });
    expect(updated.examResult).toBe('failed');
    expect(updated.advisorId).toBe(777);
    const leaderAfter = await Student.findByPk(leader.studentId);
    expect(leaderAfter.projectStatus).toBe('failed');
    expect(leaderAfter.isEnrolledProject).toBe(true);
    const overallStatuses = mockUpdateWorkflowActivity.mock.calls.map(call => call[4]);
    expect(overallStatuses).toContain('failed');
  });

  test('นักศึกษารับทราบผลสอบไม่ผ่านแล้ว isEnrolledProject=false แต่ projectStatus ยังเป็น failed', async () => {
    const acknowledged = await projectDocumentService.acknowledgeExamResult(projectId, leader.studentId);
    expect(acknowledged.status).toBe('archived');
    expect(acknowledged.studentAcknowledgedAt).not.toBeNull();
    const leaderAfterAck = await Student.findByPk(leader.studentId);
    expect(leaderAfterAck.isEnrolledProject).toBe(false);
    expect(leaderAfterAck.projectStatus).toBe('failed');
  const overallStatuses = mockUpdateWorkflowActivity.mock.calls.map(call => call[4]);
  expect(overallStatuses).toContain('archived');
  });
});
