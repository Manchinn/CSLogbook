"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadReferralLetter,
  getReferralLetterStatus,
  type ReferralLetterStatus,
} from "@/lib/services/internshipService";

/** Query key factory สำหรับ referral letter status */
const referralLetterStatusKey = (token: string | null, documentId: number | null) =>
  ["internship-referral-letter-status", token ?? "anonymous", documentId ?? 0] as const;

/**
 * ดึงสถานะหนังสือส่งตัวนักศึกษา
 * @param token  JWT token
 * @param documentId  CS05 document ID (จาก summary.documentId)
 * @param enabled  เปิด/ปิด query (ใช้ false ถ้า documentId ยังไม่มีค่า)
 */
export function useReferralLetterStatus(
  token: string | null,
  documentId: number | null,
  enabled: boolean
) {
  return useQuery<ReferralLetterStatus | null, Error>({
    queryKey: referralLetterStatusKey(token, documentId),
    queryFn: () => getReferralLetterStatus(token ?? "", documentId ?? 0),
    enabled: Boolean(token) && Boolean(documentId) && enabled,
    staleTime: 1000 * 60 * 2,   // 2 นาที
    refetchInterval: 1000 * 60 * 3, // refetch ทุก 3 นาที (รอออกหนังสือ)
    retry: 1,
  });
}

/**
 * Mutation สำหรับดาวน์โหลดหนังสือส่งตัว และ invalidate status query หลังดาวน์โหลด
 * @param token  JWT token
 */
export function useDownloadReferralLetter(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => downloadReferralLetter(token ?? "", documentId),
    onSuccess: (_data, documentId) => {
      // อัปเดต status cache หลังจากดาวน์โหลดสำเร็จ
      queryClient.invalidateQueries({
        queryKey: referralLetterStatusKey(token, documentId),
      });
    },
  });
}

export type { ReferralLetterStatus };
