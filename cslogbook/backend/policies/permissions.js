module.exports = {
  academic: {
    manage: ['admin']
  },

  admin: {
    access: ['admin', 'teacher:support']
  },

  curriculum: {
    manage: ['admin']
  },

  documents: {
    studentSubmit: ['student'],
    staffReview: ['admin', 'teacher']
  },

  internship: {
    student: ['student'],
    summary: ['student', 'teacher'],
    companyStats: ['student', 'teacher', 'admin'],
    cp05Head: [
      'admin',
      'teacher:position:หัวหน้าภาควิชา',
      'teacher:head_of_department'
    ],
    cp05Staff: ['admin', 'teacher:support'],
    cp05Reviewer: [
      'admin',
      'teacher:position:หัวหน้าภาควิชา',
      'teacher:head_of_department',
      'teacher:support'
    ],
    acceptanceHead: [
      'admin',
      'teacher:position:หัวหน้าภาควิชา',
      'teacher:head_of_department'
    ],
    acceptanceStaff: ['admin', 'teacher:support'],
    acceptanceReviewer: ['admin', 'teacher']
  },

  logbook: {
    student: ['student'],
    teacherApprove: ['teacher']
  },

  emailApproval: {
    request: ['student']
  },

  notificationSettings: {
    manage: ['admin', 'teacher:support']
  },

  projectMembers: {
    manage: ['admin', 'teacher:support']
  },

  projectTransition: {
    read: ['student', 'teacher', 'admin'],
    manage: ['admin']
  },

  studentPairs: {
    manage: ['admin', 'teacher:support']
  },

  students: {
    selfService: ['student'],
    manage: ['admin', 'teacher:support'],
    read: ['admin', 'teacher', 'student'],
    updateContact: ['admin', 'teacher', 'student'],
    updateProfile: ['admin', 'teacher:support', 'student']
  },

  teachers: {
    academicOnly: ['teacher:academic'],
    advisorList: ['student', 'teacher', 'admin'],
    manage: ['admin', 'teacher:support'],
    read: ['admin', 'teacher']
  },

  timeline: {
    readStudent: ['student', 'teacher', 'admin'],
    initStudent: ['student', 'teacher', 'admin'],
    updateStep: ['teacher', 'admin'],
    readAll: ['admin']
  },

  topicExam: {
    access: ['admin', 'teacher:support', 'teacher:topic_exam_access']
  },

  upload: {
    csvManage: ['admin', 'teacher:support']
  },

  workflowStepDefinition: {
    manage: ['admin', 'teacher:support']
  },

  project: {
    create: ['student'],
    viewMine: ['student'],
    milestoneManage: ['student'],
    artifactManage: ['student'],
    trackManage: ['student'],
    updateOwn: ['student'],
    addMember: ['student'],
    activate: ['student'],
    archive: ['admin'],
    topicExamRecord: ['admin', 'teacher:support'],
    topicExamAcknowledge: ['student'],
    examRecord: ['admin', 'teacher:support'],
    examAcknowledge: ['student'],
    finalDocumentStatus: ['admin', 'teacher:support'],
    systemTestAdvisorQueue: ['teacher'],
    systemTestStaffQueue: ['admin', 'teacher:support', 'teacher:can_export_project1'],
    systemTestAdvisorDecision: ['teacher'],
    systemTestStaffDecision: ['admin', 'teacher:support', 'teacher:can_export_project1'],
    kp02Submit: ['student'],
    kp02AdvisorQueue: ['teacher'],
    kp02AdvisorDecision: ['teacher'],
    kp02StaffQueue: ['admin', 'teacher:support', 'teacher:can_export_project1'],
    kp02StaffVerify: ['admin', 'teacher:support'],
    kp02Schedule: ['admin', 'teacher:support'],
    kp02Export: ['admin', 'teacher:support', 'teacher:can_export_project1']
  }
};
