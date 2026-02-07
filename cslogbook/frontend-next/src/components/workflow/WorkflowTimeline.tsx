"use client";

import styles from "./WorkflowTimeline.module.css";
import type { WorkflowTimeline } from "@/lib/services/workflowService";

type WorkflowTimelineProps = {
  title: string;
  subtitle?: string;
  timeline?: WorkflowTimeline | null;
  isLoading?: boolean;
  error?: string | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "เสร็จแล้ว";
    case "pending":
    case "awaiting_action":
      return "รอดำเนินการ";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "blocked":
      return "ถูกบล็อก";
    default:
      return "ยังไม่เริ่ม";
  }
}

export function WorkflowTimeline({ title, subtitle, timeline, isLoading, error }: WorkflowTimelineProps) {
  if (isLoading) {
    return (
      <section className={styles.card} aria-busy>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{title}</p>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{title}</p>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
        <div className={styles.error}>{error}</div>
      </section>
    );
  }

  if (!timeline) {
    return (
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{title}</p>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
        <p className={styles.empty}>ยังไม่มีข้อมูล timeline</p>
      </section>
    );
  }

  const progress = Math.min(Math.max(timeline.progress, 0), 100);

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{title}</p>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.badges}>
          <span className={styles.chip}>สถานะ: {timeline.status}</span>
          <span className={styles.chip}>ความคืบหน้า: {progress}%</span>
        </div>
      </header>

      <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <ol className={styles.stepList}>
        {timeline.steps.map((step) => {
          const isCompleted = step.status === "completed" || step.completed;
          const isCurrent = timeline.currentStepDisplay === step.order || step.status === "in_progress";
          return (
            <li key={step.id} className={`${styles.step} ${styles[`step-${step.status}`]}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>{step.order ?? "-"}</span>
                <div>
                  <p className={styles.stepTitle}>{step.title}</p>
                  {step.description ? <p className={styles.stepDescription}>{step.description}</p> : null}
                </div>
                <span
                  className={`${styles.statusChip} ${isCompleted ? styles.positive : ""} ${step.status === "blocked" ? styles.negative : ""}`}
                >
                  {statusLabel(step.status)}
                </span>
              </div>
              <div className={styles.stepMeta}>
                <span>ลำดับ: {step.order ?? "-"}</span>
                {isCurrent ? <span className={styles.current}>กำลังทำ</span> : null}
                {isCompleted && step.completedDate ? <span>เสร็จ: {new Date(step.completedDate).toLocaleDateString("th-TH")}</span> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
