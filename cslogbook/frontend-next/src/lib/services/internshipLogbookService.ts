import { apiFetch, apiFetchData } from "@/lib/api/client";
import type { InternshipTimesheetStats } from "@/lib/services/studentService";

export type InternshipDateRange = {
  startDate: string;
  endDate: string;
};

export type TimesheetEntry = {
  logId?: number;
  internshipId?: number;
  studentId?: number;
  workDate: string;
  timeIn?: string | null;
  timeOut?: string | null;
  workHours?: number | null;
  logTitle?: string | null;
  workDescription?: string | null;
  learningOutcome?: string | null;
  problems?: string | null;
  solutions?: string | null;
  supervisorApproved?: number | boolean | null;
  supervisorComment?: string | null;
  advisorApproved?: boolean | null;
  advisorComment?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ReflectionPayload = {
  learningOutcome: string;
  keyLearnings: string;
  futureApplication: string;
  improvements?: string;
};

export type ReflectionResponse = {
  learningOutcome?: string;
  keyLearnings?: string;
  futureApplication?: string;
  improvements?: string;
};

export type SaveTimesheetPayload = {
  workDate: string;
  timeIn: string;
  timeOut: string;
  workHours: number;
  logTitle: string;
  workDescription: string;
  learningOutcome: string;
  problems?: string | null;
  solutions?: string | null;
};

export async function getInternshipDateRange(token: string) {
  const data = await apiFetchData<InternshipDateRange | null>(
    "/internship/logbook/cs05/date-range",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function generateInternshipWorkdays(token: string) {
  const response = await apiFetch<{ success: boolean; data?: string[] | { data?: string[] } | null; message?: string }>(
    "/internship/logbook/workdays",
    {
      method: "GET",
      token,
    }
  );

  const payload = (response as unknown as { data?: unknown }).data ?? response;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: string[] }).data;
  }
  return [] as string[];
}

export async function getTimesheetEntries(token: string) {
  const response = await apiFetch<{ success: boolean; data?: TimesheetEntry[] | null; message?: string }>(
    "/internship/logbook/timesheet",
    {
      method: "GET",
      token,
    }
  );

  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray((response.data as unknown as { data?: TimesheetEntry[] }).data)) {
    return (response.data as unknown as { data: TimesheetEntry[] }).data;
  }
  return [];
}

export async function getTimesheetStats(token: string) {
  const data = await apiFetchData<InternshipTimesheetStats | null>(
    "/internship/logbook/timesheet/stats",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function saveTimesheetEntry(token: string, payload: SaveTimesheetPayload) {
  return apiFetch<{ success: boolean; data?: TimesheetEntry | null; message?: string }>(
    "/internship/logbook/timesheet",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function updateTimesheetEntry(token: string, logId: number, payload: SaveTimesheetPayload) {
  return apiFetch<{ success: boolean; data?: TimesheetEntry | null; message?: string }>(
    `/internship/logbook/timesheet/${logId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteTimesheetEntry(token: string, logId: number) {
  return apiFetch<{ success: boolean; message?: string }>(
    `/internship/logbook/timesheet/${logId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function getReflection(token: string) {
  const data = await apiFetchData<ReflectionResponse | null>(
    "/internship/logbook/reflection",
    {
      method: "GET",
      token,
    }
  );

  return data ?? null;
}

export async function saveReflection(token: string, payload: ReflectionPayload) {
  return apiFetch<{ success: boolean; data?: ReflectionResponse | null; message?: string }>(
    "/internship/logbook/reflection",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export type TimesheetApprovalRequestPayload = {
  type: "full" | "weekly";
  startDate?: string;
  endDate?: string;
};

export type TimesheetApprovalRequestResponse = {
  success: boolean;
  emailSent?: boolean;
  reason?: string | null;
  message?: string | null;
};

export async function sendTimesheetApprovalRequest(
  token: string,
  studentId: number,
  payload: TimesheetApprovalRequestPayload
) {
  return apiFetch<TimesheetApprovalRequestResponse>(
    `/email-approval/request/${studentId}`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function getApprovalHistory(token: string, studentId: number) {
  const data = await apiFetchData<Array<Record<string, unknown>> | null>(
    `/email-approval/history/${studentId}`,
    {
      method: "GET",
      token,
    }
  );
  return data ?? [];
}
