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
    throw new Error("ไม่สามารถดาวน์โหลดไฟล์ได้");
  }

  return res.blob();
}

export async function viewDocument(documentId: string | number, token: string) {
  return fetchBlob(`/documents/${documentId}/view`, token);
}

export async function downloadDocument(documentId: string | number, token: string) {
  return fetchBlob(`/documents/${documentId}/download`, token);
}
