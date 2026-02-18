import { apiFetch } from "@/lib/api/client";

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

export async function getProjectAcademicYears(): Promise<number[]> {
  const res = await apiFetch<{ success: boolean; data: number[] }>("/reports/projects/academic-years");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getProjectStatusSummary(params: { year?: number } = {}): Promise<ProjectStatusSummary | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: ProjectStatusSummary }>(`/reports/projects/status-summary${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getProjectList(params: { year?: number; status?: string } = {}): Promise<ProjectListItem[]> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: ProjectListItem[] }>(`/reports/projects/list${qs ? `?${qs}` : ""}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getWorkflowProgress(params: { workflowType?: string } = {}): Promise<WorkflowProgressData | null> {
  const query = new URLSearchParams();
  if (params.workflowType) query.set("workflowType", params.workflowType);
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: WorkflowProgressData }>(`/reports/workflow/progress${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getDeadlineCompliance(params: { year?: number; semester?: number } = {}): Promise<DeadlineComplianceReport | null> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.semester) query.set("semester", String(params.semester));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: DeadlineComplianceReport }>(`/reports/deadlines/compliance${qs ? `?${qs}` : ""}`);
  return res.data ?? null;
}

export async function getAdvisorWorkload(): Promise<AdvisorWorkloadItem[]> {
  const res = await apiFetch<{ success: boolean; data: AdvisorWorkloadItem[] }>("/reports/advisors/workload");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getAdvisorDetail(teacherId: number): Promise<AdvisorDetail | null> {
  const res = await apiFetch<{ success: boolean; data: AdvisorDetail }>(`/reports/advisors/${teacherId}/detail`);
  return res.data ?? null;
}

export async function cancelInternship(internshipId: number, reason: string): Promise<void> {
  await apiFetch(`/internships/${internshipId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function updateInternship(internshipId: number, data: Record<string, unknown>): Promise<void> {
  await apiFetch(`/internships/${internshipId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelProject(projectId: number, reason: string): Promise<void> {
  await apiFetch(`/projects/${projectId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
