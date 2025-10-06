const { buildSummary } = require('../../services/meetingSummaryHelper');

/**
 * ทดสอบฟังก์ชัน buildSummary ที่ใช้สรุปจำนวนครั้งการพบและการอนุมัติ
 */
describe('meetingService.buildSummary', () => {
  const members = [
    {
      student: {
        studentId: 1,
        studentCode: '640000000001',
        user: {
          userId: 101,
          firstName: 'สมชาย',
          lastName: 'ใจดี'
        }
      }
    },
    {
      student: {
        studentId: 2,
        studentCode: '640000000002',
        user: {
          userId: 102,
          firstName: 'สมหญิง',
          lastName: 'กล้าหาญ'
        }
      }
    }
  ];

  test('นับจำนวนครั้งที่ได้รับการอนุมัติของนักศึกษาแต่ละคนได้ถูกต้อง', () => {
    const meetings = [
      {
        phase: 'phase1',
        participants: [
          { userId: 101, role: 'student', attendanceStatus: 'present' },
          { userId: 102, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'approved' },
          { approvalStatus: 'approved' }
        ]
      },
      {
        phase: 'phase2',
        participants: [
          { userId: 101, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'pending' },
          { approvalStatus: 'approved' }
        ]
      }
    ];

  const summary = buildSummary(meetings, members);

    expect(summary.totalMeetings).toBe(2);
    expect(summary.totalLogs).toBe(4);
    expect(summary.approvedLogs).toBe(3);
    expect(summary.pendingLogs).toBe(1);

    const student101 = summary.approvalsByStudent.find(item => item.userId === 101);
    const student102 = summary.approvalsByStudent.find(item => item.userId === 102);

  expect(student101).toMatchObject({ totalLogs: 4, approvedLogs: 3, studentCode: '640000000001' });
    expect(student102).toMatchObject({ totalLogs: 2, approvedLogs: 2, studentCode: '640000000002' });
  });

  test('ไม่นับนักศึกษาที่ไม่มาร่วมประชุมหรือไม่มีข้อมูลผู้ใช้', () => {
    const meetings = [
      {
        phase: 'phase1',
        participants: [
          { userId: 101, role: 'student', attendanceStatus: 'absent' },
          { userId: 999, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'approved' }
        ]
      }
    ];

  const summary = buildSummary(meetings, members);

    const student101 = summary.approvalsByStudent.find(item => item.userId === 101);
    const student102 = summary.approvalsByStudent.find(item => item.userId === 102);

    expect(student101.totalLogs).toBe(0);
    expect(student101.approvedLogs).toBe(0);
    expect(student102.totalLogs).toBe(0);
    expect(student102.approvedLogs).toBe(0);
  });

  test('แยกสรุปตาม phase และใช้ค่าเริ่มต้นเมื่อไม่ระบุ phase', () => {
    const meetings = [
      {
        // ไม่ระบุ phase -> ต้องถูกนับเป็น phase1
        participants: [
          { userId: 101, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'approved' }
        ]
      },
      {
        phase: 'phase1',
        participants: [
          { userId: 101, role: 'student', attendanceStatus: 'present' },
          { userId: 102, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'pending' }
        ]
      },
      {
        phase: 'phase2',
        participants: [
          { userId: 102, role: 'student', attendanceStatus: 'present' }
        ],
        logs: [
          { approvalStatus: 'approved' },
          { approvalStatus: 'approved' }
        ]
      }
    ];

    const summary = buildSummary(meetings, members);
    const phase1 = summary.phaseBreakdown.phase1;
    const phase2 = summary.phaseBreakdown.phase2;

    expect(phase1.totalMeetings).toBe(2);
    expect(phase1.approvedLogs).toBe(1);
    expect(phase2.totalMeetings).toBe(1);
    expect(phase2.approvedLogs).toBe(2);

    const student1Phase2 = phase2.approvalsByStudent.find(item => item.userId === 101);
    const student2Phase2 = phase2.approvalsByStudent.find(item => item.userId === 102);

    expect(student1Phase2.approvedLogs).toBe(0);
    expect(student2Phase2.approvedLogs).toBe(2);
  });
});
