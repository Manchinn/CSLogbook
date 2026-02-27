import {
  getEmailApproveByEmailCompatibility,
  getEmailRejectByEmailCompatibility,
  getEmailApprovalDetailsCompatibility,
  postEmailApproveByEmailCompatibility,
  postEmailRejectByEmailCompatibility,
  postEmailApproveByWebCompatibility,
  postEmailRejectByWebCompatibility,
  type EmailApprovalActionResult,
  type EmailApprovalDetails,
  type TimesheetApprovalEntryCompat,
} from "@/lib/services/compatibilityService";

export type TimesheetApprovalEntry = TimesheetApprovalEntryCompat & {
  studentName?: string | null;
  companyName?: string | null;
};

export type TimesheetApprovalDetails = Omit<EmailApprovalDetails, "timesheetEntries"> & {
  timesheetEntries: TimesheetApprovalEntry[];
};

export type TimesheetApprovalAction = EmailApprovalActionResult;

export async function getTimesheetApprovalDetails(token: string) {
  const data = await getEmailApprovalDetailsCompatibility(token);

  if (!data) {
    throw new Error("ไม่พบข้อมูลการอนุมัติ");
  }

  return {
    ...data,
    timesheetEntries: Array.isArray(data.timesheetEntries) ? data.timesheetEntries : [],
  };
}

export async function approveTimesheet(token: string, comment?: string) {
  const response = await postEmailApproveByWebCompatibility(token, comment ?? "");
  if (!response.success) {
    throw new Error(response.message ?? "ไม่สามารถดำเนินการได้");
  }
  return response.data ?? null;
}

export async function rejectTimesheet(token: string, comment: string) {
  const response = await postEmailRejectByWebCompatibility(token, comment);
  if (!response.success) {
    throw new Error(response.message ?? "ไม่สามารถดำเนินการได้");
  }
  return response.data ?? null;
}

export async function previewApproveByEmail(token: string) {
  return getEmailApproveByEmailCompatibility(token);
}

export async function approveByEmail(token: string, comment?: string) {
  const response = await postEmailApproveByEmailCompatibility(token, comment ?? "");
  if (!response.success) {
    throw new Error(response.message ?? "ไม่สามารถดำเนินการได้");
  }
  return response.data ?? null;
}

export async function previewRejectByEmail(token: string) {
  return getEmailRejectByEmailCompatibility(token);
}

export async function rejectByEmail(token: string, comment?: string) {
  const response = await postEmailRejectByEmailCompatibility(token, comment ?? "");
  if (!response.success) {
    throw new Error(response.message ?? "ไม่สามารถดำเนินการได้");
  }
  return response.data ?? null;
}
