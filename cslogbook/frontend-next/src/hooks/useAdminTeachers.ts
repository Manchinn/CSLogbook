"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminTeacher,
  deleteAdminTeacher,
  getAdminTeachers,
  updateAdminTeacher,
  type TeacherFilters,
} from "@/lib/services/adminTeacherService";

export function useAdminTeachers(filters: TeacherFilters) {
  return useQuery({
    queryKey: ["admin-teachers", filters],
    queryFn: () => getAdminTeachers(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminTeacherMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
  };

  const createMutation = useMutation({
    mutationFn: createAdminTeacher,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ teacherId, payload }: { teacherId: number; payload: Parameters<typeof updateAdminTeacher>[1] }) =>
      updateAdminTeacher(teacherId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminTeacher,
    onSuccess: invalidate,
  });

  return {
    createTeacher: createMutation,
    updateTeacher: updateMutation,
    deleteTeacher: deleteMutation,
  };
}
