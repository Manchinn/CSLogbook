"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminSystemTestStaffQueue,
  getAdminSystemTestRequestDetail,
  submitAdminSystemTestStaffDecision,
  getAdminSystemTestAcademicYears,
  type AdminSystemTestQueueFilters,
} from "@/lib/services/adminSystemTestService";

export function useAdminSystemTestQueue(filters: AdminSystemTestQueueFilters, enabled = true) {
  return useQuery({
    queryKey: ["admin-system-test-queue", filters],
    queryFn: () => getAdminSystemTestStaffQueue(filters),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminSystemTestAcademicYears(enabled = true) {
  return useQuery({
    queryKey: ["admin-system-test-queue-academic-years"],
    queryFn: getAdminSystemTestAcademicYears,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminSystemTestDetail(projectId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-system-test-detail", projectId],
    queryFn: () => getAdminSystemTestRequestDetail(projectId ?? 0),
    enabled: Boolean(enabled && projectId),
  });
}

export function useAdminSystemTestMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-system-test-queue"] });
  };

  const submitDecision = useMutation({
    mutationFn: submitAdminSystemTestStaffDecision,
    onSuccess: invalidate,
  });

  return {
    submitDecision,
  };
}
