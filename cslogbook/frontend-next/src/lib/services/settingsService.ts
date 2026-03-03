import { apiFetch, apiFetchData } from "@/lib/api/client";

type CurriculumRecord = {
  curriculumId?: number | null;
  curriculumID?: number | null;
  id?: number | null;
  name?: string | null;
  shortName?: string | null;
  code?: string | null;
  active?: boolean | null;
  startYear?: number | null;
  endYear?: number | null;
  maxCredits?: number | null;
  totalCredits?: number | null;
  majorCredits?: number | null;
  internshipBaseCredits?: number | null;
  projectBaseCredits?: number | null;
  projectMajorBaseCredits?: number | null;
};

/**
 * ดึงรายการหลักสูตร
 * @param activeOnly - หาก true จะดึงเฉพาะหลักสูตรที่ active=true (ค่าเริ่มต้น: true)
 */
export async function getCurriculums(activeOnly: boolean = true) {
  // apiFetchData unwraps { success, data } envelope แล้ว — data ที่ได้คือ CurriculumRecord[] โดยตรง
  const data = await apiFetchData<CurriculumRecord[]>(
    `/admin/curriculums?activeOnly=${activeOnly}`
  );
  return data ?? [];
}

export async function getCurriculumById(id: number) {
  return apiFetchData<CurriculumRecord>(`/admin/curriculums/${id}`);
}

export async function createCurriculum(payload: Record<string, unknown>) {
  return apiFetch("/admin/curriculums", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateCurriculum(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/admin/curriculums/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteCurriculum(id: number) {
  return apiFetch(`/admin/curriculums/${id}`, { method: "DELETE" });
}

export async function getCurriculumMappings() {
  const response = await apiFetchData<CurriculumRecord[]>("/admin/curriculums/mappings");
  return response ?? [];
}

export async function getCurriculumSettings() {
  return apiFetchData<Record<string, unknown>>("/admin/academic");
}

export type AcademicSettings = {
  id?: number;
  academicYear?: number | null;
  currentSemester?: number | null;
  activeCurriculumId?: number | null;
  semester1Range?: { start?: string | null; end?: string | null } | null;
  semester2Range?: { start?: string | null; end?: string | null } | null;
  semester3Range?: { start?: string | null; end?: string | null } | null;
  internshipRegistration?: { startDate?: string | null; endDate?: string | null } | null;
  projectRegistration?: { startDate?: string | null; endDate?: string | null } | null;
  internshipSemesters?: number[] | null;
  projectSemesters?: number[] | null;
  status?: string | null;
  isCurrent?: boolean | null;
};

export async function getAcademicSettings() {
  return apiFetchData<AcademicSettings>("/admin/academic");
}

export async function createAcademicSettings(payload: Record<string, unknown>) {
  return apiFetch("/admin/academic", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateAcademicSettings(payload: Record<string, unknown>) {
  return apiFetch("/admin/academic", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteAcademicSettings(id: number) {
  return apiFetch(`/admin/academic/${id}`, { method: "DELETE" });
}

export type AcademicSchedule = AcademicSettings & {
  id: number;
};

export async function listAcademicSchedules(params: Record<string, unknown> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetchData<AcademicSchedule[]>(`/admin/academic/schedules${suffix}`);
}

export async function getAcademicSchedule(id: number) {
  return apiFetchData<AcademicSchedule>(`/admin/academic/schedules/${id}`);
}

export async function createAcademicSchedule(payload: Record<string, unknown>) {
  return apiFetch("/admin/academic/schedules", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateAcademicSchedule(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/admin/academic/schedules/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function activateAcademicSchedule(id: number) {
  return apiFetch(`/admin/academic/schedules/${id}/activate`, { method: "POST" });
}

export type EligibilitySettings = Record<string, unknown>;

export async function getEligibilitySettings() {
  return apiFetchData<EligibilitySettings>("/admin/settings/eligibility");
}

export async function updateEligibilitySettings(payload: EligibilitySettings) {
  return apiFetch("/admin/settings/eligibility", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export type StudentStatus = {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  color?: string;
  active?: boolean;
  conditions?: { maxStudyYears?: number | null };
};

export async function getStudentStatuses() {
  return apiFetchData<StudentStatus[]>("/admin/settings/student-statuses");
}

export async function createStudentStatus(payload: StudentStatus) {
  return apiFetch("/admin/settings/student-statuses", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateStudentStatus(statusId: number, payload: StudentStatus) {
  return apiFetch(`/admin/settings/student-statuses/${statusId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteStudentStatus(statusId: number) {
  return apiFetch(`/admin/settings/student-statuses/${statusId}`, { method: "DELETE" });
}

export type { CurriculumRecord };
