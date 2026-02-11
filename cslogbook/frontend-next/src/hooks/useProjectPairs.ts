"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelProjectPair,
  createProjectManually,
  findProjectStudentByCode,
  getProjectAdvisors,
  getProjectPairs,
  getProjectTracks,
  updateProjectPair,
  type ProjectPairFilters,
} from "@/lib/services/projectPairsService";

export function useProjectPairs(filters: ProjectPairFilters) {
  return useQuery({
    queryKey: ["project-pairs", filters],
    queryFn: () => getProjectPairs(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProjectPairMeta() {
  const advisorsQuery = useQuery({
    queryKey: ["project-pairs-advisors"],
    queryFn: getProjectAdvisors,
    staleTime: 1000 * 60 * 10,
  });

  const tracksQuery = useQuery({
    queryKey: ["project-pairs-tracks"],
    queryFn: getProjectTracks,
    staleTime: 1000 * 60 * 10,
  });

  return { advisorsQuery, tracksQuery };
}

export function useProjectStudentLookup(studentCode: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["project-pairs-student", studentCode],
    queryFn: () => findProjectStudentByCode(studentCode ?? ""),
    enabled: Boolean(enabled && studentCode),
    staleTime: 1000 * 30,
    retry: 0,
  });
}

export function useProjectPairMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["project-pairs"] });
  };

  const createMutation = useMutation({
    mutationFn: createProjectManually,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: Parameters<typeof updateProjectPair>[1] }) =>
      updateProjectPair(projectId, payload),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ projectId, reason }: { projectId: number; reason?: string }) => cancelProjectPair(projectId, reason),
    onSuccess: invalidate,
  });

  return {
    createProject: createMutation,
    updateProject: updateMutation,
    cancelProject: cancelMutation,
  };
}
