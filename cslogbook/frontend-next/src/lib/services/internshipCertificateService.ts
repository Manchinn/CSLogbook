import { apiFetch } from "@/lib/api/client";
import { getStudentCertificateStatus, type InternshipCertificateStatus } from "@/lib/services/studentService";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

type CertificateRequestPayload = {
  studentId: string;
  requestDate: string;
  totalHours?: number;
  approvedHours?: number;
  evaluationStatus?: string;
  summaryStatus?: string;
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error("missing token");
  }
  return token;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  } as const;
}

async function fetchCertificateBlob(token: string, path: string) {
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    try {
      const { message } = await response.json();
      throw new Error(message || "ไม่สามารถดึงไฟล์หนังสือรับรองได้");
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("ไม่สามารถดึงไฟล์หนังสือรับรองได้");
    }
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("ไม่พบไฟล์ PDF จากเซิร์ฟเวอร์");
  }
  return blob;
}

export async function getCertificateStatus(token: string) {
  return getStudentCertificateStatus(token);
}

export async function submitCertificateRequest(token: string | null, payload: CertificateRequestPayload) {
  const safeToken = requireToken(token);
  return apiFetch<{ success: boolean; data?: unknown; message?: string }>("/internship/certificate-request", {
    method: "POST",
    token: safeToken,
    body: JSON.stringify(payload),
  });
}

export async function previewCertificate(token: string | null) {
  const safeToken = requireToken(token);
  const blob = await fetchCertificateBlob(safeToken, "/internship/certificate/preview");
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");

  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error("เบราว์เซอร์ปิดการเปิดแท็บใหม่ กรุณาอนุญาต popup");
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { success: true, message: "เปิดตัวอย่างหนังสือรับรองแล้ว" };
}

export async function downloadCertificate(token: string | null) {
  const safeToken = requireToken(token);
  const blob = await fetchCertificateBlob(safeToken, "/internship/certificate/download");
  const filename = `internship-certificate-${new Date().toISOString().slice(0, 10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return { success: true, message: "ดาวน์โหลดหนังสือรับรองแล้ว", filename };
}

export async function markCertificateDownloaded(token: string | null) {
  const safeToken = requireToken(token);
  return apiFetch<{ success: boolean; message?: string }>("/internship/certificate-downloaded", {
    method: "POST",
    token: safeToken,
  });
}

export type { CertificateRequestPayload, InternshipCertificateStatus };
