"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
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

  if (!enabled) {
    return null;
  }

  if (!hydrated) {
    return <p>Loading student eligibility...</p>;
  }

  if (isLoading) {
    return <p>Loading student eligibility...</p>;
  }

  if (error || !data) {
    return <p className={styles.error}>ไม่สามารถโหลดสิทธิ์นักศึกษาได้</p>;
  }

  const internship = data.eligibility.internship;
  const project = data.eligibility.project;
  const internshipStatus = data.status.internship;
  const projectStatus = data.status.project;
  const requirements = data.requirements;
  const student = data.student;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student widgets</p>
          <h2>สิทธิ์ฝึกงาน / โครงงาน</h2>
          <p className={styles.subtitle}>ดึงข้อมูลจริงจาก /students/check-eligibility</p>
        </div>
        <div className={styles.badges}>
          <span
            className={`${styles.chip} ${internship.canAccessFeature ? styles.chipPositive : styles.chipNegative}`}
          >
            ฝึกงาน: {internship.canAccessFeature ? "พร้อมใช้งาน" : "ยังไม่พร้อม"}
          </span>
          <span
            className={`${styles.chip} ${project.canAccessFeature ? styles.chipPositive : styles.chipNegative}`}
          >
            โครงงาน: {project.canAccessFeature ? "พร้อมใช้งาน" : "ยังไม่พร้อม"}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardTitle}>สิทธิ์ฝึกงาน</p>
          <div className={styles.statusLine}>
            <span
              className={`${styles.statusBadge} ${internship.isEligible ? styles.positive : styles.negative}`}
            >
              {internship.isEligible ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"}
            </span>
            <span>{formatRegistration(internshipStatus.registrationOpen)}</span>
          </div>
          <p className={styles.note}>
            {internship.reason || internshipStatus.reason || "ไม่พบข้อมูลสิทธิ์ฝึกงาน"}
          </p>
          <div className={styles.metaGrid}>
            <span>สิทธิ์เข้าระบบ: {internship.canAccessFeature ? "ได้" : "ไม่ได้"}</span>
            <span>ลงทะเบียน: {internshipStatus.canRegister ? "ได้" : "ไม่ได้"}</span>
            <span>เครดิตที่ใช้ตรวจ: {internshipStatus.currentCredits?.toLocaleString() ?? "—"}</span>
            <span>เครดิตวิชาเอก: {internshipStatus.currentMajorCredits?.toLocaleString() ?? "—"}</span>
          </div>
        </article>

        <article className={styles.card}>
          <p className={styles.cardTitle}>สิทธิ์โครงงาน</p>
          <div className={styles.statusLine}>
            <span
              className={`${styles.statusBadge} ${project.canAccessFeature ? styles.positive : styles.negative}`}
            >
              {project.canAccessFeature ? "เข้าถึงได้" : "ยังเข้าไม่ได้"}
            </span>
            <span>{formatRegistration(projectStatus.registrationOpen)}</span>
          </div>
          <p className={styles.note}>{project.reason || projectStatus.reason || "ไม่พบข้อมูลสิทธิ์โครงงาน"}</p>
          <div className={styles.metaGrid}>
            <span>ลงทะเบียน: {projectStatus.canRegister ? "ได้" : "ไม่ได้"}</span>
            <span>
              ต้องผ่านฝึกงานก่อน: {projectStatus.requiresInternshipCompletion ? "ใช่" : "ไม่จำเป็น"}
            </span>
            <span>เครดิตที่ใช้ตรวจ: {projectStatus.currentCredits?.toLocaleString() ?? "—"}</span>
            <span>เครดิตวิชาเอก: {projectStatus.currentMajorCredits?.toLocaleString() ?? "—"}</span>
          </div>
        </article>

        <article className={styles.card}>
          <p className={styles.cardTitle}>หน่วยกิตสะสม</p>
          <div className={styles.statList}>
            <div className={styles.statRow}>
              <span>รวมทั้งหมด</span>
              <strong>{student.totalCredits.toLocaleString()}</strong>
            </div>
            <div className={styles.statRow}>
              <span>วิชาเอก</span>
              <strong>{student.majorCredits.toLocaleString()}</strong>
            </div>
          </div>
          <div className={styles.requirements}>
            <span>
              เกณฑ์ฝึกงาน: {requirements.internship.totalCredits ?? "—"} หน่วยกิต (วิชาเอก {requirements.internship.majorCredits ?? "—"})
            </span>
            <span>
              เกณฑ์โครงงาน: {requirements.project.totalCredits ?? "—"} หน่วยกิต (วิชาเอก {requirements.project.majorCredits ?? "—"})
            </span>
            {requirements.project.requireInternship !== undefined && (
              <span>ต้องผ่านฝึกงานก่อนขอโครงงาน: {requirements.project.requireInternship ? "ใช่" : "ไม่จำเป็น"}</span>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
