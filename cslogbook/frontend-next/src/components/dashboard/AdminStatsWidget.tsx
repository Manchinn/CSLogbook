"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useHydrated } from "@/hooks/useHydrated";
import styles from "./AdminStatsWidget.module.css";

export function AdminStatsWidget() {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useAdminStats(hydrated ? token : null);

  if (!hydrated) {
    return <p>Loading admin metrics...</p>;
  }

  if (isLoading) {
    return <p>Loading admin metrics...</p>;
  }

  if (error) {
    return <p className={styles.error}>ไม่สามารถโหลด widget สถิติ admin ได้</p>;
  }

  const cards = [
    { label: "นักศึกษาทั้งหมด", value: data?.students.total ?? 0 },
    { label: "พร้อมฝึกงาน", value: data?.students.internshipEligible ?? 0 },
    { label: "พร้อมทำโครงงาน", value: data?.students.projectEligible ?? 0 },
    { label: "เอกสารรอดำเนินการ", value: data?.documents.pending ?? 0 },
  ];

  return (
    <section>
      <h2>Admin Widgets (migrated)</h2>
      <div className={styles.grid}>
        {cards.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.label}>{card.label}</p>
            <p className={styles.value}>{card.value.toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
