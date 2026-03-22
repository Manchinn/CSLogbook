"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcademicYears, type AcademicYearOption } from "@/lib/services/academicService";

export function useAcademicYears() {
  return useQuery<AcademicYearOption[]>({
    queryKey: ["academic-years"],
    queryFn: getAcademicYears,
    staleTime: 10 * 60 * 1000, // 10 นาที
  });
}
