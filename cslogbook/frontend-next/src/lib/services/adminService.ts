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
