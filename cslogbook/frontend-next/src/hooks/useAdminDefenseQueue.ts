"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportDefenseQueue,
  getAdminDefenseQueue,
  getProjectAcademicYearsForDefenseQueue,
  getProjectDefenseDetail,
  rejectDefenseQueueRequest,
  verifyDefenseQueueRequest,
  type DefenseQueueFilters,
  type DefenseType,
} from "@/lib/services/adminDefenseQueueService";

export function useAdminDefenseQueue(defenseType: DefenseType, filters: DefenseQueueFilters, enabled = true) {
  return useQuery({
    queryKey: ["admin-defense-queue", defenseType, filters],
    queryFn: () => getAdminDefenseQueue(defenseType, filters),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminDefenseAcademicYears(enabled = true) {
  return useQuery({
    queryKey: ["admin-defense-queue-academic-years"],
    queryFn: getProjectAcademicYearsForDefenseQueue,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminDefenseDetail(projectId: number | null, defenseType: DefenseType, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-defense-detail", defenseType, projectId],
    queryFn: () => getProjectDefenseDetail(projectId ?? 0, defenseType),
    enabled: Boolean(enabled && projectId),
  });
}

export function useAdminDefenseQueueMutations(defenseType: DefenseType) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-defense-queue", defenseType] });
  };

  const verifyRequest = useMutation({
    mutationFn: verifyDefenseQueueRequest,
    onSuccess: invalidate,
  });

  const rejectRequest = useMutation({
    mutationFn: rejectDefenseQueueRequest,
    onSuccess: invalidate,
  });

  const exportQueue = useMutation({
    mutationFn: (filters: Omit<DefenseQueueFilters, "limit" | "offset">) => exportDefenseQueue(defenseType, filters),
  });

  return {
    verifyRequest,
    rejectRequest,
    exportQueue,
  };
}
