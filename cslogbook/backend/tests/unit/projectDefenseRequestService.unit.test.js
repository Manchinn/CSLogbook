/**
 * Unit tests สำหรับ projectDefenseRequestService
 * โฟกัสการยื่นคำขอสอบโครงงานพิเศษ 1 (คพ.02)
 */

let SequelizeCtor;
let DataTypesCtor;
let Op;
let sequelize;
let Student;
let User;
let ProjectDocument;
let ProjectMember;
let ProjectDefenseRequest;
let ProjectDefenseRequestAdvisorApproval;
let Teacher;
let Meeting;
let MeetingParticipant;
let MeetingLog;
let ProjectExamResult;
let ProjectTestRequest;
let projectDefenseRequestService;
const mockSyncProjectWorkflowState = jest.fn().mockResolvedValue(null);

const formatDateOnly = (date) => {
  if (!(date instanceof Date)) return null;
  return date.toISOString().slice(0, 10);
};

async function createStudent(code) {
  const user = await User.create({ firstName: 'Stu', lastName: code.slice(-3) });
  return Student.create({ studentCode: code, userId: user.userId });
}

let leader;
let member;
let project;
let staffUser;
let advisor;

async function resetMeetings() {
  await MeetingLog.destroy({ where: {} });
  await MeetingParticipant.destroy({ where: {} });
  await Meeting.destroy({ where: {} });
}

async function resetExamAndTest() {
  await ProjectExamResult.destroy({ where: {} });
  await ProjectTestRequest.destroy({ where: {} });
}

async function seedApprovedMeetings(count = 5, { phase = 'phase1' } = {}) {
  // สร้างข้อมูลการพบอาจารย์ที่ได้รับอนุมัติครบตามจำนวนที่กำหนด เพื่อใช้ทดสอบเกณฑ์ยื่นสอบ
  for (let i = 0; i < count; i += 1) {
    const meeting = await Meeting.create({ projectId: project.projectId, phase });
    await MeetingParticipant.bulkCreate([
      { meetingId: meeting.meetingId, userId: leader.userId, role: 'student', attendanceStatus: 'present' },
      { meetingId: meeting.meetingId, userId: member.userId, role: 'student', attendanceStatus: 'present' }
    ]);
    await MeetingLog.create({ meetingId: meeting.meetingId, approvalStatus: 'approved', approvedAt: new Date() });
  }
}

const daysAgo = (days) => new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

async function seedProject1ExamPass() {
  return ProjectExamResult.create({
    projectId: project.projectId,
    examType: 'PROJECT1',
    result: 'PASS',
    recordedByUserId: staffUser.userId,
    recordedAt: daysAgo(45)
  });
}

async function seedSystemTestRequest(options = {}) {
  const {
    status = 'staff_approved',
    submittedDaysAgo = 60,
    dueDaysAgo = 5,
    includeEvidence = true
  } = options;

  return ProjectTestRequest.create({
    projectId: project.projectId,
    submittedByStudentId: leader.studentId,
    status,
    submittedAt: daysAgo(submittedDaysAgo),
    testStartDate: daysAgo(submittedDaysAgo),
    testDueDate: daysAgo(dueDaysAgo),
    staffDecidedAt: status === 'staff_approved' ? daysAgo(dueDaysAgo + 1) : null,
    evidenceSubmittedAt: includeEvidence ? daysAgo(Math.max(dueDaysAgo - 1, 0)) : null
  });
}

beforeAll(async () => {
  jest.resetModules();
  ({ Sequelize: SequelizeCtor, DataTypes: DataTypesCtor, Op } = require('sequelize'));

  process.env.THESIS_REQUIRED_APPROVED_LOGS = '4';

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
    submittedAt: { type: DataTypesCtor.DATE, field: 'submitted_at' },
    advisorApprovedAt: { type: DataTypesCtor.DATE, field: 'advisor_approved_at' },
    defenseScheduledAt: { type: DataTypesCtor.DATE, field: 'defense_scheduled_at' },
    defenseLocation: { type: DataTypesCtor.STRING, field: 'defense_location' },
    defenseNote: { type: DataTypesCtor.TEXT, field: 'defense_note' },
    scheduledByUserId: { type: DataTypesCtor.INTEGER, field: 'scheduled_by_user_id' },
    scheduledAt: { type: DataTypesCtor.DATE, field: 'scheduled_at' },
    staffVerifiedAt: { type: DataTypesCtor.DATE, field: 'staff_verified_at' },
    staffVerifiedByUserId: { type: DataTypesCtor.INTEGER, field: 'staff_verified_by_user_id' },
    staffVerificationNote: { type: DataTypesCtor.TEXT, field: 'staff_verification_note' }
  }, { tableName: 'project_defense_requests', underscored: true, timestamps: true });

  ProjectDefenseRequestAdvisorApproval = sequelize.define('ProjectDefenseRequestAdvisorApproval', {
    approvalId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'approval_id' },
    requestId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'request_id' },
    teacherId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'teacher_id' },
    teacherRole: { type: DataTypesCtor.STRING, field: 'teacher_role' },
    status: { type: DataTypesCtor.STRING, allowNull: false, defaultValue: 'pending' },
    note: { type: DataTypesCtor.TEXT },
    approvedAt: { type: DataTypesCtor.DATE, field: 'approved_at' }
  }, { tableName: 'project_defense_request_approvals', underscored: true, timestamps: true });

  Teacher = sequelize.define('Teacher', {
    teacherId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'teacher_id' },
    userId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'user_id' },
    teacherCode: { type: DataTypesCtor.STRING, allowNull: true, field: 'teacher_code' }
  }, { tableName: 'teachers', underscored: true, timestamps: false });

  Meeting = sequelize.define('Meeting', {
    meetingId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'meeting_id' },
    projectId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'project_id' },
    phase: { type: DataTypesCtor.STRING, allowNull: true }
  }, { tableName: 'meetings', underscored: true, timestamps: false });

  MeetingParticipant = sequelize.define('MeetingParticipant', {
    meetingId: { type: DataTypesCtor.INTEGER, primaryKey: true, field: 'meeting_id' },
    userId: { type: DataTypesCtor.INTEGER, primaryKey: true, field: 'user_id' },
    role: { type: DataTypesCtor.STRING, allowNull: false },
    attendanceStatus: { type: DataTypesCtor.STRING, allowNull: false, defaultValue: 'present', field: 'attendance_status' }
  }, { tableName: 'meeting_participants', underscored: true, timestamps: false });

  MeetingLog = sequelize.define('MeetingLog', {
    logId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'log_id' },
    meetingId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'meeting_id' },
    approvalStatus: { type: DataTypesCtor.STRING, allowNull: false, field: 'approval_status' },
    approvedAt: { type: DataTypesCtor.DATE, allowNull: true, field: 'approved_at' }
  }, { tableName: 'meeting_logs', underscored: true, timestamps: false });

  ProjectExamResult = sequelize.define('ProjectExamResult', {
    examResultId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'exam_result_id' },
    projectId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'project_id' },
    examType: { type: DataTypesCtor.STRING, allowNull: false, field: 'exam_type' },
    result: { type: DataTypesCtor.STRING, allowNull: false },
    recordedByUserId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'recorded_by_user_id' },
    recordedAt: { type: DataTypesCtor.DATE, allowNull: false, defaultValue: DataTypesCtor.NOW, field: 'recorded_at' }
  }, { tableName: 'project_exam_results', underscored: true, timestamps: false });

  ProjectTestRequest = sequelize.define('ProjectTestRequest', {
    requestId: { type: DataTypesCtor.INTEGER, primaryKey: true, autoIncrement: true, field: 'request_id' },
    projectId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'project_id' },
    submittedByStudentId: { type: DataTypesCtor.INTEGER, allowNull: false, field: 'submitted_by_student_id' },
    status: { type: DataTypesCtor.STRING, allowNull: false },
    submittedAt: { type: DataTypesCtor.DATE, allowNull: false, field: 'submitted_at' },
    testStartDate: { type: DataTypesCtor.DATE, allowNull: false, field: 'test_start_date' },
    testDueDate: { type: DataTypesCtor.DATE, allowNull: false, field: 'test_due_date' },
    staffDecidedAt: { type: DataTypesCtor.DATE, allowNull: true, field: 'staff_decided_at' },
    evidenceSubmittedAt: { type: DataTypesCtor.DATE, allowNull: true, field: 'evidence_submitted_at' }
  }, { tableName: 'project_test_requests', underscored: true, timestamps: false });

  ProjectDocument.hasMany(ProjectMember, { as: 'members', foreignKey: 'project_id' });
  ProjectMember.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
  ProjectMember.belongsTo(Student, { as: 'student', foreignKey: 'student_id' });
  ProjectDocument.hasMany(ProjectDefenseRequest, { as: 'defenseRequests', foreignKey: 'project_id' });
  ProjectDocument.belongsTo(Teacher, { as: 'advisor', foreignKey: 'advisor_id' });
  ProjectDocument.belongsTo(Teacher, { as: 'coAdvisor', foreignKey: 'co_advisor_id' });
  ProjectDocument.hasMany(ProjectExamResult, { as: 'examResults', foreignKey: 'project_id' });
  ProjectExamResult.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
  ProjectDocument.hasMany(ProjectTestRequest, { as: 'testRequests', foreignKey: 'project_id' });
  ProjectTestRequest.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
  Teacher.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  ProjectDefenseRequest.belongsTo(ProjectDocument, { as: 'project', foreignKey: 'project_id' });
  ProjectDefenseRequest.belongsTo(Student, { as: 'submittedBy', foreignKey: 'submitted_by_student_id' });
  ProjectDefenseRequest.belongsTo(User, { as: 'scheduledBy', foreignKey: 'scheduled_by_user_id' });
  ProjectDefenseRequest.belongsTo(User, { as: 'staffVerifiedBy', foreignKey: 'staff_verified_by_user_id' });
  ProjectDefenseRequest.hasMany(ProjectDefenseRequestAdvisorApproval, { as: 'advisorApprovals', foreignKey: 'request_id' });
  ProjectDefenseRequestAdvisorApproval.belongsTo(ProjectDefenseRequest, { as: 'request', foreignKey: 'request_id' });
  ProjectDefenseRequestAdvisorApproval.belongsTo(Teacher, { as: 'teacher', foreignKey: 'teacher_id' });

  jest.isolateModules(() => {
    jest.doMock('../../config/database', () => ({ sequelize }));
    jest.doMock('../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
    jest.doMock('../../services/projectDocumentService', () => ({
      syncProjectWorkflowState: mockSyncProjectWorkflowState,
      getProjectById: jest.fn(),
      getRequiredApprovedMeetingLogs: () => 5,
      buildProjectMeetingMetrics: async (projectId, students, options = {}) => {
        const metrics = {
          totalMeetings: 0,
          totalApprovedLogs: 0,
          lastApprovedLogAt: null,
          perStudent: {}
        };

        if (!Array.isArray(students) || students.length === 0) {
          return metrics;
        }

        const userToStudentId = {};
        const userIds = [];
        students.forEach(student => {
          metrics.perStudent[student.studentId] = { approvedLogs: 0, attendedMeetings: 0 };
          if (student.userId) {
            userToStudentId[student.userId] = student.studentId;
            userIds.push(student.userId);
          }
        });

        if (!userIds.length) {
          return metrics;
        }

        const meetingWhere = { projectId };
        const { phase } = options;
        if (phase) {
          const normalized = Array.isArray(phase) ? phase.filter(Boolean) : [phase].filter(Boolean);
          if (normalized.length === 1) {
            meetingWhere.phase = normalized[0];
          } else if (normalized.length > 1) {
            meetingWhere.phase = { [Op.in]: normalized };
          }
        }

        const meetings = await Meeting.findAll({ where: meetingWhere, raw: true });
        metrics.totalMeetings = meetings.length;
        if (!meetings.length) {
          return metrics;
        }

        const meetingIds = meetings.map(item => item.meetingId);
        const participants = await MeetingParticipant.findAll({
          where: { meetingId: meetingIds, userId: userIds },
          raw: true
        });
        const participantsByMeeting = new Map();
        participants.forEach(row => {
          const studentId = userToStudentId[row.userId];
          if (!studentId) return;
          if (!participantsByMeeting.has(row.meetingId)) {
            participantsByMeeting.set(row.meetingId, new Set());
          }
          participantsByMeeting.get(row.meetingId).add(studentId);
          metrics.perStudent[studentId].attendedMeetings += 1;
        });

        const approvedLogs = await MeetingLog.findAll({
          where: { meetingId: meetingIds, approvalStatus: 'approved' },
          order: [['approved_at', 'DESC']],
          raw: true
        });
        metrics.totalApprovedLogs = approvedLogs.length;

        approvedLogs.forEach(log => {
          if (!metrics.lastApprovedLogAt && log.approvedAt) {
            metrics.lastApprovedLogAt = log.approvedAt;
          }
          const studentSet = participantsByMeeting.get(log.meetingId);
          if (!studentSet) return;
          studentSet.forEach(studentId => {
            const current = metrics.perStudent[studentId];
            if (current) {
              current.approvedLogs += 1;
            }
          });
        });

        return metrics;
      }
    }));
    jest.doMock('../../models', () => ({
      sequelize,
      Student,
      User,
      ProjectDocument,
      ProjectMember,
      ProjectDefenseRequest,
      ProjectDefenseRequestAdvisorApproval,
      Teacher,
      Meeting,
      MeetingParticipant,
      MeetingLog,
      ProjectExamResult,
      ProjectTestRequest
    }));
    projectDefenseRequestService = require('../../services/projectDefenseRequestService');
  });

  await sequelize.sync({ force: true });
  leader = await createStudent('640000001111');
  member = await createStudent('640000001112');
  staffUser = await User.create({ firstName: 'Staff', lastName: 'Dept' });
  const advisorUserInstance = await User.create({ firstName: 'Advisor', lastName: 'One' });
  advisor = await Teacher.create({ userId: advisorUserInstance.userId, teacherCode: 'T001' });
  project = await ProjectDocument.create({
    projectNameTh: 'ระบบทดสอบ',
    projectNameEn: 'Test System',
    projectCode: 'PRJTEST-001',
    status: 'in_progress',
    advisorId: advisor.teacherId
  });
  await ProjectMember.bulkCreate([
    { projectId: project.projectId, studentId: leader.studentId, role: 'leader' },
    { projectId: project.projectId, studentId: member.studentId, role: 'member' }
  ]);
});

afterEach(() => {
  mockSyncProjectWorkflowState.mockClear();
});

beforeEach(async () => {
  await resetExamAndTest();
});

afterAll(async () => {
  await sequelize.close();
  jest.resetModules();
});

describe('submitProject1Request', () => {
  test('บันทึกคำขอใหม่สำเร็จและเรียก sync workflow แม้ยังไม่มีคำขอทดสอบระบบ', async () => {
    await resetMeetings();
    await seedApprovedMeetings(5);
    const payload = {
      advisorName: 'Dr.B',
      coAdvisorName: 'Dr.C',
      additionalNotes: 'พร้อมสำหรับการประเมิน',
      students: [
        { studentId: leader.studentId, phone: '0812345678', email: 'leader@example.com' },
        { studentId: member.studentId, phone: '0823456789', email: '' }
      ]
    };

    const record = await projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, payload);
    expect(record).toBeDefined();
    expect(record.status).toBe('advisor_in_review');
    expect(record.advisorApprovals).toBeDefined();
    expect(record.advisorApprovals).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'pending', teacherId: advisor.teacherId })
    ]));
    expect(record.formPayload.advisorName).toBe('Dr.B');
    expect(record.formPayload.coAdvisorName).toBe('Dr.C');
    expect(record.formPayload.students).toEqual(expect.arrayContaining([
      expect.objectContaining({ studentId: leader.studentId, phone: '0812345678', email: 'leader@example.com' }),
      expect.objectContaining({ studentId: member.studentId, phone: '0823456789', email: '' })
    ]));
    expect(record.formPayload.examLocation).toBeUndefined();
    expect(mockSyncProjectWorkflowState).toHaveBeenCalled();
  });

  test('ยับยั้งการส่งเมื่อบันทึกการพบอาจารย์ไม่ครบตามเกณฑ์', async () => {
    await resetMeetings();
    await expect(projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, {
      advisorName: 'Dr.Ready',
      students: [
        { studentId: leader.studentId, phone: '0800000000', email: '' },
        { studentId: member.studentId, phone: '0800000001', email: '' }
      ]
    })).rejects.toThrow(/บันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย/);
  });

  test('อนุญาตให้แก้ไขคำขอเดิมได้', async () => {
    await resetMeetings();
    await seedApprovedMeetings(5);
    const updated = await projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, {
      advisorName: 'อ. ที่ปรึกษา',
      additionalNotes: 'อัปเดตข้อมูล',
      students: [
        { studentId: leader.studentId, phone: '0899999999', email: 'leader@example.com' },
        { studentId: member.studentId, phone: '', email: '' }
      ]
    });
    expect(updated.status).toBe('advisor_in_review');
    expect(updated.formPayload.additionalNotes).toBe('อัปเดตข้อมูล');
    const leaderContact = updated.formPayload.students.find(item => item.studentId === leader.studentId);
    expect(leaderContact.phone).toBe('0899999999');
    expect(updated.formPayload.examDate).toBeUndefined();
  });

  test('ห้ามนักศึกษาที่ไม่ใช่หัวหน้ายื่นคำขอ', async () => {
    await resetMeetings();
    await expect(projectDefenseRequestService.submitProject1Request(project.projectId, member.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0800000000', email: '' },
        { studentId: member.studentId, phone: '0811111111', email: '' }
      ]
    })).rejects.toThrow(/อนุญาตเฉพาะหัวหน้าโครงงาน/);
  });

  test('ตรวจสอบ validation ข้อมูลไม่ครบ', async () => {
    await resetMeetings();
    await seedApprovedMeetings(5);
    await expect(projectDefenseRequestService.submitProject1Request(project.projectId, leader.studentId, {
      students: []
    })).rejects.toThrow(/ช่องติดต่อของสมาชิก/);
  });
});

describe('submitThesisRequest', () => {
  test('ยื่นคำขอสำเร็จเมื่อครบเงื่อนไขทั้งหมด', async () => {
    await resetMeetings();
    await seedApprovedMeetings(5, { phase: 'phase2' });
    await seedProject1ExamPass();
    const testRequest = await seedSystemTestRequest({ dueDaysAgo: 10, includeEvidence: true });
    const payload = {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: 'leader@example.com' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    };

    const record = await projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, payload);
    expect(record).toBeDefined();
    expect(record.defenseType).toBe('THESIS');
    expect(record.status).toBe('advisor_in_review');
    expect(record.formPayload.intendedDefenseDate).toBeNull();
    expect(record.formPayload.systemTestSnapshot).toEqual(expect.objectContaining({ requestId: testRequest.requestId }));
  });

  test('ปฏิเสธเมื่อยังไม่ผ่านการสอบโครงงานพิเศษ 1', async () => {
    await resetMeetings();
    await seedApprovedMeetings(5, { phase: 'phase2' });
    await seedSystemTestRequest({ dueDaysAgo: 15, includeEvidence: true });

    await expect(projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: '' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    })).rejects.toThrow(/ต้องผ่านการสอบโครงงานพิเศษ 1/);
  });

  test('ปฏิเสธเมื่อบันทึกการพบอาจารย์ไม่ครบตามเกณฑ์พิเศษ', async () => {
    await resetMeetings();
    await seedApprovedMeetings(3, { phase: 'phase2' });
    await seedProject1ExamPass();
    await seedSystemTestRequest({ dueDaysAgo: 20, includeEvidence: true });

    await expect(projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: '' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    })).rejects.toThrow(/บันทึกการพบอาจารย์ที่ได้รับอนุมัติอย่างน้อย/);
  });

  test('ปฏิเสธเมื่อสถานะคำขอทดสอบระบบยังไม่อนุมัติโดยเจ้าหน้าที่', async () => {
    await resetMeetings();
    await seedApprovedMeetings(6, { phase: 'phase2' });
    await seedProject1ExamPass();
    await seedSystemTestRequest({ status: 'pending_staff', includeEvidence: false });

    await expect(projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: '' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    })).rejects.toThrow(/ยังไม่ได้รับการอนุมัติคำขอทดสอบระบบ/);
  });

  test('ปฏิเสธเมื่อยังไม่อัปโหลดหลักฐานการทดสอบระบบครบ', async () => {
    await resetMeetings();
    await seedApprovedMeetings(6, { phase: 'phase2' });
    await seedProject1ExamPass();
    await seedSystemTestRequest({ includeEvidence: false, dueDaysAgo: 20 });

    await expect(projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: '' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    })).rejects.toThrow(/กรุณาอัปโหลดหลักฐานการประเมินการทดสอบระบบ/);
  });

  test('ปฏิเสธเมื่อยังไม่ครบกำหนด 30 วันของการทดสอบระบบ', async () => {
    await resetMeetings();
    await seedApprovedMeetings(6, { phase: 'phase2' });
    await seedProject1ExamPass();
    const testRequest = await seedSystemTestRequest({ dueDaysAgo: -2 });

    await expect(projectDefenseRequestService.submitThesisRequest(project.projectId, leader.studentId, {
      students: [
        { studentId: leader.studentId, phone: '0811111111', email: '' },
        { studentId: member.studentId, phone: '0822222222', email: '' }
      ]
    })).rejects.toThrow(/ยังไม่ครบกำหนดระยะเวลาทดสอบระบบ 30 วัน/);

    // ป้องกันไม่ให้ intended date ซ้ำหรือก่อน due date
    expect(testRequest.testDueDate).toBeInstanceOf(Date);
  });
});

describe('getLatestProject1Request', () => {
  test('ดึงคำขอล่าสุดกลับมาได้', async () => {
    const record = await projectDefenseRequestService.getLatestProject1Request(project.projectId);
    expect(record).toBeTruthy();
    expect(record.status).toBe('advisor_in_review');
  });
});

describe('scheduleProject1Defense (deprecated)', () => {
  test('ป้องกันการเรียกใช้งานและแจ้งเตือนให้ใช้ปฏิทิน', async () => {
    await expect(projectDefenseRequestService.scheduleProject1Defense(project.projectId, {})).rejects.toThrow(/ปฏิทินภาควิชา/);
  });
});

