"use client";

import { useMemo } from "react";
import Link from "next/link";
import styles from "./eligibility.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";

type Tone = "positive" | "warning" | "danger" | "info" | "muted";

function toneClass(tone: Tone) {
  switch (tone) {
    case "positive": return styles.badgePositive;
    case "warning":  return styles.badgeWarning;
    case "danger":   return styles.badgeDanger;
    case "info":     return styles.badgeInfo;
    default:         return styles.badgeMuted;
  }
}

export default function ProjectEligibilityView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const enabled = hydrated && Boolean(token);

  const { data, isLoading, error, refetch } = useStudentEligibility(token, enabled);

  const eligibility    = data?.eligibility.project    ?? null;
  const status         = data?.status.project         ?? null;
  const requirements   = data?.requirements.project   ?? null;
  const student        = data?.student                ?? null;
  const academicSettings = data?.academicSettings     ?? null;

  const currentCredits      = student?.totalCredits      ?? status?.currentCredits      ?? 0;
  const currentMajorCredits = student?.majorCredits      ?? status?.currentMajorCredits ?? 0;
  const requiredCredits      = requirements?.totalCredits ?? status?.requiredCredits      ?? 90;
  const requiredMajorCredits = requirements?.majorCredits ?? status?.requiredMajorCredits ?? 0;
  const requiresInternship   = requirements?.requireInternship ?? status?.requiresInternshipCompletion ?? false;

  const allowedSemesters = useMemo(
    () => requirements?.allowedSemesters ?? [1, 2],
    [requirements?.allowedSemesters]
  );

  const currentSemester     = academicSettings?.currentSemester     ?? 1;
  const currentAcademicYear = academicSettings?.currentAcademicYear ?? null;

  const passCredits      = currentCredits      >= requiredCredits;
  const passMajorCredits = requiredMajorCredits === 0 || currentMajorCredits >= requiredMajorCredits;
  const passSemester     = allowedSemesters.includes(currentSemester);
  const canAccess        = eligibility?.canAccessFeature ?? false;
  const canRegister      = eligibility?.canRegister ?? status?.canRegister ?? false;
  const statusReason     = eligibility?.reason ?? status?.reason ?? "ระบบจะตรวจสอบจากข้อมูลล่าสุด";

  const overallTone: Tone   = canAccess   ? "positive" : "warning";
  const registerTone: Tone  = canRegister ? "positive" : "warning";

  const checks = useMemo(
    () => [
      {
        title: "หน่วยกิตรวมสะสม",
        detail: `${currentCredits} / ${requiredCredits} หน่วยกิต`,
        ok: passCredits,
      },
      ...(requiredMajorCredits > 0
        ? [
            {
              title: "หน่วยกิตในสาขา",
              detail: `${currentMajorCredits} / ${requiredMajorCredits} หน่วยกิต`,
              ok: passMajorCredits,
            },
          ]
        : []),
      {
        title: "ภาคเรียนที่อนุญาตลงทะเบียน",
        detail: `ภาคเรียนที่ ${allowedSemesters.join(", ")}`,
        ok: passSemester,
      },
      ...(requiresInternship
        ? [
            {
              title: "ต้องผ่านการฝึกงาน",
              detail: "ต้องเสร็จสิ้นการฝึกงานก่อนลงทะเบียน",
              ok: false,
            },
          ]
        : []),
      {
        title: "สิทธิ์เข้าระบบโครงงาน",
        detail: canAccess ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์",
        ok: canAccess,
      },
    ],
    [
      allowedSemesters,
      canAccess,
      currentCredits,
      currentMajorCredits,
      passMajorCredits,
      passCredits,
      passSemester,
      requiredCredits,
      requiredMajorCredits,
      requiresInternship,
    ]
  );

  if (!hydrated || isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={`${styles.card} ${styles.calloutDanger}`}>
          <p className={styles.cardLabel}>โหลดข้อมูลไม่สำเร็จ</p>
          <p className={styles.cardValue}>กรุณาตรวจสอบการเชื่อมต่อ</p>
          <button className={styles.primaryButton} type="button" onClick={() => refetch()}>
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Project Eligibility</p>
          <h1 className={styles.title}>ตรวจสอบคุณสมบัติโครงงานพิเศษ</h1>
          <p className={styles.lead}>
            ตรวจสอบสิทธิ์ลงทะเบียนโครงงานพิเศษ ภาคเรียนที่ {currentSemester}
            {currentAcademicYear ? ` ปีการศึกษา ${currentAcademicYear}` : ""}
          </p>
        </div>
        <div className={styles.heroMeta}>
          <span className={`${styles.badge} ${toneClass(overallTone)}`}>
            สิทธิ์เข้าระบบ: {canAccess ? "ผ่าน" : "ยังไม่ผ่าน"}
          </span>
          <span className={`${styles.badge} ${toneClass(registerTone)}`}>
            สิทธิ์ลงทะเบียน: {canRegister ? "ผ่าน" : "ยังไม่ผ่าน"}
          </span>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>หน่วยกิตรวม</p>
          <p className={styles.cardValue}>{currentCredits}</p>
          <p className={styles.cardHint}>ต้องอย่างน้อย {requiredCredits} หน่วยกิต</p>
        </div>
        {requiredMajorCredits > 0 && (
          <div className={styles.card}>
            <p className={styles.cardLabel}>หน่วยกิตในสาขา</p>
            <p className={styles.cardValue}>{currentMajorCredits}</p>
            <p className={styles.cardHint}>ต้องอย่างน้อย {requiredMajorCredits} หน่วยกิต</p>
          </div>
        )}
        <div className={styles.card}>
          <p className={styles.cardLabel}>ภาคเรียนปัจจุบัน</p>
          <p className={styles.cardValue}>{currentSemester}</p>
          <p className={styles.cardHint}>อนุญาตภาค {allowedSemesters.join(", ")}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ผลการตรวจสอบคุณสมบัติ</h2>
        <div className={styles.stepList}>
          {checks.map((check) => (
            <div key={check.title} className={styles.stepItem}>
              <span className={`${styles.stepDot} ${check.ok ? styles.stepDotOk : styles.stepDotWarn}`} />
              <div>
                <p className={styles.stepTitle}>{check.title}</p>
                <p className={styles.stepHint}>{check.detail}</p>
              </div>
              <span className={`${styles.badge} ${toneClass(check.ok ? "positive" : "warning")}`}>
                {check.ok ? "ผ่าน" : "ไม่ผ่าน"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {statusReason && (
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <p className={styles.infoLabel}>หมายเหตุจากระบบ</p>
            <p className={styles.infoValue}>{statusReason}</p>
          </div>
        </div>
      )}

      <div className={styles.sectionFooter} style={{ marginTop: 24, gap: 12, display: "flex", flexWrap: "wrap" }}>
        <Link href="/project-requirements" className={styles.primaryButton}>
          ดูข้อกำหนดโครงงาน
        </Link>
        {canAccess && (
          <Link href="/project/phase1" className={styles.primaryButton}>
            ไปหน้าโครงงานพิเศษ
          </Link>
        )}
      </div>
    </div>
  );
}
