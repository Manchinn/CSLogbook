import { apiFetch } from "@/lib/api/client";
import {
  getDeadlineAcademicYearsCompatibility,
  getDeadlineOverdueCompatibility,
  getDeadlineUpcomingCompatibility,
  getInternshipLogbookComplianceCompatibility,
  getProjectsAdvisorLoadCompatibility,
  getReportsOverviewCompatibility,
  getStudentDeadlineHistoryCompatibility,
  getWorkflowBlockedStudentsCompatibility,
  getWorkflowBottlenecksCompatibility,
} from "@/lib/services/compatibilityService";

// ---- Types ----

export type InternshipStudentSummary = {
  enrolledCount?: number | null;
  completed?: number | null;
  inProgress?: number | null;
  notStarted?: number | null;
  totalStudents?: number | null;
  started?: number | null;
};

export type InternshipEvaluationSummary = {
  criteriaAverages?: Array<{ criteriaName: string; average: number }> | null;
  gradeDistribution?: Array<{ grade: string; count: number }> | null;
};

export type EnrolledInternshipStudent = {
  studentCode?: string | null;
  fullName?: string | null;
  studentYear?: number | null;
  internshipStatus?: string | null;
  companyName?: string | null;
  internshipPosition?: string | null;
  supervisorName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  internshipId?: number | null;
};

export type ProjectStatusSummary = {
  totalProjects?: number | null;
  activeProjects?: number | null;
  completedProjects?: number | null;
  criticalIssues?: number | null;
  project1?: {
    total?: number | null;
    passed?: number | null;
    failed?: number | null;
    pending?: number | null;
  } | null;
  project2?: {
    total?: number | null;
    passed?: number | null;
    failed?: number | null;
    pending?: number | null;
  } | null;
  examTrend?: Array<{ year: number; project1Pass: number; project2Pass: number }> | null;
  byStatus?: Array<{ status: string; count: number }> | null;
  byPhase?: Array<{ phase: string; count: number }> | null;
};

export type ProjectListItem = {
  projectId?: number | null;
  projectCode?: string | null;
  projectTitle?: string | null;
  status?: string | null;
  phase?: string | null;
  members?: Array<{ studentCode: string; name: string }> | null;
  advisorName?: string | null;
};

export type WorkflowProgressSummary = {
  totalStudents?: number | null;
  inProgress?: number | null;
  completed?: number | null;
  blocked?: number | null;
};

export type WorkflowFunnelStep = {
  stepName: string;
  count: number;
  percentage?: number | null;
};

export type WorkflowBottleneck = {
  stepName: string;
  stuckCount: number;
  avgDaysStuck?: number | null;
};

export type BlockedStudent = {
  studentCode?: string | null;
  fullName?: string | null;
  stuckStepName?: string | null;
  daysSinceLastUpdate?: number | null;
};

export type WorkflowProgressData = {
  summary?: WorkflowProgressSummary | null;
  funnelSteps?: WorkflowFunnelStep[] | null;
  bottlenecks?: WorkflowBottleneck[] | null;
  statusData?: Array<{ status: string; count: number }> | null;
  blockedStudents?: BlockedStudent[] | null;
};

export type DeadlineComplianceReport = {
  totalDeadlines?: number | null;
  onTimePercentage?: number | null;
  upcomingCount?: number | null;
  overdueCount?: number | null;
  deadlines?: Array<{
    deadlineId: number;
    deadlineName: string;
    deadlineDate: string;
    complianceRate: number;
    totalStudents: number;
    onTimeCount: number;
    lateCount: number;
  }> | null;
  upcomingDeadlines?: Array<{
    deadlineId: number;
    deadlineName: string;
    deadlineDate: string;
    daysUntil: number;
  }> | null;
  overdueDeadlines?: Array<{
    deadlineId: number;
    deadlineName: string;
    deadlineDate: string;
    daysOverdue: number;
  }> | null;
  lateStudents?: Array<{
    studentCode: string;
    fullName: string;
    deadlineName: string;
    daysLate: number;
  }> | null;
};

export type AdvisorWorkloadItem = {
  teacherId?: number | null;
  teacherCode?: string | null;
  name?: string | null;
  advisorProjectCount?: number | null;
  coAdvisorProjectCount?: number | null;
};

export type AdvisorDetail = {
  teacher?: {
    teacherCode?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  summary?: {
    totalProjects?: number | null;
    advisorProjectsCount?: number | null;
    coAdvisorProjectsCount?: number | null;
  } | null;
  projects?: Array<{
    projectId: number;
    projectName: string;
    members: Array<{ studentCode: string; name: string }>;
    role: string;
    status: string;
  }> | null;
};

export type ReportsOverviewData = {
  totalStudents?: number;
  totalProjects?: number;
  totalInternships?: number;
};

export type InternshipLogbookComplianceData = {
  totalStudents?: number;
  compliantStudents?: number;
  nonCompliantStudents?: number;
  complianceRate?: number;
};

export type StudentDeadlineHistoryData = {
  studentCode?: string;
  fullName?: string;
  history?: Array<{
    deadlineId?: number;
    deadlineName?: string;
    submittedAt?: string | null;
    dueDate?: string | null;
    daysLate?: number | null;
    status?: string | null;
  }>;
};

// ---- Document Pipeline Types ----

export type DocumentPipelineItem = {
  documentName: string;
  documentType: string;
  total: number;
  statuses: Record<string, number>;
};

export type DocumentPipelineSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  draft: number;
  other: number;
};

export type DocumentPipelineData = {
  academicYear: number;
  semester: number | null;
  summary: DocumentPipelineSummary;
  pipeline: DocumentPipelineItem[];
};

// ---- Internship Supervisor Report Types ----

export type InternshipSupervisorItem = {
  companyName: string;
  supervisorName: string;
  supervisorEmail: string | null;
  studentCount: number;
  totalLogs: number;
  supervisorApprovalRate: number;
  advisorApprovalRate: number;
  evaluationCompletionRate: number;
  evaluatedStudents: number;
};

export type InternshipSupervisorReportData = {
  academicYear: number;
  semester: number | null;
  supervisors: InternshipSupervisorItem[];
};

// ---- Service Functions ----

export async function getInternshipStudentSummary(params: { year?: number; semester?: number } = {}): Promise<InternshipStudentSummary | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: InternshipStudentSummary }>(`/reports/internships/student-summary${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getInternshipEvaluationSummary(params: { year?: number; semester?: number } = {}): Promise<InternshipEvaluationSummary | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: InternshipEvaluationSummary }>(`/reports/internships/evaluations/summary${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getEnrolledInternshipStudents(params: { year?: number } = {}): Promise<EnrolledInternshipStudent[]> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: EnrolledInternshipStudent[] }>(`/reports/internships/enrolled-students${qs ? `?${qs}` : ""}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getInternshipAcademicYears(): Promise<number[]> {
  const res = await apiFetch<{ success: boolean; data: number[] }>("/reports/internships/academic-years");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getDeadlineAcademicYears(): Promise<number[]> {
  const years = await getDeadlineAcademicYearsCompatibility();
  return Array.isArray(years) ? years : [];
}

export async function getProjectAcademicYears(): Promise<number[]> {
  const res = await apiFetch<{ success: boolean; data: number[] }>("/reports/projects/academic-years");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getProjectStatusSummary(params: { year?: number; semester?: number } = {}): Promise<ProjectStatusSummary | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: ProjectStatusSummary }>(`/reports/projects/status-summary${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getProjectList(params: { year?: number; status?: string } = {}): Promise<ProjectListItem[]> {
  const query = new URLSearchParams();
  if (params.year) query.set("academicYear", String(params.year));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: { projects?: ProjectListItem[] } | ProjectListItem[] }>(`/admin/projects${qs ? `?${qs}` : ""}`);
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.projects)) return res.data.projects;
  return Array.isArray(res.data) ? res.data : [];
}

export async function getWorkflowProgress(params: { workflowType?: string } = {}): Promise<WorkflowProgressData | null> {
  const query = new URLSearchParams();
  if (params.workflowType) query.set("workflowType", params.workflowType);
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: WorkflowProgressData }>(`/reports/workflow/progress${qs ? `?${qs}` : ""}`).catch(() => null);
  if (res?.data) return res.data;

  const [blockedStudents, bottlenecks] = await Promise.all([
    getWorkflowBlockedStudentsCompatibility(params.workflowType ? { workflowType: params.workflowType } : undefined),
    getWorkflowBottlenecksCompatibility(params.workflowType ? { workflowType: params.workflowType } : undefined),
  ]);

  const blockedCount = Array.isArray(blockedStudents) ? blockedStudents.length : 0;
  return {
    summary: {
      blocked: blockedCount,
    },
    bottlenecks: Array.isArray(bottlenecks)
      ? bottlenecks.map((item) => ({
          stepName: item.stepName ?? "-",
          stuckCount: item.stuckCount ?? 0,
          avgDaysStuck: item.avgDaysStuck ?? null,
        }))
      : [],
    blockedStudents: Array.isArray(blockedStudents)
      ? blockedStudents.map((item) => ({
          studentCode: item.studentCode ?? null,
          fullName: item.fullName ?? null,
          stuckStepName: item.stuckStepName ?? null,
          daysSinceLastUpdate: item.daysSinceLastUpdate ?? null,
        }))
      : [],
  };
}

export async function getDeadlineCompliance(params: { year?: number; semester?: number } = {}): Promise<DeadlineComplianceReport | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: DeadlineComplianceReport }>(`/reports/deadlines/compliance${qs ? `?${qs}` : ""}`).catch(() => null);
  if (res?.data) return res.data;

  const queryObj = {
    year: params.year,
    semester: params.semester,
  };
  const [overdue, upcoming] = await Promise.all([
    getDeadlineOverdueCompatibility(queryObj),
    getDeadlineUpcomingCompatibility(queryObj),
  ]);

  return {
    upcomingCount: Array.isArray(upcoming) ? upcoming.length : 0,
    overdueCount: Array.isArray(overdue) ? overdue.length : 0,
    upcomingDeadlines: Array.isArray(upcoming)
      ? upcoming.map((item, index) => ({
          deadlineId: item.deadlineId ?? index,
          deadlineName: item.deadlineName ?? "-",
          deadlineDate: item.deadlineDate ?? "",
          daysUntil: item.daysUntil ?? 0,
        }))
      : [],
    overdueDeadlines: Array.isArray(overdue)
      ? overdue.map((item, index) => ({
          deadlineId: item.deadlineId ?? index,
          deadlineName: item.deadlineName ?? "-",
          deadlineDate: item.deadlineDate ?? "",
          daysOverdue: item.daysOverdue ?? 0,
        }))
      : [],
  };
}

export async function getAdvisorWorkload(): Promise<AdvisorWorkloadItem[]> {
  const data = await getProjectsAdvisorLoadCompatibility();
  if (Array.isArray(data)) {
    return data.map((item) => ({
      teacherId: item.teacherId ?? null,
      teacherCode: item.teacherCode ?? null,
      name: item.name ?? null,
      advisorProjectCount: item.advisorProjectCount ?? 0,
      coAdvisorProjectCount: item.coAdvisorProjectCount ?? 0,
    }));
  }

  const res = await apiFetch<{ success: boolean; data: AdvisorWorkloadItem[] }>("/reports/advisors/workload");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getAdvisorDetail(teacherId: number): Promise<AdvisorDetail | null> {
  const res = await apiFetch<{ success: boolean; data: AdvisorDetail }>(`/reports/advisors/${teacherId}/detail`);
  return res.data ?? null;
}

export async function getReportsOverview(params: { year?: number; semester?: number } = {}): Promise<ReportsOverviewData | null> {
  const data = await getReportsOverviewCompatibility(params);
  return data
    ? {
        totalStudents: typeof data.totalStudents === "number" ? data.totalStudents : undefined,
        totalProjects: typeof data.totalProjects === "number" ? data.totalProjects : undefined,
        totalInternships: typeof data.totalInternships === "number" ? data.totalInternships : undefined,
      }
    : null;
}

export async function getInternshipLogbookCompliance(params: { year?: number; semester?: number } = {}): Promise<InternshipLogbookComplianceData | null> {
  const data = await getInternshipLogbookComplianceCompatibility(params);
  return data
    ? {
        totalStudents: typeof data.totalStudents === "number" ? data.totalStudents : undefined,
        compliantStudents: typeof data.compliantStudents === "number" ? data.compliantStudents : undefined,
        nonCompliantStudents: typeof data.nonCompliantStudents === "number" ? data.nonCompliantStudents : undefined,
        complianceRate: typeof data.complianceRate === "number" ? data.complianceRate : undefined,
      }
    : null;
}

export async function getStudentDeadlineHistory(studentId: string | number): Promise<StudentDeadlineHistoryData | null> {
  const data = await getStudentDeadlineHistoryCompatibility(studentId);
  return data ?? null;
}

// ---- Document Pipeline ----

export async function getDocumentPipeline(params: { year?: number; semester?: number; documentType?: string } = {}): Promise<DocumentPipelineData | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  if (params.documentType) query.set("documentType", params.documentType);
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: DocumentPipelineData }>(`/reports/documents/pipeline${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

// ---- Internship Supervisor Report ----

export async function getInternshipSupervisorReport(params: { year?: number; semester?: number } = {}): Promise<InternshipSupervisorReportData | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: InternshipSupervisorReportData }>(`/reports/internships/supervisor-report${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function cancelInternship(internshipId: number, reason: string): Promise<void> {
  await apiFetch(`/admin/internships/${internshipId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function updateInternship(internshipId: number, data: Record<string, unknown>): Promise<void> {
  await apiFetch(`/admin/internships/${internshipId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelProject(projectId: number, reason: string): Promise<void> {
  await apiFetch(`/admin/projects/${projectId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
