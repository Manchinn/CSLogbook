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
 * Hook สำหรับอนุมัติหรือปฏิเสธบันทึกการพบ
 */
export function useUpdateMeetingLogApproval() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      meetingId,
      logId,
      decision,
      note,
    }: {
      projectId: number;
      meetingId: number;
      logId: number;
      decision: "approve" | "reject";
      note?: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.updateMeetingLogApproval(token, projectId, meetingId, logId, decision, note);
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
export function useAdvisorKP02Queue(
  filters?: teacherService.AdvisorQueueFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "kp02", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorKP02Queue(token, filters);
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook สำหรับอนุมัติหรือปฏิเสธคำขอสอบ คพ.02 หรือ คพ.03
 */
export function useSubmitKP02AdvisorDecision() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      decision,
      note,
      defenseType = "PROJECT1",
    }: {
      projectId: number;
      decision: "approve" | "reject";
      note?: string;
      defenseType?: "PROJECT1" | "THESIS";
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.submitKP02AdvisorDecision(token, projectId, decision, note, defenseType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "advisor-queue"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
  });
}

/**
 * Hook สำหรับดึงคำขอสอบ คพ.03
 */
export function useAdvisorThesisQueue(
  filters?: teacherService.AdvisorQueueFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "thesis", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorThesisQueue(token, filters);
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
export function useAdvisorSystemTestQueue(
  filters?: teacherService.AdvisorQueueFilters,
  enabled = true
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "advisor-queue", "system-test", filters],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getAdvisorSystemTestQueue(token, filters);
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook สำหรับอนุมัติหรือปฏิเสธคำขอทดสอบระบบ
 */
export function useSubmitSystemTestAdvisorDecision() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      decision,
      note,
    }: {
      projectId: number;
      decision: "approve" | "reject";
      note?: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.submitSystemTestAdvisorDecision(token, projectId, decision, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "advisor-queue", "system-test"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
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
 * Hook สำหรับอนุมัติเอกสาร CS05
 */
export function useApproveCS05Document() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      comment,
      letterType,
    }: {
      documentId: string;
      comment?: string;
      letterType?: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.approveCS05Document(token, documentId, comment, letterType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "approve-documents", "cs05"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
  });
}

/**
 * Hook สำหรับปฏิเสธเอกสาร CS05
 */
export function useRejectCS05Document() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      reason,
    }: {
      documentId: string;
      reason: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.rejectCS05Document(token, documentId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "approve-documents", "cs05"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
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

/**
 * Hook สำหรับอนุมัติหนังสือส่งตัว
 */
export function useApproveAcceptanceLetter() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      comment,
    }: {
      documentId: string;
      comment?: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.approveAcceptanceLetter(token, documentId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "approve-documents", "acceptance"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
  });
}

/**
 * Hook สำหรับปฏิเสธหนังสือส่งตัว
 */
export function useRejectAcceptanceLetter() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      reason,
    }: {
      documentId: string;
      reason: string;
    }) => {
      if (!token) throw new Error("No authentication token");
      return teacherService.rejectAcceptanceLetter(token, documentId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "approve-documents", "acceptance"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "overview"] });
    },
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

// =====================
// Teacher Deadlines
// =====================

/**
 * Hook สำหรับดึงกำหนดการสำคัญสำหรับอาจารย์
 */
export function useTeacherImportantDeadlines(enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["teacher", "important-deadlines"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return teacherService.getTeacherImportantDeadlines(token);
    },
    enabled: enabled && !!token,
  });
}
