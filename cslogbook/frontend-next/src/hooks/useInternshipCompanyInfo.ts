"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcceptanceLetterStatus, getCompanyInfo } from "@/lib/services/internshipService";

export function useAcceptanceLetterStatus(token: string | null, documentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-acceptance-status", token, documentId ?? "none"],
    queryFn: () => getAcceptanceLetterStatus(token ?? "", documentId ?? 0),
    enabled: Boolean(token) && Boolean(documentId) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useCompanyInfo(token: string | null, documentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-company-info", token, documentId ?? "none"],
    queryFn: () => getCompanyInfo(token ?? "", documentId ?? 0),
    enabled: Boolean(token) && Boolean(documentId) && enabled,
    retry: 1,
  });
}
