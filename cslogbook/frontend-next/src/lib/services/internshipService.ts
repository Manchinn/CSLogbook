import { apiFetch, apiFetchData } from "@/lib/api/client";

export type InternshipStudent = {
  studentId: string;
  fullName: string;
  email?: string | null;
  totalCredits?: number | null;
  year?: number | null;
  status?: string | null;
  classroom?: string | null;
  phoneNumber?: string | null;
  statusLabel?: string | null;
  isEligible?: boolean | null;
  academicYear?: number | null;
  department?: string | null;
  faculty?: string | null;
  university?: string | null;
};

export type InternshipStudentInfoResponse = {
  success: boolean;
  student?: InternshipStudent;
  message?: string;
};

export async function getInternshipStudentInfo(token: string) {
  return apiFetch<InternshipStudentInfoResponse>("/internship/student/info", {
    method: "GET",
    token,
  });
}

export type CS05Document = {
  documentId?: number;
  status?: string;
  companyName?: string;
  companyAddress?: string;
  startDate?: string;
  endDate?: string;
  internshipPosition?: string;
  contactPersonName?: string;
  contactPersonPosition?: string;
  hasTwoStudents?: boolean;
  studentData?: Array<Record<string, unknown>>;
  transcriptFilename?: string | null;
  classroom?: string | null;
  phoneNumber?: string | null;
  rejectionReason?: string | null;
  reviewComment?: string | null;
};

export async function getCurrentCS05(token: string) {
  const data = await apiFetchData<CS05Document | null>(
    "/internship/current-cs05",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function submitCS05WithTranscript(token: string, formData: FormData) {
  return apiFetch<{ success: boolean; data?: CS05Document | null; message?: string }>(
    "/internship/cs-05/submit-with-transcript",
    {
      method: "POST",
      token,
      body: formData,
    }
  );
}

export type AcceptanceLetterStatus = {
  cs05DocumentId?: number | null;
  cs05Status?: string | null;
  hasAcceptanceLetter: boolean;
  acceptanceStatus: "not_uploaded" | "pending" | "approved" | "rejected" | "cancelled" | string;
  canUpload?: boolean;
  requiresApproval?: boolean;
  statusMessage?: string | null;
  uploadedAt?: string | null;
  updatedAt?: string | null;
  fileName?: string | null;
  documentId?: number | null;
  reviewComment?: string | null;
  rejectionReason?: string | null;
};

export async function getAcceptanceLetterStatus(token: string, documentId: number) {
  const data = await apiFetchData<AcceptanceLetterStatus | null>(
    `/internship/acceptance-letter-status/${documentId}` as const,
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export type CompanyInfo = {
  documentId?: number;
  companyName?: string | null;
  supervisorName?: string | null;
  supervisorPosition?: string | null;
  supervisorPhone?: string | null;
  supervisorEmail?: string | null;
};

export async function getCompanyInfo(token: string, documentId: number) {
  const data = await apiFetchData<CompanyInfo | null>(
    `/internship/company-info/${documentId}`,
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export type SubmitCompanyInfoPayload = {
  documentId: number;
  supervisorName: string;
  supervisorPosition?: string | null;
  supervisorPhone: string;
  supervisorEmail: string;
};

export async function submitCompanyInfo(token: string, payload: SubmitCompanyInfoPayload) {
  return apiFetch<{ success: boolean; data?: CompanyInfo | null; message?: string }>(
    "/internship/company-info/submit",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export type EvaluationStatus = {
  isSent?: boolean;
  sentDate?: string | null;
};

export async function getEvaluationStatus(token: string) {
  const data = await apiFetchData<EvaluationStatus | null>(
    "/internship/evaluation/status",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function sendEvaluationRequest(token: string, documentId: number) {
  return apiFetch<{ success: boolean; message?: string }>(
    `/internship/request-evaluation/send/${documentId}`,
    {
      method: "POST",
      token,
    }
  );
}

/**
 * อัปโหลดหนังสือตอบรับจากสถานประกอบการ (PDF)
 * POST /internship/upload-acceptance-letter
 * FormData fields: acceptanceLetter (file), cs05DocumentId (number)
 */
export async function uploadAcceptanceLetter(token: string, documentId: number, file: File) {
  const formData = new FormData();
  formData.append("acceptanceLetter", file);
  formData.append("cs05DocumentId", String(documentId));
  return apiFetch<{ success: boolean; message?: string; data?: unknown }>(
    "/internship/upload-acceptance-letter",
    {
      method: "POST",
      token,
      body: formData,
    }
  );
}

// ============= หนังสือส่งตัวนักศึกษาฝึกงาน (Referral Letter) =============

const _apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

/** สถานะหนังสือส่งตัวที่ backend ส่งกลับมา */
export type ReferralLetterStatus = {
  isReady: boolean;
  isDownloaded: boolean;
  status: string;
  statusMessage?: string | null;
  referralLetterPath?: string | null;
  hasSupervisorInfo?: boolean;
  missingRequirements?: string[];
};

/**
 * ตรวจสอบว่าหนังสือส่งตัวพร้อมให้ดาวน์โหลดหรือยัง
 * GET /internship/referral-letter-status/:documentId
 */
export async function getReferralLetterStatus(token: string, documentId: number) {
  const data = await apiFetchData<ReferralLetterStatus | null>(
    `/internship/referral-letter-status/${documentId}`,
    {
      method: "GET",
      token,
    }
  );
  return data ?? null;
}

/**
 * ดาวน์โหลดหนังสือส่งตัวนักศึกษา → trigger browser download
 * GET /internship/download-referral-letter/:documentId
 */
export async function downloadReferralLetter(token: string, documentId: number) {
  if (!_apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(
    `${_apiBaseUrl}/internship/download-referral-letter/${documentId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    try {
      const body = await response.json();
      throw new Error(body?.message || "ไม่สามารถดาวน์โหลดหนังสือส่งตัวได้");
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("ไม่สามารถดาวน์โหลดหนังสือส่งตัวได้");
    }
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("ไม่พบไฟล์ PDF จากเซิร์ฟเวอร์");
  }

  // trigger browser download
  const filename = `หนังสือส่งตัวฝึกงาน-${documentId}-${new Date().toISOString().slice(0, 10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, message: "ดาวน์โหลดหนังสือส่งตัวแล้ว", filename };
}

/**
 * ดาวน์โหลดหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน → trigger browser download
 * download ได้ทันทีหลัง CS05 approved (ไม่ต้องรอ acceptance letter)
 * GET /internship/download-cooperation-letter/:documentId
 */
export async function downloadCooperationLetter(token: string, documentId: number) {
  if (!_apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(
    `${_apiBaseUrl}/internship/download-cooperation-letter/${documentId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    try {
      const body = await response.json();
      throw new Error(body?.message || "ไม่สามารถดาวน์โหลดหนังสือขอความอนุเคราะห์ได้");
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("ไม่สามารถดาวน์โหลดหนังสือขอความอนุเคราะห์ได้");
    }
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("ไม่พบไฟล์ PDF จากเซิร์ฟเวอร์");
  }

  // ดึงชื่อไฟล์จาก Content-Disposition header ที่ backend ส่งมา (มีชื่อนักศึกษา)
  let filename = `หนังสือขอความอนุเคราะห์-${documentId}.pdf`;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    if (match?.[1]) {
      filename = decodeURIComponent(match[1].replace(/"/g, ""));
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, message: "ดาวน์โหลดหนังสือขอความอนุเคราะห์แล้ว", filename };
}
