"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTeacherOverview } from "@/hooks/useTeacherOverview";
import { useHydrated } from "@/hooks/useHydrated";
import styles from "./TeacherOverviewWidget.module.css";

export function TeacherOverviewWidget({ enabled }: { enabled: boolean }) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useTeacherOverview(token, enabled && hydrated);

  if (!enabled) {
    return null;
  }

  if (!hydrated) {
    return <p>Loading teacher overview...</p>;
  }

  if (isLoading) {
    return <p>Loading teacher overview...</p>;
  }

  if (error) {
    return <p className={styles.error}>ไม่สามารถโหลด teacher widget ได้</p>;
  }

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Teacher Widgets (migrated)</h2>
      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.label}>นักศึกษาในที่ปรึกษา</p>
          <p className={styles.value}>{data?.advisees.total ?? 0}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>นักศึกษาฝึกงานกำลังดำเนินการ</p>
          <p className={styles.value}>{data?.advisees.internshipInProgress ?? 0}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>บันทึกการพบรออนุมัติ</p>
          <p className={styles.value}>{data?.queues.meetingLogs.pending ?? 0}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.label}>เอกสารรออนุมัติ</p>
          <p className={styles.value}>{data?.queues.documents.pending ?? 0}</p>
        </article>
      </div>
    </section>
  );
}
