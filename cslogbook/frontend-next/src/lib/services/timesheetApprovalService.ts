import { apiFetch, type ApiSuccessResponse } from "@/lib/api/client";

export type TimesheetApprovalEntry = {
  logId: number;
  workDate?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  workHours?: number | null;
  logTitle?: string | null;
  workDescription?: string | null;
  supervisorApproved?: number | boolean | null;
  advisorApproved?: boolean | null;
  studentName?: string | null;
  companyName?: string | null;
};

export type TimesheetApprovalDetails = {
  token: string;
  status: string | null;
  type: string | null;
  studentId?: number | string | null;
  studentName?: string | null;
  studentCode?: string | null;
  companyName?: string | null;
  timesheetEntries: TimesheetApprovalEntry[];
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt?: string | null;
};

export type TimesheetApprovalAction = {
  token?: string;
  status?: string | null;
  processedAt?: string | null;
  comment?: string | null;
};

async function fetchApprovalResponse<T>(path: string, options: RequestInit) {
  const response = await apiFetch<ApiSuccessResponse<T>>(path, options);
  if (!response.success) {
    throw new Error(response.message ?? "ไม่สามารถดำเนินการได้");
  }
  return response.data ?? null;
}

export async function getTimesheetApprovalDetails(token: string) {
  const data = await fetchApprovalResponse<TimesheetApprovalDetails>(
    `/email-approval/details/${token}`,
    { method: "GET" }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูลการอนุมัติ");
  }

  return data;
}

export async function approveTimesheet(token: string, comment?: string) {
  const data = await fetchApprovalResponse<TimesheetApprovalAction>(
    `/email-approval/web/approve/${token}`,
    {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? "" }),
    }
  );

  return data;
}

export async function rejectTimesheet(token: string, comment: string) {
  const data = await fetchApprovalResponse<TimesheetApprovalAction>(
    `/email-approval/web/reject/${token}`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    }
  );

  return data;
}
