import { apiFetch } from "@/lib/api/client";

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

type StudentDeadlinesResponse = {
  success: boolean;
  data: StudentDeadline[];
};

export async function getStudentUpcomingDeadlines(token: string, days = 7) {
  const response = await apiFetch<StudentDeadlinesResponse>(
    `/students/important-deadlines/upcoming?days=${days}`,
    {
      method: "GET",
      token,
    }
  );

  return response.data;
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
  const response = await apiFetch<{ success: boolean; data: InternshipSummary | null }>(
    "/internship/summary",
    {
      method: "GET",
      token,
    }
  );

  return response.data ?? null;
}

export async function getStudentInternshipTimesheetStats(token: string) {
  const response = await apiFetch<{ success: boolean; data: InternshipTimesheetStats | null; message?: string }>(
    "/logbooks/internship/timesheet/stats",
    {
      method: "GET",
      token,
    }
  );

  if (!response.success) return null;
  return response.data;
}

export async function getStudentCertificateStatus(token: string) {
  const response = await apiFetch<{ success: boolean; data: InternshipCertificateStatus | null }>(
    "/internship/certificate-status",
    {
      method: "GET",
      token,
    }
  );

  return response.data ?? null;
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
  coAdvisorId?: number | null;
  academicYear?: number | null;
  semester?: number | null;
  examResult?: string | null;
  members?: ProjectMemberSummary[];
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

export async function getProjectWorkflowState(token: string, projectId: number) {
  const response = await apiFetch<{ success: boolean; data: ProjectWorkflowStateSummary }>(
    `/projects/${projectId}/workflow-state`,
    {
      method: "GET",
      token,
    }
  );

  return response.data;
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
