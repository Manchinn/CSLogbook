import { apiFetch } from "@/lib/api/client";
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";
import { env } from "@/lib/config/env";

export type AdminCertificateRequestStatus = "pending" | "approved" | "rejected" | string;

export type AdminCertificateRequest = {
  id: number;
  status: AdminCertificateRequestStatus;
  requestDate: string | null;
  totalHours: number | null;
  student: {
    studentCode: string;
    fullName: string;
  };
  internship: {
    internshipId: number | null;
    companyName: string;
  };
};

export type AdminCertificateListFilters = {
  status?: string;
  academicYear?: string | number;
  semester?: string | number;
  page?: number;
  limit?: number;
};

export type AdminCertificateListResult = {
  rows: AdminCertificateRequest[];
  total: number;
};

export type AdminCertificateRequestDetail = {
  id?: number;
  status?: string;
  requestDate?: string | null;
  student?: {
    fullName?: string | null;
    studentCode?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  internship?: {
    internshipId?: number | null;
    companyName?: string | null;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    totalHours?: number | null;
  } | null;
  eligibility?: {
    hours?: { current?: number; required?: number; passed?: boolean };
    evaluation?: { status?: string; passed?: boolean; overallScore?: number; passScore?: number };
  } | null;
  evaluationDetail?: {
    overallScore?: number;
    passScore?: number;
    fullScore?: number | null;
    evaluatorName?: string | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    passed?: boolean;
    strengths?: string | null;
    weaknessesToImprove?: string | null;
    additionalComments?: string | null;
    breakdown?: Array<{
      key?: string | null;
      category?: string | null;
      categoryLabel?: string | null;
      sequence?: number | null;
      label?: string | null;
      score?: number | null;
      max?: number | null;
    }>;
  } | null;
  remarks?: string | null;
  [key: string]: unknown;
};

export type AdminInternshipLogbookSummary = {
  internship?: {
    internshipId?: number | null;
    companyName?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  student?: {
    fullName?: string | null;
    studentCode?: string | null;
  } | null;
  statistics?: {
    totalEntries?: number;
    totalHours?: number;
    approvedHours?: number;
    workingDays?: number;
  } | null;
  reflection?: {
    learningOutcome?: string | null;
    keyLearnings?: string | null;
    futureApplication?: string | null;
    improvements?: string | null;
  } | null;
  entries?: Array<{
    workDate?: string | null;
    logTitle?: string | null;
    workDescription?: string | null;
    workHours?: number | null;
  }> | null;
  [key: string]: unknown;
};

type CertificateListApiResponse = {
  data?: unknown;
  pagination?: {
    total?: number;
  };
  total?: number;
};

type DetailApiResponse = {
  data?: unknown;
};

type LogbookSummaryApiResponse = {
  data?: unknown;
  success?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function toStringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function resolveToken(token?: string) {
  if (token) return token;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_TOKEN_KEY);
}

async function fetchCertificateBlob(path: string, filename: string, token?: string) {
  const effectiveToken = resolveToken(token);
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: "GET",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถดาวน์โหลดไฟล์หนังสือรับรองได้");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function normalizeRow(item: unknown): AdminCertificateRequest {
  const raw = isRecord(item) ? item : {};
  const studentRaw = isRecord(raw.student) ? raw.student : {};
  const internshipRaw = isRecord(raw.internship) ? raw.internship : {};
  const id = toNumberOrNull(raw.id) ?? 0;

  return {
    id,
    status: toStringOrEmpty(raw.status) || "pending",
    requestDate: toStringOrNull(raw.requestDate),
    totalHours: toNumberOrNull(raw.totalHours),
    student: {
      studentCode: toStringOrEmpty(studentRaw.studentCode),
      fullName: toStringOrEmpty(studentRaw.fullName),
    },
    internship: {
      internshipId: toNumberOrNull(internshipRaw.internshipId),
      companyName: toStringOrEmpty(internshipRaw.companyName),
    },
  };
}

function buildQueryString(filters: AdminCertificateListFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function getAdminCertificateRequests(filters: AdminCertificateListFilters): Promise<AdminCertificateListResult> {
  const query = buildQueryString(filters);
  const response = await apiFetch<CertificateListApiResponse>(`/admin/certificate-requests${query ? `?${query}` : ""}`);

  const rows = Array.isArray(response.data) ? response.data.map(normalizeRow) : [];
  const total = toNumberOrNull(response.pagination?.total) ?? toNumberOrNull(response.total) ?? rows.length;

  return { rows, total };
}

export async function getAdminCertificateRequestDetail(requestId: number): Promise<AdminCertificateRequestDetail | null> {
  const response = await apiFetch<DetailApiResponse>(`/admin/certificate-requests/${requestId}/detail`);
  if (!isRecord(response.data)) return null;
  return response.data as AdminCertificateRequestDetail;
}

export async function approveAdminCertificateRequest(requestId: number, certificateNumber: string) {
  return apiFetch(`/admin/certificate-requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify({ certificateNumber }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function rejectAdminCertificateRequest(requestId: number, remarks: string) {
  return apiFetch(`/admin/certificate-requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function downloadAdminCertificateRequest(requestId: number, token?: string) {
  return fetchCertificateBlob(`/admin/certificate-requests/${requestId}/download`, `internship-certificate-${requestId}.pdf`, token);
}

export async function getAdminInternshipLogbookSummary(internshipId: number): Promise<AdminInternshipLogbookSummary | null> {
  const response = await apiFetch<LogbookSummaryApiResponse>(`/admin/internships/${internshipId}/logbook-summary`);
  if (!isRecord(response.data)) return null;
  const raw = response.data as Record<string, unknown>;

  // backend ส่ง studentInfo/companyInfo/internshipPeriod/statistics — map ให้ตรงกับ frontend type
  const studentInfo = isRecord(raw.studentInfo) ? raw.studentInfo : null;
  const companyInfo = isRecord(raw.companyInfo) ? raw.companyInfo : null;
  const period = isRecord(raw.internshipPeriod) ? raw.internshipPeriod : null;
  const stats = isRecord(raw.statistics) ? raw.statistics : null;
  const reflection = isRecord(raw.reflection) ? raw.reflection : null;
  const entries = Array.isArray(raw.logEntries) ? raw.logEntries : null;

  return {
    student: studentInfo
      ? {
          fullName: [studentInfo.firstName, studentInfo.lastName].filter(Boolean).join(" ") || null,
          studentCode: toStringOrEmpty(studentInfo.studentId) || null,
        }
      : null,
    internship: companyInfo || period
      ? {
          internshipId: toNumberOrNull(raw.internshipId ?? internshipId),
          companyName: toStringOrEmpty(companyInfo?.companyName) || null,
          startDate: toStringOrEmpty(period?.startDate) || null,
          endDate: toStringOrEmpty(period?.endDate) || null,
        }
      : null,
    statistics: stats
      ? {
          totalEntries: toNumberOrNull(stats.totalDays) ?? undefined,
          totalHours: toNumberOrNull(stats.totalHours) ?? undefined,
          approvedHours: toNumberOrNull(stats.approvedHours) ?? undefined,
          workingDays: toNumberOrNull(stats.totalDays) ?? undefined,
        }
      : null,
    reflection: reflection
      ? {
          learningOutcome: toStringOrEmpty(reflection.learningOutcome) || null,
          keyLearnings: toStringOrEmpty(reflection.keyLearnings) || null,
          futureApplication: toStringOrEmpty(reflection.futureApplication) || null,
          improvements: toStringOrEmpty(reflection.improvements) || null,
        }
      : null,
    entries: entries
      ? entries.map((e: Record<string, unknown>) => ({
          workDate: toStringOrEmpty(e?.workDate) || null,
          logTitle: toStringOrEmpty(e?.logTitle) || null,
          workDescription: toStringOrEmpty(e?.workDescription) || null,
          workHours: toNumberOrNull(e?.workHours) ?? null,
        }))
      : null,
  };
}
