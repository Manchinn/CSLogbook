import { apiFetch } from "@/lib/api/client";
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";
import { env } from "@/lib/config/env";

export const DEFENSE_TYPE_PROJECT1 = "PROJECT1";
export const DEFENSE_TYPE_THESIS = "THESIS";
export type DefenseType = typeof DEFENSE_TYPE_PROJECT1 | typeof DEFENSE_TYPE_THESIS;

export type DefenseQueueStatus =
  | "advisor_in_review"
  | "advisor_approved"
  | "staff_verified"
  | "scheduled"
  | "completed"
  | string;

export type DefenseQueueFilters = {
  status?: string;
  academicYear?: number | string;
  semester?: number | string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type DefenseQueueRecord = {
  requestId: number;
  projectId: number;
  defenseType: DefenseType;
  status: DefenseQueueStatus;
  submittedAt: string | null;
  advisorApprovedAt: string | null;
  staffVerifiedAt: string | null;
  defenseScheduledAt: string | null;
  defenseLocation: string | null;
  defenseNote: string | null;
  staffVerificationNote: string | null;
  staffVerifiedByName: string | null;
  submittedLate: boolean;
  submissionDelayMinutes: number | null;
  deadlineTag: {
    text: string;
    color: string;
    tooltip?: string;
    type?: string;
  } | null;
  project: {
    projectId: number;
    projectCode: string;
    projectNameTh: string;
    projectNameEn: string;
    academicYear: number | null;
    semester: number | null;
    members: Array<{
      studentId: number | null;
      studentCode: string;
      name: string;
      role: string | null;
    }>;
    advisor: { teacherId: number; name: string } | null;
    coAdvisor: { teacherId: number; name: string } | null;
  };
  meetingMetrics?: {
    requiredApprovedLogs?: number;
    totalMeetings?: number;
    totalApprovedLogs?: number;
    lastApprovedLogAt?: string | null;
    perStudent?: Array<{
      studentId?: number | null;
      approvedLogs?: number;
      attendedMeetings?: number;
    }>;
  } | null;
  advisorApprovals?: Array<{
    approvalId?: number | null;
    teacherRole?: string | null;
    status?: string | null;
    note?: string | null;
    approvedAt?: string | null;
    teacher?: {
      teacherId?: number | null;
      name?: string | null;
    } | null;
  }> | null;
  requestDate?: string | null;
  intendedDefenseDate?: string | null;
  additionalNotes?: string | null;
  additionalMaterials?: Array<{
    label?: string | null;
    value?: string | null;
  }> | null;
  thesisSystemTestSnapshot?: {
    status?: string | null;
    testStartDate?: string | null;
    testDueDate?: string | null;
    staffDecidedAt?: string | null;
    evidenceSubmittedAt?: string | null;
    evidence?: { url?: string | null; name?: string | null } | null;
  } | null;
};

type QueueApiResponse = {
  data?: unknown;
  total?: number;
};

type DataResponse = {
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

function toStringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeProject(value: unknown) {
  const raw = isRecord(value) ? value : {};
  const membersRaw = Array.isArray(raw.members) ? raw.members : [];
  const advisorRaw = isRecord(raw.advisor) ? raw.advisor : {};
  const coAdvisorRaw = isRecord(raw.coAdvisor) ? raw.coAdvisor : {};

  return {
    projectId: toNumberOrNull(raw.projectId) ?? 0,
    projectCode: toStringOrEmpty(raw.projectCode),
    projectNameTh: toStringOrEmpty(raw.projectNameTh),
    projectNameEn: toStringOrEmpty(raw.projectNameEn),
    academicYear: toNumberOrNull(raw.academicYear),
    semester: toNumberOrNull(raw.semester),
    members: membersRaw.map((member) => {
      const m = isRecord(member) ? member : {};
      return {
        studentId: toNumberOrNull(m.studentId),
        studentCode: toStringOrEmpty(m.studentCode),
        name: toStringOrEmpty(m.name),
        role: toStringOrNull(m.role),
      };
    }),
    advisor: toNumberOrNull(advisorRaw.teacherId)
      ? {
          teacherId: toNumberOrNull(advisorRaw.teacherId) ?? 0,
          name: toStringOrEmpty(advisorRaw.name),
        }
      : null,
    coAdvisor: toNumberOrNull(coAdvisorRaw.teacherId)
      ? {
          teacherId: toNumberOrNull(coAdvisorRaw.teacherId) ?? 0,
          name: toStringOrEmpty(coAdvisorRaw.name),
        }
      : null,
  };
}

function normalizeQueueRecord(value: unknown): DefenseQueueRecord {
  const raw = isRecord(value) ? value : {};
  const project = normalizeProject(raw.project);
  const deadlineStatus = isRecord(raw.deadlineStatus) ? raw.deadlineStatus : {};
  const deadlineTag = isRecord(deadlineStatus.tag) ? deadlineStatus.tag : null;
  const meetingMetrics = isRecord(raw.meetingMetrics) ? raw.meetingMetrics : null;
  const payload = isRecord(raw.formPayload) ? raw.formPayload : {};
  const systemTestSnapshot = isRecord(payload.systemTestSnapshot) ? payload.systemTestSnapshot : null;
  const advisorApprovals = Array.isArray(raw.advisorApprovals) ? raw.advisorApprovals : [];
  const additionalMaterials = Array.isArray(payload.additionalMaterials) ? payload.additionalMaterials : [];

  return {
    requestId: toNumberOrNull(raw.requestId) ?? 0,
    projectId: project.projectId,
    defenseType: toStringOrEmpty(raw.defenseType) === DEFENSE_TYPE_THESIS ? DEFENSE_TYPE_THESIS : DEFENSE_TYPE_PROJECT1,
    status: toStringOrEmpty(raw.status) || "advisor_in_review",
    submittedAt: toStringOrNull(raw.submittedAt),
    advisorApprovedAt: toStringOrNull(raw.advisorApprovedAt),
    staffVerifiedAt: toStringOrNull(raw.staffVerifiedAt),
    defenseScheduledAt: toStringOrNull(raw.defenseScheduledAt),
    defenseLocation: toStringOrNull(raw.defenseLocation),
    defenseNote: toStringOrNull(raw.defenseNote),
    staffVerificationNote: toStringOrNull(raw.staffVerificationNote),
    staffVerifiedByName: isRecord(raw.staffVerifiedBy) ? toStringOrNull(raw.staffVerifiedBy.fullName) : null,
    submittedLate: Boolean(raw.submittedLate),
    submissionDelayMinutes: toNumberOrNull(raw.submissionDelayMinutes),
    deadlineTag: deadlineTag
      ? {
          text: toStringOrEmpty(deadlineTag.text),
          color: toStringOrEmpty(deadlineTag.color),
          tooltip: toStringOrNull(deadlineTag.tooltip) ?? undefined,
          type: toStringOrNull(deadlineTag.type) ?? undefined,
        }
      : null,
    project,
    meetingMetrics: meetingMetrics
      ? {
          requiredApprovedLogs: toNumberOrNull(meetingMetrics.requiredApprovedLogs) ?? undefined,
          totalMeetings: toNumberOrNull(meetingMetrics.totalMeetings) ?? undefined,
          totalApprovedLogs: toNumberOrNull(meetingMetrics.totalApprovedLogs) ?? undefined,
          lastApprovedLogAt: toStringOrNull(meetingMetrics.lastApprovedLogAt),
          perStudent: Array.isArray(meetingMetrics.perStudent)
            ? meetingMetrics.perStudent.map((item) => {
                const student = isRecord(item) ? item : {};
                return {
                  studentId: toNumberOrNull(student.studentId),
                  approvedLogs: toNumberOrNull(student.approvedLogs) ?? undefined,
                  attendedMeetings: toNumberOrNull(student.attendedMeetings) ?? undefined,
                };
              })
            : undefined,
        }
      : null,
    advisorApprovals: advisorApprovals.map((approval) => {
      const item = isRecord(approval) ? approval : {};
      const teacher = isRecord(item.teacher) ? item.teacher : {};
      return {
        approvalId: toNumberOrNull(item.approvalId),
        teacherRole: toStringOrNull(item.teacherRole),
        status: toStringOrNull(item.status),
        note: toStringOrNull(item.note),
        approvedAt: toStringOrNull(item.approvedAt),
        teacher: toNumberOrNull(teacher.teacherId)
          ? {
              teacherId: toNumberOrNull(teacher.teacherId),
              name: toStringOrNull(teacher.name),
            }
          : null,
      };
    }),
    requestDate: toStringOrNull(payload.requestDate),
    intendedDefenseDate: toStringOrNull(payload.intendedDefenseDate),
    additionalNotes: toStringOrNull(payload.additionalNotes),
    additionalMaterials: additionalMaterials.map((entry) => {
      const item = isRecord(entry) ? entry : {};
      return {
        label: toStringOrNull(item.label),
        value: toStringOrNull(item.value),
      };
    }),
    thesisSystemTestSnapshot: systemTestSnapshot
      ? {
          status: toStringOrNull(systemTestSnapshot.status),
          testStartDate: toStringOrNull(systemTestSnapshot.testStartDate),
          testDueDate: toStringOrNull(systemTestSnapshot.testDueDate),
          staffDecidedAt: toStringOrNull(systemTestSnapshot.staffDecidedAt),
          evidenceSubmittedAt: toStringOrNull(systemTestSnapshot.evidenceSubmittedAt),
          evidence: isRecord(systemTestSnapshot.evidence)
            ? {
                url: toStringOrNull(systemTestSnapshot.evidence.url),
                name: toStringOrNull(systemTestSnapshot.evidence.name),
              }
            : null,
        }
      : null,
  };
}

function buildQueueQuery(filters: DefenseQueueFilters, defenseType: DefenseType) {
  const params = new URLSearchParams();
  params.set("defenseType", defenseType);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

function resolveToken(token?: string) {
  if (token) return token;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_TOKEN_KEY);
}

function extractFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}

export async function getAdminDefenseQueue(defenseType: DefenseType, filters: DefenseQueueFilters = {}) {
  const query = buildQueueQuery(filters, defenseType);
  const response = await apiFetch<QueueApiResponse>(`/projects/kp02/staff-queue?${query}`);
  const source = Array.isArray(response.data) ? response.data : [];
  const rows = source.map(normalizeQueueRecord).filter((row) => row.requestId > 0 && row.projectId > 0);

  return {
    rows,
    total: toNumberOrNull(response.total) ?? rows.length,
  };
}

export async function verifyDefenseQueueRequest(payload: {
  projectId: number;
  defenseType: DefenseType;
  note?: string;
}) {
  const params = new URLSearchParams({ defenseType: payload.defenseType });
  return apiFetch(`/projects/${payload.projectId}/kp02/verify?${params.toString()}`, {
    method: "POST",
    body: JSON.stringify({ note: payload.note?.trim() || undefined }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function exportDefenseQueue(defenseType: DefenseType, filters: Omit<DefenseQueueFilters, "limit" | "offset"> = {}, token?: string) {
  const effectiveToken = resolveToken(token);
  const query = buildQueueQuery(filters, defenseType);
  const response = await fetch(`${env.apiUrl}/projects/kp02/staff-queue/export?${query}`, {
    method: "GET",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถส่งออกข้อมูลได้");
  }

  const blob = await response.blob();
  const filename = extractFileName(
    response.headers.get("content-disposition"),
    `${defenseType === DEFENSE_TYPE_THESIS ? "thesis" : "project1"}-queue-${Date.now()}.xlsx`,
  );

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function getProjectDefenseDetail(projectId: number, defenseType: DefenseType) {
  const params = new URLSearchParams({ defenseType });
  const response = await apiFetch<DataResponse>(`/projects/${projectId}/kp02?${params.toString()}`);
  return normalizeQueueRecord(response.data);
}

export async function getProjectAcademicYearsForDefenseQueue() {
  const response = await apiFetch<DataResponse>("/reports/projects/academic-years");
  const source = Array.isArray(response.data) ? response.data : [];
  return source
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null)
    .sort((a, b) => b - a);
}
