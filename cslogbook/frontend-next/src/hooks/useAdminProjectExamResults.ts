"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProjectExamPendingResults,
  getAdminProjectExamResult,
  getProjectAcademicYearsForExamResults,
  recordAdminProjectExamResult,
  updateDocumentStatus,
  updateProjectFinalDocumentStatus,
  type AdminExamType,
  type AdminProjectExamFilters,
} from "@/lib/services/adminProjectExamResultService";

export function useAdminProjectExamPendingResults(examType: AdminExamType, filters: AdminProjectExamFilters) {
  return useQuery({
    queryKey: ["admin-project-exam-pending-results", examType, filters],
    queryFn: () => getAdminProjectExamPendingResults(examType, filters),
    staleTime: 1000 * 30,
  });
}

export function useAdminProjectExamResultDetail(projectId: number | null, examType: AdminExamType, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-project-exam-result-detail", examType, projectId],
    queryFn: () => getAdminProjectExamResult(projectId ?? 0, examType),
    enabled: Boolean(enabled && projectId),
    retry: 0,
  });
}

export function useAdminProjectExamAcademicYears() {
  return useQuery({
    queryKey: ["admin-project-exam-academic-years"],
    queryFn: getProjectAcademicYearsForExamResults,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminProjectExamMutations(examType: AdminExamType) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-project-exam-pending-results", examType] });
  };

  const recordExamResult = useMutation({
    mutationFn: recordAdminProjectExamResult,
    onSuccess: invalidate,
  });

  const updateFinalDocumentStatus = useMutation({
    mutationFn: (payload: { projectId: number; documentId?: number | null; status: string; comment?: string }) => {
      if (payload.documentId) {
        return updateDocumentStatus({
          documentId: payload.documentId,
          status: payload.status,
          comment: payload.comment,
        });
      }
      return updateProjectFinalDocumentStatus({
        projectId: payload.projectId,
        status: payload.status,
        comment: payload.comment,
      });
    },
    onSuccess: invalidate,
  });

  return {
    recordExamResult,
    updateFinalDocumentStatus,
  };
}
