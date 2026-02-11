import { apiFetch } from "@/lib/api/client";

export type AdminSystemTestQueueFilters = {
  status?: string;
  academicYear?: number | string;
  semester?: number | string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type AdminSystemTestQueueRecord = {
  requestId: number;
  projectId: number;
  status: string;
  submittedAt: string | null;
  updatedAt: string | null;
  testStartDate: string | null;
  testDueDate: string | null;
  studentNote: string | null;
  submittedBy: {
    studentId: number | null;
    studentCode: string;
    name: string;
  } | null;
  projectSnapshot: {
    projectId: number;
    projectCode: string;
    projectNameTh: string;
    projectNameEn: string;
  };
  requestFile: {
    name: string | null;
    url: string | null;
  } | null;
  evidence: {
    name: string | null;
    url: string | null;
  } | null;
  evidenceSubmittedAt: string | null;
  advisorDecision: {
    teacherId: number | null;
    name: string | null;
    note: string | null;
    decidedAt: string | null;
  } | null;
  coAdvisorDecision: {
    teacherId: number | null;
    name: string | null;
    note: string | null;
    decidedAt: string | null;
  } | null;
  staffDecision: {
    teacherId: number | null;
    name: string | null;
    note: string | null;
    decidedAt: string | null;
  } | null;
  timeline: {
    submittedAt: string | null;
    advisorDecidedAt: string | null;
    coAdvisorDecidedAt: string | null;
    staffDecidedAt: string | null;
    evidenceSubmittedAt: string | null;
  } | null;
  deadlineTag: {
    text: string;
    color: string;
    tooltip?: string | null;
    type?: string | null;
  } | null;
};

type QueueApiResponse = {
  success?: boolean;
  data?: unknown;
  total?: number;
};

type DataApiResponse = {
  success?: boolean;
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toStringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeFile(value: unknown) {
  const raw = isRecord(value) ? value : {};
  if (!raw.url && !raw.name) return null;
  return {
    name: toStringOrNull(raw.name),
    url: toStringOrNull(raw.url),
  };
}

function normalizeDecision(value: unknown) {
  const raw = isRecord(value) ? value : {};
  const teacherId = toNumberOrNull(raw.teacherId);
  const name = toStringOrNull(raw.name);
  const note = toStringOrNull(raw.note);
  const decidedAt = toStringOrNull(raw.decidedAt);
  if (teacherId === null && !name && !note && !decidedAt) return null;

  return {
    teacherId,
    name,
    note,
    decidedAt,
  };
}

function normalizeTimeline(value: unknown) {
  const raw = isRecord(value) ? value : {};
  const timeline = {
    submittedAt: toStringOrNull(raw.submittedAt),
    advisorDecidedAt: toStringOrNull(raw.advisorDecidedAt),
    coAdvisorDecidedAt: toStringOrNull(raw.coAdvisorDecidedAt),
    staffDecidedAt: toStringOrNull(raw.staffDecidedAt),
    evidenceSubmittedAt: toStringOrNull(raw.evidenceSubmittedAt),
  };

  if (!timeline.submittedAt && !timeline.advisorDecidedAt && !timeline.coAdvisorDecidedAt && !timeline.staffDecidedAt && !timeline.evidenceSubmittedAt) {
    return null;
  }

  return timeline;
}

function normalizeQueueRecord(value: unknown): AdminSystemTestQueueRecord {
  const raw = isRecord(value) ? value : {};
  const projectSnapshotRaw = isRecord(raw.projectSnapshot) ? raw.projectSnapshot : {};
  const submittedByRaw = isRecord(raw.submittedBy) ? raw.submittedBy : {};
  const deadlineStatusRaw = isRecord(raw.deadlineStatus) ? raw.deadlineStatus : {};
  const deadlineTagRaw = isRecord(deadlineStatusRaw.tag) ? deadlineStatusRaw.tag : null;
  const projectId = toNumberOrNull(projectSnapshotRaw.projectId) ?? toNumberOrNull(raw.projectId) ?? 0;

  return {
    requestId: toNumberOrNull(raw.requestId) ?? 0,
    projectId,
    status: toStringOrEmpty(raw.status) || "pending_staff",
    submittedAt: toStringOrNull(raw.submittedAt),
    updatedAt: toStringOrNull(raw.updatedAt),
    testStartDate: toStringOrNull(raw.testStartDate),
    testDueDate: toStringOrNull(raw.testDueDate),
    studentNote: toStringOrNull(raw.studentNote),
    submittedBy:
      toNumberOrNull(submittedByRaw.studentId) !== null || toStringOrNull(submittedByRaw.studentCode) || toStringOrNull(submittedByRaw.name)
        ? {
            studentId: toNumberOrNull(submittedByRaw.studentId),
            studentCode: toStringOrEmpty(submittedByRaw.studentCode),
            name: toStringOrEmpty(submittedByRaw.name),
          }
        : null,
    projectSnapshot: {
      projectId,
      projectCode: toStringOrEmpty(projectSnapshotRaw.projectCode),
      projectNameTh: toStringOrEmpty(projectSnapshotRaw.projectNameTh),
      projectNameEn: toStringOrEmpty(projectSnapshotRaw.projectNameEn),
    },
    requestFile: normalizeFile(raw.requestFile),
    evidence: normalizeFile(raw.evidence),
    evidenceSubmittedAt: toStringOrNull(raw.evidenceSubmittedAt),
    advisorDecision: normalizeDecision(raw.advisorDecision),
    coAdvisorDecision: normalizeDecision(raw.coAdvisorDecision),
    staffDecision: normalizeDecision(raw.staffDecision),
    timeline: normalizeTimeline(raw.timeline),
    deadlineTag: deadlineTagRaw
      ? {
          text: toStringOrEmpty(deadlineTagRaw.text),
          color: toStringOrEmpty(deadlineTagRaw.color),
          tooltip: toStringOrNull(deadlineTagRaw.tooltip),
          type: toStringOrNull(deadlineTagRaw.type),
        }
      : null,
  };
}

function buildQuery(filters: AdminSystemTestQueueFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function getAdminSystemTestStaffQueue(filters: AdminSystemTestQueueFilters = {}) {
  const query = buildQuery(filters);
  const path = query ? `/projects/system-test/staff-queue?${query}` : "/projects/system-test/staff-queue";
  const response = await apiFetch<QueueApiResponse>(path);
  const source = Array.isArray(response.data) ? response.data : [];
  const rows = source.map(normalizeQueueRecord).filter((item) => item.requestId > 0 && item.projectId > 0);

  return {
    rows,
    total: toNumberOrNull(response.total) ?? rows.length,
  };
}

export async function getAdminSystemTestRequestDetail(projectId: number) {
  const response = await apiFetch<DataApiResponse>(`/projects/${projectId}/system-test/request`);
  return normalizeQueueRecord(response.data);
}

export async function submitAdminSystemTestStaffDecision(payload: {
  projectId: number;
  decision: "approve" | "reject";
  note?: string;
}) {
  return apiFetch(`/projects/${payload.projectId}/system-test/request/staff-decision`, {
    method: "POST",
    body: JSON.stringify({
      decision: payload.decision,
      note: payload.note?.trim() || undefined,
    }),
  });
}

export async function getAdminSystemTestAcademicYears() {
  const response = await apiFetch<DataApiResponse>("/reports/projects/academic-years");
  const source = Array.isArray(response.data) ? response.data : [];
  return source
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null)
    .sort((a, b) => b - a);
}

