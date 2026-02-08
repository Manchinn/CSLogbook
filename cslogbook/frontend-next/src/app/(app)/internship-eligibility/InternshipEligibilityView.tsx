"use client";

import { useMemo } from "react";
import styles from "./eligibility.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";

type Tone = "positive" | "warning" | "danger" | "info" | "muted";

function toneClass(tone: Tone) {
  switch (tone) {
    case "positive":
      return styles.badgePositive;
    case "warning":
      return styles.badgeWarning;
    case "danger":
      return styles.badgeDanger;
    case "info":
      return styles.badgeInfo;
    default:
      return styles.badgeMuted;
  }
}

export default function InternshipEligibilityView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const enabled = hydrated && Boolean(token);

  const { data, isLoading, isFetching, error, refetch } = useStudentEligibility(token, enabled);

  const eligibility = data?.eligibility.internship ?? null;
  const status = data?.status.internship ?? null;
  const requirements = data?.requirements.internship ?? null;
  const academicSettings = data?.academicSettings ?? null;

  const currentCredits = status?.currentCredits ?? data?.student?.totalCredits ?? 0;
  const requiredCredits = requirements?.totalCredits ?? status?.requiredCredits ?? 81;
  const allowedSemesters = useMemo(
    () => requirements?.allowedSemesters ?? [3],
    [requirements?.allowedSemesters]
  );

  const currentSemester = academicSettings?.currentSemester ?? 1;
  const currentAcademicYear = academicSettings?.currentAcademicYear ?? new Date().getFullYear() + 543;

  const passCredits = currentCredits >= requiredCredits;
  const passSemester = allowedSemesters.includes(currentSemester);
  const canAccess = eligibility?.canAccessFeature ?? false;
  const canRegister = status?.canRegister ?? false;
  const statusReason = eligibility?.reason ?? status?.reason ?? "ระบบจะตรวจสอบจากข้อมูลล่าสุด";
  const registerReason = status?.registrationReason ?? "ตรวจสอบสิทธิ์ยื่นคำร้อง คพ.05";

  const statusTone: Tone = canAccess ? "positive" : "warning";
  const registerTone: Tone = canRegister ? "positive" : "warning";

  const steps = useMemo(
    () => [
      {
        title: "จำนวนหน่วยกิตรวม",
        detail: `ต้องผ่านอย่างน้อย ${requiredCredits} หน่วยกิต`,
        ok: passCredits,
      },
      {
        title: "ภาคเรียนที่อนุญาต",
        detail: `ภาคเรียนที่ ${allowedSemesters.join(", ")}`,
        ok: passSemester,
      },
      {
        title: "สิทธิ์เข้าระบบฝึกงาน",
        detail: canAccess ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์",
        ok: canAccess,
      },
    ],
    [allowedSemesters, canAccess, passCredits, passSemester, requiredCredits]
  );

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Eligibility</p>
          <h1 className={styles.title}>ตรวจสอบคุณสมบัติฝึกงาน</h1>
          <p className={styles.lead}>สรุปสิทธิ์ฝึกงานจากหน่วยกิต ภาคเรียน และเงื่อนไขหลักสูตรล่าสุด</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={`${styles.badge} ${toneClass(statusTone)}`}>สิทธิ์เข้าระบบ: {canAccess ? "ผ่าน" : "ยังไม่ผ่าน"}</span>
          <span className={`${styles.badge} ${toneClass(registerTone)}`}>ยื่นคำร้อง: {canRegister ? "พร้อม" : "ยังไม่พร้อม"}</span>
          <span className={`${styles.badge} ${styles.badgeNeutral}`}>เทอม {currentSemester}/{currentAcademicYear}</span>
        </div>
      </header>

      {!hydrated ? (
        <section className={`${styles.card} ${styles.callout}`}>กำลังเตรียมข้อมูล...</section>
      ) : isLoading ? (
        <section className={`${styles.card} ${styles.callout}`}>กำลังโหลดข้อมูลคุณสมบัติ...</section>
      ) : error ? (
        <section className={`${styles.card} ${styles.calloutDanger}`}>ไม่สามารถโหลดข้อมูลได้ โปรดลองใหม่</section>
      ) : (
        <>
          <section className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardLabel}>สิทธิ์เข้าระบบฝึกงาน</p>
              <p className={styles.cardValue}>{canAccess ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"}</p>
              <p className={styles.cardHint}>{statusReason}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>ยื่นคำร้อง คพ.05</p>
              <p className={styles.cardValue}>{canRegister ? "พร้อมยื่น" : "ยังไม่พร้อม"}</p>
              <p className={styles.cardHint}>{registerReason}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>หน่วยกิตสะสม</p>
              <p className={styles.cardValue}>{currentCredits} / {requiredCredits}</p>
              <p className={styles.cardHint}>{passCredits ? "ผ่านเกณฑ์" : `ขาดอีก ${Math.max(requiredCredits - currentCredits, 0)} หน่วยกิต`}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>ภาคเรียนปัจจุบัน</p>
              <p className={styles.cardValue}>{currentSemester}/{currentAcademicYear}</p>
              <p className={styles.cardHint}>ภาคเรียนที่อนุญาต: {allowedSemesters.join(", ")}</p>
            </article>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>เช็กลิสต์คุณสมบัติ</h2>
            <div className={styles.stepList}>
              {steps.map((step) => (
                <div key={step.title} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${step.ok ? styles.stepDotOk : styles.stepDotWarn}`} />
                  <div>
                    <p className={styles.stepTitle}>{step.title}</p>
                    <p className={styles.stepHint}>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>ข้อมูลทั่วไปเกี่ยวกับการฝึกงาน</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>ระยะเวลา</p>
                <p className={styles.infoValue}>อย่างน้อย 240 ชั่วโมง (ประมาณ 6-8 สัปดาห์)</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>ช่วงเวลา</p>
                <p className={styles.infoValue}>ภาคฤดูร้อน (พ.ค. - ก.ค.)</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>เอกสารหลัก</p>
                <p className={styles.infoValue}>คพ.05 - แบบคำร้องขอฝึกงาน</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>ผลการประเมิน</p>
                <p className={styles.infoValue}>S - ผ่าน หรือ U - ไม่ผ่าน</p>
              </div>
            </div>
          </section>

          <section className={styles.sectionFooter}>
            <button className={styles.primaryButton} type="button" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "กำลังรีเฟรช..." : "ตรวจสอบคุณสมบัติอีกครั้ง"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
