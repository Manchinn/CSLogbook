/** Test data definitions สำหรับ E2E workflow tests */
export const SEED_DATA = {
  // Project สำหรับ test meeting-logbook-flow, kp02-defense-flow, thesis-flow
  testProject: {
    title: 'E2E Test Project — ระบบจัดการข้อมูลนักศึกษา',
    titleEn: 'E2E Test Project — Student Management System',
  },

  // Meeting records — ต้อง ≥4 เพื่อ unlock KP02 submit
  meetings: [
    {
      title: 'E2E Meeting 1 — ออกแบบ ER Diagram',
      date: '2026-02-01T10:00:00+07:00',
      log: {
        discussionTopic: 'ออกแบบ Entity-Relationship Diagram',
        currentProgress: 'รวบรวม requirements เสร็จแล้ว',
        nextActionItems: 'สร้าง ER Diagram ฉบับร่าง',
      },
    },
    {
      title: 'E2E Meeting 2 — Review database schema',
      date: '2026-02-15T10:00:00+07:00',
      log: {
        discussionTopic: 'Review database schema และ normalization',
        currentProgress: 'ER Diagram เสร็จแล้ว ต้อง normalize',
        nextActionItems: 'ปรับ schema ตาม feedback อาจารย์',
      },
    },
    {
      title: 'E2E Meeting 3 — Frontend wireframe',
      date: '2026-03-01T10:00:00+07:00',
      log: {
        discussionTopic: 'ออกแบบ UI wireframe หน้าหลัก',
        currentProgress: 'Backend API พร้อมแล้ว',
        nextActionItems: 'สร้าง React components ตาม wireframe',
      },
    },
    {
      title: 'E2E Meeting 4 — API integration testing',
      date: '2026-03-08T10:00:00+07:00',
      log: {
        discussionTopic: 'ทดสอบ API integration frontend-backend',
        currentProgress: 'UI components พร้อม ต้องต่อ API',
        nextActionItems: 'แก้ bugs จาก integration test',
      },
    },
  ],

  // Meeting log สำหรับ meeting-approvals test (จะเว้นไว้เป็น pending)
  pendingMeetingLog: {
    title: 'E2E Meeting 5 — Pending approval test',
    date: '2026-03-15T10:00:00+07:00',
    log: {
      discussionTopic: 'E2E Seed — รออนุมัติจากอาจารย์',
      currentProgress: 'สร้างไว้สำหรับทดสอบ approval flow',
      nextActionItems: 'รอ advisor approve',
    },
  },

  // Internship CS05 data สำหรับ internship-flow test
  internshipCS05: {
    companyName: 'E2E Test Company Co., Ltd.',
    companyAddress: '123 ถนนพระราม 9 กรุงเทพฯ 10120',
    position: 'Software Developer Intern',
    contactPersonName: 'คุณทดสอบ ระบบ',
    contactPersonPosition: 'HR Manager',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
  },
};

/** Test data สำหรับ evaluation & certificate flow tests */
export const EVALUATION_SEED = {
  // Token ที่ valid สำหรับ test supervisor evaluation form
  // ต้อง generate จาก API — ใส่ค่าหลัง seed
  supervisorEvalToken: process.env.E2E_EVAL_TOKEN || '',
  timesheetApprovalToken: process.env.E2E_TIMESHEET_TOKEN || '',
};

/** Test data สำหรับ admin document management tests */
export const DOCUMENT_SEED = {
  // Documents ที่จะถูกสร้างเป็น pending สำหรับ test approve/reject
  pendingCS05: {
    companyName: 'E2E Document Test Company',
    companyAddress: '456 ถนนสุขุมวิท กรุงเทพฯ 10110',
    position: 'QA Engineer Intern',
    contactPersonName: 'คุณทดสอบ เอกสาร',
    contactPersonPosition: 'IT Manager',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
  },
};

/** Test data สำหรับ exam results tests */
export const EXAM_SEED = {
  // Project ที่มี topic submitted + พร้อมบันทึกผลสอบ
  topicExamProject: {
    title: 'E2E Exam Test Project — ระบบวิเคราะห์ข้อมูล',
    titleEn: 'E2E Exam Test Project — Data Analytics System',
  },
};
