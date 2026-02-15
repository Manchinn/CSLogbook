import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as teacherService from "@/lib/services/teacherService";

// =====================
// Meeting Approvals
// =====================

/**
 * Hook สำหรับดึงรายการบันทึกการพบที่รออนุมัติ
 */
export function useTeacherMeetingApprovals(
  filters?: teacherService.MeetingApprovalFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "meeting-approvals", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getTeacherMeetingApprovals(token, filters);
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook สำหรับอนุมัติบันทึกการพบ
 */
export function useApproveMeetingLog() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      meetingId,
      logId,
      notes,
    }: {
      projectId: number;
      meetingId: number;
      logId: number;
      notes?: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.approveMeetingLog(token, projectId, meetingId, logId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "meeting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
  });
}

/**
 * Hook สำหรับปฏิเสธบันทึกการพบ
 */
export function useRejectMeetingLog() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      meetingId,
      logId,
      notes,
    }: {
      projectId: number;
      meetingId: number;
      logId: number;
      notes: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.rejectMeetingLog(token, projectId, meetingId, logId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "meeting-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
  });
}

// =====================
// Advisor Queues
// =====================

/**
 * Hook สำหรับดึงคำขอสอบ คพ.02
 */
export function useAdvisorKP02Queue(enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "kp02"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorKP02Queue(token);
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook สำหรับดึงคำขอสอบ คพ.03
 */
export function useAdvisorThesisQueue(enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "thesis"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorThesisQueue(token);
    },
    enabled: enabled && !!token,
  });
}

// =====================
// System Test Queue
// =====================

/**
 * Hook สำหรับดึงคำขอทดสอบระบบ
 */
export function useAdvisorSystemTestQueue(enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "system-test"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorSystemTestQueue(token);
    },
    enabled: enabled && !!token,
  });
}

// =====================
// Approve Documents
// =====================

/**
 * Hook สำหรับดึงคิวเอกสาร CS05
 */
export function useCS05HeadQueue(
  filters?: teacherService.ApproveDocumentsFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "approve-documents", "cs05", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getCS05HeadQueue(token, filters);
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook สำหรับดึงคิวหนังสือส่งตัว
 */
export function useAcceptanceLetterHeadQueue(
  filters?: teacherService.ApproveDocumentsFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "approve-documents", "acceptance", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAcceptanceLetterHeadQueue(token, filters);
    },
    enabled: enabled && !!token,
  });
}

// =====================
// Topic Exam Overview
// =====================

/**
 * Hook สำหรับดึงรายชื่อหัวข้อโครงงานพิเศษ
 */
export function useTopicExamOverview(
  academicYear?: string,
  semester?: string,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "topic-exam", "overview", academicYear, semester],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getTopicExamOverview(token, academicYear, semester);
    },
    enabled: enabled && !!token,
  });
}
