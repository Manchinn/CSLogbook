import { apiFetch } from "@/lib/api/client";
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";
import { env } from "@/lib/config/env";

export type AdminInternshipDocumentStatus = "pending" | "approved" | "rejected" | "cancelled" | string;

export type AdminInternshipDocument = {
  id: number;
  documentName: string;
  studentName: string;
  status: AdminInternshipDocumentStatus;
  createdAt: string | null;
  reviewerId: number | null;
  reviewComment: string | null;
  filePath: string | null;
};

export type AdminInternshipDocumentListFilters = {
  status?: string;
  search?: string;
  academicYear?: string | number;
  semester?: string | number;
  limit?: number;
  offset?: number;
};

export type AdminInternshipDocumentListResult = {
  documents: AdminInternshipDocument[];
  total: number;
  statistics: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

export type AdminInternshipDocumentDetail = {
  documentId: number;
  documentName: string;
  documentType?: string | null;
  status: string;
  submittedAt?: string | null;
  filePath?: string | null;
  reviewComment?: string | null;
  studentName?: string | null;
  owner?: {
    student?: {
      studentCode?: string | null;
      totalCredits?: number | null;
      studentYear?: number | null;
    } | null;
  } | null;
  internshipDocument?: {
    companyName?: string | null;
    companyAddress?: string | null;
    internshipPosition?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  [key: string]: unknown;
};

export type LateSubmissionRecord = {
  documentId: number;
  status: "late" | "very_late" | "overdue" | string;
  daysLate?: number;
  hoursLate?: number;
};

type DocumentListApiResponse = {
  total?: number;
  statistics?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };
  documents?: unknown[];
  data?: unknown;
};

type DocumentDetailApiResponse = {
  data?: unknown;
  success?: boolean;
  message?: string;
};

type AcademicYearsApiResponse = {
  data?: unknown;
  success?: boolean;
};

type LateSubmissionsApiResponse = {
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

function normalizeDocument(item: unknown): AdminInternshipDocument {
  const raw = isRecord(item) ? item : {};
  const id = toNumberOrNull(raw.id) ?? toNumberOrNull(raw.documentId) ?? 0;

  return {
    id,
    documentName: toStringOrEmpty(raw.document_name ?? raw.documentName),
    studentName: toStringOrEmpty(raw.student_name ?? raw.studentName),
    status: toStringOrEmpty(raw.status) || "pending",
    createdAt: toStringOrNull(raw.created_at ?? raw.createdAt ?? raw.submittedAt),
    reviewerId: toNumberOrNull(raw.reviewerId),
    reviewComment: toStringOrNull(raw.reviewComment),
    filePath: toStringOrNull(raw.filePath),
  };
}

function extractDocuments(payload: DocumentListApiResponse) {
  if (Array.isArray(payload.documents)) {
    return payload.documents;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.documents)) {
    return payload.data.documents;
  }

  return [];
}

function buildQueryString(filters: AdminInternshipDocumentListFilters) {
  const params = new URLSearchParams();
  params.set("type", "internship");

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

async function fetchDocumentBlob(path: string, token?: string) {
  const effectiveToken = resolveToken(token);
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: "GET",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถดาวน์โหลดไฟล์เอกสารได้");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  return url;
}

export async function getAdminInternshipDocuments(filters: AdminInternshipDocumentListFilters = {}): Promise<AdminInternshipDocumentListResult> {
  const query = buildQueryString(filters);
  const response = await apiFetch<DocumentListApiResponse>(`/admin/documents?${query}`);
  const rows = extractDocuments(response).map(normalizeDocument);

  const total = toNumberOrNull(response.total) ?? rows.length;
  const statistics = {
    total: toNumberOrNull(response.statistics?.total) ?? total,
    pending: toNumberOrNull(response.statistics?.pending) ?? rows.filter((row) => row.status === "pending").length,
    approved: toNumberOrNull(response.statistics?.approved) ?? rows.filter((row) => row.status === "approved").length,
    rejected: toNumberOrNull(response.statistics?.rejected) ?? rows.filter((row) => row.status === "rejected").length,
  };

  return {
    documents: rows,
    total,
    statistics,
  };
}

export async function getAdminInternshipDocumentDetail(documentId: number): Promise<AdminInternshipDocumentDetail | null> {
  const response = await apiFetch<DocumentDetailApiResponse>(`/admin/documents/${documentId}`);
  const data = (isRecord(response.data) ? response.data : response) as Record<string, unknown>;
  const normalizedId = toNumberOrNull(data.documentId ?? data.id);

  if (!normalizedId) return null;

  return {
    ...(data as AdminInternshipDocumentDetail),
    documentId: normalizedId,
    documentName: toStringOrEmpty(data.documentName ?? data.document_name),
    status: toStringOrEmpty(data.status) || "pending",
  };
}

export async function reviewInternshipDocumentByStaff(
  documentId: number,
  documentName?: string,
  comment?: string,
  officialNumber?: string,
) {
  const normalizedName = (documentName ?? "").toUpperCase();
  const body = { comment: comment ?? null, officialNumber: officialNumber ?? null };

  if (normalizedName === "CS05") {
    return apiFetch(`/internship/cs-05/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  if (normalizedName === "ACCEPTANCE_LETTER") {
    return apiFetch(`/internship/acceptance/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  return apiFetch(`/admin/documents/${documentId}/approve`, {
    method: "POST",
  });
}

export async function rejectInternshipDocument(documentId: number, reason: string, documentName?: string) {
  const normalizedName = (documentName ?? "").toUpperCase();

  if (normalizedName === "CS05") {
    return apiFetch(`/internship/cs-05/${documentId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      headers: { "Content-Type": "application/json" },
    });
  }

  if (normalizedName === "ACCEPTANCE_LETTER") {
    return apiFetch(`/internship/acceptance/${documentId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      headers: { "Content-Type": "application/json" },
    });
  }

  return apiFetch(`/admin/documents/${documentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function getInternshipAcademicYearsForAdmin(): Promise<number[]> {
  const response = await apiFetch<AcademicYearsApiResponse>("/reports/internships/academic-years");
  const data = Array.isArray(response.data) ? response.data : [];
  return data
    .map((value) => toNumberOrNull(value))
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a);
}

export async function getInternshipLateSubmissions(filters: {
  academicYear?: string | number;
  semester?: string | number;
}) {
  const params = new URLSearchParams({ relatedTo: "internship" });
  if (filters.academicYear !== undefined && filters.academicYear !== "") {
    params.set("academicYear", String(filters.academicYear));
  }
  if (filters.semester !== undefined && filters.semester !== "") {
    params.set("semester", String(filters.semester));
  }

  const response = await apiFetch<LateSubmissionsApiResponse>(`/reports/deadlines/late-submissions?${params.toString()}`);
  const rows = Array.isArray(response.data) ? response.data : [];

  return rows
    .map((item) => {
      const raw = isRecord(item) ? item : {};
      const documentId = toNumberOrNull(raw.documentId);
      if (!documentId) return null;
      const daysLate = toNumberOrNull(raw.daysLate) ?? undefined;
      const hoursLate = toNumberOrNull(raw.hoursLate) ?? undefined;
      return {
        documentId,
        status: toStringOrEmpty(raw.status),
        ...(daysLate !== undefined && { daysLate }),
        ...(hoursLate !== undefined && { hoursLate }),
      } as LateSubmissionRecord;
    })
    .filter((item): item is LateSubmissionRecord => item !== null);
}

export async function previewInternshipDocument(documentId: number, token?: string) {
  const url = await fetchDocumentBlob(`/admin/documents/${documentId}/view`, token);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export async function downloadInternshipDocument(documentId: number, token?: string) {
  const url = await fetchDocumentBlob(`/admin/documents/${documentId}/download`, token);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `document-${documentId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function extractFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}

export async function exportAdminInternshipDocuments(
  filters: Omit<AdminInternshipDocumentListFilters, "limit" | "offset"> = {},
  token?: string,
) {
  const effectiveToken = resolveToken(token);
  const params = new URLSearchParams({ type: "internship" });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`${env.apiUrl}/admin/documents/export?${params.toString()}`, {
    method: "GET",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถส่งออกข้อมูลได้");
  }

  const blob = await response.blob();
  const filename = extractFileName(response.headers.get("content-disposition"), "เอกสารฝึกงาน.xlsx");

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
