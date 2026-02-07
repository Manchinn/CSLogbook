"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyDocuments, type DocumentItem } from "@/lib/services/documentService";

export function useStudentDocuments(token: string | null, enabled: boolean, params?: { type?: string; lettersOnly?: number }) {
  return useQuery<{ success: boolean; documents: DocumentItem[] }>({
    queryKey: ["student-documents", token, params],
    queryFn: () => getMyDocuments(token ?? "", params),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
