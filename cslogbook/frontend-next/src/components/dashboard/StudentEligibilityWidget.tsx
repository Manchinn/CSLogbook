"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { WidgetState } from "@/components/dashboard/WidgetState";
import styles from "./StudentEligibilityWidget.module.css";

type StudentEligibilityWidgetProps = {
  enabled: boolean;
};

function formatRegistration(open: boolean | undefined) {
  return open ? "เปิดลงทะเบียน" : "ปิดลงทะเบียน";
}

export function StudentEligibilityWidget({ enabled }: StudentEligibilityWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useStudentEligibility(token, enabled && hydrated);

  return (
    <WidgetState
      enabled={enabled}
      hydrated={hydrated}
      isLoading={isLoading}
      error={error || !data}
      loadingFallback={<p>Loading student eligibility...</p>}
      errorFallback={<p className={styles.error}>ไม่สามารถโหลดสิทธิ์นักศึกษาได้</p>}
    >
      {data ? (
        <section className={styles.wrapper}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Student widgets</p>
              <h2>สิทธิ์ฝึกงาน / โครงงาน</h2>
              <p className={styles.subtitle}>ดึงข้อมูลจริงจาก /students/check-eligibility</p>
            </div>
            <div className={styles.badges}>
              <span
                className={`${styles.chip} ${data.eligibility.internship.canAccessFeature ? styles.chipPositive : styles.chipNegative}`}
              >
                ฝึกงาน: {data.eligibility.internship.canAccessFeature ? "พร้อมใช้งาน" : "ยังไม่พร้อม"}
              </span>
              <span
                className={`${styles.chip} ${data.eligibility.project.canAccessFeature ? styles.chipPositive : styles.chipNegative}`}
              >
                โครงงาน: {data.eligibility.project.canAccessFeature ? "พร้อมใช้งาน" : "ยังไม่พร้อม"}
              </span>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardTitle}>สิทธิ์ฝึกงาน</p>
              <div className={styles.statusLine}>
                <span
                  className={`${styles.statusBadge} ${data.eligibility.internship.isEligible ? styles.positive : styles.negative}`}
                >
                  {data.eligibility.internship.isEligible ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"}
                </span>
                <span>{formatRegistration(data.status.internship.registrationOpen)}</span>
              </div>
              <p className={styles.note}>
                {data.eligibility.internship.reason || data.status.internship.reason || "ไม่พบข้อมูลสิทธิ์ฝึกงาน"}
              </p>
              <div className={styles.metaGrid}>
                <span>สิทธิ์เข้าระบบ: {data.eligibility.internship.canAccessFeature ? "ได้" : "ไม่ได้"}</span>
                <span>ลงทะเบียน: {data.status.internship.canRegister ? "ได้" : "ไม่ได้"}</span>
                <span>เครดิตที่ใช้ตรวจ: {data.status.internship.currentCredits?.toLocaleString() ?? "—"}</span>
                <span>เครดิตวิชาเอก: {data.status.internship.currentMajorCredits?.toLocaleString() ?? "—"}</span>
              </div>
            </article>

            <article className={styles.card}>
              <p className={styles.cardTitle}>สิทธิ์โครงงาน</p>
              <div className={styles.statusLine}>
                <span
                  className={`${styles.statusBadge} ${data.eligibility.project.canAccessFeature ? styles.positive : styles.negative}`}
                >
                  {data.eligibility.project.canAccessFeature ? "เข้าถึงได้" : "ยังเข้าไม่ได้"}
                </span>
                <span>{formatRegistration(data.status.project.registrationOpen)}</span>
              </div>
              <p className={styles.note}>{data.eligibility.project.reason || data.status.project.reason || "ไม่พบข้อมูลสิทธิ์โครงงาน"}</p>
              <div className={styles.metaGrid}>
                <span>ลงทะเบียน: {data.status.project.canRegister ? "ได้" : "ไม่ได้"}</span>
                <span>
                  ต้องผ่านฝึกงานก่อน: {data.status.project.requiresInternshipCompletion ? "ใช่" : "ไม่จำเป็น"}
                </span>
                <span>เครดิตที่ใช้ตรวจ: {data.status.project.currentCredits?.toLocaleString() ?? "—"}</span>
                <span>เครดิตวิชาเอก: {data.status.project.currentMajorCredits?.toLocaleString() ?? "—"}</span>
              </div>
            </article>

            <article className={styles.card}>
              <p className={styles.cardTitle}>หน่วยกิตสะสม</p>
              <div className={styles.statList}>
                <div className={styles.statRow}>
                  <span>รวมทั้งหมด</span>
                  <strong>{data.student.totalCredits.toLocaleString()}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>วิชาเอก</span>
                  <strong>{data.student.majorCredits.toLocaleString()}</strong>
                </div>
              </div>
              <div className={styles.requirements}>
                <span>
                  เกณฑ์ฝึกงาน: {data.requirements.internship.totalCredits ?? "—"} หน่วยกิต (วิชาเอก {data.requirements.internship.majorCredits ?? "—"})
                </span>
                <span>
                  เกณฑ์โครงงาน: {data.requirements.project.totalCredits ?? "—"} หน่วยกิต (วิชาเอก {data.requirements.project.majorCredits ?? "—"})
                </span>
                {data.requirements.project.requireInternship !== undefined && (
                  <span>ต้องผ่านฝึกงานก่อนขอโครงงาน: {data.requirements.project.requireInternship ? "ใช่" : "ไม่จำเป็น"}</span>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </WidgetState>
  );
}
