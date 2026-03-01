import { apiFetch } from "@/lib/api/client";
import { env } from "@/lib/config/env";
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";

export type AdminProjectDocument = {
  id: number;
  documentName: string;
  studentName: string;
  status: string;
  createdAt: string | null;
  reviewerId: number | null;
  reviewComment: string | null;
  filePath: string | null;
  projectTitle?: string | null;
  projectCode?: string | null;
};

export type AdminProjectDocumentDetail = {
  id: number;
  documentName: string;
  studentName: string;
  studentCode: string | null;
  status: string;
  createdAt: string | null;
  reviewDate: string | null;
  reviewComment: string | null;
  filePath: string | null;
  projectTitle?: string | null;
  projectCode?: string | null;
};

export type AdminProjectDocumentListFilters = {
  status?: string;
  search?: string;
  academicYear?: string | number;
  semester?: string | number;
  limit?: number;
  offset?: number;
};

export type AdminProjectDocumentListResult = {
  documents: AdminProjectDocument[];
  total: number;
  statistics?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

export async function listAdminProjectDocuments(filters: AdminProjectDocumentListFilters = {}): Promise<AdminProjectDocumentListResult> {
  const query = new URLSearchParams();
  query.set("type", "project");
  if (filters.status) query.set("status", String(filters.status));
  if (filters.search) query.set("search", String(filters.search));
  if (filters.academicYear) query.set("academicYear", String(filters.academicYear));
  if (filters.semester) query.set("semester", String(filters.semester));
  if (filters.limit != null) query.set("limit", String(filters.limit));
  if (filters.offset != null) query.set("offset", String(filters.offset));
  const qs = query.toString();
  const res = await apiFetch<{ success: boolean; data: AdminProjectDocumentListResult }>(
    `/admin/documents${qs ? `?${qs}` : ""}`
  );
  return res.data ?? { documents: [], total: 0 };
}

export async function getAdminProjectDocumentDetail(documentId: number): Promise<AdminProjectDocumentDetail> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(`/admin/documents/${documentId}`);
  const d = res.data ?? {};
  const owner = d.owner as Record<string, unknown> | undefined;
  const student = owner?.student as Record<string, unknown> | undefined;
  return {
    id: (d.documentId ?? d.id ?? documentId) as number,
    documentName: (d.documentName ?? d.document_name ?? "") as string,
    studentName: owner ? `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim() : ((d.studentName ?? "") as string),
    studentCode: (student?.studentCode ?? null) as string | null,
    status: (d.status ?? "") as string,
    createdAt: (d.createdAt ?? d.created_at ?? null) as string | null,
    reviewDate: (d.reviewDate ?? d.review_date ?? null) as string | null,
    reviewComment: (d.reviewComment ?? d.review_comment ?? null) as string | null,
    filePath: (d.filePath ?? d.file_path ?? null) as string | null,
    projectTitle: (d.projectTitle ?? null) as string | null,
    projectCode: (d.projectCode ?? null) as string | null,
  };
}

export async function reviewAdminProjectDocument(documentId: number): Promise<void> {
  await apiFetch(`/admin/documents/${documentId}/approve`, { method: "POST" });
}

export async function rejectAdminProjectDocument(documentId: number, reason: string): Promise<void> {
  await apiFetch(`/admin/documents/${documentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

async function fetchDocumentBlob(path: string): Promise<Blob> {
  const token =
    typeof window !== "undefined"
      ? (window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_TOKEN_KEY))
      : null;

  const res = await fetch(`${env.apiUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("ไม่สามารถดาวน์โหลดไฟล์ได้");
  return res.blob();
}

export async function previewAdminProjectDocument(documentId: number): Promise<void> {
  const blob = await fetchDocumentBlob(`/admin/documents/${documentId}/view`);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function downloadAdminProjectDocument(documentId: number): Promise<void> {
  const blob = await fetchDocumentBlob(`/admin/documents/${documentId}/download`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `project-document-${documentId}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
