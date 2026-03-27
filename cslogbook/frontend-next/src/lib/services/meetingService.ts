import { apiFetch } from "@/lib/api/client";

type MeetingRecord = {
  meetingId: number;
  meetingTitle?: string | null;
  meetingDate?: string | null;
  meetingMethod?: string | null;
  meetingLocation?: string | null;
  meetingLink?: string | null;
  phase?: string | null;
  logs?: Array<{ logId: number; status?: string | null; notes?: string | null; approvalNote?: string | null; advisorComment?: string | null }>;
};

type MeetingLogRecord = {
  logId: number;
  status?: string | null;
  notes?: string | null;
  approvalNote?: string | null;
  advisorComment?: string | null;
};

function normalizeResponse<T>(response: { success?: boolean; data?: T; message?: string }) {
  if (response?.success === false) {
    throw new Error(response.message || "ไม่สามารถดำเนินการได้");
  }
  return response;
}

export async function listMeetings(token: string, projectId: number) {
  const response = await apiFetch<{ success?: boolean; data?: MeetingRecord[]; stats?: unknown }>(
    `/projects/${projectId}/meetings`,
    {
      method: "GET",
      token,
    }
  );
  return normalizeResponse(response);
}

export async function createMeeting(token: string, projectId: number, payload: Record<string, unknown>) {
  const response = await apiFetch<{ success?: boolean; data?: MeetingRecord; message?: string }>(
    `/projects/${projectId}/meetings`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
  return normalizeResponse(response);
}

export async function updateMeeting(
  token: string,
  projectId: number,
  meetingId: number,
  payload: Record<string, unknown>
) {
  const response = await apiFetch<{ success?: boolean; data?: MeetingRecord; message?: string }>(
    `/projects/${projectId}/meetings/${meetingId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }
  );
  return normalizeResponse(response);
}

export async function deleteMeeting(token: string, projectId: number, meetingId: number) {
  const response = await apiFetch<{ success?: boolean; message?: string }>(
    `/projects/${projectId}/meetings/${meetingId}`,
    {
      method: "DELETE",
      token,
    }
  );
  return normalizeResponse(response);
}

export async function createMeetingLog(
  token: string,
  projectId: number,
  meetingId: number,
  payload: Record<string, unknown>
) {
  const response = await apiFetch<{ success?: boolean; data?: MeetingLogRecord; message?: string }>(
    `/projects/${projectId}/meetings/${meetingId}/logs`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
  return normalizeResponse(response);
}

export async function updateMeetingLog(
  token: string,
  projectId: number,
  meetingId: number,
  logId: number,
  payload: Record<string, unknown>
) {
  const response = await apiFetch<{ success?: boolean; data?: MeetingLogRecord; message?: string }>(
    `/projects/${projectId}/meetings/${meetingId}/logs/${logId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }
  );
  return normalizeResponse(response);
}

export async function deleteMeetingLog(
  token: string,
  projectId: number,
  meetingId: number,
  logId: number
) {
  const response = await apiFetch<{ success?: boolean; message?: string }>(
    `/projects/${projectId}/meetings/${meetingId}/logs/${logId}`,
    {
      method: "DELETE",
      token,
    }
  );
  return normalizeResponse(response);
}
