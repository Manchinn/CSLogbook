import { apiFetch } from "@/lib/api/client";

export type ProjectMember = {
  studentId?: number | null;
  studentCode?: string | null;
  fullName?: string | null;
  role?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  classroom?: string | null;
  isEligibleProject?: boolean | null;
  isEligibleInternship?: boolean | null;
};

export type ProjectPairRecord = {
  projectId?: number | null;
  projectCode?: string | null;
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  status?: string | null;
  projectType?: string | null;
  tracks?: string[];
  advisorId?: number | null;
  coAdvisorId?: number | null;
  advisor?: {
    fullName?: string | null;
    position?: string | null;
    teacherId?: number | null;
  } | null;
  coAdvisor?: {
    fullName?: string | null;
    position?: string | null;
    teacherId?: number | null;
  } | null;
  members?: ProjectMember[];
  createdAt?: string | null;
  updatedAt?: string | null;
  objective?: string | null;
  background?: string | null;
  scope?: string | null;
  expectedOutcome?: string | null;
  benefit?: string | null;
  methodology?: string | null;
  tools?: string | null;
  timelineNote?: string | null;
  constraints?: string | null;
  risk?: string | null;
};

export type ProjectPairFilters = {
  projectStatus?: string;
  documentStatus?: string;
  trackCodes?: string;
  projectType?: string;
  academicYear?: string | number;
  semester?: string | number;
};

export type TrackOption = {
  code: string;
  name?: string | null;
  nameTh?: string | null;
};

export type AdvisorOption = {
  teacherId: number;
  teacherCode?: string | null;
  position?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type ProjectStudentLookup = {
  studentId?: number | null;
  studentCode?: string | null;
  classroom?: string | null;
  totalCredits?: number | null;
  majorCredits?: number | null;
  isEligibleProject?: boolean | null;
  hasActiveProject?: boolean | null;
  activeProject?: {
    projectId?: number | null;
    projectNameTh?: string | null;
    status?: string | null;
  } | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

export type CreateProjectPayload = {
  studentCode: string;
  student2Code?: string | null;
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectType?: string | null;
  advisorId?: number | null;
  coAdvisorId?: number | null;
  trackCodes?: string[];
};

export type UpdateProjectPayload = {
  projectNameTh?: string | null;
  projectNameEn?: string | null;
  projectType?: string | null;
  advisorId?: number | null;
  coAdvisorId?: number | null;
  trackCodes?: string[];
};

type ProjectPairsResponse = {
  success?: boolean;
  total?: number;
  data?: ProjectPairRecord[];
};

type DataResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function buildQueryString(filters: ProjectPairFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export async function getProjectPairs(filters: ProjectPairFilters = {}) {
  const query = buildQueryString(filters);
  const response = await apiFetch<ProjectPairsResponse>(`/project-members${query ? `?${query}` : ""}`);
  return {
    total: response.total ?? (response.data ?? []).length,
    data: response.data ?? [],
  };
}

export async function findProjectStudentByCode(studentCode: string) {
  const response = await apiFetch<DataResponse<ProjectStudentLookup>>(`/admin/projects/student/${encodeURIComponent(studentCode)}`);
  return response.data ?? null;
}

export async function getProjectAdvisors() {
  const response = await apiFetch<DataResponse<AdvisorOption[]>>("/admin/advisors");
  return response.data ?? [];
}

export async function getProjectTracks() {
  const response = await apiFetch<DataResponse<TrackOption[]>>("/admin/projects/tracks");
  return response.data ?? [];
}

export async function createProjectManually(payload: CreateProjectPayload) {
  try {
    return await apiFetch<DataResponse<ProjectPairRecord>>("/admin/projects/create-manually", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Fallback for environments exposing only /manual.
    return apiFetch<DataResponse<ProjectPairRecord>>("/admin/projects/manual", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function updateProjectPair(projectId: number, payload: UpdateProjectPayload) {
  return apiFetch<DataResponse<ProjectPairRecord>>(`/admin/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function cancelProjectPair(projectId: number, reason?: string) {
  return apiFetch<DataResponse<unknown>>(`/admin/projects/${projectId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
    headers: { "Content-Type": "application/json" },
  });
}
