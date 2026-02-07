import { apiFetch } from "@/lib/api/client";

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
};

export async function getCurrentCS05(token: string) {
  const response = await apiFetch<{ success: boolean; data: CS05Document | null; message?: string }>(
    "/internship/current-cs05",
    {
      method: "GET",
      token,
    }
  );

  return response.data ?? null;
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
