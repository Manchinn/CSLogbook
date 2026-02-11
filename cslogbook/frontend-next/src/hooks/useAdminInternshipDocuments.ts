"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadInternshipDocument,
  getAdminInternshipDocumentDetail,
  getAdminInternshipDocuments,
  getInternshipAcademicYearsForAdmin,
  getInternshipLateSubmissions,
  previewInternshipDocument,
  rejectInternshipDocument,
  reviewInternshipDocumentByStaff,
  type AdminInternshipDocumentListFilters,
} from "@/lib/services/adminInternshipDocumentsService";

export function useAdminInternshipDocuments(filters: AdminInternshipDocumentListFilters) {
  return useQuery({
    queryKey: ["admin-internship-documents", filters],
    queryFn: () => getAdminInternshipDocuments(filters),
    staleTime: 1000 * 60,
  });
}

export function useAdminInternshipDocumentDetail(documentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-internship-document-detail", documentId],
    queryFn: () => getAdminInternshipDocumentDetail(documentId ?? 0),
    enabled: Boolean(enabled && documentId),
    retry: 0,
  });
}

export function useAdminInternshipAcademicYears() {
  return useQuery({
    queryKey: ["admin-internship-document-academic-years"],
    queryFn: getInternshipAcademicYearsForAdmin,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminInternshipLateSubmissions(filters: { academicYear?: string | number; semester?: string | number }) {
  return useQuery({
    queryKey: ["admin-internship-late-submissions", filters],
    queryFn: () => getInternshipLateSubmissions(filters),
    staleTime: 1000 * 30,
  });
}

export function useAdminInternshipDocumentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-internship-documents"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-internship-late-submissions"] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({
      documentId,
      documentName,
      comment,
    }: {
      documentId: number;
      documentName?: string;
      comment?: string;
    }) => reviewInternshipDocumentByStaff(documentId, documentName, comment),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: number; reason: string }) => rejectInternshipDocument(documentId, reason),
    onSuccess: invalidate,
  });

  const previewMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: number }) => previewInternshipDocument(documentId),
  });

  const downloadMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: number }) => downloadInternshipDocument(documentId),
  });

  return {
    reviewDocument: reviewMutation,
    rejectDocument: rejectMutation,
    previewDocument: previewMutation,
    downloadDocument: downloadMutation,
  };
}
