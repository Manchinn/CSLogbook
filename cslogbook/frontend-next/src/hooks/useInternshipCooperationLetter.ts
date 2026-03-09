"use client";

import { useMutation } from "@tanstack/react-query";
import { downloadCooperationLetter } from "@/lib/services/internshipService";

/**
 * Mutation สำหรับดาวน์โหลดหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
 * download ได้ทันทีหลัง CS05 approved (ไม่ต้องรอ acceptance letter)
 * @param token  JWT token
 */
export function useDownloadCooperationLetter(token: string | null) {
  return useMutation({
    mutationFn: (documentId: number) =>
      downloadCooperationLetter(token ?? "", documentId),
  });
}
