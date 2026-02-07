import { apiFetch } from "@/lib/api/client";
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
  const response = await apiFetch<{ success: boolean; data?: InternshipDateRange | null; message?: string }>(
    "/internship/logbook/cs05/date-range",
    {
      method: "GET",
      token,
    }
  );

  return response.data ?? null;
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
  const response = await apiFetch<{ success: boolean; data?: InternshipTimesheetStats | null; message?: string }>(
    "/internship/logbook/timesheet/stats",
    {
      method: "GET",
      token,
    }
  );

  if (!response.success) return null;
  return response.data ?? null;
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
