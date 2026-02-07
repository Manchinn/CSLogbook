import { apiFetchData } from "@/lib/api/client";

export type TeacherDeadline = {
  id: number;
  name: string;
  relatedTo?: string | null;
  isCritical?: boolean;
  dueAt?: string | null;
  status?: string | null;
  daysLeft?: number | null;
  hoursLeft?: number | null;
  academicYear?: number | null;
  semester?: number | null;
};

export type TeacherMeetingStudent = {
  studentId: number | null;
  studentCode: string;
  name: string;
};

export type TeacherMeeting = {
  meetingId: number | null;
  meetingTitle: string | null;
  meetingDate: string | null;
  projectId: number | null;
  projectCode: string | null;
  projectTitleTh: string | null;
  projectTitleEn: string | null;
  daysLeft: number;
  students: TeacherMeetingStudent[];
};

export type TeacherMeetingLogItem = {
  logId: number | null;
  meetingId: number | null;
  projectId: number | null;
  projectCode: string | null;
  projectTitleTh: string | null;
  projectTitleEn: string | null;
  meetingTitle: string | null;
  meetingDate: string | null;
  submittedAt: string | null;
  pendingDays: number;
  recorderName?: string;
  students: TeacherMeetingStudent[];
};

export type TeacherQuickAction = {
  key: string;
  label: string;
  description?: string;
  pendingCount?: number;
  path: string;
};

export type TeacherDashboardData = {
  teacher: {
    id: number | null;
    code: string | null;
    name: string;
    position: string;
    email?: string;
  };
  advisees: {
    total: number;
    internshipInProgress: number;
    projectInProgress: number;
    internshipEligible: number;
    projectEligible: number;
  };
  projects: {
    active: number;
    completed: number;
  };
  queues: {
    meetingLogs: {
      pending: number;
      items: TeacherMeetingLogItem[];
    };
    documents: {
      pending: number;
    };
  };
  quickActions: TeacherQuickAction[];
  deadlines: TeacherDeadline[];
  upcomingMeetings: TeacherMeeting[];
  updatedAt: string;
};

export async function getTeacherOverview(token: string) {
  const data = await apiFetchData<TeacherDashboardData>(
    "/teachers/academic/dashboard",
    {
      method: "GET",
      token,
    }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูลแดชบอร์ดอาจารย์");
  }

  return data;
}
