"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyDocuments, getStudentDocumentsOverview, type DocumentItem, type StudentDocumentOverviewItem } from "@/lib/services/documentService";

export function useStudentDocuments(token: string | null, enabled: boolean, params?: { type?: string; lettersOnly?: number }) {
  return useQuery<{ success: boolean; documents: DocumentItem[] }>({
    queryKey: ["student-documents", token, params],
    queryFn: () => getMyDocuments(token ?? "", params),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useStudentDocumentsOverview(token: string | null, enabled: boolean) {
  return useQuery<{ success: boolean; documents: StudentDocumentOverviewItem[] }>({
    queryKey: ["student-documents-overview", token],
    queryFn: () => getStudentDocumentsOverview(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
