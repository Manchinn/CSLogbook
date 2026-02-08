import { apiFetch, apiFetchData } from "@/lib/api/client";

export type AdminStats = {
  students: {
    total: number;
    internshipEligible: number;
    projectEligible: number;
  };
  documents: {
    total: number;
    pending: number;
  };
  system: {
    onlineUsers: number;
    lastUpdate: string | null;
  };
};

export async function getAdminStats(token: string) {
  return apiFetch<AdminStats>("/admin/stats", {
    method: "GET",
    token,
  });
}

export type AdminProjectStats = {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
  };
  byPhase: Record<string, number>;
  examResults: {
    project1: { pending: number; pass: number; fail: number };
    thesis: { pending: number; pass: number; fail: number };
  };
  blockedProjects: Array<{ projectId?: number | null; projectCode?: string | null; projectTitle?: string | null }>;
  overdueProjects: Array<{ projectId?: number | null; projectCode?: string | null; projectTitle?: string | null }>;
};

export async function getAdminProjectStats(token: string) {
  const data = await apiFetchData<AdminProjectStats>(
    "/admin/dashboard/project-statistics",
    {
      method: "GET",
      token,
    }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูลสถิติโครงงาน");
  }

  return data;
}

export type UploadStudentResult = {
  studentID?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: "Added" | "Updated" | "Invalid" | "Error" | string;
  errors?: string[];
  error?: string;
};

export type UploadStudentSummary = {
  total?: number;
  added?: number;
  updated?: number;
  invalid?: number;
  errors?: number;
  fileError?: string;
};

export type UploadStudentResponse = {
  success: boolean;
  results?: UploadStudentResult[];
  summary?: UploadStudentSummary;
  message?: string;
  error?: string;
};

export async function uploadStudentCSV(formData: FormData, token: string) {
  return apiFetch<UploadStudentResponse>("/upload-csv", {
    method: "POST",
    body: formData,
    token,
  });
}
