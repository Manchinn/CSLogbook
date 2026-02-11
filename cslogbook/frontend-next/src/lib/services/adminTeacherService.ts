import { apiFetch } from "@/lib/api/client";

export type AdminTeacher = {
  teacherId?: number | null;
  teacherCode: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  contactExtension?: string | null;
  position?: string | null;
  teacherType?: string | null;
  canAccessTopicExam?: boolean | null;
  canExportProject1?: boolean | null;
};

export type TeacherFilters = {
  search?: string;
  position?: string;
  teacherType?: string;
};

type TeacherListResponse = {
  success: boolean;
  data?: AdminTeacher[];
  message?: string;
};

type AdminTeacherWritePayload = {
  teacherCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  contactExtension?: string;
  position: string;
  teacherType?: string;
  canAccessTopicExam: boolean;
  canExportProject1: boolean;
};

function buildQueryString(filters: TeacherFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function normalizeTeacher(teacher: AdminTeacher): AdminTeacher {
  return {
    ...teacher,
    canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
    canExportProject1: Boolean(teacher.canExportProject1),
  };
}

export async function getAdminTeachers(filters: TeacherFilters = {}) {
  const query = buildQueryString(filters);
  const response = await apiFetch<TeacherListResponse>(`/admin/teachers${query ? `?${query}` : ""}`);
  return (response.data ?? []).map(normalizeTeacher);
}

export async function createAdminTeacher(payload: AdminTeacherWritePayload) {
  return apiFetch("/admin/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateAdminTeacher(
  teacherId: number,
  payload: Omit<AdminTeacherWritePayload, "teacherCode"> & { teacherCode?: string },
) {
  return apiFetch(`/admin/teachers/${teacherId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteAdminTeacher(teacherId: number) {
  return apiFetch(`/admin/teachers/${teacherId}`, {
    method: "DELETE",
  });
}
