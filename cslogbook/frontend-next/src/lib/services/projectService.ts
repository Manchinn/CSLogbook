import { apiFetch, apiFetchData } from "@/lib/api/client";
import type { ProjectDetail } from "@/lib/services/studentService";

const DEFENSE_TYPE_PROJECT1 = "PROJECT1";

export type ProjectCreatePayload = {
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectType?: string | null;
  tracks?: string[] | null;
  background?: string | null;
  objective?: string | null;
  benefit?: string | null;
  secondMemberStudentCode?: string | null;
};

export type ProjectUpdatePayload = {
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectType?: string | null;
  tracks?: string[] | null;
  background?: string | null;
  objective?: string | null;
  benefit?: string | null;
};

export type ProjectDefenseRequest = {
  requestId: number;
  status?: string | null;
  formPayload?: Record<string, unknown> | null;
  submittedAt?: string | null;
  advisorApprovedAt?: string | null;
  staffVerifiedAt?: string | null;
  defenseScheduledAt?: string | null;
  defenseLocation?: string | null;
  staffVerificationNote?: string | null;
  staffVerifiedBy?: { fullName?: string | null } | null;
  submittedLate?: boolean | null;
  advisorApprovals?: Array<{ advisorId: number; status?: string | null }>;
  updatedAt?: string | null;
};

export async function createProject(token: string, payload: ProjectCreatePayload) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail; message?: string }>("/projects", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function getProject(token: string, projectId: number) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail }>(`/projects/${projectId}`, {
    method: "GET",
    token,
  });
}

export async function getProjectWithSummary(token: string, projectId: number) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail }>(
    `/projects/${projectId}?include=summary`,
    {
      method: "GET",
      token,
    }
  );
}

export async function updateProject(token: string, projectId: number, payload: ProjectUpdatePayload) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail; message?: string }>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function addMember(token: string, projectId: number, studentCode: string) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail; message?: string }>(
    `/projects/${projectId}/members`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ studentCode }),
    }
  );
}

export async function activateProject(token: string, projectId: number) {
  return apiFetch<{ success: boolean; data?: ProjectDetail; project?: ProjectDetail; message?: string }>(
    `/projects/${projectId}/activate`,
    {
      method: "POST",
      token,
    }
  );
}

export async function getProject1DefenseRequest(token: string, projectId: number) {
  return apiFetchData<ProjectDefenseRequest>(`/projects/${projectId}/kp02?defenseType=${DEFENSE_TYPE_PROJECT1}`, {
    method: "GET",
    token,
  });
}

export async function submitProject1DefenseRequest(
  token: string,
  projectId: number,
  payload: Record<string, unknown>
) {
  return apiFetch<{ success: boolean; data?: ProjectDefenseRequest; message?: string }>(
    `/projects/${projectId}/kp02?defenseType=${DEFENSE_TYPE_PROJECT1}`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}
