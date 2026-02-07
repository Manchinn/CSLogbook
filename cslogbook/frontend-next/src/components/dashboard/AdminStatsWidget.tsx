"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useHydrated } from "@/hooks/useHydrated";
import { WidgetState } from "@/components/dashboard/WidgetState";
import styles from "./AdminStatsWidget.module.css";

type AdminStatsWidgetProps = {
  enabled?: boolean;
};

export function AdminStatsWidget({ enabled = true }: AdminStatsWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useAdminStats(hydrated ? token : null);

  const cards = [
    { label: "นักศึกษาทั้งหมด", value: data?.students.total ?? 0 },
    { label: "พร้อมฝึกงาน", value: data?.students.internshipEligible ?? 0 },
    { label: "พร้อมทำโครงงาน", value: data?.students.projectEligible ?? 0 },
    { label: "เอกสารรอดำเนินการ", value: data?.documents.pending ?? 0 },
  ];

  return (
    <WidgetState
      enabled={enabled}
      hydrated={hydrated}
      isLoading={isLoading}
      error={error}
      loadingFallback={<p>Loading admin metrics...</p>}
      errorFallback={<p className={styles.error}>ไม่สามารถโหลด widget สถิติ admin ได้</p>}
    >
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
    </WidgetState>
  );
}
