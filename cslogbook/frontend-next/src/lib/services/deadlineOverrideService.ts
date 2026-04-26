import { apiFetch, apiFetchData } from "@/lib/api/client";

export type DeadlineOverride = {
  studentDeadlineStatusId: number;
  studentId: number;
  importantDeadlineId: number;
  extendedUntil: string | null;
  bypassLock: boolean;
  grantedBy: number | null;
  grantedAt: string | null;
  revokedAt: string | null;
  reason: string | null;
  isActive: boolean;
  student?: {
    studentId: number;
    studentCode?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  grantedByUser?: {
    userId: number;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type GrantOverridePayload = {
  studentId: number;
  extendedUntil?: string | null; // ISO string
  bypassLock?: boolean;
  reason?: string | null;
};

export async function listDeadlineOverrides(deadlineId: number) {
  return apiFetchData<DeadlineOverride[]>(
    `/admin/important-deadlines/${deadlineId}/overrides`,
  );
}

export async function grantDeadlineOverride(
  deadlineId: number,
  payload: GrantOverridePayload,
) {
  return apiFetch(
    `/admin/important-deadlines/${deadlineId}/overrides`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function revokeDeadlineOverride(
  deadlineId: number,
  studentId: number,
  reason?: string | null,
) {
  return apiFetch(
    `/admin/important-deadlines/${deadlineId}/overrides/${studentId}`,
    {
      method: "DELETE",
      body: reason ? JSON.stringify({ reason }) : undefined,
      headers: reason ? { "Content-Type": "application/json" } : undefined,
    },
  );
}
