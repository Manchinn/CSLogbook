import { apiFetch, apiFetchData, type ApiSuccessResponse } from "@/lib/api/client";

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export type GenericActionResult = {
  success?: boolean;
  message?: string;
};

export type AgentStatus = Record<string, unknown>;

export type AgentEmailStats = {
  totalSent?: number;
  totalFailed?: number;
  lastSentAt?: string | null;
  [key: string]: unknown;
};

export type SsoStatus = {
  enabled?: boolean;
  provider?: string | null;
  authenticated?: boolean;
  redirectUrl?: string | null;
  [key: string]: unknown;
};

export type TimesheetApprovalEntryCompat = {
  logId: number;
  workDate?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  workHours?: number | null;
  logTitle?: string | null;
  workDescription?: string | null;
  supervisorApproved?: number | boolean | null;
  advisorApproved?: boolean | null;
};

export type EmailApprovalDetails = {
  token: string;
  status: string | null;
  type: string | null;
  studentId?: number | string | null;
  studentName?: string | null;
  studentCode?: string | null;
  companyName?: string | null;
  timesheetEntries?: TimesheetApprovalEntryCompat[];
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt?: string | null;
};

export type EmailApprovalActionResult = {
  token?: string;
  status?: string | null;
  processedAt?: string | null;
  comment?: string | null;
};

export type AcademicYearsResponse = number[];

export type DeadlineOverdueItem = {
  deadlineId?: number;
  deadlineName?: string;
  deadlineDate?: string;
  daysOverdue?: number;
  studentCode?: string;
  fullName?: string;
};

export type DeadlineUpcomingItem = {
  deadlineId?: number;
  deadlineName?: string;
  deadlineDate?: string;
  daysUntil?: number;
};

export type InternshipLogbookCompliance = {
  totalStudents?: number;
  compliantStudents?: number;
  nonCompliantStudents?: number;
  complianceRate?: number;
  [key: string]: unknown;
};

export type ReportsOverview = {
  totalStudents?: number;
  totalProjects?: number;
  totalInternships?: number;
  [key: string]: unknown;
};

export type AdvisorLoadItem = {
  teacherId?: number | null;
  teacherCode?: string | null;
  name?: string | null;
  advisorProjectCount?: number | null;
  coAdvisorProjectCount?: number | null;
};

export type StudentDeadlineHistory = {
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

export type WorkflowBlockedStudent = {
  studentCode?: string | null;
  fullName?: string | null;
  stuckStepName?: string | null;
  daysSinceLastUpdate?: number | null;
  [key: string]: unknown;
};

export type WorkflowBottleneck = {
  stepName?: string;
  stuckCount?: number;
  avgDaysStuck?: number | null;
  [key: string]: unknown;
};

export type WorkflowStudentTimeline = {
  studentId?: string | number;
  workflowType?: string;
  steps?: Array<{
    id?: string | number;
    title?: string;
    description?: string | null;
    status?: string;
    completed?: boolean;
    completedDate?: string | null;
    order?: number;
  }>;
  progress?: number;
  status?: string;
  currentStepDisplay?: number;
  totalStepsDisplay?: number;
  blocked?: boolean;
  [key: string]: unknown;
};

export type TimelineStep = {
  id?: string | number;
  title?: string;
  status?: string;
  order?: number;
  [key: string]: unknown;
};

export type TimelineRecord = {
  studentId?: string | number;
  steps?: TimelineStep[];
  [key: string]: unknown;
};

export type UploadCsvHistoryItem = {
  id?: number;
  fileName?: string;
  createdAt?: string;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  status?: string;
  [key: string]: unknown;
};

export type WorkflowStepDetail = {
  id?: number | string;
  title?: string;
  description?: string | null;
  workflowType?: string;
  order?: number;
  status?: string;
  [key: string]: unknown;
};

export const TEMPLATE_ENDPOINTS = {
  csv: "/template/download-csv-template",
  excel: "/template/download-excel-template",
  generic: "/template/download-template",
} as const;

export type TemplateKind = keyof typeof TEMPLATE_ENDPOINTS;

export function getTemplateDownloadPath(kind: TemplateKind) {
  return TEMPLATE_ENDPOINTS[kind];
}

export async function restartAgentStatus(agentId: string | number) {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>(`/admin/agent-status/${agentId}/restart`, {
    method: "POST",
  });
}

export async function getAgentEmailStatsCompatibility() {
  return apiFetchData<AgentEmailStats>("/admin/agent-status/email-stats");
}

export async function logoutCompatibility() {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>("/auth/logout", { method: "POST" });
}

export async function refreshTokenCompatibility(refreshToken?: string) {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });
}

export async function getSsoAuthorizeCompatibility(query?: Query) {
  return apiFetch<Record<string, unknown>>(withQuery("/auth/sso/authorize", query));
}

export async function getSsoCallbackCompatibility(query?: Query) {
  return apiFetch<Record<string, unknown>>(withQuery("/auth/sso/callback", query));
}

export async function getSsoStatusCompatibility() {
  return apiFetchData<SsoStatus>("/auth/sso/status");
}

export async function getSsoUrlCompatibility() {
  return apiFetchData<{ url?: string; redirectUrl?: string }>("/auth/sso/url");
}

export async function getEmailApprovalDetailsCompatibility(token: string) {
  return apiFetchData<EmailApprovalDetails>(`/email-approval/details/${token}`);
}

export async function getEmailApproveByEmailCompatibility(token: string) {
  return apiFetchData<EmailApprovalActionResult>(`/email-approval/email/approve/${token}`);
}

export async function postEmailApproveByEmailCompatibility(token: string, comment?: string) {
  return apiFetch<ApiSuccessResponse<EmailApprovalActionResult>>(`/email-approval/email/approve/${token}`, {
    method: "POST",
    body: JSON.stringify({ comment: comment ?? "" }),
  });
}

export async function getEmailRejectByEmailCompatibility(token: string) {
  return apiFetchData<EmailApprovalActionResult>(`/email-approval/email/reject/${token}`);
}

export async function postEmailRejectByEmailCompatibility(token: string, comment?: string) {
  return apiFetch<ApiSuccessResponse<EmailApprovalActionResult>>(`/email-approval/email/reject/${token}`, {
    method: "POST",
    body: JSON.stringify({ comment: comment ?? "" }),
  });
}

export async function postEmailApproveByWebCompatibility(token: string, comment?: string) {
  return apiFetch<ApiSuccessResponse<EmailApprovalActionResult>>(`/email-approval/web/approve/${token}`, {
    method: "POST",
    body: JSON.stringify({ comment: comment ?? "" }),
  });
}

export async function postEmailRejectByWebCompatibility(token: string, comment?: string) {
  return apiFetch<ApiSuccessResponse<EmailApprovalActionResult>>(`/email-approval/web/reject/${token}`, {
    method: "POST",
    body: JSON.stringify({ comment: comment ?? "" }),
  });
}

export async function getDeadlineAcademicYearsCompatibility() {
  return apiFetchData<AcademicYearsResponse>("/reports/deadlines/academic-years");
}

export async function getDeadlineOverdueCompatibility(query?: Query) {
  return apiFetchData<DeadlineOverdueItem[]>(withQuery("/reports/deadlines/overdue", query));
}

export async function getDeadlineUpcomingCompatibility(query?: Query) {
  return apiFetchData<DeadlineUpcomingItem[]>(withQuery("/reports/deadlines/upcoming", query));
}

export async function getInternshipLogbookComplianceCompatibility(query?: Query) {
  return apiFetchData<InternshipLogbookCompliance>(withQuery("/reports/internships/logbook-compliance", query));
}

export async function getReportsOverviewCompatibility(query?: Query) {
  return apiFetchData<ReportsOverview>(withQuery("/reports/overview", query));
}

export async function getProjectsAdvisorLoadCompatibility(query?: Query) {
  return apiFetchData<AdvisorLoadItem[]>(withQuery("/reports/projects/advisor-load", query));
}

export async function getStudentDeadlineHistoryCompatibility(studentId: string | number) {
  return apiFetchData<StudentDeadlineHistory>(`/reports/students/${studentId}/deadline-history`);
}

export async function getWorkflowBlockedStudentsCompatibility(query?: Query) {
  return apiFetchData<WorkflowBlockedStudent[]>(withQuery("/reports/workflow/blocked-students", query));
}

export async function getWorkflowBottlenecksCompatibility(query?: Query) {
  return apiFetchData<WorkflowBottleneck[]>(withQuery("/reports/workflow/bottlenecks", query));
}

export async function getWorkflowStudentTimelineCompatibility(studentId: string | number, query?: Query) {
  return apiFetchData<WorkflowStudentTimeline>(withQuery(`/reports/workflow/student-timeline/${studentId}`, query));
}

export async function getTimelineAllCompatibility(query?: Query) {
  return apiFetchData<TimelineRecord[]>(withQuery("/timeline/all", query));
}

export async function updateTimelineStepCompatibility(stepId: string | number, payload: Record<string, unknown>) {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>(`/timeline/step/${stepId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getTimelineStudentCompatibility(studentId: string | number, query?: Query) {
  return apiFetchData<TimelineRecord>(withQuery(`/timeline/student/${studentId}`, query));
}

export async function initTimelineStudentCompatibility(studentId: string | number, payload: Record<string, unknown> = {}) {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>(`/timeline/student/${studentId}/init`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUploadCsvHistoryCompatibility(query?: Query) {
  return apiFetchData<UploadCsvHistoryItem[]>(withQuery("/upload-csv/history", query));
}

export async function getWorkflowStepCompatibility(stepId: string | number) {
  return apiFetchData<WorkflowStepDetail>(`/workflow/steps/${stepId}`);
}

export async function updateWorkflowCompatibility(payload: Record<string, unknown>) {
  return apiFetch<ApiSuccessResponse<GenericActionResult>>("/workflow/update", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function downloadCsvTemplateCompatibility() {
  return apiFetch<BlobPart>(TEMPLATE_ENDPOINTS.csv, { method: "GET" });
}

export async function downloadExcelTemplateCompatibility() {
  return apiFetch<BlobPart>(TEMPLATE_ENDPOINTS.excel, { method: "GET" });
}

export async function downloadGenericTemplateCompatibility() {
  return apiFetch<BlobPart>(TEMPLATE_ENDPOINTS.generic, { method: "GET" });
}
