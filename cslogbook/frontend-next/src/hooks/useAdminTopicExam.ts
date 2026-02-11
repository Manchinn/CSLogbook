"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportAdminTopicExamOverview,
  getAdminTopicExamAdvisors,
  getAdminTopicExamOverview,
  getProjectAcademicYearsForAdmin,
  recordAdminTopicExamResult,
  type AdminTopicExamFilters,
} from "@/lib/services/adminTopicExamService";

export function useAdminTopicExamOverview(filters: AdminTopicExamFilters) {
  return useQuery({
    queryKey: ["admin-topic-exam-overview", filters],
    queryFn: () => getAdminTopicExamOverview(filters),
    staleTime: 1000 * 30,
  });
}

export function useAdminTopicExamAcademicYears() {
  return useQuery({
    queryKey: ["admin-topic-exam-academic-years"],
    queryFn: getProjectAcademicYearsForAdmin,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminTopicExamAdvisors() {
  return useQuery({
    queryKey: ["admin-topic-exam-advisors"],
    queryFn: getAdminTopicExamAdvisors,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminTopicExamMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-topic-exam-overview"] });
  };

  const recordResult = useMutation({
    mutationFn: recordAdminTopicExamResult,
    onSuccess: invalidate,
  });

  const exportOverview = useMutation({
    mutationFn: exportAdminTopicExamOverview,
  });

  return {
    recordResult,
    exportOverview,
  };
}
