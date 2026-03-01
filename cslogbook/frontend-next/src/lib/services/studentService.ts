import { apiFetch, apiFetchData } from "@/lib/api/client";

export type EligibilityItem = {
  isEligible: boolean;
  canAccessFeature: boolean;
  canRegister: boolean;
  reason: string | null;
};

export type EligibilityStatus = {
  canAccess: boolean;
  canRegister: boolean;
  reason: string | null;
  registrationOpen: boolean;
  registrationReason: string | null;
  requiredCredits?: number | null;
  requiredMajorCredits?: number | null;
  currentCredits: number;
  currentMajorCredits: number;
  requiresInternshipCompletion?: boolean | null;
};

export type EligibilityRequirements = {
  totalCredits?: number | null;
  majorCredits?: number | null;
  requireInternship?: boolean | null;
  allowedSemesters?: number[] | null;
};

export type StudentEligibilityResponse = {
  success: boolean;
  student: {
    studentId: number;
    studentCode: string;
    totalCredits: number;
    majorCredits: number;
  };
  eligibility: {
    internship: EligibilityItem;
    project: EligibilityItem;
  };
  status: {
    internship: EligibilityStatus;
    project: EligibilityStatus;
  };
  requirements: {
    internship: EligibilityRequirements;
    project: EligibilityRequirements;
  };
  academicSettings?: {
    currentAcademicYear?: number | null;
    currentSemester?: number | null;
    internshipRegistrationPeriod?: unknown;
    projectRegistrationPeriod?: unknown;
  };
  curriculum?: {
    id: number | null;
    name: string | null;
    shortName: string | null;
    isActive: boolean;
  };
};

export type StudentProfile = {
  studentId: number;
  studentCode: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  classroom?: string | null;
  studentYear?: number | { year?: number | null } | null;
  totalCredits?: number | null;
  majorCredits?: number | null;
  requirements?: {
    internshipBaseCredits?: number | null;
    projectBaseCredits?: number | null;
    projectMajorBaseCredits?: number | null;
  } | null;
  eligibility?: {
    internship?: { eligible?: boolean; message?: string | null } | null;
    project?: { eligible?: boolean; message?: string | null } | null;
  } | null;
  isEligibleInternship?: boolean | null;
  isEligibleProject?: boolean | null;
  isEnrolledInternship?: boolean | null;
  internshipStatus?: string | null;
  isEnrolledProject?: boolean | null;
  projectStatus?: string | null;
  updatedAt?: string | null;
};

export async function getStudentEligibility(token: string) {
  return apiFetch<StudentEligibilityResponse>("/students/check-eligibility", {
    method: "GET",
    token,
  });
}

export type StudentDeadline = {
  id: number;
  name: string;
  deadlineAt: string;
  deadlineDate?: string;
  deadlineTime?: string;
  deadlineType?: string | null;
  relatedTo?: string | null;
  daysLeft?: number | null;
  hoursLeft?: number | null;
  allowLate?: boolean;
  lockAfterDeadline?: boolean;
  gracePeriodMinutes?: number | null;
};

export type StudentDeadlineSubmission = {
  submitted: boolean;
  submittedAt: string | null;
  late: boolean;
  status: string | null;
};

export type StudentDeadlineDetail = StudentDeadline & {
  status?: string | null;
  locked?: boolean;
  effectiveDeadlineAt?: string | null;
  windowStartAt?: string | null;
  windowEndAt?: string | null;
  windowStartDate?: string | null;
  windowStartTime?: string | null;
  windowEndDate?: string | null;
  windowEndTime?: string | null;
  isWindow?: boolean;
  acceptingSubmissions?: boolean;
  hasSubmission?: boolean;
  documentId?: number | null;
  documentStatus?: string | null;
  submittedAtLocal?: string | null;
  submission?: StudentDeadlineSubmission;
  academicYear?: number | string | null;
  semester?: number | null;
  description?: string | null;
  isCritical?: boolean;
  allDay?: boolean | null;
  visibilityScope?: string | null;
  publishAt?: string | null;
  isPublished?: boolean;
};


export async function getStudentUpcomingDeadlines(token: string, days = 7) {
  const data = await apiFetchData<StudentDeadline[]>(
    `/students/important-deadlines/upcoming?days=${days}`,
    {
      method: "GET",
      token,
    }
  );

  return data ?? [];
}

export async function getStudentDeadlineCalendar(token: string, academicYear?: string | number | null) {
  const params = new URLSearchParams();
  if (academicYear) {
    params.set("academicYear", String(academicYear));
  }

  const queryString = params.toString();
  const data = await apiFetchData<StudentDeadlineDetail[]>(
    `/students/important-deadlines${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      token,
    }
  );

  return data ?? [];
}

export type InternshipSummary = {
  documentId: number;
  status: string;
  companyName: string;
  companyAddress: string;
  startDate: string;
  endDate: string;
  supervisorName: string;
  supervisorPosition: string;
  supervisorPhone: string;
  supervisorEmail: string;
  totalDays: number;
  totalHours: number;
  approvedDays: number;
  approvedHours: number;
  learningOutcome?: string;
  studentInfo?: {
    studentId: string;
    fullName: string;
    email?: string;
  };
};

export type InternshipTimesheetStats = {
  total: number;
  completed: number;
  pending: number;
  totalHours: number;
  averageHoursPerDay: number;
  remainingDays: number;
  approvedBySupervisor: number;
};

export type InternshipCertificateStatus = {
  status: string;
  canRequestCertificate: boolean;
  requirements?: {
    totalHours?: { current?: number; approved?: number; required?: number; completed?: boolean };
    supervisorEvaluation?: { completed?: boolean; evaluationDate?: string | null };
    summarySubmission?: { completed?: boolean; submissionDate?: string | null };
  };
  certificateRequest?: {
    requestId?: number;
    requestDate?: string;
    status?: string;
    processedDate?: string | null;
    processedBy?: string | null;
  } | null;
  companyInfo?: {
    companyName?: string;
    companyAddress?: string;
    internshipStartDate?: string | null;
    internshipEndDate?: string | null;
    supervisorName?: string;
    supervisorPosition?: string;
    totalHours?: number;
    approvedHours?: number;
  };
};

export async function getStudentInternshipSummary(token: string) {
  const data = await apiFetchData<InternshipSummary | null>(
    "/internship/summary",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function getStudentInternshipTimesheetStats(token: string) {
  const data = await apiFetchData<InternshipTimesheetStats | null>(
    "/internship/logbook/timesheet/stats",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function getStudentCertificateStatus(token: string) {
  const data = await apiFetchData<InternshipCertificateStatus | null>(
    "/internship/certificate-status",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function getStudentInternshipStatus(token: string) {
  const [summaryResult, statsResult, certificateResult] = await Promise.allSettled([
    getStudentInternshipSummary(token),
    getStudentInternshipTimesheetStats(token),
    getStudentCertificateStatus(token),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const certificateStatus = certificateResult.status === "fulfilled" ? certificateResult.value : null;

  return { summary, stats, certificateStatus };
}

export type ProjectMemberSummary = {
  studentId: number;
  role?: string;
  studentCode?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  totalCredits?: number | null;
  majorCredits?: number | null;
};

export type ProjectSummary = {
  projectId: number;
  projectCode?: string | null;
  status?: string;
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectType?: string | null;
  advisorId?: number | null;
  advisorName?: string | null;
  coAdvisorId?: number | null;
  coAdvisorName?: string | null;
  academicYear?: number | null;
  semester?: number | null;
  examResult?: string | null;
  members?: ProjectMemberSummary[];
};

export type ProjectDefenseRequestSummary = {
  requestId: number;
  defenseType?: string | null;
  status?: string | null;
  submittedByStudentId?: number | null;
  submittedAt?: string | null;
  defenseScheduledAt?: string | null;
  defenseLocation?: string | null;
  defenseNote?: string | null;
};

export type ProjectMeetingMetrics = {
  requiredApprovedLogs?: number;
  totalMeetings?: number;
  totalApprovedLogs?: number;
  lastApprovedLogAt?: string | null;
  perStudent?: Array<{
    studentId: number;
    approvedLogs?: number;
    attendedMeetings?: number;
  }>;
};

export type ProjectSystemTestSummary = {
  requestId: number;
  status?: string | null;
  submittedAt?: string | null;
  testStartDate?: string | null;
  testDueDate?: string | null;
  evidenceSubmittedAt?: string | null;
};

export type ProjectDetail = ProjectSummary & {
  examFailReason?: string | null;
  studentAcknowledgedAt?: string | null;
  meetingMetrics?: ProjectMeetingMetrics | null;
  meetingMetricsPhase1?: ProjectMeetingMetrics | null;
  meetingMetricsPhase2?: ProjectMeetingMetrics | null;
  defenseRequests?: ProjectDefenseRequestSummary[];
  systemTestRequest?: ProjectSystemTestSummary | null;
};

export type ProjectWorkflowStateSummary = {
  projectId: number;
  currentPhase?: string;
  projectStatus?: string;
  isBlocked?: boolean;
  blockReason?: string | null;
  topicExamResult?: string | null;
  thesisExamResult?: string | null;
  lastActivityAt?: string | null;
  workflowStepMapping?: Record<string, unknown>;
  canSubmitTopicDefense?: boolean;
  canSubmitThesisDefense?: boolean;
  isDocumentSubmissionPhase?: boolean;
  isComplete?: boolean;
  project?: {
    projectId: number;
    projectNameTh?: string | null;
    projectNameEn?: string | null;
    status?: string | null;
  };
};

export type StudentProjectStatus = {
  project: ProjectSummary | null;
  workflow: ProjectWorkflowStateSummary | null;
};

export async function getStudentProjects(token: string) {
  const response = await apiFetch<{ success: boolean; data?: ProjectSummary[]; projects?: ProjectSummary[] }>(
    "/projects/mine",
    {
      method: "GET",
      token,
    }
  );

  return response.data ?? response.projects ?? [];
}

export async function getProjectById(token: string, projectId: number) {
  const data = await apiFetchData<ProjectDetail>(`/projects/${projectId}`, {
    method: "GET",
    token,
  });

  if (!data) {
    throw new Error("ไม่พบข้อมูลโครงงาน");
  }

  return data;
}

export async function acknowledgeTopicExamResult(token: string, projectId: number) {
  return apiFetch<{ success: boolean; message?: string }>(
    `/projects/${projectId}/topic-exam-result/ack`,
    {
      method: "PATCH",
      token,
    }
  );
}

export async function getProjectWorkflowState(token: string, projectId: number) {
  const data = await apiFetchData<ProjectWorkflowStateSummary>(
    `/projects/${projectId}/workflow-state`,
    {
      method: "GET",
      token,
    }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูลสถานะ workflow");
  }

  return data;
}

export async function getStudentProjectStatus(token: string): Promise<StudentProjectStatus> {
  const projects = await getStudentProjects(token);
  const project = projects[0] ?? null;

  if (!project?.projectId) {
    return { project: null, workflow: null };
  }

  try {
    const workflow = await getProjectWorkflowState(token, project.projectId);
    return { project, workflow };
  } catch (error) {
    console.warn("Failed to load project workflow state", error);
    return { project, workflow: null };
  }
}

export async function getStudentProjectDetail(token: string) {
  const projects = await getStudentProjects(token);
  const project = projects[0] ?? null;

  if (!project?.projectId) {
    return null;
  }

  return getProjectById(token, project.projectId);
}

export type UpdateContactInfoPayload = {
  classroom?: string | null;
  phoneNumber?: string | null;
};

export type UpdateCreditsPayload = {
  totalCredits: number;
  majorCredits: number;
};

export async function updateStudentContactInfo(studentCode: string, token: string, payload: UpdateContactInfoPayload) {
  const data = await apiFetchData<StudentProfile>(
    `/students/${studentCode}/contact-info`,
    {
      method: "PUT",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!data) {
    throw new Error("อัปเดตข้อมูลติดต่อไม่สำเร็จ");
  }

  return data;
}

export async function updateStudentCredits(studentCode: string, token: string, payload: UpdateCreditsPayload) {
  return apiFetch(`/students/${studentCode}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getStudentProfile(studentCode: string, token: string) {
  const data = await apiFetchData<StudentProfile>(`/students/${studentCode}`, {
    method: "GET",
    token,
  });

  if (!data) {
    throw new Error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
  }

  return data;
}
