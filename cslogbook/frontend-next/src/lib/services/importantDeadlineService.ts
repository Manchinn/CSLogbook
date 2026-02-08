import { apiFetch, apiFetchData } from "@/lib/api/client";

export type ImportantDeadline = {
  id: number;
  name: string;
  relatedTo?: string | null;
  academicYear?: number | null;
  semester?: number | null;
  deadlineAt?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  allowLate?: boolean | null;
  gracePeriodMinutes?: number | null;
  lockAfterDeadline?: boolean | null;
  visibilityScope?: string | null;
  isPublished?: boolean | null;
  publishAt?: string | null;
  windowStartAt?: string | null;
  windowEndAt?: string | null;
  windowStartDate?: string | null;
  windowStartTime?: string | null;
  windowEndDate?: string | null;
  windowEndTime?: string | null;
  status?: string | null;
  daysLeft?: number | null;
};

export async function listImportantDeadlines(params: Record<string, unknown> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetchData<ImportantDeadline[]>(`/admin/important-deadlines${suffix}`);
}

export async function createImportantDeadline(payload: Record<string, unknown>) {
  return apiFetch("/admin/important-deadlines", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateImportantDeadline(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/admin/important-deadlines/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateDeadlinePolicy(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/admin/important-deadlines/${id}/policy`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteImportantDeadline(id: number) {
  return apiFetch(`/admin/important-deadlines/${id}`, { method: "DELETE" });
}

export async function getImportantDeadlineStats(id: number) {
  return apiFetchData<Record<string, unknown>>(`/admin/important-deadlines/${id}/stats`);
}
