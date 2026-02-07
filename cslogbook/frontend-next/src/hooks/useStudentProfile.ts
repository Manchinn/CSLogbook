"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentProfile, type StudentProfile } from "@/lib/services/studentService";

export function useStudentProfile(studentCode: string | null, token: string | null, enabled: boolean) {
  return useQuery<StudentProfile | undefined>({
    queryKey: ["student-profile", studentCode, token],
    queryFn: () => getStudentProfile(studentCode ?? "", token ?? ""),
    enabled: Boolean(enabled && studentCode && token),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
