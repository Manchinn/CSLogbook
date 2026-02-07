import { apiFetch } from "@/lib/api/client";

type TeacherOverviewResponse = {
  success: boolean;
  data: {
    teacher: {
      name: string;
      position: string;
    };
    advisees: {
      total: number;
      internshipInProgress: number;
      projectInProgress: number;
    };
    queues: {
      meetingLogs: {
        pending: number;
      };
      documents: {
        pending: number;
      };
    };
    updatedAt: string;
  };
};

export async function getTeacherOverview(token: string) {
  const response = await apiFetch<TeacherOverviewResponse>("/teachers/academic/dashboard", {
    method: "GET",
    token,
  });

  return response.data;
}
