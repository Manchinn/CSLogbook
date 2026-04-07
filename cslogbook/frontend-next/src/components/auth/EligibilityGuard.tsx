"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";

type EligibilityGuardProps = {
  /** ต้องมี eligibility สำหรับ feature ไหน */
  require: "internship" | "project";
  /** redirect ไปไหนถ้าไม่ผ่าน (default: eligibility page ของ feature นั้น) */
  redirectPath?: string;
  children: React.ReactNode;
};

/**
 * Guard ที่เช็ค student eligibility (credits/year) ก่อนเข้าหน้า feature
 * ใช้ร่วมกับ RoleGuard — RoleGuard เช็ค role, EligibilityGuard เช็ค credits
 *
 * ไม่มีผลกับ teacher/admin — ให้ผ่านเสมอ
 */
export function EligibilityGuard({
  require: requiredFeature,
  redirectPath,
  children,
}: EligibilityGuardProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const isStudent = user?.role === "student";

  const { data: eligibilityData, isLoading } = useStudentEligibility(
    token,
    isStudent,
  );

  const defaultRedirect = requiredFeature === "internship"
    ? "/internship-eligibility"
    : "/project-eligibility";

  const canAccess = isStudent
    ? eligibilityData?.eligibility?.[requiredFeature]?.canAccessFeature ?? null
    : true; // teacher/admin ผ่านเสมอ

  useEffect(() => {
    if (!isStudent) return; // ไม่ใช่ student → ไม่ต้องเช็ค
    if (isLoading) return;  // กำลังโหลด → รอก่อน
    if (canAccess === false) {
      router.replace(redirectPath ?? defaultRedirect);
    }
  }, [isStudent, isLoading, canAccess, router, redirectPath, defaultRedirect]);

  // กำลังโหลด eligibility → ไม่ render (ป้องกัน flash)
  if (isStudent && (isLoading || canAccess === null)) {
    return null;
  }

  // ไม่ผ่าน → ไม่ render (redirect อยู่ใน useEffect)
  if (isStudent && canAccess === false) {
    return null;
  }

  return <>{children}</>;
}
