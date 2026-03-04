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
    throw new Error("ไม่พบข้อมูลหน้าหลักอาจารย์");
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
  projectCode?: string;
  studentCode: string;
  studentName: string;
  projectTitle: string;
  topic: string;
  meetingDate: string;
  submittedAt?: string;
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
 */
export async function getTeacherMeetingApprovals(
  token: string,
  filters?: MeetingApprovalFilters
): Promise<MeetingLogApproval[]> {
  const params = new URLSearchParams();
  if (filters?.academicYear) params.append("academicYear", filters.academicYear);
  if (filters?.semester) params.append("semester", filters.semester);
  if (filters?.projectId) params.append("projectId", filters.projectId);
  if (filters?.status) params.append("status", filters.status);

  const queryString = params.toString();
  const url = queryString ? `/teachers/meeting-approvals?${queryString}` : "/teachers/meeting-approvals";

  const data = await apiFetchData<{ items: MeetingLogApproval[] }>(url, {
    method: "GET",
    token,
  });

  return data?.items || [];
}

/**
 * อนุมัติหรือปฏิเสธบันทึกการพบ
 */
export async function updateMeetingLogApproval(
  token: string,
  projectId: number,
  meetingId: number,
  logId: number,
  decision: "approve" | "reject",
  note?: string
): Promise<void> {
  await apiFetchData<void>(
    `/projects/${projectId}/meetings/${meetingId}/logs/${logId}/approval`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ decision, note }),
    }
  );
}

// =====================
// Advisor Queues
// =====================

export type ProjectMember = {
  studentCode: string;
  name: string;
};

export type AdvisorApproval = {
  teacherId: number;
  teacherName: string;
  role: "advisor" | "co_advisor";
  status: "pending" | "approved" | "rejected";
  note?: string;
  approvedAt?: string;
};

export type MeetingMetrics = {
  totalMeetings: number;
  approvedLogs: number;
  minimumRequired: number;
  lastApprovalDate?: string;
};

export type StaffVerification = {
  staffName?: string;
  verifiedAt?: string;
  note?: string;
};

export type DefenseSchedule = {
  scheduledDate?: string;
  location?: string;
};

export type DefenseRequest = {
  id: number;
  projectId: number;
  projectTitle: string;
  project?: {
    projectId: number;
    projectCode?: string;
    projectNameTh?: string;
    projectNameEn?: string;
    members?: ProjectMember[];
  };
  requestDate: string;
  status: "pending" | "approved" | "rejected" | "advisor_in_review" | "advisor_approved" | "staff_verified" | "scheduled" | "completed";
  advisorStatus?: "pending" | "approved" | "rejected";
  coAdvisorStatus?: "pending" | "approved" | "rejected";
  myApproval?: {
    status: "pending" | "approved" | "rejected";
    note?: string;
  };
  submittedAt?: string;
  submittedLate?: boolean;
  advisors?: AdvisorApproval[];
  meetingMetrics?: MeetingMetrics;
  staffVerification?: StaffVerification;
  defenseSchedule?: DefenseSchedule;
};

/**
 *ดึงคำขอสอบ คพ.02 (Advisor Queue)
 */
export async function getAdvisorKP02Queue(token: string): Promise<DefenseRequest[]> {
  const data = await apiFetchData<DefenseRequest[]>("/projects/kp02/advisor-queue", {
    method: "GET",
    token,
  });

  return data || [];
}

/**
 * อนุมัติหรือปฏิเสธคำขอสอบ คพ.02 หรือ คพ.03
 */
export async function submitKP02AdvisorDecision(
  token: string,
  projectId: number,
  decision: "approve" | "reject",
  note?: string,
  defenseType: "PROJECT1" | "THESIS" = "PROJECT1"
): Promise<void> {
  await apiFetchData<void>(`/projects/${projectId}/kp02/advisor-approve`, {
    method: "POST",
    token,
    body: JSON.stringify({ decision, note, defenseType }),
  });
}

/**
 * ดึงคำขอสอบ คพ.03 (Thesis Advisor Queue)
 */
export async function getAdvisorThesisQueue(token: string): Promise<DefenseRequest[]> {
  const data = await apiFetchData<DefenseRequest[]>(
    "/projects/kp02/advisor-queue?defenseType=THESIS",
    {
      method: "GET",
      token,
    }
  );

  return data || [];
}

// =====================
// System Test Advisor Queue
// =====================

export type SystemTestTimeline = {
  step: "submitted" | "advisor" | "co_advisor" | "staff" | "evidence_uploaded";
  status: "completed" | "pending";
  completedAt?: string;
  note?: string;
  actorName?: string;
};

export type SystemTestRequest = {
  id: number | string; // requestId
  projectId: number;
  projectTitle: string;
  projectSnapshot?: {
    projectId: number;
    projectCode?: string;
    projectNameTh?: string;
    projectNameEn?: string;
  };
  submittedBy?: {
    studentCode: string;
    name: string;
  };
  requestDate: string;
  submittedAt?: string;
  testStartDate?: string;
  testDueDate?: string;
  status: "pending" | "approved" | "rejected" | "pending_advisor" | "pending_staff" | "staff_approved";
  advisorStatus?: "pending" | "approved" | "rejected";
  coAdvisorStatus?: "pending" | "approved" | "rejected";
  studentNote?: string;
  pdfFile?: {
    filename: string;
    url: string;
  };
  advisors?: AdvisorApproval[];
  timeline?: SystemTestTimeline[];
};

/**
 * ดึงคำขอทดสอบระบบ (Advisor Queue)
 */
export async function getAdvisorSystemTestQueue(token: string): Promise<SystemTestRequest[]> {
  const data = await apiFetchData<SystemTestRequest[]>("/projects/system-test/advisor-queue", {
    method: "GET",
    token,
  });

  return data || [];
}

/**
 * อนุมัติหรือปฏิเสธคำขอทดสอบระบบ
 */
export async function submitSystemTestAdvisorDecision(
  token: string,
  projectId: number,
  decision: "approve" | "reject",
  note?: string
): Promise<void> {
  await apiFetchData<void>(`/projects/${projectId}/system-test/request/advisor-decision`, {
    method: "POST",
    token,
    body: JSON.stringify({ decision, note }),
  });
}

// =====================
// Approve Documents (หัวหน้าภาค)
// =====================

export type InternshipDocument = {
  id: number;         // ตรงกับ documentId (integer PK) — ใช้ id ก็ได้ documentId ก็ได้
  documentId: number; // integer PK ของตาราง documents
  studentCode: string;
  studentId: string;
  studentName: string;
  companyName: string;
  documentType: "cs05" | "acceptance";
  status: "pending" | "approved" | "rejected" | "acceptance_approved" | "referral_ready" | "referral_downloaded" | "completed" | "cancelled";
  submittedAt: string;
  submittedDate: string;
  academicYear: string;
  semester: string;
  pdfFile?: {
    url: string;
    filename: string;
  };
  comment?: string;
  rejectionReason?: string;
};

export type ApproveDocumentsFilters = {
  status?: string;
  academicYear?: string;
  semester?: string;
  studentYear?: string;
};

/**
 * ดึงคิวเอกสาร CS05 (หัวหน้าภาค)
 */
export async function getCS05HeadQueue(
  token: string,
  filters?: ApproveDocumentsFilters
): Promise<InternshipDocument[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.academicYear) params.append("academicYear", filters.academicYear);
  if (filters?.semester) params.append("semester", filters.semester);
  if (filters?.studentYear) params.append("studentYear", filters.studentYear);

  const queryString = params.toString();
  const url = queryString
    ? `/internship/cs-05/head/queue?${queryString}`
    : "/internship/cs-05/head/queue";

  const data = await apiFetchData<InternshipDocument[]>(url, {
    method: "GET",
    token,
  });

  return data || [];
}

/**
 * อนุมัติเอกสาร CS05
 */
export async function approveCS05Document(
  token: string,
  documentId: string,
  comment?: string,
  letterType?: string
): Promise<void> {
  await apiFetchData<void>(`/internship/cs-05/${documentId}/approve`, {
    method: "POST",
    token,
    body: JSON.stringify({ comment, letterType }),
  });
}

/**
 * ปฏิเสธเอกสาร CS05
 */
export async function rejectCS05Document(
  token: string,
  documentId: string,
  reason: string
): Promise<void> {
  await apiFetchData<void>(`/internship/cs-05/${documentId}/reject`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason }),
  });
}

/**
 * ดึงคิวหนังสือส่งตัว (หัวหน้าภาค)
 */
export async function getAcceptanceLetterHeadQueue(
  token: string,
  filters?: ApproveDocumentsFilters
): Promise<InternshipDocument[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.academicYear) params.append("academicYear", filters.academicYear);
  if (filters?.semester) params.append("semester", filters.semester);

  const queryString = params.toString();
  const url = queryString
    ? `/internship/acceptance/head/queue?${queryString}`
    : "/internship/acceptance/head/queue";

  const data = await apiFetchData<InternshipDocument[]>(url, {
    method: "GET",
    token,
  });

  return data || [];
}

/**
 * อนุมัติหนังสือส่งตัว
 */
export async function approveAcceptanceLetter(
  token: string,
  documentId: string,
  comment?: string
): Promise<void> {
  await apiFetchData<void>(`/internship/acceptance/${documentId}/approve`, {
    method: "POST",
    token,
    body: JSON.stringify({ comment }),
  });
}

/**
 * ปฏิเสธหนังสือส่งตัว
 */
export async function rejectAcceptanceLetter(
  token: string,
  documentId: string,
  reason: string
): Promise<void> {
  await apiFetchData<void>(`/internship/acceptance/${documentId}/reject`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason }),
  });
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
 */
export async function getTopicExamOverview(
  token: string,
  academicYear?: string,
  semester?: string
): Promise<TopicExamProject[]> {
  const params = new URLSearchParams();
  if (academicYear) params.append("academicYear", academicYear);
  if (semester) params.append("semester", semester);

  const queryString = params.toString();
  const url = queryString
    ? `/projects/topic-exam/overview?${queryString}`
    : "/projects/topic-exam/overview";

  const response = await apiFetchData<{ data: TopicExamProject[]; total: number }>(url, {
    method: "GET",
    token,
  });

  return response?.data || [];
}

// =====================
// Teacher Deadlines
// =====================

/**
 * ดึงรายการกำหนดการสำคัญสำหรับอาจารย์
 */
export async function getTeacherImportantDeadlines(token: string): Promise<TeacherDeadline[]> {
  const data = await apiFetchData<TeacherDeadline[]>("/teachers/important-deadlines", {
    method: "GET",
    token,
  });

  return data || [];
}
