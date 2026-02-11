import { apiFetch } from "@/lib/api/client";

export const ADMIN_EXAM_TYPE_PROJECT1 = "PROJECT1";
export const ADMIN_EXAM_TYPE_THESIS = "THESIS";
export type AdminExamType = typeof ADMIN_EXAM_TYPE_PROJECT1 | typeof ADMIN_EXAM_TYPE_THESIS;

export type AdminProjectExamFilters = {
  status?: string;
  academicYear?: string | number;
  semester?: string | number;
  search?: string;
  limit?: number;
  offset?: number;
};

export type AdminProjectExamMember = {
  studentId: number | null;
  studentCode: string;
  name: string;
  role: string | null;
};

export type AdminProjectExamAdvisor = {
  teacherId: number;
  name: string;
} | null;

export type AdminProjectExamResultRecord = {
  examType: AdminExamType;
  result: "PASS" | "FAIL";
  score: number | null;
  notes: string | null;
  requireScopeRevision: boolean;
  recordedAt: string | null;
  recordedByName: string | null;
  studentAcknowledgedAt: string | null;
};

export type AdminDefenseRequestSnapshot = {
  status: string;
  submittedAt: string | null;
  advisorApprovedAt: string | null;
  staffVerifiedAt: string | null;
  defenseScheduledAt: string | null;
  defenseLocation: string | null;
};

export type AdminFinalDocumentSnapshot = {
  documentId: number | null;
  status: string | null;
  submittedAt: string | null;
  reviewDate: string | null;
  downloadCount: number | null;
  reviewerName: string | null;
};

export type AdminProjectExamRow = {
  projectId: number;
  projectCode: string;
  projectNameTh: string;
  projectNameEn: string;
  projectType: string;
  status: string;
  academicYear: number | null;
  semester: number | null;
  createdAt: string | null;
  staffVerifiedAt: string | null;
  members: AdminProjectExamMember[];
  advisor: AdminProjectExamAdvisor;
  coAdvisor: AdminProjectExamAdvisor;
  examResult: AdminProjectExamResultRecord | null;
  defenseRequest: AdminDefenseRequestSnapshot | null;
  finalDocument: AdminFinalDocumentSnapshot | null;
};

type PendingApiResponse = {
  data?: unknown;
  total?: number;
};

type DataResponse = {
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function normalizeExamType(value: unknown): AdminExamType {
  return toStringOrEmpty(value).toUpperCase() === ADMIN_EXAM_TYPE_THESIS
    ? ADMIN_EXAM_TYPE_THESIS
    : ADMIN_EXAM_TYPE_PROJECT1;
}

function normalizeMember(value: unknown): AdminProjectExamMember {
  const raw = isRecord(value) ? value : {};
  const studentRaw = isRecord(raw.student) ? raw.student : {};
  const studentUserRaw = isRecord(studentRaw.user) ? studentRaw.user : {};
  const firstName = toStringOrEmpty(studentUserRaw.firstName);
  const lastName = toStringOrEmpty(studentUserRaw.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    studentId: toNumberOrNull(raw.studentId) ?? toNumberOrNull(studentRaw.studentId),
    studentCode: toStringOrEmpty(studentRaw.studentCode),
    name: fullName || "-",
    role: toStringOrNull(raw.role),
  };
}

function normalizeAdvisor(value: unknown): AdminProjectExamAdvisor {
  const raw = isRecord(value) ? value : {};
  const teacherId = toNumberOrNull(raw.teacherId);
  if (!teacherId) return null;
  const userRaw = isRecord(raw.user) ? raw.user : {};
  const firstName = toStringOrEmpty(userRaw.firstName);
  const lastName = toStringOrEmpty(userRaw.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    teacherId,
    name: fullName || "-",
  };
}

function normalizeExamResult(value: unknown): AdminProjectExamResultRecord | null {
  const raw = isRecord(value) ? value : {};
  const result = toStringOrEmpty(raw.result).toUpperCase();
  if (result !== "PASS" && result !== "FAIL") return null;
  const recordedBy = isRecord(raw.recordedBy) ? raw.recordedBy : {};
  const firstName = toStringOrEmpty(recordedBy.firstName);
  const lastName = toStringOrEmpty(recordedBy.lastName);

  return {
    examType: normalizeExamType(raw.examType ?? raw.exam_type),
    result,
    score: toNumberOrNull(raw.score),
    notes: toStringOrNull(raw.notes),
    requireScopeRevision: Boolean(raw.requireScopeRevision ?? raw.require_scope_revision),
    recordedAt: toStringOrNull(raw.recordedAt ?? raw.recorded_at),
    recordedByName: [firstName, lastName].filter(Boolean).join(" ").trim() || null,
    studentAcknowledgedAt: toStringOrNull(raw.studentAcknowledgedAt ?? raw.student_acknowledged_at),
  };
}

function normalizeDefenseRequest(value: unknown): AdminDefenseRequestSnapshot | null {
  const raw = isRecord(value) ? value : {};
  const status = toStringOrEmpty(raw.status);
  if (!status) return null;
  return {
    status,
    submittedAt: toStringOrNull(raw.submittedAt ?? raw.submitted_at),
    advisorApprovedAt: toStringOrNull(raw.advisorApprovedAt ?? raw.advisor_approved_at),
    staffVerifiedAt: toStringOrNull(raw.staffVerifiedAt ?? raw.staff_verified_at),
    defenseScheduledAt: toStringOrNull(raw.defenseScheduledAt ?? raw.defense_scheduled_at),
    defenseLocation: toStringOrNull(raw.defenseLocation ?? raw.defense_location),
  };
}

function normalizeFinalDocument(value: unknown): AdminFinalDocumentSnapshot | null {
  const raw = isRecord(value) ? value : {};
  if (!Object.keys(raw).length) return null;
  const reviewer = isRecord(raw.reviewer) ? raw.reviewer : {};
  const firstName = toStringOrEmpty(reviewer.firstName);
  const lastName = toStringOrEmpty(reviewer.lastName);

  return {
    documentId: toNumberOrNull(raw.documentId ?? raw.document_id),
    status: toStringOrNull(raw.status),
    submittedAt: toStringOrNull(raw.submittedAt ?? raw.submitted_at),
    reviewDate: toStringOrNull(raw.reviewDate ?? raw.review_date),
    downloadCount: toNumberOrNull(raw.downloadCount ?? raw.download_count),
    reviewerName: [firstName, lastName].filter(Boolean).join(" ").trim() || null,
  };
}

function normalizeExamRow(value: unknown): AdminProjectExamRow {
  const raw = isRecord(value) ? value : {};
  const examResultsRaw = Array.isArray(raw.examResults) ? raw.examResults : [];
  const defenseRequestsRaw = Array.isArray(raw.defenseRequests) ? raw.defenseRequests : [];
  const normalizedMembers = (Array.isArray(raw.members) ? raw.members : []).map(normalizeMember);

  const examResult = examResultsRaw
    .map(normalizeExamResult)
    .filter((item): item is AdminProjectExamResultRecord => item !== null)
    .sort((a, b) => {
      const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
      const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
      return bTime - aTime;
    })[0] ?? null;

  const defenseRequest = defenseRequestsRaw
    .map(normalizeDefenseRequest)
    .filter((item): item is AdminDefenseRequestSnapshot => item !== null)
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    })[0] ?? null;

  return {
    projectId: toNumberOrNull(raw.projectId ?? raw.project_id) ?? 0,
    projectCode: toStringOrEmpty(raw.projectCode ?? raw.project_code),
    projectNameTh: toStringOrEmpty(raw.projectNameTh ?? raw.project_name_th),
    projectNameEn: toStringOrEmpty(raw.projectNameEn ?? raw.project_name_en),
    projectType: toStringOrEmpty(raw.projectType ?? raw.project_type),
    status: toStringOrEmpty(raw.status),
    academicYear: toNumberOrNull(raw.academicYear ?? raw.academic_year),
    semester: toNumberOrNull(raw.semester),
    createdAt: toStringOrNull(raw.createdAt ?? raw.created_at),
    staffVerifiedAt: toStringOrNull(raw.staffVerifiedAt ?? raw.staff_verified_at),
    members: normalizedMembers,
    advisor: normalizeAdvisor(raw.advisor),
    coAdvisor: normalizeAdvisor(raw.coAdvisor ?? raw.co_advisor),
    examResult,
    defenseRequest,
    finalDocument: normalizeFinalDocument(raw.finalDocument ?? raw.document),
  };
}

function buildQueryString(filters: AdminProjectExamFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function getPendingEndpoint(examType: AdminExamType) {
  return examType === ADMIN_EXAM_TYPE_THESIS ? "/projects/exam-results/thesis/pending" : "/projects/exam-results/project1/pending";
}

export async function getAdminProjectExamPendingResults(examType: AdminExamType, filters: AdminProjectExamFilters = {}) {
  const query = buildQueryString(filters);
  const response = await apiFetch<PendingApiResponse>(`${getPendingEndpoint(examType)}${query ? `?${query}` : ""}`);
  const source = Array.isArray(response.data) ? response.data : [];
  const rows = source.map(normalizeExamRow).filter((item) => item.projectId > 0);
  const total = toNumberOrNull(response.total) ?? rows.length;
  return { rows, total };
}

export async function recordAdminProjectExamResult(payload: {
  projectId: number;
  examType: AdminExamType;
  result: "PASS" | "FAIL";
  score?: number | null;
  notes?: string | null;
  requireScopeRevision?: boolean;
}) {
  return apiFetch(`/projects/${payload.projectId}/exam-result`, {
    method: "POST",
    body: JSON.stringify({
      examType: payload.examType,
      result: payload.result,
      score: payload.score ?? null,
      notes: payload.notes ?? null,
      requireScopeRevision: payload.result === "PASS" ? Boolean(payload.requireScopeRevision) : false,
    }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getAdminProjectExamResult(projectId: number, examType: AdminExamType) {
  const query = new URLSearchParams({ examType }).toString();
  const response = await apiFetch<DataResponse>(`/projects/${projectId}/exam-result?${query}`);
  return normalizeExamResult(response.data);
}

export async function updateProjectFinalDocumentStatus(payload: {
  projectId: number;
  status: string;
  comment?: string;
}) {
  return apiFetch(`/projects/${payload.projectId}/final-document/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: payload.status,
      comment: payload.comment?.trim() || null,
    }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateDocumentStatus(payload: {
  documentId: number;
  status: string;
  comment?: string;
}) {
  return apiFetch(`/documents/${payload.documentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: payload.status,
      comment: payload.comment?.trim() || null,
    }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getProjectAcademicYearsForExamResults() {
  const response = await apiFetch<DataResponse>("/reports/projects/academic-years");
  const source = Array.isArray(response.data) ? response.data : [];
  return source
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null)
    .sort((a, b) => b - a);
}
