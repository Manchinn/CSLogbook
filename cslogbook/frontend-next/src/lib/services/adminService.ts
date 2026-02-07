import { apiFetch } from "@/lib/api/client";

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
