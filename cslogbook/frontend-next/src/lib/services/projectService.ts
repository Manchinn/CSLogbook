import { apiFetch, apiFetchData } from "@/lib/api/client";
import type { ProjectDetail } from "@/lib/services/studentService";

const DEFENSE_TYPE_PROJECT1 = "PROJECT1";
const DEFENSE_TYPE_THESIS = "THESIS";

type DefenseType = typeof DEFENSE_TYPE_PROJECT1 | typeof DEFENSE_TYPE_THESIS;

type ProjectFile = {
  name?: string | null;
  url?: string | null;
};

export type SystemTestRequest = {
  requestId: number;
  status?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  testStartDate?: string | null;
  testDueDate?: string | null;
  studentNote?: string | null;
  requestFile?: ProjectFile | null;
  evidence?: ProjectFile | null;
  evidenceDriveLink?: string | null;
  evidenceSubmittedAt?: string | null;
  submittedLate?: boolean | null;
  timeline?: {
    submittedAt?: string | null;
    advisorDecidedAt?: string | null;
    coAdvisorDecidedAt?: string | null;
    staffDecidedAt?: string | null;
    evidenceSubmittedAt?: string | null;
  };
  advisorDecision?: { name?: string | null; note?: string | null; decidedAt?: string | null } | null;
  coAdvisorDecision?: { name?: string | null; note?: string | null; decidedAt?: string | null } | null;
  staffDecision?: { note?: string | null } | null;
};

function resolveDefenseType(defenseType?: DefenseType) {
  return defenseType === DEFENSE_TYPE_THESIS ? DEFENSE_TYPE_THESIS : DEFENSE_TYPE_PROJECT1;
}

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
  advisorApprovals?: Array<{ approvalId: number; teacherId?: number; status?: string | null; note?: string | null; approvedAt?: string | null; teacher?: { name?: string | null } | null }>;
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

export async function getProjectDefenseRequest(
  token: string,
  projectId: number,
  defenseType?: DefenseType
) {
  const resolvedType = resolveDefenseType(defenseType);
  return apiFetchData<ProjectDefenseRequest>(`/projects/${projectId}/kp02?defenseType=${resolvedType}`, {
    method: "GET",
    token,
  });
}

export async function submitProjectDefenseRequest(
  token: string,
  projectId: number,
  payload: Record<string, unknown>,
  defenseType?: DefenseType
) {
  const resolvedType = resolveDefenseType(defenseType);
  return apiFetch<{ success: boolean; data?: ProjectDefenseRequest; message?: string }>(
    `/projects/${projectId}/kp02?defenseType=${resolvedType}`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function getProject1DefenseRequest(token: string, projectId: number) {
  return getProjectDefenseRequest(token, projectId, DEFENSE_TYPE_PROJECT1);
}

export async function submitProject1DefenseRequest(
  token: string,
  projectId: number,
  payload: Record<string, unknown>
) {
  return submitProjectDefenseRequest(token, projectId, payload, DEFENSE_TYPE_PROJECT1);
}

export async function getThesisDefenseRequest(token: string, projectId: number) {
  return getProjectDefenseRequest(token, projectId, DEFENSE_TYPE_THESIS);
}

export async function submitThesisDefenseRequest(
  token: string,
  projectId: number,
  payload: Record<string, unknown>
) {
  return submitProjectDefenseRequest(token, projectId, payload, DEFENSE_TYPE_THESIS);
}

export async function getSystemTestRequest(token: string, projectId: number) {
  return apiFetchData<SystemTestRequest>(`/projects/${projectId}/system-test/request`, {
    method: "GET",
    token,
  });
}

export async function submitSystemTestRequest(
  token: string,
  projectId: number,
  payload: {
    testStartDate: string;
    testDueDate: string;
    studentNote?: string | null;
    requestFile?: File | null;
  }
) {
  const formData = new FormData();
  formData.append("testStartDate", payload.testStartDate);
  formData.append("testDueDate", payload.testDueDate);
  if (payload.studentNote) {
    formData.append("studentNote", payload.studentNote);
  }
  if (payload.requestFile) {
    formData.append("requestFile", payload.requestFile);
  }

  return apiFetch<{ success: boolean; data?: SystemTestRequest; message?: string }>(
    `/projects/${projectId}/system-test/request`,
    {
      method: "POST",
      token,
      body: formData,
    }
  );
}

export async function uploadSystemTestEvidence(
  token: string,
  projectId: number,
  file: File | null,
  options?: { driveLink?: string }
) {
  const formData = new FormData();
  if (file) {
    formData.append("evidenceFile", file);
  }
  if (options?.driveLink) {
    formData.append("evidenceDriveLink", options.driveLink);
  }

  return apiFetch<{ success: boolean; data?: SystemTestRequest; message?: string }>(
    `/projects/${projectId}/system-test/request/evidence`,
    {
      method: "POST",
      token,
      body: formData,
    }
  );
}

export type ProjectArtifact = {
  artifactId: number;
  projectId: number;
  type: string;
  filePath: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  version?: number;
  uploadedByStudentId?: number;
  uploadedAt?: string;
};

export async function getProjectArtifacts(token: string, projectId: number, type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetchData<ProjectArtifact[]>(`/projects/${projectId}/artifacts${query}`, {
    method: "GET",
    token,
  });
}

export async function uploadProposalFile(token: string, projectId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<{ success: boolean; data?: ProjectArtifact; message?: string }>(
    `/projects/${projectId}/proposal`,
    {
      method: "POST",
      token,
      body: formData,
    }
  );
}
