"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import styles from "./StudentInternshipStatusWidget.module.css";
import { labelStatus, formatRemainingDays } from "@/lib/utils/statusLabels";

type StudentInternshipStatusWidgetProps = {
  enabled: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", { dateStyle: "medium" });
}

function formatHours(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

export function StudentInternshipStatusWidget({ enabled }: StudentInternshipStatusWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useStudentInternshipStatus(token, enabled && hydrated);

  const summary = data?.summary;
  const stats = data?.stats;
  const certificate = data?.certificateStatus;

  const hours = useMemo(() => {
    const completed = stats?.totalHours ?? summary?.approvedHours ?? summary?.totalHours ?? 0;
    const approved = certificate?.companyInfo?.approvedHours ?? summary?.approvedHours ?? completed;
    const required = certificate?.requirements?.totalHours?.required ?? 240;
    return { completed, approved, required };
  }, [certificate?.companyInfo?.approvedHours, certificate?.requirements?.totalHours?.required, stats?.totalHours, summary?.approvedHours, summary?.totalHours]);

  const statusChip = certificate?.status ?? summary?.status ?? "pending";

  if (!enabled) {
    return null;
  }

  if (!hydrated || isLoading) {
    return (
      <section className={styles.wrapper} aria-busy>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.error}>โหลดสถานะฝึกงานไม่สำเร็จ</div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.empty}>ยังไม่มีข้อมูลฝึกงาน เริ่มจากการยื่น คพ.05 หรือกรอกข้อมูลบริษัท</div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Internship</p>
          <h3 className={styles.title}>สถานะฝึกงาน</h3>
        </div>
        <div className={styles.badges}>
          <span className={styles.chip}>สถานะ: {labelStatus(statusChip)}</span>
          <span
            className={`${styles.chip} ${certificate?.status === "ready" ? styles.chipPositive : styles.chipMuted}`}
          >
            ใบรับรอง: {labelStatus(certificate?.status, "ยังไม่ร้องขอ")}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardTitle}>สถานประกอบการ</p>
          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt>บริษัท</dt>
              <dd>{summary.companyName || "-"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>ที่อยู่</dt>
              <dd>{summary.companyAddress || "-"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>ช่วงฝึกงาน</dt>
              <dd>
                {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt>ผู้ควบคุมงาน</dt>
              <dd>{summary.supervisorName || "-"}{summary.supervisorPosition ? ` (${summary.supervisorPosition})` : ""}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.card}>
          <p className={styles.cardTitle}>ความคืบหน้า</p>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>ชั่วโมงที่บันทึก</span>
              <strong className={styles.statValue}>{formatHours(hours.completed)}</strong>
              <p className={styles.statMeta}>บันทึกแล้ว {stats?.completed ?? summary.approvedDays ?? 0} วัน</p>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>ชั่วโมงที่อนุมัติ</span>
              <strong className={styles.statValue}>{formatHours(hours.approved)}</strong>
              <p className={styles.statMeta}>ต้องการ {formatHours(hours.required)} ชม.</p>
            </div>
          </div>
          <div className={styles.metaGrid}>
            <span>วันฝึกงาน: {formatRemainingDays(stats?.remainingDays)}</span>
            <span>อนุมัติแล้ว: {stats?.approvedBySupervisor ?? summary.approvedDays ?? 0} วัน</span>
            <span>เฉลี่ยต่อวัน: {formatHours(stats?.averageHoursPerDay)} ชม.</span>
          </div>
        </article>
      </div>
    </section>
  );
}
