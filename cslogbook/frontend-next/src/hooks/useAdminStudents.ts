"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminStudent,
  deleteAdminStudent,
  getAdminStudentFilterOptions,
  getAdminStudents,
  updateAdminStudent,
  type StudentFilters,
} from "@/lib/services/adminStudentService";

export function useAdminStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: ["admin-students", filters],
    queryFn: () => getAdminStudents(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminStudentFilterOptions() {
  return useQuery({
    queryKey: ["admin-students-filter-options"],
    queryFn: () => getAdminStudentFilterOptions(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminStudentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-students"] });
  };

  const createMutation = useMutation({
    mutationFn: createAdminStudent,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ studentCode, payload }: { studentCode: string; payload: Parameters<typeof updateAdminStudent>[1] }) =>
      updateAdminStudent(studentCode, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminStudent,
    onSuccess: invalidate,
  });

  return {
    createStudent: createMutation,
    updateStudent: updateMutation,
    deleteStudent: deleteMutation,
  };
}
