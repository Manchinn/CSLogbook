"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentDeadlines } from "@/hooks/useStudentDeadlines";
import { StudentDeadline } from "@/lib/services/studentService";
import { WidgetState } from "@/components/dashboard/WidgetState";
import styles from "./StudentDeadlinesWidget.module.css";

type StudentDeadlinesWidgetProps = {
  enabled: boolean;
  days?: number;
  limit?: number;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  });
}

function formatCountdown(deadline: StudentDeadline) {
  if (deadline.daysLeft !== null && deadline.daysLeft !== undefined) {
    if (deadline.daysLeft < 0) return "พ้นกำหนด";
    if (deadline.daysLeft === 0) {
      const hours = deadline.hoursLeft ?? 0;
      return hours > 0 ? `เหลือ ${hours} ชม.` : "ภายในวันนี้";
    }
    return `เหลือ ${deadline.daysLeft} วัน`;
  }
  if (deadline.hoursLeft !== null && deadline.hoursLeft !== undefined) {
    return `เหลือ ${deadline.hoursLeft} ชม.`;
  }
  return "";
}

export function StudentDeadlinesWidget({ enabled, days = 7, limit = 5 }: StudentDeadlinesWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useStudentDeadlines(token, days, enabled && hydrated);

  const deadlines = useMemo(() => {
    if (!data) return [] as StudentDeadline[];
    const sorted = [...data].sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
    return sorted.slice(0, limit);
  }, [data, limit]);

  return (
    <WidgetState
      enabled={enabled}
      hydrated={hydrated}
      isLoading={isLoading}
      error={error}
      loadingFallback={<p>กำลังโหลดกำหนดส่ง...</p>}
      errorFallback={<p className={styles.error}>ไม่สามารถโหลดกำหนดส่งได้</p>}
    >
      <section className={styles.wrapper}>
        <div className={styles.header}>
          <h3 className={styles.title}>กำหนดส่งที่ใกล้ถึง (ภายใน {days} วัน)</h3>
        </div>

        {deadlines.length === 0 ? (
          <p className={styles.empty}>ยังไม่มีกำหนดส่งในช่วงนี้</p>
        ) : (
          <div className={styles.list}>
            {deadlines.map((deadline) => (
              <article key={deadline.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <p className={styles.name}>{deadline.name}</p>
                  {deadline.deadlineType ? <span className={styles.chip}>{deadline.deadlineType === "SUBMISSION" ? "ส่งเอกสาร" : deadline.deadlineType}</span> : null}
                </div>
                <p className={styles.datetime}>{formatDateTime(deadline.deadlineAt)}</p>
                <p className={styles.countdown}>
                  <span className={styles.badgeDanger}>{formatCountdown(deadline)}</span>
                </p>
                <div className={styles.flags}>
                  {deadline.lockAfterDeadline ? <span>⚠️ ล็อกหลังครบกำหนด</span> : null}
                  {deadline.allowLate && !deadline.lockAfterDeadline ? <span>อนุญาตยื่นสาย</span> : null}
                  {deadline.gracePeriodMinutes ? <span>ผ่อนผัน {deadline.gracePeriodMinutes} นาที</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </WidgetState>
  );
}
