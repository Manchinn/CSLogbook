import { apiFetch } from "@/lib/api/client";
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export type TopicExamResult = "passed" | "failed" | null;

export type AdminTopicExamFilters = {
  search?: string;
  academicYear?: string | number;
  semester?: string | number;
  limit?: number;
  offset?: number;
};

export type AdminTopicExamMember = {
  studentId: number | null;
  studentCode: string;
  name: string;
  role: string | null;
  classroom: string | null;
  remark: string | null;
};

export type AdminTopicExamAdvisor = {
  teacherId: number;
  name: string;
};

export type AdminTopicExamRecord = {
  projectId: number;
  projectCode: string;
  titleTh: string;
  titleEn: string;
  status: string;
  advisor: AdminTopicExamAdvisor | null;
  coAdvisor: AdminTopicExamAdvisor | null;
  members: AdminTopicExamMember[];
  memberCount: number;
  examResult: TopicExamResult;
  examFailReason: string | null;
  examResultAt: string | null;
  academicYear: number | null;
  semester: number | null;
};

export type AdminTopicExamOverviewResult = {
  rows: AdminTopicExamRecord[];
  total: number;
  meta: {
    availableAcademicYears: number[];
    availableSemestersByYear: Record<string, number[]>;
  };
};

export type AdminAdvisorOption = {
  teacherId: number;
  teacherCode: string;
  fullName: string;
};

type TopicExamOverviewApiResponse = {
  data?: unknown;
  total?: number;
  meta?: unknown;
};

type DataResponse<T> = {
  data?: unknown;
  success?: boolean;
  message?: string;
} & T;

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

function normalizeTopicExamMember(item: unknown): AdminTopicExamMember {
  const raw = isRecord(item) ? item : {};
  return {
    studentId: toNumberOrNull(raw.studentId),
    studentCode: toStringOrEmpty(raw.studentCode),
    name: toStringOrEmpty(raw.name),
    role: toStringOrNull(raw.role),
    classroom: toStringOrNull(raw.classroom),
    remark: toStringOrNull(raw.remark),
  };
}

function normalizeTopicExamAdvisor(item: unknown): AdminTopicExamAdvisor | null {
  const raw = isRecord(item) ? item : {};
  const teacherId = toNumberOrNull(raw.teacherId);
  if (!teacherId) return null;
  return {
    teacherId,
    name: toStringOrEmpty(raw.name),
  };
}

function normalizeTopicExamRecord(item: unknown): AdminTopicExamRecord {
  const raw = isRecord(item) ? item : {};
  const members = Array.isArray(raw.members) ? raw.members.map(normalizeTopicExamMember) : [];
  const examResultRaw = toStringOrEmpty(raw.examResult).toLowerCase();

  const examResult: TopicExamResult =
    examResultRaw === "passed" ? "passed" : examResultRaw === "failed" ? "failed" : null;

  return {
    projectId: toNumberOrNull(raw.projectId) ?? 0,
    projectCode: toStringOrEmpty(raw.projectCode),
    titleTh: toStringOrEmpty(raw.titleTh),
    titleEn: toStringOrEmpty(raw.titleEn),
    status: toStringOrEmpty(raw.status),
    advisor: normalizeTopicExamAdvisor(raw.advisor),
    coAdvisor: normalizeTopicExamAdvisor(raw.coAdvisor),
    members,
    memberCount: toNumberOrNull(raw.memberCount) ?? members.length,
    examResult,
    examFailReason: toStringOrNull(raw.examFailReason),
    examResultAt: toStringOrNull(raw.examResultAt),
    academicYear: toNumberOrNull(raw.academicYear),
    semester: toNumberOrNull(raw.semester),
  };
}

function buildOverviewQuery(filters: AdminTopicExamFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function normalizeMeta(value: unknown) {
  const raw = isRecord(value) ? value : {};
  const years = Array.isArray(raw.availableAcademicYears) ? raw.availableAcademicYears : [];
  const yearList = years
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null)
    .sort((a, b) => b - a);

  const availableSemestersByYear: Record<string, number[]> = {};
  const semesterRaw = isRecord(raw.availableSemestersByYear) ? raw.availableSemestersByYear : {};
  Object.entries(semesterRaw).forEach(([key, item]) => {
    const semesters = Array.isArray(item) ? item : [];
    const normalized = semesters
      .map((semester) => toNumberOrNull(semester))
      .filter((semester): semester is number => semester !== null)
      .sort((a, b) => a - b);
    availableSemestersByYear[key] = normalized;
  });

  return {
    availableAcademicYears: yearList,
    availableSemestersByYear,
  };
}

export async function getAdminTopicExamOverview(filters: AdminTopicExamFilters = {}): Promise<AdminTopicExamOverviewResult> {
  const query = buildOverviewQuery(filters);
  const response = await apiFetch<TopicExamOverviewApiResponse>(`/projects/topic-exam/overview${query ? `?${query}` : ""}`);
  const source = Array.isArray(response.data) ? response.data : [];
  const rows = source.map(normalizeTopicExamRecord).filter((item) => item.projectId > 0);
  return {
    rows,
    total: toNumberOrNull(response.total) ?? rows.length,
    meta: normalizeMeta(response.meta),
  };
}

export async function recordAdminTopicExamResult(payload: {
  projectId: number;
  result: "passed" | "failed";
  reason?: string;
  advisorId?: number;
  coAdvisorId?: number | null;
  allowOverwrite?: boolean;
}) {
  const body: Record<string, unknown> = {
    result: payload.result,
    allowOverwrite: Boolean(payload.allowOverwrite),
  };

  if (payload.reason !== undefined) {
    body.reason = payload.reason;
  }
  if (payload.advisorId !== undefined) {
    body.advisorId = payload.advisorId;
  }
  if (payload.coAdvisorId !== undefined) {
    body.coAdvisorId = payload.coAdvisorId;
  }

  return apiFetch(`/projects/${payload.projectId}/topic-exam-result`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

export function exportTopicExamList(
  filters: Omit<AdminTopicExamFilters, "limit" | "offset"> = {},
) {
  return downloadExcelFile({
    endpoint: "/projects/topic-exam/export-list",
    params: { ...filters },
    fallbackFilename: "รายชื่อสอบหัวข้อโครงงาน.xlsx",
  });
}

export function exportTopicExamResults(
  filters: Omit<AdminTopicExamFilters, "limit" | "offset"> = {},
) {
  return downloadExcelFile({
    endpoint: "/projects/topic-exam/export-results",
    params: { ...filters },
    fallbackFilename: "ผลสอบหัวข้อโครงงาน.xlsx",
  });
}

export async function getAdminTopicExamAdvisors(): Promise<AdminAdvisorOption[]> {
  const response = await apiFetch<DataResponse<{ data?: unknown[] }>>("/admin/advisors");
  const source = Array.isArray(response.data) ? response.data : [];

  return source
    .map((item) => {
      const raw = isRecord(item) ? item : {};
      const teacherId = toNumberOrNull(raw.teacherId);
      if (!teacherId) return null;
      const user = isRecord(raw.user) ? raw.user : {};
      const firstName = toStringOrEmpty(user.firstName);
      const lastName = toStringOrEmpty(user.lastName);
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

      return {
        teacherId,
        teacherCode: toStringOrEmpty(raw.teacherCode),
        fullName: fullName || "-",
      } satisfies AdminAdvisorOption;
    })
    .filter((item): item is AdminAdvisorOption => item !== null);
}

export async function getProjectAcademicYearsForAdmin() {
  const response = await apiFetch<DataResponse<{ data?: unknown[] }>>("/reports/projects/academic-years");
  const source = Array.isArray(response.data) ? response.data : [];
  return source
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null)
    .sort((a, b) => b - a);
}
