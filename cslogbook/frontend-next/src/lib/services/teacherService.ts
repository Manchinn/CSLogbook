import { apiFetchData } from "@/lib/api/client";

export type TeacherDeadline = {
  id: number;
  name: string;
  relatedTo?: string | null;
  isCritical?: boolean;
  dueAt?: string | null;
  status?: string | null;
  daysLeft?: number | null;
  hoursLeft?: number | null;
  academicYear?: number | null;
  semester?: number | null;
};

export type TeacherMeetingStudent = {
  studentId: number | null;
  studentCode: string;
  name: string;
};

export type TeacherMeeting = {
  meetingId: number | null;
  meetingTitle: string | null;
  meetingDate: string | null;
  projectId: number | null;
  projectCode: string | null;
  projectTitleTh: string | null;
  projectTitleEn: string | null;
  daysLeft: number;
  students: TeacherMeetingStudent[];
};

export type TeacherMeetingLogItem = {
  logId: number | null;
  meetingId: number | null;
  projectId: number | null;
  projectCode: string | null;
  projectTitleTh: string | null;
  projectTitleEn: string | null;
  meetingTitle: string | null;
  meetingDate: string | null;
  submittedAt: string | null;
  pendingDays: number;
  recorderName?: string;
  students: TeacherMeetingStudent[];
};

export type TeacherQuickAction = {
  key: string;
  label: string;
  description?: string;
  pendingCount?: number;
  path: string;
};

export type TeacherDashboardData = {
  teacher: {
    id: number | null;
    code: string | null;
    name: string;
    position: string;
    email?: string;
  };
  advisees: {
    total: number;
    internshipInProgress: number;
    projectInProgress: number;
    internshipEligible: number;
    projectEligible: number;
  };
  projects: {
    active: number;
    completed: number;
  };
  queues: {
    meetingLogs: {
      pending: number;
      items: TeacherMeetingLogItem[];
    };
    documents: {
      pending: number;
    };
  };
  quickActions: TeacherQuickAction[];
  deadlines: TeacherDeadline[];
  upcomingMeetings: TeacherMeeting[];
  updatedAt: string;
};

export async function getTeacherOverview(token: string) {
  const data = await apiFetchData<TeacherDashboardData>(
    "/teachers/academic/dashboard",
    {
      method: "GET",
      token,
    }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูลแดชบอร์ดอาจารย์");
  }

  return data;
}

// =====================
// Meeting Approvals
// =====================

export type MeetingLogApproval = {
  id: number;
  meetingId: number;
  projectId: number;
  studentCode: string;
  studentName: string;
  projectTitle: string;
  topic: string;
  meetingDate: string;
  status: "pending" | "approved" | "rejected";
  advisorNotes?: string;
};

export type MeetingApprovalFilters = {
  academicYear?: string;
  semester?: string;
  projectId?: string;
  status?: string;
};

/**
 * ดึงรายการบันทึกการพบที่รออนุมัติ
 * TODO: implement when backend API is ready
 */
export async function getTeacherMeetingApprovals(
  _token: string,
  _filters?: MeetingApprovalFilters
): Promise<MeetingLogApproval[]> {
  // Placeholder - will implement when API is ready
  return [];
}

/**
 * อนุมัติบันทึกการพบ
 * TODO: implement when backend API is ready
 */
export async function approveMeetingLog(
  _token: string,
  _projectId: number,
  _meetingId: number,
  _logId: number,
  _notes?: string
): Promise<void> {
  // Placeholder - will implement when API is ready
  return;
}

/**
 * ปฏิเสธบันทึกการพบ
 * TODO: implement when backend API is ready
 */
export async function rejectMeetingLog(
  _token: string,
  _projectId: number,
  _meetingId: number,
  _logId: number,
  _notes: string
): Promise<void> {
  // Placeholder - will implement when API is ready
  return;
}

// =====================
// Advisor Queues
// =====================

export type DefenseRequest = {
  id: number;
  projectId: number;
  projectTitle: string;
  studentNames: string[];
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  advisorStatus?: "pending" | "approved" | "rejected";
  coAdvisorStatus?: "pending" | "approved" | "rejected";
};

/**
 * ดึงคำขอสอบ คพ.02 (Advisor Queue)
 * TODO: implement when backend API is ready
 */
export async function getAdvisorKP02Queue(_token: string): Promise<DefenseRequest[]> {
  // Placeholder - will implement when API is ready
  return [];
}

/**
 * ดึงคำขอสอบ คพ.03 (Thesis Advisor Queue)
 * TODO: implement when backend API is ready
 */
export async function getAdvisorThesisQueue(_token: string): Promise<DefenseRequest[]> {
  // Placeholder - will implement when API is ready
  return [];
}

// =====================
// System Test Advisor Queue
// =====================

export type SystemTestRequest = {
  id: number;
  projectId: number;
  projectTitle: string;
  studentNames: string[];
  requestDate: string;
  testStartDate?: string;
  testDueDate?: string;
  status: "pending" | "approved" | "rejected";
  advisorStatus?: "pending" | "approved" | "rejected";
  coAdvisorStatus?: "pending" | "approved" | "rejected";
};

/**
 * ดึงคำขอทดสอบระบบ (Advisor Queue)
 * TODO: implement when backend API is ready
 */
export async function getAdvisorSystemTestQueue(
  _token: string
): Promise<SystemTestRequest[]> {
  // Placeholder - will implement when API is ready
  return [];
}

// =====================
// Approve Documents (หัวหน้าภาค)
// =====================

export type InternshipDocument = {
  id: number;
  documentId: string;
  studentCode: string;
  studentName: string;
  companyName: string;
  documentType: "cs05" | "acceptance";
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  academicYear: string;
  semester: string;
};

export type ApproveDocumentsFilters = {
  status?: string;
  academicYear?: string;
  semester?: string;
  studentYear?: string;
};

/**
 * ดึงคิวเอกสาร CS05 (หัวหน้าภาค)
 * TODO: implement when backend API is ready
 */
export async function getCS05HeadQueue(
  _token: string,
  _filters?: ApproveDocumentsFilters
): Promise<InternshipDocument[]> {
  // Placeholder - will implement when API is ready
  return [];
}

/**
 * ดึงคิวหนังสือส่งตัว (หัวหน้าภาค)
 * TODO: implement when backend API is ready
 */
export async function getAcceptanceLetterHeadQueue(
  _token: string,
  _filters?: ApproveDocumentsFilters
): Promise<InternshipDocument[]> {
  // Placeholder - will implement when API is ready
  return [];
}

// =====================
// Topic Exam Overview
// =====================

export type TopicExamProject = {
  id: number;
  projectId: number;
  projectTitle: string;
  studentNames: string[];
  advisorName: string;
  examDate?: string;
  examResult?: "pass" | "fail" | "pending";
  academicYear: string;
  semester: string;
};

/**
 * ดึงรายชื่อหัวข้อโครงงานพิเศษ
 * TODO: implement when backend API is ready
 */
export async function getTopicExamOverview(
  _token: string,
  _academicYear?: string,
  _semester?: string
): Promise<TopicExamProject[]> {
  // Placeholder - will implement when API is ready
  return [];
}
