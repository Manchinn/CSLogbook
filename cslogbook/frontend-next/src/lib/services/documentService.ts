import { apiFetch } from "@/lib/api/client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export type DocumentItem = {
  documentId?: number | string;
  id?: number | string;
  name?: string | null;
  documentName?: string | null;
  status?: string | null;
  filePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type DocumentListResponse = {
  success: boolean;
  documents: DocumentItem[];
};

export async function getMyDocuments(token: string, params?: { type?: string; lettersOnly?: number }) {
  const search = new URLSearchParams();
  if (params?.type) search.set("type", params.type);
  if (params?.lettersOnly !== undefined) search.set("lettersOnly", String(params.lettersOnly));

  const query = search.toString();
  const path = `/documents/my${query ? `?${query}` : ""}`;
  return apiFetch<DocumentListResponse>(path, { method: "GET", token });
}

async function fetchBlob(path: string, token: string) {
  if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is required");

  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = "ไม่สามารถดาวน์โหลดไฟล์ได้";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response ไม่ใช่ JSON — ใช้ message default
    }
    throw new Error(message);
  }

  return res.blob();
}

export type StudentDocumentOverviewItem = {
  type: string;
  name: string;
  status: string;
  statusLabel: string;
  documentId: number | string | null;
  canView: boolean;
  canDownload: boolean;
  downloadType: "document" | "referral" | "certificate";
};

type StudentDocumentOverviewResponse = {
  success: boolean;
  documents: StudentDocumentOverviewItem[];
};

export async function getStudentDocumentsOverview(token: string) {
  return apiFetch<StudentDocumentOverviewResponse>("/documents/student-overview", { method: "GET", token });
}

export async function viewDocument(documentId: string | number, token: string) {
  return fetchBlob(`/documents/${documentId}/view`, token);
}

export async function downloadDocument(documentId: string | number, token: string) {
  return fetchBlob(`/documents/${documentId}/download`, token);
}

export async function downloadReferralLetter(documentId: string | number, token: string) {
  return fetchBlob(`/internship/download-referral-letter/${documentId}`, token);
}

export async function downloadCertificate(token: string) {
  return fetchBlob("/internship/certificate/download", token);
}

export async function previewCertificate(token: string) {
  return fetchBlob("/internship/certificate/preview", token);
}
