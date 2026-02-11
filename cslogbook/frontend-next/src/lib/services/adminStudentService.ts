import { apiFetch } from "@/lib/api/client";

export type AdminStudent = {
  studentId?: number | null;
  userId?: number | null;
  studentCode: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  classroom?: string | null;
  academicYear?: number | null;
  semester?: number | null;
  totalCredits?: number | null;
  majorCredits?: number | null;
  status?: string | null;
  isEligibleForInternship?: boolean | null;
  isEligibleForProject?: boolean | null;
  isEligibleInternship?: boolean | null;
  isEligibleProject?: boolean | null;
};

export type StudentFilters = {
  search?: string;
  status?: string;
  academicYear?: string | number;
  semester?: string | number;
};

type StudentListResponse = {
  success: boolean;
  data?: AdminStudent[];
  message?: string;
};

type FilterOption = { value: string | number; label: string };

type StudentFilterOptionsResponse = {
  success: boolean;
  data?: {
    semesters?: FilterOption[];
    academicYears?: FilterOption[];
  };
};

type AdminStudentWritePayload = {
  studentCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  totalCredits: number;
  majorCredits: number;
};

function buildQueryString(filters: StudentFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

function normalizeStudent(student: AdminStudent): AdminStudent {
  return {
    ...student,
    totalCredits: Number(student.totalCredits ?? 0),
    majorCredits: Number(student.majorCredits ?? 0),
    isEligibleForInternship: Boolean(student.isEligibleForInternship ?? student.isEligibleInternship ?? false),
    isEligibleForProject: Boolean(student.isEligibleForProject ?? student.isEligibleProject ?? false),
  };
}

export async function getAdminStudents(filters: StudentFilters = {}) {
  const query = buildQueryString(filters);
  const response = await apiFetch<StudentListResponse>(`/students${query ? `?${query}` : ""}`);
  return (response.data ?? []).map(normalizeStudent);
}

export async function getAdminStudentFilterOptions() {
  const response = await apiFetch<StudentFilterOptionsResponse>("/students/filter-options");
  return {
    semesters: response.data?.semesters ?? [],
    academicYears: response.data?.academicYears ?? [],
  };
}

export async function createAdminStudent(payload: AdminStudentWritePayload) {
  return apiFetch("/students", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateAdminStudent(studentCode: string, payload: Omit<AdminStudentWritePayload, "studentCode">) {
  return apiFetch(`/students/${studentCode}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteAdminStudent(studentCode: string) {
  return apiFetch(`/students/${studentCode}`, {
    method: "DELETE",
  });
}
